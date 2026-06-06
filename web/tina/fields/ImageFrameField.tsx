import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';

// CMS-Vorschau-Feld für „Bild-Rahmen & Schatten" (image_frame) — im iOS-Stil:
// pro Stufe eine kleine Live-Vorschau (helle „Seite" mit einer Foto-Kachel + einem
// Button), gestylt mit GENAU den Rahmen/Schatten-Werten der Website (global.css).
// Klick wählt die Stufe. So sieht man sofort, wie sich Karten/Buttons je Stufe ändern.

type Stage = { value: string; label: string; ring: string; shadow: string };

const STAGES: Stage[] = [
  { value: 'none', label: 'Keine', ring: '0 0 0 0 transparent', shadow: '0 0 0 0 transparent' },
  { value: 'soft', label: 'Ausgewogen', ring: '0 0 0 1px #d8cab2', shadow: '0 8px 22px -10px rgba(46,36,24,0.30)' },
  { value: 'strong', label: 'Kräftig', ring: '0 0 0 2px #d8cab2', shadow: '0 18px 40px -12px rgba(46,36,24,0.50)' },
];

const ImageFrameField = wrapFieldsWithMeta(({ input }: any) => {
  const value: string = STAGES.some((s) => s.value === input.value) ? input.value : 'soft';

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {STAGES.map((s) => {
        const sel = value === s.value;
        const combined = `${s.ring}, ${s.shadow}`;
        return (
          <button
            type="button"
            key={s.value}
            onClick={() => input.onChange(s.value)}
            aria-pressed={sel}
            style={{
              flex: '1 1 150px', minWidth: 140, cursor: 'pointer', textAlign: 'center',
              padding: 8, borderRadius: 12, background: 'transparent',
              border: sel ? '2px solid #a7672f' : '2px solid #e1ddd5',
              transition: 'border-color .15s',
            }}
          >
            {/* Mini-„Seite" mit Foto-Kachel + Button-Andeutung */}
            <div style={{ background: '#f4ede1', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: '100%', height: 56, borderRadius: 6, background: 'linear-gradient(135deg,#c9b89a,#9a8567)', boxShadow: combined }} />
              <div style={{ width: 84, height: 18, borderRadius: 999, background: '#a7672f', boxShadow: combined }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: sel ? '#a7672f' : '#6e5e49' }}>
              {s.label}{sel ? '  ✓' : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default ImageFrameField;
