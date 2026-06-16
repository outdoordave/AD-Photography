import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { englishStore, useEnglishOn } from './englishStore';

// Apple-artiger An/Aus-Schalter: blendet die englischen Felder global ein/aus.
// Reiner Editor-Schalter — schreibt NICHTS in den Inhalt (input wird ignoriert).
// Standard: aus (nur Deutsch).
const EnglishToggleInner = wrapFieldsWithMeta(() => {
  const on = useEnglishOn();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => englishStore.toggle()}
        style={{
          width: 48, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: on ? '#a7672f' : '#cfc3ad', position: 'relative',
          transition: 'background .2s', flex: '0 0 auto', padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: on ? 23 : 3, width: 22, height: 22,
            borderRadius: '50%', background: '#fff', transition: 'left .2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>
      <span style={{ fontSize: 13, color: '#2e2418' }}>
        {on ? 'Deutsch + Englisch' : 'Nur Deutsch'}
      </span>
    </div>
  );
});

export default EnglishToggleInner;
