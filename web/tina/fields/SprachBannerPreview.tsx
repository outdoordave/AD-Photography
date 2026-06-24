import React from 'react';
import { useFormState } from 'react-final-form';

// Reines Vorschau-Feld (rendert KEIN Eingabefeld, ruft NIE onChange -> schreibt nichts in die Daten).
// Zeigt im CMS live, wie der Sprach-Hinweis für englischsprachige Besucher aussieht: Position
// (oben Streifen / unten schwebende Karte), Text + beide Knöpfe — gelesen aus den Geschwisterfeldern
// sprach_banner.* (react-final-form; im Projekt genau EINE Form-Instanz -> Context passt).
// Visuell erklärt mehr als Beschreibungstext.
const C = { bg: '#f4ede1', ink: '#2e2418', soft: '#6e5e49', line: '#d8cab2', accent: '#a7672f', dark: '#1c1812' };

const SprachBannerPreview = (_props: any) => {
  const { values } = useFormState({ subscription: { values: true } });
  const sb: any = (values as any)?.sprach_banner || {};
  const enabled = sb.enabled !== false;
  const pos: 'oben' | 'unten' = sb.position === 'oben' ? 'oben' : 'unten';
  const text = (sb.text && String(sb.text).trim()) || 'This site is also available in English.';
  const switchLabel = (sb.switch_label && String(sb.switch_label).trim()) || 'Switch to English';
  const stayLabel = (sb.stay_label && String(sb.stay_label).trim()) || 'Auf Deutsch bleiben';

  const switchBtn = (
    <span style={{ display: 'inline-block', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 11, padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{switchLabel}</span>
  );
  const stayBtn = (color: string) => (
    <span style={{ color, fontWeight: 700, fontSize: 11, textDecoration: 'underline', whiteSpace: 'nowrap' }}>{stayLabel}</span>
  );
  const closeX = (color: string) => (
    <span style={{ color, fontSize: 13, opacity: 0.7, marginLeft: 2 }} aria-hidden="true">✕</span>
  );

  return (
    <div style={{ margin: '2px 0 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.soft, marginBottom: 6 }}>
        Vorschau · Position: <strong style={{ color: C.ink }}>{pos === 'oben' ? 'oben (Streifen)' : 'unten (schwebende Karte)'}</strong>
        {!enabled && <span style={{ color: '#b91c1c', marginLeft: 8 }}>· ausgeschaltet</span>}
      </div>

      {/* Mini-Browserfenster */}
      <div style={{ position: 'relative', height: 200, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.line}`, background: C.bg, opacity: enabled ? 1 : 0.5 }}>
        {/* Faux-Nav */}
        <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: `1px solid ${C.line}`, background: 'rgba(244,237,225,0.94)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.ink }}>Wide &amp; Wild</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ width: 14, height: 2, background: C.ink }} /><span style={{ width: 14, height: 2, background: C.ink }} /><span style={{ width: 14, height: 2, background: C.ink }} />
          </div>
        </div>

        {/* oben = dunkler Streifen direkt unter der Nav */}
        {pos === 'oben' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, padding: '8px 12px', background: C.dark, color: '#f0e6d6' }}>
            <span style={{ fontSize: 11 }}>{text}</span>
            {switchBtn}{stayBtn('#f0e6d6')}{closeX('#f0e6d6')}
          </div>
        )}

        {/* Platzhalter-Seiteninhalt */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ width: '55%', height: 9, background: C.line, borderRadius: 4, marginBottom: 7 }} />
          <div style={{ width: '85%', height: 6, background: '#e7dcc8', borderRadius: 4, marginBottom: 5 }} />
          <div style={{ width: '78%', height: 6, background: '#e7dcc8', borderRadius: 4 }} />
        </div>

        {/* unten = schwebende Karte unten rechts */}
        {pos === 'unten' && (
          <div style={{ position: 'absolute', right: 12, bottom: 12, maxWidth: 220, padding: '10px 12px', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 10px 24px -10px rgba(46,36,24,0.5)' }}>
            <div style={{ fontSize: 11, color: C.ink, marginBottom: 8, lineHeight: 1.35 }}>{text}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {switchBtn}{stayBtn(C.soft)}{closeX(C.ink)}
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: C.soft, marginTop: 6, lineHeight: 1.4 }}>
        Erscheint nur Besuchern mit nicht-deutscher Browser-Sprache auf den deutschen Seiten. „{switchLabel}" führt zur englischen Version; „{stayLabel}" / ✕ blendet ihn dauerhaft aus (lokal auf dem Gerät gemerkt).
      </div>
    </div>
  );
};

export default SprachBannerPreview;
