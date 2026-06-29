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

// Schlüssel KANONISIEREN: ein `type:'image'`-Feld (z. B. Story-Cover) bekommt von Tina Cloud
// für die Anzeige oft die CDN-URL `https://assets.tina.io/<id>/<datei>`, beim Upload wird der
// Blob aber unter `/uploads/<datei>` abgelegt. Ohne Kanonisierung passt der Schlüssel beim
// Lesen nicht zum Schlüssel beim Schreiben → Vorschau bleibt auf dem alten Bild. Beide Seiten
// (put/get) reduzieren deshalb auf denselben `/uploads/<datei>`-Schlüssel.
function canonUpload(p: string): string {
  if (!p) return p;
  const m = p.match(/^https?:\/\/assets\.tina\.io\/[^/]+\/(.+)$/i);
  const out = m ? '/uploads/' + m[1] : p;
  return out.replace(/\/uploads(?:\/uploads)+\//g, '/uploads/');
}

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
  const key = PREFIX + canonUpload(path);
  try {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      const write = () => {
        store.setItem(key, dataUrl);
        // Gleiches-Fenster-Listener wecken (das `storage`-Event feuert NUR in ANDEREN
        // Fenstern derselben Origin — die Vorschau-iframe bekommt es, das schreibende
        // Admin-Fenster nicht). So aktualisiert sich die Vorschau auch ohne Tina-Re-Render.
        try { window.dispatchEvent(new CustomEvent('ww:fresh-media', { detail: { path: canonUpload(path) } })); } catch (e) { /* egal */ }
      };
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
    const v = store.getItem(PREFIX + canonUpload(path));
    return v && v.indexOf('data:') === 0 ? v : null;
  } catch (e) {
    return null;
  }
}

// Ergebnis-Kanal für das „Foto tauschen"-Overlay (PhotoSwapOverlay in der iframe). Das
// Upload-Feld (im Admin-Fenster) meldet Erfolg + Größen-Info zurück; die Overlay liest es
// per `storage`-Event und zeigt einen Hinweis — analog zum Info-Text im CMS-Formular.
const SWAP_INFO_KEY = 'wwswapinfo';
export type SwapInfo = { value: string; ok: boolean; text: string; ts: number };

export function putSwapInfo(value: string, ok: boolean, text: string, ts: number): void {
  const store = ls();
  if (!store) return;
  try { store.setItem(SWAP_INFO_KEY, JSON.stringify({ value, ok, text, ts } as SwapInfo)); } catch (e) { /* egal */ }
}

export function getSwapInfo(): SwapInfo | null {
  const store = ls();
  if (!store) return null;
  try {
    const v = store.getItem(SWAP_INFO_KEY);
    if (!v) return null;
    const o = JSON.parse(v);
    return o && typeof o.value === 'string' ? (o as SwapInfo) : null;
  } catch (e) { return null; }
}

// Liste der frisch hochgeladenen Bilder (Pfad + data:-URL) — für die Mediathek-Vorschau,
// damit ein gerade hochgeladenes (noch nicht deploytes) Bild dort sofort auffindbar ist.
// NUR im Editor-iframe; live/Build leer.
export function listFreshMedia(): Array<{ path: string; dataUrl: string }> {
  if (typeof window === 'undefined' || window.self === window.top) return [];
  const store = ls();
  if (!store) return [];
  const out: Array<{ path: string; dataUrl: string }> = [];
  try {
    for (const k of freshKeys(store)) {
      const v = store.getItem(k);
      if (v && v.indexOf('data:') === 0) out.push({ path: k.slice(PREFIX.length), dataUrl: v });
    }
  } catch (e) { /* egal */ }
  return out;
}
