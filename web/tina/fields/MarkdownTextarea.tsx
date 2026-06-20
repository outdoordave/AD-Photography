import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import MarkdownToolbar, { type MdKind } from './MarkdownToolbar';

// Mehrzeiliges Textfeld MIT Format-Leiste (für die nachgerüsteten Markdown-Felder:
// Stations-Text, Bio, Startseite-Intro, Datenschutz/Impressum). Laientauglich —
// markieren + Knopf statt ** oder > tippen. Speicherformat bleibt Markdown.
// `Inline`-Variante = nur Fett/Kursiv (für kurze Felder wie Reise-Zusammenfassung).

function make(allow?: MdKind[]) {
  return wrapFieldsWithMeta(({ input }: any) => {
    const ref = React.useRef<HTMLTextAreaElement | null>(null);
    const value: string = typeof input.value === 'string' ? input.value : '';
    return (
      <div>
        <MarkdownToolbar textareaRef={ref} value={value} onChange={input.onChange} allow={allow} />
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => input.onChange(e.target.value)}
          rows={6}
          spellCheck
          style={{
            width: '100%', minHeight: 120, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.55,
            padding: 10, border: '1px solid #d8cab2', borderRadius: 8, background: '#fff',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>
    );
  });
}

export const MarkdownTextarea = make();
export const MarkdownTextareaInline = make(['bold', 'italic']);
export default MarkdownTextarea;
