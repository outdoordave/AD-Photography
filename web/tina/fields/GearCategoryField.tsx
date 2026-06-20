import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useFormState } from 'react-final-form';

// Dropdown für die Geräte-Kategorie. Tina-`options` lassen sich NICHT aus CMS-Inhalt
// füllen -> wir lesen die Geschwister-Liste `categories` direkt aus dem Formular
// (react-final-form; im Projekt genau EINE Instanz -> Context passt). Gespeichert wird
// die „Kennung" (key) der gewählten Kategorie; Überschrift + Reihenfolge kommen aus der Liste.

type Cat = { key?: string; label_de?: string; label_en?: string };

const GearCategoryField = wrapFieldsWithMeta(({ input }: any) => {
  const { values } = useFormState({ subscription: { values: true } });
  const cats: Cat[] = Array.isArray((values as any)?.categories) ? (values as any).categories : [];
  const value: string = typeof input.value === 'string' ? input.value : '';
  const known = cats.some((c) => (c?.key || '').trim() === value && value !== '');

  return (
    <select
      {...input}
      value={value}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 6,
        border: '1px solid #d1d5db', background: '#fff', fontSize: 14, color: '#1f2937',
      }}
    >
      <option value="">— Kategorie wählen —</option>
      {cats.map((c, i) => {
        const k = (c?.key || '').trim();
        if (!k) return null;
        return (
          <option key={k || i} value={k}>
            {c?.label_de || k}
          </option>
        );
      })}
      {/* Unbekannte/alte Kennung trotzdem zeigen, damit die Zuordnung nicht still verloren geht. */}
      {value && !known ? <option value={value}>{value} (nicht in der Liste)</option> : null}
    </select>
  );
});

export default GearCategoryField;
