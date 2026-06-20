// Gear / Equipment — Gruppierung nach den (im CMS editierbaren) Kategorien.
// Die Kategorie eines Geräts ist eine Tina-`reference` auf die Collection
// `gear_categories`; der generierte Query expandiert sie zu einem Objekt
// { id, label_de, label_en, order }. Reihenfolge = `order` (klein -> oben),
// Gleichstand alphabetisch nach DE-Label. Leere Kategorien entfallen; Geräte
// ohne Kategorie fallen raus (wie zuvor unbekannte Kategorien).

export type GearCategoryRef = {
  id?: string;
  label_de?: string;
  label_en?: string;
  order?: number | null;
} | null;

export type GearItem = { name: string; brand?: string; category?: GearCategoryRef; link?: string };

export type GearGroup = { id: string; de: string; en: string; order: number; items: GearItem[] };

// Flache Item-Liste -> gruppiert nach referenzierter Kategorie, sortiert nach `order`.
export function groupGear(items: GearItem[]): GearGroup[] {
  const map = new Map<string, GearGroup>();
  for (const it of items || []) {
    const cat = it?.category;
    if (!cat) continue; // ohne Kategorie -> nicht anzeigen (Parität zum alten Verhalten)
    const de = cat.label_de || '';
    if (!de) continue;
    const key = cat.id || de; // stabile Gruppierung (Datei-id), Fallback Label
    let g = map.get(key);
    if (!g) {
      g = {
        id: key,
        de,
        en: cat.label_en || de,
        order: typeof cat.order === 'number' ? cat.order : Number.POSITIVE_INFINITY,
        items: [],
      };
      map.set(key, g);
    }
    g.items.push(it);
  }
  return Array.from(map.values())
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (a.order - b.order) || a.de.localeCompare(b.de, 'de'));
}

// Nur http(s)-Links zulassen (Pendant zu wwSafeUrl); sonst kein Link.
export function safeUrl(url?: string): string {
  if (!url) return '';
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : '';
}
