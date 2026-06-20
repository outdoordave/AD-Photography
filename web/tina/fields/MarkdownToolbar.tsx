import React from 'react';

// Wiederverwendbare Format-Leiste für die Markdown-Textfelder im CMS.
// Laientauglich (für Alexandra): markieren + Knopf -> setzt die Markdown-Zeichen
// automatisch, niemand tippt ** oder >. Speicherformat bleibt normales Markdown
// (wird über den bestehenden mdToHtml-Port gerendert).
//
// Inline (Fett/Kursiv): umschließt die Auswahl. Zeilen-Ebene (Überschrift/Zitat/
// Liste): setzt das Präfix je Zeile, erneuter Klick entfernt es wieder (Toggle).
// Über `allow` lassen sich die Knöpfe einschränken (z. B. nur Fett/Kursiv in
// kurzen Karten-Feldern).

export type MdKind = 'bold' | 'italic' | 'h3' | 'quote' | 'list';

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
  allow?: MdKind[];
};

const ALL: MdKind[] = ['bold', 'italic', 'h3', 'quote', 'list'];

const META: Record<MdKind, { txt: string; title: string; style?: React.CSSProperties }> = {
  bold: { txt: 'F', title: 'Fett', style: { fontWeight: 800 } },
  italic: { txt: 'K', title: 'Kursiv', style: { fontStyle: 'italic' } },
  h3: { txt: 'H', title: 'Überschrift' },
  quote: { txt: '❝', title: 'Zitat' },
  list: { txt: '•', title: 'Aufzählung' },
};

// Zeilen-Grenzen rund um die aktuelle Auswahl (für Zeilen-Präfixe).
function lineBounds(v: string, start: number, end: number): [number, number] {
  const ls = v.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  let le = v.indexOf('\n', end);
  if (le === -1) le = v.length;
  return [ls, le];
}

export default function MarkdownToolbar({ textareaRef, value, onChange, allow }: Props) {
  const kinds = allow && allow.length ? allow : ALL;

  function apply(kind: MdKind) {
    const ta = textareaRef.current;
    const v = typeof value === 'string' ? value : '';
    const start = ta?.selectionStart ?? v.length;
    const end = ta?.selectionEnd ?? start;
    let next = v;
    let caret = end;

    if (kind === 'bold' || kind === 'italic') {
      const marker = kind === 'bold' ? '**' : '*';
      const sel = v.slice(start, end) || (kind === 'bold' ? 'fetter Text' : 'kursiver Text');
      const wrapped = marker + sel + marker;
      next = v.slice(0, start) + wrapped + v.slice(end);
      caret = start + wrapped.length;
    } else {
      const prefix = kind === 'h3' ? '### ' : kind === 'quote' ? '> ' : '- ';
      const [ls, le] = lineBounds(v, start, end);
      const lines = v.slice(ls, le).split('\n');
      const allPrefixed = lines.every((l) => l.startsWith(prefix));
      const newLines = lines.map((l) =>
        allPrefixed ? l.slice(prefix.length) : prefix + l.replace(/^(#{1,6} |> |- )/, ''),
      );
      const block = newLines.join('\n');
      next = v.slice(0, ls) + block + v.slice(le);
      caret = ls + block.length;
    }

    onChange(next);
    // Nach dem (kontrollierten) Re-Render Cursor/Fokus wiederherstellen.
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (t) {
        t.focus();
        try { t.setSelectionRange(caret, caret); } catch { /* egal */ }
      }
    });
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
      {kinds.map((k) => (
        <button
          key={k}
          type="button"
          title={META[k].title}
          aria-label={META[k].title}
          // mousedown-preventDefault: Auswahl im Textfeld bleibt beim Klick erhalten.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply(k)}
          style={btnStyle}
        >
          <span style={META[k].style}>{META[k].txt}</span>
        </button>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  minWidth: 32,
  height: 30,
  padding: '0 9px',
  borderRadius: 6,
  cursor: 'pointer',
  border: '1px solid #d8cab2',
  background: '#faf6ef',
  color: '#2e2418',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '28px',
};
