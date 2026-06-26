// „Frisch-Upload"-Brücke für die CMS-Live-Vorschau.
//
// Problem: Ein gerade hochgeladenes Bild wird als /uploads/<datei> gespeichert,
// diese Datei liegt aber erst nach dem nächsten Deploy auf der Seite. Die Live-
// Vorschau im CMS rendert die echte Seite → lädt /uploads/<neu> → 404 → zeigt das
// „alte" Bild. Das Upload-Feld hat die Datei aber schon im Browser.
//
// Lösung: Das Upload-Feld legt die Datei als portable `data:`-URL im localStorage ab
// (Schlüssel = der gespeicherte Pfad). Die Vorschau läuft als IFRAME im selben Origin
// → liest denselben localStorage → zeigt das frische Bild sofort. Greift NUR im Editor
// (iframe); die Live-Seite (top-level, und per CSP `frame-ancestors 'self'` nicht fremd
// einbettbar) liest das nie. Bei SSG/Build gibt es kein `window` → ebenfalls inaktiv.

const PREFIX = 'wwfresh:';
const MAX_ENTRIES = 8; // Vorschau-Cache klein halten (localStorage-Quota schonen)

function ls(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (e) {
    return null;
  }
}

function freshKeys(store: Storage): string[] {
  const out: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && k.indexOf(PREFIX) === 0) out.push(k);
  }
  return out;
}

function clearAll(store: Storage): void {
  try { freshKeys(store).forEach((k) => store.removeItem(k)); } catch (e) { /* egal */ }
}

// Schreiben (Upload-Feld): Datei als data:-URL hinterlegen, Schlüssel = gespeicherter Pfad.
export function putFreshMedia(path: string, file: Blob): void {
  const store = ls();
  if (!store || !path || !file) return;
  try {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const write = () => store.setItem(PREFIX + path, dataUrl);
      try {
        // älteste Einträge wegräumen, damit der Cache nicht über die Quota läuft
        const keys = freshKeys(store);
        while (keys.length >= MAX_ENTRIES) { const k = keys.shift(); if (k) store.removeItem(k); }
        write();
      } catch (e) {
        // Quota voll → alles räumen und einmal neu versuchen; sonst still aufgeben
        try { clearAll(store); write(); } catch (_e) { /* egal */ }
      }
    };
    reader.readAsDataURL(file);
  } catch (e) { /* egal */ }
}

// Lesen (Render): NUR im Editor-iframe eine frische data:-URL liefern, sonst null.
export function getFreshMedia(path: string): string | null {
  if (typeof window === 'undefined' || window.self === window.top) return null; // Live/Build → nie
  const store = ls();
  if (!store || !path) return null;
  try {
    const v = store.getItem(PREFIX + path);
    return v && v.indexOf('data:') === 0 ? v : null;
  } catch (e) {
    return null;
  }
}
