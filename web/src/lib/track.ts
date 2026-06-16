// Mini-Helfer für cookielose Umami-Events. No-op, wenn Umami nicht geladen ist
// (z. B. Statistik im CMS aus) — wirft nie, blockiert nie.
export function track(event: string, data?: Record<string, any>): void {
  try {
    const u = (typeof window !== 'undefined' ? (window as any).umami : null);
    if (u && typeof u.track === 'function') u.track(event, data);
  } catch {
    /* Analyse darf die Seite nie stören */
  }
}

// Dateiname aus einem /uploads-Pfad (für lesbare Event-Daten, ohne Query/Ordner).
export function fileLabel(path: string): string {
  if (!path) return '';
  const clean = String(path).split('?')[0].split('#')[0];
  const base = clean.substring(clean.lastIndexOf('/') + 1);
  return base || clean;
}
