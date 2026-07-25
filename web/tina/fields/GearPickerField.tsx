import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import gear from '../../src/data/gear.json';

// Geräte-Feld der Profil-Ausrüstung: Eingabefeld MIT Vorschlagsliste (datalist) aus den
// echten Equipment-Geräten (gear.json → items[].name). Tippen zeigt passende Vorschläge —
// man kann aber genauso etwas Eigenes eintippen, das nicht im Equipment steht (dann optional
// im „Link"-Feld verlinken). Steht der Name im Equipment, wird er auf der Seite automatisch
// dorthin verlinkt (gearLinkFor). Bewusst kein hartes Dropdown: Freitext bleibt möglich.

const GearPickerField = wrapFieldsWithMeta(({ input }: any) => {
  const items: any[] = Array.isArray((gear as any)?.items) ? (gear as any).items : [];
  const names: string[] = Array.from(new Set(items.map((i) => String(i?.name || '').trim()).filter(Boolean)));
  const value: string = typeof input.value === 'string' ? input.value : '';
  const listId = 'ww-gear-' + String(input.name || 'x').replace(/[^a-z0-9]/gi, '-');

  return (
    <>
      <input
        {...input}
        value={value}
        list={listId}
        placeholder="z. B. Sony A7 IV — oder frei eintippen"
        autoComplete="off"
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 6,
          border: '1px solid #d1d5db', background: '#fff', fontSize: 14, color: '#1f2937',
        }}
      />
      <datalist id={listId}>
        {names.map((n, i) => <option key={i} value={n} />)}
      </datalist>
    </>
  );
});

export default GearPickerField;
