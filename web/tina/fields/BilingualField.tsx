import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import { useEnglishOn } from './englishStore';

// Zweisprachiges Feld OHNE Unterseite:
//  - Deutsch immer direkt sichtbar.
//  - Englisch nur, wenn der globale „Englisch"-Schalter (oben) an ist.
//  - Mehrzeilige Felder wachsen automatisch mit dem Text (keine feste Hoehe,
//    kein internes Scrollen -> die Tina-Seitenleiste scrollt normal mit).
// Zwei Varianten: BilingualField (einzeilig) / BilingualTextField (mehrzeilig).

const fieldStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #d8cab2', background: '#fff', color: '#2e2418', fontSize: 14,
  fontFamily: 'inherit', lineHeight: 1.5,
};

// Mehrzeiliges Feld, das mit dem Inhalt mitwaechst (auto-resize).
function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(el.scrollHeight, 40) + 'px';
    }
  };
  React.useLayoutEffect(() => { fit(); }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      style={{ ...fieldStyle, overflow: 'hidden', resize: 'none' }}
    />
  );
}

function makeBilingual(multiline: boolean) {
  return wrapFieldsWithMeta(({ input }: any) => {
    const value = input.value && typeof input.value === 'object' ? input.value : {};
    const englishOn = useEnglishOn();
    const set = (lang: 'de' | 'en', v: string) => input.onChange({ ...value, [lang]: v });

    const render = (lang: 'de' | 'en') =>
      multiline ? (
        <AutoTextarea value={value[lang] || ''} onChange={(v) => set(lang, v)} />
      ) : (
        <input type="text" value={value[lang] || ''} onChange={(e) => set(lang, e.target.value)} style={fieldStyle} />
      );

    return (
      <div style={{ display: 'grid', gap: englishOn ? 10 : 0 }}>
        {render('de')}
        {englishOn ? (
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#9a8c76', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              English
            </span>
            {render('en')}
          </div>
        ) : null}
      </div>
    );
  });
}

export const BilingualField = makeBilingual(false);
export const BilingualTextField = makeBilingual(true);
export default BilingualField;
