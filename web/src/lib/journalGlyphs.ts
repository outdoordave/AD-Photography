// Kleine Anhang-Symbole für die Hero-Journal-Kachel — dünne Linien-Glyphen im Seiten-Stil
// (currentColor, stroke-based, 24er-Grid). Kein Emoji, damit es zur Fraunces/Mulish-Optik passt.
import type { JournalAttachment } from './journal';

export function glyphLabel(k: JournalAttachment, lang: 'de' | 'en'): string {
  const de: Record<JournalAttachment, string> = {
    photo: 'Foto', location: 'Standort', video: 'Video', social: 'Social-Beitrag', linked: 'Verknüpfter Inhalt', link: 'Link',
  };
  const en: Record<JournalAttachment, string> = {
    photo: 'Photo', location: 'Location', video: 'Video', social: 'Social post', linked: 'Linked content', link: 'Link',
  };
  return (lang === 'en' ? en : de)[k];
}

const S = (inner: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const GLYPHS: Record<JournalAttachment, string> = {
  // Foto: Rahmen mit Bergen + Sonne
  photo: S('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="1.4"/><path d="M3 16l5-4 4 3 3-3 6 5"/>'),
  // Standort: Pin
  location: S('<path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/>'),
  // Video: Play im Kreis
  video: S('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>'),
  // Social: Herz
  social: S('<path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7 2.7C19 15.6 12 20 12 20z"/>'),
  // Verknüpfter Inhalt: Lesezeichen
  linked: S('<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>'),
  // Externer Link: Pfeil aus Rahmen
  link: S('<path d="M14 4h6v6"/><path d="M20 4l-8 8"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'),
};

export function glyphSvg(k: JournalAttachment): string { return GLYPHS[k] || ''; }
