import React from 'react';
import { TinaMarkdown, type TinaMarkdownContent } from 'tinacms/dist/rich-text';
import { mdToHtml, normalizePath } from '../lib/stories';

// Render-Fundament für die WYSIWYG-Umstellung (Weg B, Stufe 1).
// Bildet die bisherige `.ww-rich`-Optik des mdToHtml-Ports 1:1 mit Tinas <TinaMarkdown> nach.
//
// Zwei Modi, damit die Umstellung gefahrlos gestaffelt laufen kann:
//   • value = STRING  -> noch nicht umgestelltes Feld: via mdToHtml (exakt wie bisher).
//   • value = AST     -> rich-text-Feld: via <TinaMarkdown> mit der Komponenten-Karte unten.
//
// Marken (fett/kursiv/durchgestrichen) rendert Tina selbst als <strong>/<em>/<s> — identisch zu
// mdToHtml (`**`/`*`/`~~`). Überschriften: `#`/`##` -> <h2>, `###` -> <h3> (wie mdToHtml).
// Rohes HTML (Datenschutz/Impressum) kommt als html/html_inline-Knoten und wird durchgereicht.

const components: any = {
  h1: (p: any) => <h2>{p.children}</h2>,
  h2: (p: any) => <h2>{p.children}</h2>,
  h3: (p: any) => <h3>{p.children}</h3>,
  a: (p: any) => (
    <a href={p.url} target="_blank" rel="noopener">
      {p.children}
    </a>
  ),
  blockquote: (p: any) => <div className="pullquote">{p.children}</div>,
  block_quote: (p: any) => <div className="pullquote">{p.children}</div>,
  img: (p: any) => <img src={normalizePath(p.url)} alt={p.alt || ''} loading="lazy" />,
  // Rohes HTML aus einem Generator (Rechts-Seiten) unverändert durchreichen.
  html: (p: any) => <div dangerouslySetInnerHTML={{ __html: p.value || '' }} />,
  html_inline: (p: any) => <span dangerouslySetInnerHTML={{ __html: p.value || '' }} />,
};

// Leer? (für DE/EN-Fallback) — String leer ODER Rich-Text-AST ohne Kinder.
export function richIsEmpty(v: any): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'object' && Array.isArray(v.children)) return v.children.length === 0;
  return false;
}

// Klartext aus Rich-Text-AST (für SEO-/Meta-Beschreibungen). Akzeptiert auch String.
export function richToPlain(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  const inline = (n: any): string =>
    typeof n?.text === 'string' ? n.text : Array.isArray(n?.children) ? n.children.map(inline).join('') : '';
  const blocks = Array.isArray(v?.children) ? v.children : [];
  return blocks.map(inline).join(' ').replace(/\s+/g, ' ').trim();
}

// DE/EN wählen wie buildStory/bi: EN nur, wenn vorhanden, sonst DE-Fallback.
// Funktioniert für Strings (Übergang) UND Rich-Text-ASTs.
export function pickRich(de: any, en: any, isEn: boolean): any {
  return isEn ? (richIsEmpty(en) ? de : en) : de;
}

export default function RichText({ value }: { value: any }) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    return <span dangerouslySetInnerHTML={{ __html: mdToHtml(value) }} />;
  }
  return <TinaMarkdown content={value as TinaMarkdownContent} components={components} />;
}
