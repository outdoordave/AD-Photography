// Gemeinsame Admin-Helfer für die Inhalts-Verwaltung (AdminDocTools + AdminArchive).
// Sichtbarkeit nur bei Login; Bearbeiten/Neu = CMS-Routen; Löschen = sichere deleteDocument-Mutation.
// clientId + branch sind öffentlich (stehen ohnehin im /admin-Bundle).

const CLIENT_ID = 'defa5b44-687f-478c-a647-bad7355aedd3';
const BRANCH = 'main';
export const CONTENT_API_URL = `https://content.tinajs.io/1.6/content/${CLIENT_ID}/github/${BRANCH}`;

export function loggedIn(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /tina/i.test(k) && (localStorage.getItem(k) || '').length > 20) return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

export function authToken(): string | null {
  try {
    const raw = localStorage.getItem('tinacms-auth');
    if (!raw) return null;
    const o = JSON.parse(raw);
    return (o && (o.id_token || o.access_token)) || (typeof o === 'string' ? o : null);
  } catch (e) { return null; }
}

// JWT-Payload dekodieren (wie Tinas parseJwt): base64url -> JSON. Bei Fehler null.
function parseJwt(token: string): any {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(b64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) { return null; }
}

// FRISCHEN id_token holen — repliziert Tinas Client-Refresh (getRefreshedToken): access_token-JWT prüfen und,
// wenn er (fast) abgelaufen ist (< 120 s Rest), per Cognito REFRESH_TOKEN_AUTH gegen den Issuer (`iss`) erneuern
// und `tinacms-auth` zurückschreiben. Nötig, weil /medien-manager KEIN Tina-Client läuft, der das sonst tut —
// sonst steht der id_token in langen Sitzungen und Content-API-Abfragen enden in „Fehler (HTTP 401)".
let refreshInFlight: Promise<string | null> | null = null;
export async function freshToken(): Promise<string | null> {
  let toks: any;
  try {
    const raw = localStorage.getItem('tinacms-auth');
    if (!raw) return null;
    toks = JSON.parse(raw);
  } catch (e) { return null; }
  const access = toks && toks.access_token;
  const refresh = toks && toks.refresh_token;
  const claims = access ? parseJwt(access) : null;
  // Kein prüfbarer access_token oder kein refresh_token -> nicht erneuerbar, bestehenden id_token nehmen.
  if (!claims || !claims.exp || !claims.iss || !claims.client_id || !refresh) {
    return (toks && (toks.id_token || toks.access_token)) || null;
  }
  if (Date.now() / 1000 < claims.exp - 120) return toks.id_token || null; // noch gültig
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(claims.iss, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-amz-json-1.1', 'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth' },
          body: JSON.stringify({ ClientId: claims.client_id, AuthFlow: 'REFRESH_TOKEN_AUTH', AuthParameters: { REFRESH_TOKEN: refresh, DEVICE_KEY: null } }),
        });
        if (res.status !== 200) throw new Error('Refresh HTTP ' + res.status);
        const j = await res.json();
        const nt = { access_token: j.AuthenticationResult.AccessToken, id_token: j.AuthenticationResult.IdToken, refresh_token: refresh };
        try { localStorage.setItem('tinacms-auth', JSON.stringify(nt, null, 2)); } catch (e) { /* egal */ }
        return nt.id_token as string;
      } catch (e) {
        return (toks && toks.id_token) || null; // Fallback: alter Token (Aufrufer meldet ggf. weiter 401)
      } finally { refreshInFlight = null; }
    })();
  }
  return refreshInFlight;
}

// Tina-Editor-Route eines Dokuments. WICHTIG: exakt diese Form nutzt auch Tinas eigener Link
// (belegt im Admin-Bundle: `/collections/edit/${_sys.collection.name}/~/${filename}`). Ein Weglassen
// von „edit/" führt in den ORDNER-Browser („No documents found"). relativePath MIT Endung
// (z. B. „slug.md"); die Route braucht den Dateinamen OHNE Endung.
export function editHref(collection: string, relativePath: string): string {
  const noExt = relativePath.replace(/\.[^.]+$/, '');
  return `/admin/index.html#/collections/edit/${collection}/~/${noExt}`;
}

export function newHref(collection: string): string {
  return `/admin/index.html#/collections/new/${collection}`;
}

// Kleiner GraphQL-Helfer gegen die Tina-Content-API (mit Login-Token).
export async function tinaGql(query: string, variables: Record<string, any> = {}): Promise<{ ok: boolean; data?: any; error?: string }> {
  const token = await freshToken();
  if (!token) return { ok: false, error: 'Kein Login-Token gefunden — bitte im CMS neu anmelden.' };
  try {
    const res = await fetch(CONTENT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || (json && json.errors)) {
      return { ok: false, error: (json && json.errors && json.errors[0] && json.errors[0].message) || `Fehler (HTTP ${res.status}).` };
    }
    return { ok: true, data: json && json.data };
  } catch (e) { return { ok: false, error: String((e as any)?.message || e) }; }
}

// Sicheres Setzen des `archived`-Schalters OHNE Bearbeiten-Menü — als „In den Papierkorb" (true) bzw.
// „Wiederherstellen" (false). Verfahren wie Tinas eigener Speichern: erst die ROHEN Formularwerte
// (`_values`, exakt die Eingabeform) lesen, dann NUR `archived` ändern und alles zurückschreiben
// (updateDocument, params pro Collection). So gehen keine Felder verloren. Echter Durchlauf nur im CMS.
export async function setArchived(collection: string, relativePath: string, archived: boolean): Promise<{ ok: boolean; error?: string }> {
  const read = await tinaGql(
    'query v($collection:String!,$relativePath:String!){ document(collection:$collection, relativePath:$relativePath){ ... on Document { _values } } }',
    { collection, relativePath },
  );
  if (!read.ok) return { ok: false, error: read.error };
  const values = read.data && read.data.document && read.data.document._values;
  if (!values || typeof values !== 'object') return { ok: false, error: 'Datensatz nicht gefunden.' };
  // `_values` enthält System-Felder (`_collection`, `_template`), die die `<Collection>Mutation`-
  // Eingabe NICHT kennt -> würden den Update ablehnen. Deshalb alle `_`-Felder herausfiltern; echte
  // Eingabefelder beginnen nie mit „_". Übrig bleibt die reine Eingabeform + der geänderte Schalter.
  const clean: Record<string, any> = {};
  for (const k of Object.keys(values)) { if (!k.startsWith('_')) clean[k] = (values as any)[k]; }
  const params = { [collection]: { ...clean, archived } };
  const write = await tinaGql(
    'mutation u($collection:String!,$relativePath:String!,$params:DocumentUpdateMutation!){ updateDocument(collection:$collection, relativePath:$relativePath, params:$params){ __typename } }',
    { collection, relativePath, params },
  );
  return write.ok ? { ok: true } : { ok: false, error: write.error };
}

export const archiveDocument = (collection: string, relativePath: string) => setArchived(collection, relativePath, true);
export const restoreDocument = (collection: string, relativePath: string) => setArchived(collection, relativePath, false);

// --- LIVE-Stand aus Tina Cloud (nur eingeloggt) ---------------------------------------------------
// Damit Archivieren/Wiederherstellen/Löschen SOFORT wirken (nicht erst nach dem Cloudflare-Build):
// Archiv-Liste, Zahl und das Ausblenden archivierter Karten holen ihren Stand direkt von Tina Cloud.
// Tina Cloud kennt jede Mutation sofort -> stimmt auch nach Reload. Für Besucher (kein Token) liefert
// das nichts (null) -> die aufrufenden Inseln fallen auf den statischen Build-Stand zurück (sicher).
export type ArchivedItem = { relativePath: string; title: string; date?: string; teaser?: string; href?: string };
type FieldCfg = { conn: string; ext: 'md' | 'json'; base: string; title: [string, string]; teaser: [string, string] | []; };
const FIELDS: Record<string, FieldCfg> = {
  story:   { conn: 'storyConnection',   ext: 'md',   base: '/stories',   title: ['title_de', 'title_en'], teaser: ['excerpt_de', 'excerpt_en'] },
  reisen:  { conn: 'reisenConnection',  ext: 'json', base: '/trips',     title: ['title', 'title_en'],    teaser: ['meta_de', 'meta_en'] },
  alben:   { conn: 'albenConnection',   ext: 'json', base: '/portfolio', title: ['name', 'name_en'],      teaser: ['note_de', 'note_en'] },
  journal: { conn: 'journalConnection', ext: 'md',   base: '/journal',   title: ['title_de', 'title_en'], teaser: [] },
};

const archivedCache: Record<string, Promise<any[] | null> | undefined> = {};

async function fetchArchivedRaw(collection: string): Promise<any[] | null> {
  const cfg = FIELDS[collection];
  if (!cfg || !authToken()) return null;
  const fields = ['_sys{ filename }', 'archived', 'date', ...cfg.title, ...cfg.teaser].join(' ');
  const r = await tinaGql(`query{ ${cfg.conn}(first: 1000){ edges{ node{ ${fields} } } } }`, {});
  if (!r.ok || !r.data || !r.data[cfg.conn]) return null;
  const edges = r.data[cfg.conn].edges || [];
  return edges.map((e: any) => e && e.node).filter((n: any) => n && n.archived === true);
}

// Gecacht je Bereich (eine Abfrage, viele Karten teilen sie). `force` nach einer Mutation.
export function archivedNodes(collection: string, force = false): Promise<any[] | null> {
  if (force || !archivedCache[collection]) archivedCache[collection] = fetchArchivedRaw(collection);
  return archivedCache[collection] as Promise<any[] | null>;
}
export function invalidateArchived(collection: string) { archivedCache[collection] = undefined; }

// Dezentes Erfolgs-/Fehler-Popup (grün/rot), unten mittig, blendet sich selbst wieder aus. Reines
// DOM (framework-frei) -> aus jeder Insel aufrufbar, funktioniert auch im CMS-Vorschau-iframe.
export function showToast(message: string, kind: 'success' | 'error' = 'success') {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = `ww-toast ww-toast--${kind}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  (document.body || document.documentElement).appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const remove = () => { el.classList.remove('is-in'); setTimeout(() => { try { el.remove(); } catch (e) { /* egal */ } }, 320); };
  setTimeout(remove, kind === 'error' ? 4600 : 2400);
}

export function mapArchived(collection: string, node: any, lang: 'de' | 'en'): ArchivedItem {
  const cfg = FIELDS[collection];
  const en = lang === 'en';
  const f = node?._sys?.filename || '';
  const pick = (pair: string[] | []) => {
    if (!pair.length) return '';
    const de = node?.[pair[0]]; const env = node?.[pair[1]];
    return (en ? (env || de) : de) || '';
  };
  const title = pick(cfg.title) || node?.date || f;
  return {
    relativePath: `${f}.${cfg.ext}`,
    title,
    date: node?.date || '',
    teaser: pick(cfg.teaser),
    href: `${en ? '/en' : ''}${cfg.base}/${f}`,
  };
}

// Sicheres Löschen: trifft immer nur den exakt übergebenen Datensatz. Fehlwirkung = „nichts passiert"
// (Fehlermeldung), nie Datenverlust. Echter Durchlauf nur im echten CMS (mit gültigem Token).
export async function deleteDocument(collection: string, relativePath: string): Promise<{ ok: boolean; error?: string }> {
  const token = authToken();
  if (!token) return { ok: false, error: 'Kein Login-Token gefunden — bitte im CMS neu anmelden.' };
  try {
    const res = await fetch(CONTENT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: 'mutation d($collection:String!,$relativePath:String!){ deleteDocument(collection:$collection, relativePath:$relativePath){ __typename } }',
        variables: { collection, relativePath },
      }),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || (json && json.errors)) {
      return { ok: false, error: (json && json.errors && json.errors[0] && json.errors[0].message) || `Fehler (HTTP ${res.status}).` };
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: String((e as any)?.message || e) }; }
}
