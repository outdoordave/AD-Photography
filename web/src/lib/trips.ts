// Reisen-Logik: 1:1-Port von pickStopCoord/buildTrip (index.html). Die migrierten
// trip-JSONs sind bereits sauber ({de,en}-verschachtelt); hier nur Koordinaten aus
// dem GeoJSON-Point lesen + Sprach-Helfer + zu Ansichts-Stops normalisieren.

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

// Foto-Wert (Pfad-String ODER Zuschnitt-Objekt {original,display,crop}):
//  - photoDisplay -> die ANZEIGE-Version (zugeschnitten, gerahmt),
//  - photoFull    -> das volle Original (Lightbox / Vollbild).
export function photoDisplay(v: any): string {
  if (!v) return '';
  return typeof v === 'string' ? v : v.display || v.original || '';
}
export function photoFull(v: any): string {
  if (!v) return '';
  return typeof v === 'string' ? v : v.original || v.display || '';
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
  photo: string;      // Anzeige (zugeschnitten)
  photoFull: string;  // Original (Lightbox)
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
