// Gemeinsame, React-freie Helfer zum Durchstöbern der Mediathek (Ordnerbaum + Sortierung +
// Suche) — abgeleitet aus der Logik der Medien-Manager-Seite (MediaManager.tsx). Damit der
// „🖼️ Aus Mediathek"-Feld-Picker dieselbe Ordnung anbietet wie der Manager, ohne den großen
// Manager anzufassen (kein Regressionsrisiko). Quelle bleibt uploads-manifest.json (flache
// „/uploads/<pfad>"-Liste) + uploads-meta.json ({ pfad: { size, added, camera } }).

export type MediaMeta = Record<string, { size?: number; added?: string; camera?: string }>;
export type MediaSortKey = 'name' | 'date' | 'camera' | 'type';
export type MediaSortDir = 'asc' | 'desc';

export function relOf(p: string): string { return p.replace(/^\/uploads\//, ''); }
export function baseOf(p: string): string { return p.split('/').pop() || p; }
export function extOf(p: string): string { const b = baseOf(p); const i = b.lastIndexOf('.'); return i >= 0 ? b.slice(i + 1).toLowerCase() : ''; }

// Hübsche Beschriftung für ein oberstes Ordnersegment (Slugs bleiben unverändert).
const TOP_LABEL: Record<string, string> = {
  alben: 'Alben', reisen: 'Reisen', journal: 'Journal', stories: 'Stories', story: 'Stories',
  site: 'Website', allgemein: 'Allgemein',
};
export function folderLabel(segment: string, depth: number): string {
  return depth === 0 ? (TOP_LABEL[segment] || segment) : segment;
}

// Unterordner + Dateien des aktuellen Ordners aus der flachen Liste ableiten.
export function viewOf(all: string[], folder: string): { subdirs: string[]; files: string[] } {
  const prefix = folder ? folder + '/' : '';
  const subdirs = new Set<string>();
  const files: string[] = [];
  for (const p of all) {
    const rel = relOf(p);
    if (prefix && !rel.startsWith(prefix)) continue;
    const rest = rel.slice(prefix.length);
    if (!rest) continue;
    const slash = rest.indexOf('/');
    if (slash >= 0) subdirs.add(rest.slice(0, slash));
    else files.push(p);
  }
  return { subdirs: Array.from(subdirs).sort((a, b) => a.localeCompare(b)), files };
}

// Sortier-Vergleich (identische Semantik wie MediaManager, Teilmenge Name/Datum/Kamera/Typ).
export function compareMedia(a: string, b: string, meta: MediaMeta, key: MediaSortKey): number {
  if (key === 'name') return baseOf(a).localeCompare(baseOf(b));
  if (key === 'date') return (meta[a]?.added || '').localeCompare(meta[b]?.added || '') || baseOf(a).localeCompare(baseOf(b));
  if (key === 'camera') return (meta[a]?.camera || '￿').localeCompare(meta[b]?.camera || '￿') || baseOf(a).localeCompare(baseOf(b));
  if (key === 'type') return extOf(a).localeCompare(extOf(b)) || baseOf(a).localeCompare(baseOf(b));
  return 0;
}

export function sortMedia(files: string[], meta: MediaMeta, key: MediaSortKey, dir: MediaSortDir): string[] {
  const s = files.slice().sort((a, b) => compareMedia(a, b, meta, key));
  return dir === 'desc' ? s.reverse() : s;
}

// Dateiname-Suche über ALLE Pfade (ordnerübergreifend, wie im Manager).
export function searchMedia(all: string[], q: string): string[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return all.filter((p) => relOf(p).toLowerCase().includes(t));
}

export const SORT_LABEL: Record<MediaSortKey, string> = {
  name: 'Name (A–Z)', date: 'Upload-Datum', camera: 'Kamera', type: 'Datei-Typ',
};
