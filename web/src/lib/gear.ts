// Gear / Equipment — Logik 1:1 aus index.html (GEAR_CATS, buildGearFromItems,
// renderGear). Kategorien fest + in fester Reihenfolge; leere entfallen.

export type GearItem = { name: string; brand?: string; category?: string; link?: string };
export type GearCat = { cat: string; de: string; en: string };

// Feste Kategorien — Reihenfolge bestimmt die Anzeige (NICHT alphabetisch).
// 1:1 aus index.html (var GEAR_CATS).
export const GEAR_CATS: GearCat[] = [
  { cat: 'cameras',  de: 'Kameras',         en: 'Cameras' },
  { cat: 'lenses',   de: 'Objektive',       en: 'Lenses' },
  { cat: 'drones',   de: 'Drohne & Action', en: 'Drone & Action' },
  { cat: 'phone',    de: 'Smartphone',      en: 'Phone' },
  { cat: 'tripod',   de: 'Stativ',          en: 'Tripod' },
  { cat: 'backpack', de: 'Rucksack',        en: 'Backpack' },
  { cat: 'cooking',  de: 'Kochen & Camp',   en: 'Cooking & Camp' },
];

// Flache Item-Liste -> gruppiert nach GEAR_CATS-Reihenfolge.
// Leere Kategorien entfallen; Items mit unbekannter category fallen raus.
export function groupGear(items: GearItem[]): (GearCat & { items: GearItem[] })[] {
  return GEAR_CATS
    .map((c) => ({ ...c, items: (items || []).filter((it) => it.category === c.cat) }))
    .filter((g) => g.items.length > 0);
}

// Nur http(s)-Links zulassen (Pendant zu wwSafeUrl); sonst kein Link.
export function safeUrl(url?: string): string {
  if (!url) return '';
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : '';
}
