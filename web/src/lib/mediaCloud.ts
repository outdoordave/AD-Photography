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
import { authToken, CONTENT_API_URL, tinaGql } from './tinaAdmin';
import { toLocalMedia, dedupeUploads } from '../../tina/fields/mediaPath';

// CONTENT_API_URL = https://content.tinajs.io/1.6/content/<clientId>/github/<branch>
function parts() {
  const u = new URL(CONTENT_API_URL);
  const seg = u.pathname.split('/').filter(Boolean); // ['1.6','content','<clientId>','github','<branch>']
  const clientId = seg[2] || '';
  const assetsBase = `${u.origin.replace('content', 'assets')}/v1/${clientId}`;
  // WICHTIG: Tina pollt den Request-Status OHNE Versions-Segment: `content.tinajs.io/request-status/<id>/<req>`
  // (Bundle: `${contentApiBase}/request-status/${clientId}/${requestId}`, contentApiBase = Origin ohne Version).
  // Ein fälschlich eingefügtes `/1.6/` ließ den Poll-Fetch scheitern -> „Load failed" nach dem eigentlichen DELETE.
  const requestStatusBase = `${u.origin}/request-status/${clientId}`;
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

// --- „Verwendet in": Nutzungs-Check über die Content-API ---------------------------------------
// Alle Sammlungen mit Bild-Feldern. Wir holen je Dokument die ROHEN Werte (_values) und durchsuchen
// sie rekursiv nach dem Bildpfad — das fängt direkte Felder, verschachtelte Arrays UND eingebettete
// Rich-Text-Bilder (story.body_*: der /uploads-Pfad steckt als String im gespeicherten Text) auf einmal,
// ohne pro Feld/AST zu parsen. Robust gegen Schema-Änderungen.
const USAGE_COLLECTIONS = ['startseite', 'journal', 'alben', 'story', 'reisen', 'ueber_uns', 'highlights', 'darstellung'];

// Bildpfad auf eine vergleichbare Form bringen (assets.tina.io-URL -> /uploads/…, Doppel-/uploads einklappen).
function canonMedia(s: string): string { return dedupeUploads(toLocalMedia(s || '')); }

function collectStrings(v: any, out: string[]): void {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) { for (const x of v) collectStrings(x, out); }
  else if (v && typeof v === 'object') { for (const k of Object.keys(v)) collectStrings(v[k], out); }
}

function labelFrom(values: any, filename: string): string {
  return (values && (values.title_de || values.title || values.name || values.name_en || values.title_en)) || filename;
}

export type UsageItem = { collection: string; label: string; filename: string };
export type UsageResult = { ok: boolean; items?: UsageItem[]; error?: string };

export async function findUsage(uploadsPath: string): Promise<UsageResult> {
  if (!authToken()) return { ok: false, error: 'Kein Login-Token — bitte im CMS anmelden.' };
  const target = canonMedia(uploadsPath);
  if (!target) return { ok: true, items: [] };
  const q = 'query{ ' + USAGE_COLLECTIONS.map((c) => `${c}: ${c}Connection(first: 1000){ edges{ node{ _sys{ filename } _values } } }`).join(' ') + ' }';
  const r = await tinaGql(q);
  if (!r.ok || !r.data) return { ok: false, error: r.error || 'Nutzungs-Abfrage fehlgeschlagen.' };
  const items: UsageItem[] = [];
  for (const c of USAGE_COLLECTIONS) {
    const edges = (r.data[c] && r.data[c].edges) || [];
    for (const e of edges) {
      const node = e && e.node; if (!node || !node._values) continue;
      const strs: string[] = []; collectStrings(node._values, strs);
      if (strs.some((s) => canonMedia(s).includes(target))) {
        items.push({ collection: c, label: labelFrom(node._values, node._sys?.filename || ''), filename: node._sys?.filename || '' });
      }
    }
  }
  return { ok: true, items };
}

// --- „Diesem Inhalt zuweisen": Bild einem Feld eines Dokuments zuordnen -------------------------
// Zuweisbare TOP-LEVEL-Bildfelder je Sammlung (Einzelwert = ersetzen, Liste = anhängen). Verschachtelte
// Array-Felder (reisen.stops[], ueber_uns.persons[], reisen.gallery[]) und Rich-Text-Bilder sind hier
// bewusst NICHT dabei (bräuchten Index-/Text-Auswahl) — die pflegt man im jeweiligen Dokument.
export type AssignField = { path: string; label: string; kind: 'set' | 'append' };
export type AssignTarget = { collection: string; ext: 'md' | 'json'; label: string; titleField: string; fields: AssignField[] };
export const ASSIGN_TARGETS: AssignTarget[] = [
  { collection: 'story', ext: 'md', label: 'Story', titleField: 'title_de', fields: [{ path: 'cover', label: 'Titelbild', kind: 'set' }] },
  { collection: 'alben', ext: 'json', label: 'Album', titleField: 'name', fields: [{ path: 'photos', label: 'Fotos (anhängen)', kind: 'append' }] },
  { collection: 'journal', ext: 'md', label: 'Journal', titleField: 'title_de', fields: [{ path: 'photos', label: 'Fotos (anhängen)', kind: 'append' }] },
  { collection: 'highlights', ext: 'json', label: 'Highlights', titleField: '', fields: [{ path: 'images', label: 'Highlight-Fotos (anhängen)', kind: 'append' }] },
  { collection: 'darstellung', ext: 'json', label: 'Darstellung', titleField: '', fields: [{ path: 'logo', label: 'Logo', kind: 'set' }] },
  { collection: 'startseite', ext: 'json', label: 'Startseite', titleField: '', fields: [{ path: 'hero.image', label: 'Hero-Einzelbild', kind: 'set' }, { path: 'hero.slideshow', label: 'Hero-Diashow (anhängen)', kind: 'append' }] },
];

function getAt(obj: any, path: string): any { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function setAt(obj: any, path: string, value: any): void {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = value;
}

// Dokument-Liste einer Sammlung (für die Auswahl). label aus dem Titelfeld (Fallback Dateiname).
export async function listAssignDocs(target: AssignTarget): Promise<{ ok: boolean; docs?: { filename: string; label: string }[]; error?: string }> {
  if (!authToken()) return { ok: false, error: 'Kein Login-Token.' };
  const r = await tinaGql(`query{ ${target.collection}Connection(first: 1000){ edges{ node{ _sys{ filename } _values } } } }`);
  if (!r.ok || !r.data) return { ok: false, error: r.error || 'Dokumentliste fehlgeschlagen.' };
  const edges = (r.data[`${target.collection}Connection`] && r.data[`${target.collection}Connection`].edges) || [];
  const docs = edges.map((e: any) => {
    const n = e && e.node; const f = (n && n._sys && n._sys.filename) || '';
    const label = (n && n._values && (n._values[target.titleField] || n._values.title_de || n._values.title || n._values.name)) || f;
    return { filename: f, label };
  }).filter((d: any) => d.filename);
  return { ok: true, docs };
}

// Zuweisen: _values lesen, Feld setzen/anhängen, `_`-Felder filtern, zurückschreiben (wie setArchived).
// Bei kind:'set' und bereits gesetztem Feld -> needConfirm (nur mit overwrite=true wirklich ersetzen).
export async function assignImage(
  target: AssignTarget, filename: string, field: AssignField, imagePath: string, opts: { overwrite?: boolean } = {},
): Promise<{ ok: boolean; needConfirm?: boolean; current?: string; error?: string }> {
  if (!authToken()) return { ok: false, error: 'Kein Login-Token.' };
  const relativePath = `${filename}.${target.ext}`;
  const read = await tinaGql('query v($collection:String!,$relativePath:String!){ document(collection:$collection, relativePath:$relativePath){ ... on Document { _values } } }', { collection: target.collection, relativePath });
  if (!read.ok) return { ok: false, error: read.error };
  const values = read.data && read.data.document && read.data.document._values;
  if (!values || typeof values !== 'object') return { ok: false, error: 'Dokument nicht gefunden.' };
  if (field.kind === 'set') {
    const cur = getAt(values, field.path);
    if (cur && !opts.overwrite) return { ok: false, needConfirm: true, current: String(cur) };
    setAt(values, field.path, imagePath);
  } else {
    const cur = getAt(values, field.path);
    const arr = Array.isArray(cur) ? cur.slice() : [];
    if (arr.indexOf(imagePath) === -1) arr.push(imagePath);
    setAt(values, field.path, arr);
  }
  const clean: Record<string, any> = {};
  for (const k of Object.keys(values)) { if (!k.startsWith('_')) clean[k] = values[k]; }
  const write = await tinaGql('mutation u($collection:String!,$relativePath:String!,$params:DocumentUpdateMutation!){ updateDocument(collection:$collection, relativePath:$relativePath, params:$params){ __typename } }', { collection: target.collection, relativePath, params: { [target.collection]: clean } });
  return write.ok ? { ok: true } : { ok: false, error: write.error };
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

// --- Verschieben (Ordnen) mit automatischem Referenz-Umschreiben ---------------------------------
// Tina kennt kein „move": Datei an neuen Pfad kopieren -> ALLE Fundstellen umbiegen -> alte Datei löschen.
// Reihenfolge bewusst so: nach dem Kopieren zeigen die umgeschriebenen Referenzen bereits auf die
// vorhandene Kopie; erst danach die alte Datei entfernen. Bricht ein Schritt ab, bleibt der Stand
// wiederherstellbar (nie eine tote Referenz). ⚠️ Nur im echten CMS testbar (Token + Content-API + CORS).
const COLLECTION_EXT: Record<string, 'md' | 'json'> = {
  startseite: 'json', journal: 'md', alben: 'json', story: 'md',
  reisen: 'json', ueber_uns: 'json', highlights: 'json', darstellung: 'json',
};

// Rekursiv alle Strings in einem _values-Baum ersetzen, die auf das alte Bild zeigen. Zwei Fälle:
// (1) der ganze Feldwert IST das Bild (kanonischer Treffer) -> auf neuen Pfad setzen; (2) das Bild
// steckt als Teilstring (Rich-Text-Fließtext) -> die /uploads-Form ersetzen. Gibt {changed, value} zurück.
function replaceRefsDeep(v: any, oldPath: string, newPath: string): { changed: boolean; value: any } {
  if (typeof v === 'string') {
    if (canonMedia(v) === canonMedia(oldPath)) return { changed: v !== newPath, value: newPath };
    const oldRel = oldPath.replace(/^\/+/, '');
    const newRel = newPath.replace(/^\/+/, '');
    if (v.indexOf(oldPath) !== -1) { const nv = v.split(oldPath).join(newPath); return { changed: nv !== v, value: nv }; }
    if (v.indexOf(oldRel) !== -1) { const nv = v.split(oldRel).join(newRel); return { changed: nv !== v, value: nv }; }
    return { changed: false, value: v };
  }
  if (Array.isArray(v)) {
    let changed = false;
    const out = v.map((x) => { const r = replaceRefsDeep(x, oldPath, newPath); if (r.changed) changed = true; return r.value; });
    return { changed, value: changed ? out : v };
  }
  if (v && typeof v === 'object') {
    let changed = false; const out: Record<string, any> = {};
    for (const k of Object.keys(v)) { const r = replaceRefsDeep(v[k], oldPath, newPath); if (r.changed) changed = true; out[k] = r.value; }
    return { changed, value: changed ? out : v };
  }
  return { changed: false, value: v };
}

// Alle Dokumente durchgehen und Referenzen old->new umschreiben. Gibt die Zahl geänderter Dokumente zurück.
async function rewriteReferences(oldPath: string, newPath: string): Promise<{ ok: boolean; count: number; error?: string }> {
  const q = 'query{ ' + USAGE_COLLECTIONS.map((c) => `${c}: ${c}Connection(first: 1000){ edges{ node{ _sys{ filename } _values } } }`).join(' ') + ' }';
  const r = await tinaGql(q);
  if (!r.ok || !r.data) return { ok: false, count: 0, error: r.error || 'Nutzungs-Abfrage fehlgeschlagen.' };
  let count = 0;
  for (const c of USAGE_COLLECTIONS) {
    const edges = (r.data[c] && r.data[c].edges) || [];
    for (const e of edges) {
      const node = e && e.node; if (!node || !node._values) continue;
      const filename = node._sys && node._sys.filename; if (!filename) continue;
      const { changed, value } = replaceRefsDeep(node._values, oldPath, newPath);
      if (!changed) continue;
      const clean: Record<string, any> = {};
      for (const k of Object.keys(value)) { if (!k.startsWith('_')) clean[k] = value[k]; }
      const relativePath = `${filename}.${COLLECTION_EXT[c]}`;
      const w = await tinaGql('mutation u($collection:String!,$relativePath:String!,$params:DocumentUpdateMutation!){ updateDocument(collection:$collection, relativePath:$relativePath, params:$params){ __typename } }', { collection: c, relativePath, params: { [c]: clean } });
      if (!w.ok) return { ok: false, count, error: `${c}/${filename}: ${w.error}` };
      count++;
    }
  }
  return { ok: true, count };
}

export type MoveResult = { ok: boolean; newPath?: string; refs?: number; error?: string };

// Ein Bild in einen Zielordner verschieben (targetDir relativ zu uploads, z. B. "tiere" oder "reisen/x").
export async function moveInCloud(oldPath: string, targetDir: string): Promise<MoveResult> {
  if (!authToken()) return { ok: false, error: 'Kein Login-Token — bitte im CMS anmelden.' };
  const filename = (oldPath.split('/').pop() || '').trim();
  if (!filename) return { ok: false, error: 'Ungültiger Pfad.' };
  const newPath = `/uploads/${joinPath(targetDir, filename)}`;
  if (canonMedia(newPath) === canonMedia(oldPath)) return { ok: false, error: 'Quelle und Ziel sind identisch.' };
  // 1) Bytes der alten Datei holen
  let file: File;
  try {
    const res = await fetch(oldPath, { cache: 'no-store' });
    if (!res.ok) return { ok: false, error: `Datei nicht ladbar (HTTP ${res.status}).` };
    const blob = await res.blob();
    file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  } catch (e: any) { return { ok: false, error: 'Datei nicht ladbar: ' + String(e?.message || e) }; }
  // 2) an den neuen Pfad hochladen (Kopie)
  const up = await uploadToCloud(file, targetDir);
  if (!up.ok || !up.path) return { ok: false, error: up.error || 'Kopieren fehlgeschlagen.' };
  // 3) alle Referenzen umbiegen
  const rw = await rewriteReferences(oldPath, up.path);
  if (!rw.ok) return { ok: false, newPath: up.path, error: 'Kopiert, aber Referenzen umschreiben fehlgeschlagen: ' + rw.error };
  // 4) alte Datei löschen
  const del = await deleteFromCloud(oldPath);
  if (!del.ok) return { ok: true, newPath: up.path, refs: rw.count, error: 'Verschoben, aber die alte Datei blieb liegen: ' + del.error };
  return { ok: true, newPath: up.path, refs: rw.count };
}
