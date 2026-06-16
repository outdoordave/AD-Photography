import React from 'react';

// TEIL 10: „Wo bin ich"-Banner ganz oben in jeder Sektion. Reines Info-Feld —
// rendert KEIN Eingabefeld und ruft NIE onChange auf → schreibt nichts in die Daten
// (kein zusätzlicher Schlüssel in JSON/Frontmatter). Der Sektionsname kommt aus dem
// `label` des Feldes (in tina/config.ts je Collection gesetzt).
const SectionBanner = (props: any) => {
  const text = (props.field && props.field.label) || '';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 16px',
        padding: '10px 14px', borderRadius: 8,
        background: '#f3ece0', border: '1px solid #e0d4bd', borderLeft: '4px solid #a7672f',
        color: '#6e5e49', fontSize: 13, fontWeight: 600,
      }}
    >
      <span style={{ fontSize: 15 }} aria-hidden="true">📍</span>
      <span>Du bist hier: <strong style={{ color: '#2e2418', fontWeight: 800 }}>{text}</strong></span>
    </div>
  );
};

export default SectionBanner;
