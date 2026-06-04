import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';

// Inline aufklappbares DE/EN-Feld (statt Tina-Standard, der eine Unterseite oeffnet).
// Klick auf die Kopfzeile -> klappt DE + EN direkt auf der Seite auf (Dropdown),
// keine Navigation in ein Unterfenster. Speichert weiterhin { de, en }.
// Zwei Varianten:
//   BilingualField      -> einzeilige Eingaben (Kicker, Titel, Rolle, Gear-Zeile)
//   BilingualTextField  -> mehrzeilige Textfelder (Einleitung, Bio, Fliesstext)
// Verwendung an einem `object`-Feld mit fields [de, en]: ui: { component: BilingualField }

function makeBilingual(multiline: boolean) {
  return wrapFieldsWithMeta(({ input }: any) => {
    const value = input.value && typeof input.value === 'object' ? input.value : {};
    const [open, setOpen] = React.useState(false);

    const set = (lang: 'de' | 'en', v: string) => input.onChange({ ...value, [lang]: v });
    const preview = String(value.de || value.en || '').trim();
    const previewShort = preview.length > 60 ? preview.slice(0, 60) + '…' : preview;

    const fieldStyle: React.CSSProperties = {
      width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d8cab2',
      background: '#fff', color: '#2e2418', fontSize: 14, fontFamily: 'inherit', marginTop: 4,
      resize: multiline ? 'vertical' : 'none',
    };

    return (
      <div style={{ border: '1px solid #e1ddd5', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            background: open ? '#f6ede0' : '#faf6ef', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ color: '#a7672f', fontSize: 12, width: 12, flex: '0 0 auto' }}>{open ? '▾' : '▸'}</span>
          <span style={{ color: previewShort ? '#2e2418' : '#9a8c76', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {previewShort || '(leer) — zum Bearbeiten aufklappen'}
          </span>
        </button>

        {open ? (
          <div style={{ padding: 12, display: 'grid', gap: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6e5e49', fontWeight: 600 }}>
              Deutsch
              {multiline
                ? <textarea value={value.de || ''} onChange={(e) => set('de', e.target.value)} rows={3} style={fieldStyle} />
                : <input type="text" value={value.de || ''} onChange={(e) => set('de', e.target.value)} style={fieldStyle} />}
            </label>
            <label style={{ display: 'block', fontSize: 12, color: '#6e5e49', fontWeight: 600 }}>
              Englisch
              {multiline
                ? <textarea value={value.en || ''} onChange={(e) => set('en', e.target.value)} rows={3} style={fieldStyle} />
                : <input type="text" value={value.en || ''} onChange={(e) => set('en', e.target.value)} style={fieldStyle} />}
            </label>
          </div>
        ) : null}
      </div>
    );
  });
}

export const BilingualField = makeBilingual(false);
export const BilingualTextField = makeBilingual(true);
export default BilingualField;
