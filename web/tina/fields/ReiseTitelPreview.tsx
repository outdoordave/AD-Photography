import React from 'react';
import { useFormState } from 'react-final-form';

// Reines Vorschau-Feld (schreibt nichts): zeigt, wie der Reise-Titel auf dem Handy oben in der
// mitwandernden Titel-Leiste erscheint (klein, neben „← Reisen"), inkl. …-Kürzung bei langen Titeln.
// Liest den Titel live aus dem Formular (Geschwisterfeld `title`, react-final-form). Visuell statt Text.
const C = { bg: '#f4ede1', ink: '#2e2418', soft: '#6e5e49', line: '#d8cab2', accent: '#a7672f' };

const ReiseTitelPreview = (_props: any) => {
  const { values } = useFormState({ subscription: { values: true } });
  const title = ((values as any)?.title || '').toString().trim() || 'Reise-Titel';

  return (
    <div style={{ margin: '2px 0 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.soft, marginBottom: 6 }}>
        Vorschau · so erscheint der Titel oben auf dem <strong style={{ color: C.ink }}>Handy</strong> (mitwandernde Leiste)
      </div>

      {/* Mini-Handy: Nav + deckende Titel-Leiste (eingeklappter Zustand) */}
      <div style={{ width: 300, maxWidth: '100%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.line}`, background: C.bg }}>
        {/* Faux-Nav */}
        <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.ink }}>Wide &amp; Wild</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ width: 14, height: 2, background: C.ink }} /><span style={{ width: 14, height: 2, background: C.ink }} /><span style={{ width: 14, height: 2, background: C.ink }} />
          </div>
        </div>
        {/* Titel-Leiste (deckend): ← Reisen + Titel (einzeilig, … bei Überlänge) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: C.bg }}>
          <span style={{ color: C.accent, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', flex: 'none' }}>← Reisen</span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', color: C.ink, fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{title}</span>
        </div>
        {/* angedeutete Karte/Inhalt darunter */}
        <div style={{ height: 46, background: 'linear-gradient(135deg,#cfe0ea,#e9eadf)', borderTop: `1px solid ${C.line}`, margin: '0 0 0', opacity: 0.7 }} />
      </div>

      <div style={{ fontSize: 11, color: C.soft, marginTop: 6, lineHeight: 1.4 }}>
        Auf dem Handy wandert dieser Titel beim Scrollen von groß (oben im Reisekopf) in diese kleine Leiste und
        schrumpft dabei. Sehr lange Titel werden hier mit „…" gekürzt — kurze, prägnante Titel wirken am besten.
      </div>
    </div>
  );
};

export default ReiseTitelPreview;
