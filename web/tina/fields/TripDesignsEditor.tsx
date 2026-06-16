import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import {
  TRIP_DESIGN_IDS, TRIP_DESIGN_LABELS, TRIP_DESIGN_TUNING_DEFAULTS, designToVars,
  type TripDesignId, type DesignTuning,
} from '../../src/lib/tripDesigns';

// Zentraler Regler-Editor für die 4 Design-Vorlagen (Schritt 3). Muster wie GearStyleField:
// Vorschau RENDERT IM FELD selbst (React + Inline-Styles, KEIN iframe) -> Safari-sicher, kein Sprung.
// input.value = Objekt { none:{…}, soft:{…}, strong:{…}, luftig:{…} }; input.onChange schreibt es zurück.

type Slider = { key: keyof DesignTuning; label: string; min: number; max: number; step: number; suffix?: string };
const SLIDERS: Slider[] = [
  { key: 'dimOp',       label: 'Dimmung inaktiver Stationen', min: 0,    max: 0.9, step: 0.05 },
  { key: 'gap',         label: 'Luft zwischen Stationen',     min: 0,    max: 80,  step: 1, suffix: 'px' },
  { key: 'titlePx',     label: 'Titelgröße aktive Station',   min: 18,   max: 40,  step: 1, suffix: 'px' },
  { key: 'scale',       label: 'Inaktiv-Größe',               min: 0.70, max: 1.0, step: 0.01 },
  { key: 'photoShadow', label: 'Foto-Schatten-Stärke',        min: 0,    max: 100, step: 1 },
];

const C = {
  bg: '#f4ede1', bgAlt: '#ebe1d1', ink: '#2e2418', inkSoft: '#6e5e49',
  accent: '#a7672f', line: '#d8cab2', sel: '#a7672f',
};

function tuningOf(value: any, id: TripDesignId): DesignTuning {
  const d = TRIP_DESIGN_TUNING_DEFAULTS[id];
  const c = (value && value[id]) || {};
  const n = (v: any, def: number) => (typeof v === 'number' && !Number.isNaN(v) ? v : def);
  return {
    dimOp: n(c.dimOp, d.dimOp), gap: n(c.gap, d.gap), titlePx: n(c.titlePx, d.titlePx),
    scale: n(c.scale, d.scale), photoShadow: n(c.photoShadow, d.photoShadow),
  };
}

const TripDesignsEditor = wrapFieldsWithMeta(({ input }: any) => {
  const value = input.value || {};
  const [sel, setSel] = React.useState<TripDesignId>('luftig');
  const t = tuningOf(value, sel);
  const setVal = (key: keyof DesignTuning, num: number) =>
    input.onChange({ ...value, [sel]: { ...tuningOf(value, sel), [key]: num } });

  // CSS-Variablen dieses Designs (CHARACTER + aktuelles TUNING) für die Live-Vorschau.
  const vars = designToVars(sel, t) as React.CSSProperties;

  // WICHTIG: Das Tina-/admin lädt die Site-global.css NICHT -> --c-line/--c-bg-alt usw. wären undefiniert
  // und der Ring `0 0 0 2px var(--c-line)` (soft/strong) bliebe unsichtbar. Hier die Farben mitgeben.
  const wwColors = {
    '--c-line': '#d8cab2', '--c-bg': '#f4ede1', '--c-bg-alt': '#ebe1d1', '--c-ink': '#2e2418', '--c-accent': '#a7672f',
  } as React.CSSProperties;

  // Spotlight wie live: die aktive Station folgt dem Scrollen der Vorschau (Lese-Anker im oberen Bereich).
  const [activeIdx, setActiveIdx] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const stationRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const onPreviewScroll = () => {
    const box = scrollRef.current; if (!box) return;
    // Lese-Anker als VIEWPORT-Linie (robust, unabhängig vom offsetParent): letzte Station, deren
    // Oberkante den Anker passiert hat = aktiv. Anker in der UNTEREN Hälfte (~58%) -> die nächste Station
    // schaltet deutlich früher frei, solange die aktuelle noch gut sichtbar ist. (Höher = später, tiefer = früher.)
    const anchor = box.getBoundingClientRect().top + box.clientHeight * 0.58;
    let best = 0;
    stationRefs.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= anchor) best = i; });
    setActiveIdx(best);
  };

  const card = (active: boolean): React.CSSProperties => ({
    borderRadius: 8, padding: '12px 14px',
    background: active ? 'var(--ww-trip-card-bg, #ebe1d1)' : 'transparent',
    boxShadow: active ? 'var(--ww-trip-ring), var(--ww-trip-shadow)' : 'none',
    opacity: active ? 1 : (t.dimOp as number),
    transform: active ? 'none' : `scale(${t.scale})`,
    transformOrigin: 'left center',
  });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Design-Umschalter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {TRIP_DESIGN_IDS.map((id) => {
          const on = id === sel;
          return (
            <button type="button" key={id} onClick={() => setSel(id)} aria-pressed={on}
              style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: on ? `2px solid ${C.sel}` : `2px solid ${C.line}`,
                background: on ? C.sel : 'transparent', color: on ? '#fff' : C.inkSoft }}>
              {TRIP_DESIGN_LABELS[id]}
            </button>
          );
        })}
      </div>

      {/* EINSPALTIG (CMS-Panel ist schmal): Regler oben, Live-Vorschau darunter — nichts läuft raus. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {/* Regler */}
        <div style={{ minWidth: 0 }}>
          {SLIDERS.map((s) => {
            const v = t[s.key] as number;
            return (
              <label key={String(s.key)} style={{ display: 'block', marginBottom: 12, fontSize: 12, color: C.ink }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{s.label}</span>
                  <span style={{ color: C.inkSoft }}>{v}{s.suffix || ''}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={v}
                  onChange={(e) => setVal(s.key, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: C.accent }} />
              </label>
            );
          })}
          <p style={{ fontSize: 11, color: C.inkSoft, marginTop: 4 }}>
            Wirkt global auf ALLE Reisen mit Design „{TRIP_DESIGN_LABELS[sel]}". Rahmen/Kasten-Charakter ist je
            Vorlage fest; hier justierst du Dimmung, Luft, Titelgröße, Inaktiv-Größe und Foto-Schatten.
          </p>
        </div>

        {/* Live-Vorschau (im Feld, SCROLLBAR mit Spotlight wie live, volle Breite, gedeckelt). wwColors
            geben --c-line/--c-bg-alt mit, da das CMS die Site-global.css nicht lädt -> Ringe rendern. */}
        <div style={{ ...wwColors, ...vars, background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${C.line}`, width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: C.accent, fontWeight: 700, marginBottom: 8 }}>
            Vorschau — {TRIP_DESIGN_LABELS[sel]} · scrollen ↓ (aktive Station folgt mit)
          </div>
          {/* Innenabstand, damit der Karten-Ring/-Schatten nicht vom Overflow abgeschnitten wird (Overflow
              clippt auch x). 26px seitlich ~ deckt den Schatten-Radius; oben/unten Luft fürs Rahmen-Rendern. */}
          <div ref={scrollRef} onScroll={onPreviewScroll} style={{ maxHeight: 300, overflowY: 'auto', padding: '16px 34px 44px' }}>
            {[
              { t: 'San Francisco', photo: true },
              { t: 'Morro Bay',     photo: false },
              { t: 'Yosemite',      photo: true },
              { t: 'Lake Tahoe',    photo: false },
              { t: 'Anchorage',     photo: true },
            ].map((st, i, arr) => (
              <div key={i} ref={(el) => { stationRefs.current[i] = el; }} style={{ marginBottom: i < arr.length - 1 ? 'var(--ww-trip-gap, 14px)' : 0 }}>
                <div style={card(i === activeIdx)}>
                  <div style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: C.accent, fontWeight: 700 }}>Station {i + 1}/5</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 'var(--ww-trip-title, 30px)', lineHeight: 1.1, color: C.ink, margin: '2px 0 6px' }}>{st.t}</div>
                  {st.photo && (
                    <div style={{ height: 50, borderRadius: 6, overflow: 'hidden', background: C.bgAlt, boxShadow: 'var(--ww-trip-photo-shadow, none)', marginBottom: 5 }}>
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c9b79a,#a7672f)' }} />
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: C.inkSoft, lineHeight: 1.45 }}>Ein, zwei Sätze zur Station.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default TripDesignsEditor;
