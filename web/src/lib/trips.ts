// Reisen-Logik: 1:1-Port von pickStopCoord/buildTrip (index.html). Die migrierten
// trip-JSONs sind bereits sauber ({de,en}-verschachtelt); hier nur Koordinaten aus
// dem GeoJSON-Point lesen + Sprach-Helfer + zu Ansichts-Stops normalisieren.

import { normalizePath } from './stories';

export type Lang = 'de' | 'en';
export type Bi = { de?: string; en?: string };

export type RawStop = {
  name?: string;
  location?: string;
  title_de?: string; title_en?: string;
  date_de?: string; date_en?: string;
  text_de?: string; text_en?: string;
  // Titelbild: Pfad-String (alt) ODER Zuschnitt-Objekt { original, display, crop }.
  photo?: string | { original?: string; display?: string; crop?: string };
  photos?: string[];
  video?: string;
  youtube?: string;
};
export type RawTrip = {
  order?: number;
  title?: string;
  title_en?: string;
  date?: string;
  meta_de?: string; meta_en?: string;
  summary_de?: string; summary_en?: string;
  upcoming?: boolean;
  stops?: RawStop[];
  gallery?: { image: string; caption_de?: string; caption_en?: string }[];
};

// Flaches zweisprachiges Feld lesen (base_de/base_en); EN fällt auf DE zurück.
export function bi(obj: any, base: string, lang: Lang): string {
  if (!obj) return '';
  const de = obj[base + '_de'];
  const en = obj[base + '_en'];
  return lang === 'en' ? en || de || '' : de || '';
}

// Foto-Wert: reiner /uploads-Pfad ODER JSON-Blob {original,display,crop} (String-Feld)
// ODER Alt-Objekt. -> original (voll) + crop-Rechteck (Bruchteile des Originals).
type CropRect = { x: number; y: number; w: number; h: number };
function parsePhotoVal(v: any): { original: string; display: string; crop: CropRect | null } {
  if (!v) return { original: '', display: '', crop: null };
  if (typeof v === 'object') return { original: v.original || '', display: v.display || v.original || '', crop: (v.crop as CropRect) || null };
  const s = String(v).trim();
  if (s.charAt(0) === '{') {
    try { const o = JSON.parse(s); return { original: o.original || '', display: o.display || o.original || '', crop: (o.crop as CropRect) || null }; } catch { /* Pfad */ }
  }
  return { original: s, display: s, crop: null };
}
export function photoDisplay(v: any): string { return parsePhotoVal(v).display; }
export function photoFull(v: any): string { return parsePhotoVal(v).original; }

// CSS-Zuschnitt (kein eingebranntes Bild): zeigt das ORIGINAL und schneidet per CSS
// auf das gespeicherte crop-Rechteck zu -> nie „?"/Warten, keine Extra-Datei.
// Frame-Seitenverhältnis muss = cropRatio sein (Person 4/3, Station 16/10 = --ar-media).
// Rückgabe: { src, style } für ein <img> in einem .ph (position:relative, overflow:hidden).
export function photoFrame(v: any): { src: string; style: Record<string, any> } {
  const p = parsePhotoVal(v);
  const src = p.original ? normalizePath(p.original) : '';
  if (!src) return { src: '', style: {} };
  const c = p.crop;
  if (c && c.w > 0 && c.h > 0) {
    return {
      src,
      style: {
        position: 'absolute',
        width: `${100 / c.w}%`, height: `${100 / c.h}%`,
        left: `${-(c.x / c.w) * 100}%`, top: `${-(c.y / c.h) * 100}%`,
        maxWidth: 'none', maxHeight: 'none', objectFit: 'cover',
      },
    };
  }
  // Kein Crop -> Vollbild cover.
  return { src, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } };
}

// Koordinate aus GeoJSON-Point-String: {"type":"Point","coordinates":[lon,lat]}
export function pickCoord(location: string | undefined, which: 'lat' | 'lon'): number | null {
  if (typeof location === 'string' && location.indexOf('coordinates') !== -1) {
    try {
      const c = (JSON.parse(location) || {}).coordinates;
      if (c && typeof c[0] === 'number' && typeof c[1] === 'number') return which === 'lat' ? c[1] : c[0];
    } catch {
      /* fehlerhaftes GeoJSON -> null */
    }
  }
  return null;
}

export function tl(b: Bi | undefined, lang: Lang): string {
  if (!b) return '';
  return lang === 'en' ? b.en || b.de || '' : b.de || '';
}

// Reise-Anzeigename (title = DE/isTitle, title_en = optionale EN-Variante).
export function tripTitle(d: { title?: string; title_en?: string } | undefined, lang: Lang): string {
  if (!d) return '';
  return lang === 'en' ? d.title_en || d.title || '' : d.title || '';
}

export type ViewStop = {
  name: string;
  lat: number | null;
  lon: number | null;
  title: string;
  date: string;
  text: string;
  photo: string;      // Anzeige (Original-Pfad)
  photoFull: string;  // Original (Lightbox)
  frame: { src: string; style: Record<string, any> }; // CSS-Zuschnitt (src + img-Style)
  photos: string[];
  video: string;
  youtube: string;
};

export function viewStops(trip: RawTrip, lang: Lang): ViewStop[] {
  return (trip.stops || []).map((s) => ({
    name: s.name || '',
    lat: pickCoord(s.location, 'lat'),
    lon: pickCoord(s.location, 'lon'),
    title: bi(s, 'title', lang) || s.name || '',
    date: bi(s, 'date', lang),
    text: bi(s, 'text', lang),
    photo: photoDisplay(s.photo),
    photoFull: photoFull(s.photo),
    frame: photoFrame(s.photo),
    photos: Array.isArray(s.photos) ? s.photos.filter(Boolean) : [],
    video: s.video || '',
    youtube: s.youtube || '',
  }));
}

// Sortierte Reise-Liste (nach order, dann Datum absteigend).
export function sortTrips<T extends { slug: string; data: RawTrip }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const oa = a.data.order ?? 99;
    const ob = b.data.order ?? 99;
    if (oa !== ob) return oa - ob;
    return (b.data.date || '').localeCompare(a.data.date || '');
  });
}
