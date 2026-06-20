import React from 'react';
import { useEnglishOn } from './englishStore';
import MarkdownToolbar, { type MdKind } from './MarkdownToolbar';

// Flaches „nur Englisch"-Textfeld für den FLACHEN Zweisprach-Ansatz (statt
// Objekt {de,en}). Verhalten wie der EN-Teil von BilingualField:
//   • „Nur Deutsch" (Schalter aus) → Feld komplett ausgeblendet (auch Label).
//   • „Deutsch + Englisch" (an) → kleines „English"-Label + Eingabe.
// Bewusst OHNE wrapFieldsWithMeta, damit wir bei „aus" wirklich nichts rendern
// (kein leeres Label stehen bleibt). Zwei Varianten: einzeilig / mehrzeilig.

const fieldStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #d8cab2', background: '#fffdf8', color: '#2e2418', fontSize: 14,
  fontFamily: 'inherit', lineHeight: 1.5,
};
// TEIL 7: EN-Felder dezent in Erdtönen absetzen — linker Akzentstreifen + zarte warme
// Tönung, damit man englische Felder auf einen Blick von den deutschen unterscheidet.
const wrapStyle: React.CSSProperties = {
  display: 'grid', gap: 4, padding: '7px 10px 8px 12px', marginBottom: 2,
  borderLeft: '3px solid #b08a5e', background: '#f6efe1', borderRadius: '4px 8px 8px 4px',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#8a6d3f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'inline-flex', alignItems: 'center', gap: 5,
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

function makeEnglishOnly(multiline: boolean, alwaysShow = false) {
  const Comp = (props: any) => {
    const on = useEnglishOn();
    // alwaysShow = immer sichtbar (für Collections OHNE Sprach-Schalter, z. B. Story-
    // Beiträge mit eigenem has_english) — trotzdem dieselbe Erdton-Markierung.
    if (!alwaysShow && !on) return null; // „Nur Deutsch" → komplett ausgeblendet
    const input = props.input || {};
    const value = typeof input.value === 'string' ? input.value : '';
    const label = (props.field && props.field.label) || 'English';
    return (
      <div style={wrapStyle}>
        <span style={labelStyle}><span aria-hidden="true">🌐</span>{label}</span>
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

// Wie makeEnglishOnly (mehrzeilig, Sprachschalter-tauglich), aber MIT Format-Leiste.
function makeEnglishMarkdown(alwaysShow = false, allow?: MdKind[]) {
  const Comp = (props: any) => {
    const on = useEnglishOn();
    if (!alwaysShow && !on) return null;
    const input = props.input || {};
    const value: string = typeof input.value === 'string' ? input.value : '';
    const label = (props.field && props.field.label) || 'English';
    const ref = React.useRef<HTMLTextAreaElement>(null);
    const fit = () => {
      const el = ref.current;
      if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, 56) + 'px'; }
    };
    React.useLayoutEffect(() => { fit(); }, [value]);
    return (
      <div style={wrapStyle}>
        <span style={labelStyle}><span aria-hidden="true">🌐</span>{label}</span>
        <MarkdownToolbar textareaRef={ref} value={value} onChange={(v) => input.onChange(v)} allow={allow} />
        <textarea ref={ref} value={value} onChange={(e) => input.onChange(e.target.value)} rows={2}
          style={{ ...fieldStyle, overflow: 'hidden', resize: 'none', minHeight: 56 }} />
      </div>
    );
  };
  return Comp;
}

export const EnglishOnlyField = makeEnglishOnly(false);
export const EnglishOnlyTextField = makeEnglishOnly(true);
export const EnglishMarkdownTextField = makeEnglishMarkdown(false);
export const EnglishMarkdownTextFieldInline = makeEnglishMarkdown(false, ['bold', 'italic']);
// Immer sichtbar + gestylt (für Collections ohne Sprach-Schalter, z. B. Story-Beiträge).
export const EnglishStyledField = makeEnglishOnly(false, true);
export const EnglishStyledTextField = makeEnglishOnly(true, true);
