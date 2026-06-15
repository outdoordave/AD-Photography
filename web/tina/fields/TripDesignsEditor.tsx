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

        {/* Live-Vorschau (im Feld, volle Breite, gedeckelt) */}
        <div style={{ ...vars, background: C.bg, borderRadius: 10, padding: 12, border: `1px solid ${C.line}`, width: '100%', maxWidth: 380, boxSizing: 'border-box' }}>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: C.accent, fontWeight: 700, marginBottom: 8 }}>Vorschau</div>
          <div style={card(true)}>
            <div style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: C.accent, fontWeight: 700 }}>Station 1/3</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'var(--ww-trip-title, 30px)', lineHeight: 1.1, color: C.ink, margin: '2px 0 6px' }}>Beispiel</div>
            <div style={{ aspectRatio: '16 / 10', borderRadius: 8, overflow: 'hidden', background: C.bgAlt, boxShadow: 'var(--ww-trip-photo-shadow, none)', marginBottom: 6 }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#c9b79a,#a7672f)' }} />
            </div>
            <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.5 }}>Ein, zwei Sätze zur Station.</div>
          </div>
          <div style={{ height: 'var(--ww-trip-gap, 14px)' }} />
          <div style={card(false)}>
            <div style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: C.accent, fontWeight: 700 }}>Station 2/3</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 'var(--ww-trip-title, 30px)', lineHeight: 1.1, color: C.ink }}>Nächste</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TripDesignsEditor;
