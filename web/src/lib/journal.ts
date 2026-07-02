// ============================================================================
// Journal-Render-Helfer (Tagebuch) — analog zu stories.ts. Reine Funktionen,
// kein Astro/React-Bezug. Text bleibt Rich-Text-AST (Rendering via RichText).
// ============================================================================

import { normalizePath, formatMonthYear, dateSortKey } from './stories';

// Rohdaten eines Journal-Eintrags (Frontmatter, wie das generierte JournalParts-Fragment).
export interface JournalLink { label_de?: string; label_en?: string; url?: string }
export interface JournalSocial {
  platform?: string; url?: string; caption_de?: string; caption_en?: string; thumbnail?: string;
}
export interface JournalData {
  date?: string;
  title_de?: string;
  text_de?: any;          // Rich-Text-AST
  photos?: string[];
  location?: string;      // GeoJSON-Point-String {"type":"Point","coordinates":[lon,lat]}
  youtube_url?: string;
  link?: JournalLink | null;
  linked_content?: any;   // expandierte Referenz (Alben|Story|Reisen) inkl. _sys
  social?: JournalSocial | null;
  has_english?: boolean;
  title_en?: string;
  text_en?: any;
}

export interface GeoPoint { lon: number; lat: number }

// GeoJSON-Point-String -> {lon,lat} (gleiches Format wie LocationSearchField/Reisen-Stationen).
export function parseGeoPoint(v?: string): GeoPoint | null {
  if (!v || typeof v !== 'string') return null;
  try {
    const g = JSON.parse(v);
    if (g && g.type === 'Point' && Array.isArray(g.coordinates) && typeof g.coordinates[0] === 'number') {
      return { lon: g.coordinates[0], lat: g.coordinates[1] };
    }
  } catch (e) { /* kein gültiges GeoJSON */ }
  return null;
}

// Volles Datum für die sichtbare Überschrift: „2. Juli 2026" / „July 2, 2026".
// Nur Jahr-Monat -> Monat Jahr (formatMonthYear). Kein Treffer -> Rohwert.
const monthsDE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const monthsEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function formatFullDate(dateStr: string, lang: 'de' | 'en'): string {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return formatMonthYear(dateStr, lang) || dateStr;
  const year = m[1];
  const monthIdx = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  if (monthIdx < 0 || monthIdx > 11) return year;
  const names = lang === 'en' ? monthsEN : monthsDE;
  return lang === 'en' ? `${names[monthIdx]} ${day}, ${year}` : `${day}. ${names[monthIdx]} ${year}`;
}

function hasEN(d: JournalData): boolean { return d.has_english === true; }
function pickStr(de?: string, en?: string, useEn?: boolean): string {
  return (useEn ? (en || de) : de) || '';
}

// Sichtbare Überschrift: Titel wenn gesetzt, sonst das volle Datum.
export function journalHeading(d: JournalData, lang: 'de' | 'en'): string {
  const en = hasEN(d) && lang === 'en';
  const title = pickStr(d.title_de, d.title_en, en).trim();
  return title || formatFullDate(d.date || '', lang);
}
// Ob der Eintrag einen echten Titel hat (dann Datum zusätzlich als Zeile zeigen).
export function journalHasTitle(d: JournalData, lang: 'de' | 'en'): boolean {
  const en = hasEN(d) && lang === 'en';
  return !!pickStr(d.title_de, d.title_en, en).trim();
}
// Text-AST der aktiven Sprache (EN nur wenn has_english; sonst DE als Fallback).
export function journalText(d: JournalData, lang: 'de' | 'en'): any {
  const en = hasEN(d) && lang === 'en';
  return (en ? (d.text_en || d.text_de) : d.text_de) || null;
}
// Externer Link (Label sprachabhängig).
export function journalLink(d: JournalData, lang: 'de' | 'en'): { label: string; url: string } | null {
  const l = d.link;
  if (!l || !l.url) return null;
  const en = hasEN(d) && lang === 'en';
  return { label: pickStr(l.label_de, l.label_en, en) || l.url, url: l.url };
}

export interface LinkedCard { kind: 'album' | 'story' | 'trip'; typeLabel: string; title: string; cover: string; href: string }

// Verknüpften Inhalt (Album/Story/Reise) zu einer Karte auflösen — Cover/Titel/Ziel automatisch.
export function resolveLinkedContent(d: JournalData, lang: 'de' | 'en'): LinkedCard | null {
  const lc = d.linked_content;
  if (!lc || !lc.__typename) return null;
  const en = lang === 'en';
  const base = en ? '/en' : '';
  const filename = lc._sys && lc._sys.filename;
  if (!filename) return null;
  if (lc.__typename === 'Alben') {
    return {
      kind: 'album', typeLabel: en ? 'Album' : 'Album',
      title: pickStr(lc.name, lc.name_en, en),
      cover: normalizePath((Array.isArray(lc.photos) && lc.photos[0]) || ''),
      href: `${base}/portfolio/${filename}`,
    };
  }
  if (lc.__typename === 'Story') {
    return {
      kind: 'story', typeLabel: en ? 'Story' : 'Story',
      title: pickStr(lc.title_de, lc.title_en, en),
      cover: normalizePath(lc.cover || ''),
      href: `${base}/stories/${filename}`,
    };
  }
  if (lc.__typename === 'Reisen') {
    const firstStopPhoto = Array.isArray(lc.stops) && lc.stops.find((s: any) => s && s.photo);
    const cover = (firstStopPhoto && firstStopPhoto.photo)
      || (Array.isArray(lc.gallery) && lc.gallery[0] && lc.gallery[0].image) || '';
    return {
      kind: 'trip', typeLabel: en ? 'Trip' : 'Reise',
      title: pickStr(lc.title, lc.title_en, en),
      cover: normalizePath(cover),
      href: `${base}/trips/${filename}`,
    };
  }
  return null;
}

export interface SocialCardData { platform: string; url: string; caption: string; thumbnail: string }
// Social-Beitrag zu Karten-Daten (Caption sprachabhängig, Thumbnail normalisiert).
export function resolveSocial(d: JournalData, lang: 'de' | 'en'): SocialCardData | null {
  const s = d.social;
  if (!s || !s.url || !s.platform) return null;
  const en = hasEN(d) && lang === 'en';
  return {
    platform: s.platform,
    url: s.url,
    caption: pickStr(s.caption_de, s.caption_en, en),
    thumbnail: normalizePath(s.thumbnail || ''),
  };
}

// Erste Foto-URL (normalisiert) — für die Listen-Miniatur.
export function journalFirstPhoto(d: JournalData): string {
  const p = Array.isArray(d.photos) && d.photos.find(Boolean);
  return p ? normalizePath(p) : '';
}

// Connection-Edges -> nach Datum absteigend (neueste zuerst), dann Slug für Stabilität.
export function sortJournalNodes<T extends { _sys?: { filename?: string }; date?: string }>(nodes: T[]): T[] {
  return [...nodes].sort((a, b) => {
    const d = dateSortKey(b.date || '') - dateSortKey(a.date || '');
    return d !== 0 ? d : (b._sys?.filename || '').localeCompare(a._sys?.filename || '');
  });
}
