import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import equipmentNames from '../../src/data/equipment-index.json';

// Geräte-Feld der Profil-Ausrüstung: Eingabefeld MIT Vorschlagsliste (datalist) aus den echten
// Ausrüstungs-Teilen (equipment-Collection → src/data/equipment-index.json, im Build erzeugt).
// Tippen zeigt passende Vorschläge — man kann aber genauso etwas Eigenes eintippen, das nicht im
// Equipment steht (dann optional im „Link"-Feld verlinken). Steht der Name im Equipment, wird er
// auf der Seite automatisch dorthin verlinkt (gearLinkFor). Kein hartes Dropdown: Freitext bleibt.

const GearPickerField = wrapFieldsWithMeta(({ input }: any) => {
  const names: string[] = Array.from(new Set((Array.isArray(equipmentNames) ? equipmentNames : []).map((n: any) => String(n || '').trim()).filter(Boolean)));
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
