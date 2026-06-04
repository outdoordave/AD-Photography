// Galerie/Alben-Logik: 1:1-Port aus index.html (buildAlbumFromData/paletteFromString/
// rebuildPortfolioFromAlbums + Sortierung aus build-indexes.js). Die migrierten
// album-JSONs sind bereits sauber ({de,en}-verschachtelt, photos = flaches Pfad-Array).

export type Lang = 'de' | 'en';
export type Bi = { de?: string; en?: string };

export type RawAlbum = {
  name?: Bi;
  note?: Bi;
  date?: string;
  linked_trip?: string;
  pin?: { highlight?: boolean; highlight_order?: number };
  photos?: string[];
};

export type AlbumEntry = { slug: string; data: RawAlbum };

export type GalleryMode = 'album' | 'chronological' | 'alphabetical';

// Sprach-Helfer wie bei Reisen (EN-Fallback auf DE).
export function tl(b: Bi | undefined, lang: Lang): string {
  if (!b) return '';
  return lang === 'en' ? b.en || b.de || '' : b.de || '';
}

// Stabile Pseudo-Farbpalette aus einem String (Foto-Pfad) -> Platzhalter ohne Bildladung.
// Exakt die 6 Paletten aus index.html (paletteFromString).
const PALETTES = [
  { c1: '#8a9a7e', c2: '#3a4a38', img: 'mountains' },
  { c1: '#b08a5e', c2: '#5e3f20', img: 'desert' },
  { c1: '#7e98a0', c2: '#3a5058', img: 'coast' },
  { c1: '#a07e6e', c2: '#352830', img: 'canyon' },
  { c1: '#9a8aa0', c2: '#4a3a50', img: 'forest' },
  { c1: '#c08a5a', c2: '#6e4520', img: 'desert' },
] as const;

export function paletteFromString(s: string): { c1: string; c2: string; img: string } {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(h) % PALETTES.length];
}

// Ein Foto in Anzeige-Form (Pfad + Platzhalter-Palette + Original-Index).
export type ViewPhoto = { image: string; c1: string; c2: string; img: string; idx: number };

export function albumPhotos(a: RawAlbum): ViewPhoto[] {
  const list = Array.isArray(a.photos) ? a.photos : [];
  const out: ViewPhoto[] = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (typeof p !== 'string' || !p) continue;
    const pal = paletteFromString(p);
    out.push({ image: p, c1: pal.c1, c2: pal.c2, img: pal.img, idx: i });
  }
  return out;
}

// Album-Sortierung wie build-indexes.js: angepinnte (pin.highlight) zuerst nach
// highlight_order (aufsteigend), dann nach Datum absteigend (neueste oben).
export function sortAlbums<T extends { slug: string; data: RawAlbum }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const pa = a.data.pin || {};
    const pb = b.data.pin || {};
    const ha = !!pa.highlight;
    const hb = !!pb.highlight;
    if (ha && !hb) return -1;
    if (!ha && hb) return 1;
    if (ha && hb) {
      const ao = typeof pa.highlight_order === 'number' ? pa.highlight_order : 9999;
      const bo = typeof pb.highlight_order === 'number' ? pb.highlight_order : 9999;
      if (ao !== bo) return ao - bo;
    }
    return (b.data.date || '').localeCompare(a.data.date || '');
  });
}
