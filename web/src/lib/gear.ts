// Gear / Equipment — Gruppierung nach den (direkt im Equipment-Formular pflegbaren)
// Kategorien. Jedes Gerät speichert die „Kennung" (key) seiner Kategorie; die Liste
// `categories` (label_de/label_en/key) liefert Überschrift + Reihenfolge (= Listen-
// reihenfolge). Leere Kategorien entfallen. Geräte mit unbekannter/leerer Kennung
// werden nicht still verschluckt: unbekannte landen am Ende unter ihrer Kennung.

export type GearCategory = { key?: string; label_de?: string; label_en?: string };
export type GearItem = { name: string; brand?: string; category?: string; link?: string };
export type GearGroup = { id: string; de: string; en: string; items: GearItem[] };

export function groupGear(items: GearItem[], categories: GearCategory[]): GearGroup[] {
  const list = Array.isArray(items) ? items : [];
  const cats = Array.isArray(categories) ? categories : [];
  const groups: GearGroup[] = [];
  const usedKeys = new Set<string>();

  // 1) In der Reihenfolge der Kategorien-Liste.
  for (const c of cats) {
    const key = (c?.key || '').trim();
    if (!key) continue;
    const its = list.filter((it) => (it?.category || '') === key);
    usedKeys.add(key);
    if (its.length) {
      const de = c?.label_de || key;
      groups.push({ id: key, de, en: c?.label_en || de, items: its });
    }
  }

  // 2) Geräte mit gesetzter, aber unbekannter Kennung -> am Ende, nach Kennung gruppiert.
  const leftover = new Map<string, GearItem[]>();
  for (const it of list) {
    const k = (it?.category || '').trim();
    if (!k || usedKeys.has(k)) continue;
    (leftover.get(k) || leftover.set(k, []).get(k)!).push(it);
  }
  for (const [k, its] of leftover) groups.push({ id: k, de: k, en: k, items: its });

  return groups;
}

// Nur http(s)-Links zulassen (Pendant zu wwSafeUrl); sonst kein Link.
export function safeUrl(url?: string): string {
  if (!url) return '';
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : '';
}

// --- Profil-Ausrüstung <-> Equipment-Verlinkung -------------------------------
// Die Ausrüstung unter den „Über uns"-Profilen ist eine Freitextzeile
// (z. B. „Ausrüstung: Sony A7 IV · Tamron 28-75mm · …"). Diese Helfer zerlegen die
// Zeile in Einzel-Tokens und finden — wenn ein Token einem Equipment-Gerät mit Link
// entspricht — die passende URL, damit die Profil-Ausrüstung genauso verlinkt wie
// die Equipment-Seite. Kein CMS-Umbau nötig; rein auf den vorhandenen Daten.

// Präfix („Ausrüstung:" / „Gear:") entfernen, an „·" trennen, leere Teile raus.
export function personGearTokens(raw?: string): string[] {
  const s = String(raw || '').replace(/^[^:]*:\s*/, '').trim();
  return s ? s.split('·').map((x) => x.trim()).filter(Boolean) : [];
}

// Normalisieren: klein, nur a-z0-9 (Leerzeichen/Bindestriche/„/" etc. raus),
// damit „Sony A7 IV" == „sony a7iv" == „Sony A7IV".
function normGear(s: string): string {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Passende Equipment-URL für ein Profil-Token (oder '' wenn keins/kein Link).
// Match: normalisiert gleich ODER (ab Länge 4) das eine im anderen enthalten
// (fängt „Tamron 28-75mm" ↔ „Tamron 28-75mm f/2.8" ab). Kürzere Tokens: nur exakt.
export function gearLinkFor(token: string, items: GearItem[]): string {
  const tn = normGear(token);
  if (tn.length < 3) return '';
  const list = Array.isArray(items) ? items : [];
  for (const it of list) {
    const inm = normGear(it?.name || '');
    if (!inm) continue;
    const hit = inm === tn || (inm.length >= 4 && (tn.includes(inm) || inm.includes(tn)));
    if (hit) {
      const u = safeUrl(it?.link);
      if (u) return u;
    }
  }
  return '';
}
