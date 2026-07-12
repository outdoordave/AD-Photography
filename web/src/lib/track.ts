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

// Eigener, cookieloser Bild-Aufruf-Zähler (Cloudflare KV via /api/view). Non-blocking, wirft nie.
// Speist die Sortierung „Am meisten angesehen" im Medien-Manager — unabhängig von Umami (kein Bezahlplan).
export function countView(name: string): void {
  if (!name || typeof fetch === 'undefined') return;
  try {
    fetch('/api/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ img: name }),
      keepalive: true,
    }).catch(() => { /* Analyse darf die Seite nie stören */ });
  } catch { /* egal */ }
}

// Dateiname aus einem /uploads-Pfad (für lesbare Event-Daten, ohne Query/Ordner).
export function fileLabel(path: string): string {
  if (!path) return '';
  const clean = String(path).split('?')[0].split('#')[0];
  const base = clean.substring(clean.lastIndexOf('/') + 1);
  return base || clean;
}
