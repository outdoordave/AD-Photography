// Reisen-Logik: 1:1-Port von pickStopCoord/buildTrip (index.html). Die migrierten
// trip-JSONs sind bereits sauber ({de,en}-verschachtelt); hier nur Koordinaten aus
// dem GeoJSON-Point lesen + Sprach-Helfer + zu Ansichts-Stops normalisieren.

export type Lang = 'de' | 'en';
export type Bi = { de?: string; en?: string };

export type RawStop = {
  name?: string;
  location?: string;
  title?: Bi;
  date?: Bi;
  text?: Bi;
  photo?: string;
  photos?: string[];
  video?: string;
  youtube?: string;
};
export type RawTrip = {
  order?: number;
  title?: Bi;
  date?: string;
  meta?: Bi;
  summary?: Bi;
  upcoming?: boolean;
  stops?: RawStop[];
  gallery?: { image: string; caption?: Bi }[];
};

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

export type ViewStop = {
  name: string;
  lat: number | null;
  lon: number | null;
  title: string;
  date: string;
  text: string;
  photo: string;
  photos: string[];
  video: string;
  youtube: string;
};

export function viewStops(trip: RawTrip, lang: Lang): ViewStop[] {
  return (trip.stops || []).map((s) => ({
    name: s.name || '',
    lat: pickCoord(s.location, 'lat'),
    lon: pickCoord(s.location, 'lon'),
    title: tl(s.title, lang) || s.name || '',
    date: tl(s.date, lang),
    text: tl(s.text, lang),
    photo: s.photo || '',
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
