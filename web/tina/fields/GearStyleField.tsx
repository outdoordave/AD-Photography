import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';

// CMS-Vorschau für den Gear-Listen-Stil (gear_style) — wie das Rahmen-Feld:
// pro Stil eine kleine Mini-Vorschau (zwei „Einträge"), klickbar.
//  plain = schlichte Liste · card = erhabene Karte · notes = Field-Notes/Notizzettel.

type Opt = { value: string; label: string };
const OPTS: Opt[] = [
  { value: 'plain', label: 'Schlicht' },
  { value: 'card', label: 'Karte' },
  { value: 'notes', label: 'Field-Notes' },
];

function Preview({ kind }: { kind: string }) {
  const row = (withCheck: boolean) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 0', borderBottom: kind === 'notes' ? '1px dashed rgba(46,36,24,0.22)' : '1px solid rgba(176,138,79,0.18)' }}>
      <span style={{ fontSize: 11, color: '#2e2418', fontWeight: 600 }}>{withCheck ? '✓ ' : ''}Kamera</span>
      <span style={{ fontSize: 10, color: '#6e5e49' }}>Sony</span>
    </div>
  );
  const base: React.CSSProperties = { padding: 12, borderRadius: 8 };
  if (kind === 'card') {
    return <div style={{ ...base, background: '#faf6ef', boxShadow: '0 0 0 1px rgba(46,36,24,0.06), 0 12px 26px -14px rgba(46,36,24,0.42)' }}>{row(false)}{row(false)}</div>;
  }
  if (kind === 'notes') {
    return <div style={{ ...base, position: 'relative', background: '#ede1ca', paddingLeft: 22, borderRadius: 3, boxShadow: '0 1px 2px rgba(46,36,24,0.15), 0 12px 26px -14px rgba(46,36,24,0.5)' }}>
      <span style={{ position: 'absolute', top: 8, bottom: 8, left: 12, width: 1.5, background: 'rgba(167,103,47,0.4)' }} />
      {row(true)}{row(true)}
    </div>;
  }
  // plain
  return <div style={{ ...base, background: '#f4ede1' }}>{row(false)}{row(false)}</div>;
}

const GearStyleField = wrapFieldsWithMeta(({ input }: any) => {
  const value: string = OPTS.some((o) => o.value === input.value) ? input.value : 'card';
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {OPTS.map((o) => {
        const sel = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => input.onChange(o.value)}
            aria-pressed={sel}
            style={{ flex: '1 1 150px', minWidth: 140, cursor: 'pointer', textAlign: 'center', padding: 8, borderRadius: 12, background: 'transparent', border: sel ? '2px solid #a7672f' : '2px solid #e1ddd5' }}
          >
            <Preview kind={o.value} />
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: sel ? '#a7672f' : '#6e5e49' }}>{o.label}{sel ? '  ✓' : ''}</div>
          </button>
        );
      })}
    </div>
  );
});

export default GearStyleField;
