import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';

// CMS-Vorschau für den Journal-Stil (journal_style) — wie GearStyleField, aber mit vier
// Optionen und Tagebuch-typischer Mini-Vorschau (Datum/Titel + Textzeile).
//  stream = aktueller Look (Haarlinien) · plain = schlicht · card = Karte · notes = Field-Notes.

type Opt = { value: string; label: string };
const OPTS: Opt[] = [
  { value: 'stream', label: 'Stream (wie jetzt)' },
  { value: 'plain', label: 'Schlicht' },
  { value: 'card', label: 'Karte' },
  { value: 'notes', label: 'Field-Notes' },
];

function Preview({ kind }: { kind: string }) {
  const entry = (sep: string) => (
    <div style={{ padding: '5px 0', borderBottom: sep }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#2e2418', fontWeight: 700 }}>30. Juni</span>
        <span style={{ fontSize: 9, color: '#6e5e49' }}>Notiz</span>
      </div>
      <div style={{ fontSize: 9.5, color: '#6e5e49', marginTop: 1 }}>Kurzer Tagebuch-Text …</div>
    </div>
  );
  const base: React.CSSProperties = { padding: 12, borderRadius: 8, background: '#f4ede1' };
  if (kind === 'card') {
    return <div style={{ padding: 6, borderRadius: 8, background: '#f4ede1', display: 'grid', gap: 6 }}>
      {[0, 1].map((i) => <div key={i} style={{ background: '#faf6ef', borderRadius: 6, padding: '6px 8px', boxShadow: '0 0 0 1px rgba(46,36,24,0.06), 0 10px 22px -14px rgba(46,36,24,0.42)' }}>{entry('none')}</div>)}
    </div>;
  }
  if (kind === 'notes') {
    return <div style={{ ...base, position: 'relative', background: '#ede1ca', paddingLeft: 22, borderRadius: 3 }}>
      <span style={{ position: 'absolute', top: 8, bottom: 8, left: 12, width: 1.5, background: 'rgba(167,103,47,0.4)' }} />
      {entry('1px dashed rgba(46,36,24,0.22)')}{entry('1px dashed rgba(46,36,24,0.22)')}
    </div>;
  }
  if (kind === 'plain') {
    return <div style={{ ...base }}>{entry('none')}{entry('none')}</div>;
  }
  // stream (wie jetzt): Haarlinien-Trenner
  return <div style={{ ...base }}>{entry('1px solid rgba(176,138,79,0.28)')}{entry('1px solid rgba(176,138,79,0.28)')}</div>;
}

const JournalStyleField = wrapFieldsWithMeta(({ input }: any) => {
  const value: string = OPTS.some((o) => o.value === input.value) ? input.value : 'stream';
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

export default JournalStyleField;
