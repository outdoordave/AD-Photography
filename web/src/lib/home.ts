// Startseiten-Teaser (1:1 aus renderRandomMoments/renderLatest/renderDiscover):
// am Build aus Alben/Reisen/Stories + Highlights zusammengestellt; das Mischen +
// Begrenzen (6 bzw. 3) macht die Insel beim Laden (lebendig).
import { paletteFromString, albName } from './albums';
import { tripTitle, bi, photoDisplay } from './trips';
import { normalizePath } from './stories';
import { fallbackImage } from './fallback';

export type Lang = 'de' | 'en';
type Bi = { de?: string; en?: string };
const tl = (b: Bi | undefined, l: Lang) => (b ? (l === 'en' ? b.en || b.de || '' : b.de || '') : '');

const MONTHS: Record<Lang, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
function monthYear(date: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})/.exec(date || '');
  if (!m) return '';
  return (MONTHS[lang][parseInt(m[2], 10) - 1] || '') + ' ' + m[1];
}

type Doc = { slug: string; data: any };

export type Moment = { image: string; album: string; c1: string; c2: string; img: string };

// Momentaufnahmen-Pool: Highlight-Fotos (sonst alle Album-Fotos), je mit Albumname.
export function buildMoments(albums: Doc[], highlights: string[], lang: Lang): Moment[] {
  const hlSet = new Set(highlights.map((p) => normalizePath(p)));
  const all: Moment[] = [];
  for (const a of albums) {
    const name = albName(a.data, lang);
    for (const p of (Array.isArray(a.data.photos) ? a.data.photos : [])) {
      if (typeof p !== 'string' || !p) continue;
      const pal = paletteFromString(p);
      all.push({ image: p, album: name, c1: pal.c1, c2: pal.c2, img: pal.img });
    }
  }
  const hl = all.filter((m) => hlSet.has(normalizePath(m.image)));
  return hl.length ? hl : all;
}

export type LatestCard = { tag: string; title: string; meta: string; href: string; image: string; c1: string; c2: string; img: string };

// „Aktuell": Stories (nur wenn sichtbar) + Reisen (keine upcoming) + Alben (mit Datum),
// nach Datum absteigend, Top 3.
export function buildLatest(opts: { stories: Doc[]; trips: Doc[]; albums: Doc[]; lang: Lang; showStories: boolean; prefix: string }): LatestCard[] {
  const { stories, trips, albums, lang, showStories, prefix } = opts;
  const TAG = {
    story: { de: 'Neuer Beitrag', en: 'New story' },
    trip: { de: 'Neue Reise', en: 'New trip' },
    album: { de: 'Neues Album', en: 'New album' },
  };
  const rows: { date: string; card: LatestCard }[] = [];

  if (showStories) {
    for (const s of stories) {
      const d = s.data;
      const title = lang === 'en' ? d.title_en || d.title_de : d.title_de;
      const cat = lang === 'en' ? d.category_en || d.category_de : d.category_de;
      const pal = paletteFromString(d.cover || s.slug);
      rows.push({ date: d.date || '', card: { tag: TAG.story[lang], title: title || '', meta: [monthYear(d.date, lang), cat].filter(Boolean).join(' · '), href: `${prefix}/stories/${s.slug}`, image: d.cover || fallbackImage(title, cat, s.slug), c1: pal.c1, c2: pal.c2, img: pal.img } });
    }
  }
  for (const t of trips) {
    const d = t.data;
    if (d.upcoming || !d.title) continue;
    const firstPhoto = (Array.isArray(d.stops) ? d.stops : []).map((s: any) => photoDisplay(s && s.photo)).find(Boolean) || '';
    const pal = paletteFromString(firstPhoto || t.slug);
    rows.push({ date: d.date || '', card: { tag: TAG.trip[lang], title: tripTitle(d, lang), meta: bi(d, 'meta', lang) || monthYear(d.date, lang), href: `${prefix}/trips/${t.slug}`, image: firstPhoto || fallbackImage(tripTitle(d, lang), bi(d, 'meta', lang)), c1: pal.c1, c2: pal.c2, img: pal.img } });
  }
  for (const a of albums) {
    const d = a.data;
    if (!d.date) continue;
    const firstPhoto = (Array.isArray(d.photos) ? d.photos : []).find((p: any) => typeof p === 'string' && p) || '';
    const pal = paletteFromString(firstPhoto || a.slug);
    rows.push({ date: d.date, card: { tag: TAG.album[lang], title: albName(d, lang), meta: monthYear(d.date, lang), href: `${prefix}/portfolio/${a.slug}`, image: firstPhoto, c1: pal.c1, c2: pal.c2, img: pal.img } });
  }
  rows.sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  return rows.slice(0, 3).map((r) => r.card);
}

export type DiscoverItem = { cat: string; title: string; image: string; href: string; c1: string; c2: string; img: string };

// „Entdecken"-Pool: Highlight-Fotos + Alben + vergangene Reisen (Insel mischt + nimmt 3).
export function buildDiscover(opts: { albums: Doc[]; trips: Doc[]; highlights: string[]; lang: Lang; prefix: string }): DiscoverItem[] {
  const { albums, trips, highlights, lang, prefix } = opts;
  const hlSet = new Set(highlights.map((p) => normalizePath(p)));
  const pool: DiscoverItem[] = [];

  const allPhotos: { image: string; album: string }[] = [];
  for (const a of albums) {
    const name = albName(a.data, lang);
    for (const p of (Array.isArray(a.data.photos) ? a.data.photos : [])) if (typeof p === 'string' && p) allPhotos.push({ image: p, album: name });
  }
  const hlPhotos = allPhotos.filter((p) => hlSet.has(normalizePath(p.image)));
  for (const p of (hlPhotos.length ? hlPhotos : allPhotos)) {
    const pal = paletteFromString(p.image);
    pool.push({ cat: lang === 'en' ? 'Photo' : 'Foto', title: p.album, image: p.image, href: `${prefix}/portfolio`, c1: pal.c1, c2: pal.c2, img: pal.img });
  }
  for (const a of albums) {
    const cover = (Array.isArray(a.data.photos) ? a.data.photos : []).find((p: any) => typeof p === 'string' && p) || '';
    const pal = paletteFromString(cover || a.slug);
    pool.push({ cat: 'Album', title: albName(a.data, lang), image: cover, href: `${prefix}/portfolio/${a.slug}`, c1: pal.c1, c2: pal.c2, img: pal.img });
  }
  for (const t of trips) {
    const d = t.data;
    if (d.upcoming || !d.title) continue;
    const firstPhoto = (Array.isArray(d.stops) ? d.stops : []).map((s: any) => photoDisplay(s && s.photo)).find(Boolean) || '';
    const pal = paletteFromString(firstPhoto || t.slug);
    pool.push({ cat: lang === 'en' ? 'Trip' : 'Reise', title: tripTitle(d, lang), image: firstPhoto || fallbackImage(tripTitle(d, lang), bi(d, 'meta', lang)), href: `${prefix}/trips/${t.slug}`, c1: pal.c1, c2: pal.c2, img: pal.img });
  }
  return pool;
}
