// Eigener Medien-Client für die eigenständige Seite /medien-manager (dort gibt es KEIN `cms.media`
// wie in /admin). Repliziert exakt Tinas TinaMediaStore-Cloud-Flow (aus dem Bundle extrahiert):
//   • Upload = 3 Schritte: GET /upload_url/<pfad> (Token) -> PUT auf signierte S3/R2-URL (ohne Token)
//     -> Poll request-status bis fertig.
//   • Löschen = DELETE /<pfad> (Token) -> Poll request-status.
// Auth = Bearer <id_token> (wie tinaAdmin.ts). LISTEN läuft NICHT hierüber, sondern über das
// (rekursive) uploads-manifest.json — daher hier nur upload + delete.
//
// ⚠️ Der Browser-PUT auf die signierte Fremd-URL ist CORS-abhängig; offline nicht testbar. Falls das
// im echten CMS scheitert, ist das der mit David abgestimmte „zurückmelden"-Fall (kein Auto-Fallback).
import { authToken, CONTENT_API_URL } from './tinaAdmin';

// CONTENT_API_URL = https://content.tinajs.io/1.6/content/<clientId>/github/<branch>
function parts() {
  const u = new URL(CONTENT_API_URL);
  const seg = u.pathname.split('/').filter(Boolean); // ['1.6','content','<clientId>','github','<branch>']
  const version = seg[0] || '1.6';
  const clientId = seg[2] || '';
  const assetsBase = `${u.origin.replace('content', 'assets')}/v1/${clientId}`;
  const requestStatusBase = `${u.origin}/${version}/request-status/${clientId}`;
  return { clientId, assetsBase, requestStatusBase };
}

function auth(): Record<string, string> {
  const t = authToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Poll, bis Tina die Git-Operation (upload/delete) fertig gemeldet hat. { error, message }:
// error===undefined -> noch nicht fertig; error falsy -> fertig; error truthy -> Fehler (message).
async function waitForRequest(requestStatusBase: string, requestId: string): Promise<void> {
  const start = Date.now();
  while (true) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(`${requestStatusBase}/${requestId}`, { method: 'GET', headers: auth() });
    const { error, message } = await res.json().catch(() => ({} as any));
    if (error !== undefined) { if (error) throw new Error(message || 'Fehler bei der Git-Operation.'); return; }
    if (Date.now() - start > 30000) throw new Error('Zeitüberschreitung — bitte erneut versuchen.');
  }
}

function joinPath(directory: string, filename: string): string {
  let d = (directory || '').replace(/^\/+|\/+$/g, '');
  return d ? `${d}/${filename}` : filename;
}

export type CloudResult = { ok: boolean; path?: string; error?: string };

// Datei hochladen -> gibt den gespeicherten /uploads-Pfad zurück (für Manifest/Anzeige/Zuordnung).
export async function uploadToCloud(file: File, directory: string): Promise<CloudResult> {
  const token = authToken();
  if (!token) return { ok: false, error: 'Kein Login-Token — bitte im CMS anmelden.' };
  const { assetsBase, requestStatusBase } = parts();
  const path = joinPath(directory, file.name);
  try {
    // 1) signierte Upload-URL holen
    const urlRes = await fetch(`${assetsBase}/upload_url/${path}`, { method: 'GET', headers: auth() });
    if (!urlRes.ok) {
      const j = await urlRes.json().catch(() => ({} as any));
      return { ok: false, error: j.message || `Upload-URL fehlgeschlagen (HTTP ${urlRes.status}).` };
    }
    const { signedUrl, requestId } = await urlRes.json();
    if (!signedUrl) return { ok: false, error: 'Keine Upload-URL erhalten.' };
    // 2) Datei direkt auf die signierte URL PUTen (ohne Token)
    const putRes = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!putRes.ok) return { ok: false, error: `Upload fehlgeschlagen (HTTP ${putRes.status}). Evtl. CORS — David informieren.` };
    // 3) auf Git-Bestätigung warten
    if (requestId) await waitForRequest(requestStatusBase, requestId);
    return { ok: true, path: `/uploads/${path}` };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// Datei löschen (Pfad wie „/uploads/<dir>/<file>" ODER „<dir>/<file>").
export async function deleteFromCloud(uploadsPath: string): Promise<CloudResult> {
  const token = authToken();
  if (!token) return { ok: false, error: 'Kein Login-Token — bitte im CMS anmelden.' };
  const { assetsBase, requestStatusBase } = parts();
  const rel = uploadsPath.replace(/^\/?uploads\//, '').replace(/^\/+/, '');
  try {
    const res = await fetch(`${assetsBase}/${rel}`, { method: 'DELETE', headers: auth() });
    if (res.status !== 200) {
      const j = await res.json().catch(() => ({} as any));
      return { ok: false, error: j.message || `Löschen fehlgeschlagen (HTTP ${res.status}).` };
    }
    const { requestId } = await res.json().catch(() => ({} as any));
    if (requestId) await waitForRequest(requestStatusBase, requestId);
    return { ok: true, path: uploadsPath };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}
