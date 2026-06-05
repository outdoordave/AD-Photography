import React from 'react';
import { useEnglishOn } from './englishStore';

// Flaches „nur Englisch"-Textfeld für den FLACHEN Zweisprach-Ansatz (statt
// Objekt {de,en}). Verhalten wie der EN-Teil von BilingualField:
//   • „Nur Deutsch" (Schalter aus) → Feld komplett ausgeblendet (auch Label).
//   • „Deutsch + Englisch" (an) → kleines „English"-Label + Eingabe.
// Bewusst OHNE wrapFieldsWithMeta, damit wir bei „aus" wirklich nichts rendern
// (kein leeres Label stehen bleibt). Zwei Varianten: einzeilig / mehrzeilig.

const fieldStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #d8cab2', background: '#fff', color: '#2e2418', fontSize: 14,
  fontFamily: 'inherit', lineHeight: 1.5,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#9a8c76', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
};

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, 40) + 'px'; }
  };
  React.useLayoutEffect(() => { fit(); }, [value]);
  return (
    <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={1}
      style={{ ...fieldStyle, overflow: 'hidden', resize: 'none' }} />
  );
}

function makeEnglishOnly(multiline: boolean) {
  const Comp = (props: any) => {
    const on = useEnglishOn();
    if (!on) return null; // „Nur Deutsch" → komplett ausgeblendet
    const input = props.input || {};
    const value = typeof input.value === 'string' ? input.value : '';
    const label = (props.field && props.field.label) || 'English';
    return (
      <div style={{ display: 'grid', gap: 4, paddingBottom: 4 }}>
        <span style={labelStyle}>{label}</span>
        {multiline ? (
          <AutoTextarea value={value} onChange={(v) => input.onChange(v)} />
        ) : (
          <input type="text" value={value} onChange={(e) => input.onChange(e.target.value)} style={fieldStyle} />
        )}
      </div>
    );
  };
  return Comp;
}

export const EnglishOnlyField = makeEnglishOnly(false);
export const EnglishOnlyTextField = makeEnglishOnly(true);
