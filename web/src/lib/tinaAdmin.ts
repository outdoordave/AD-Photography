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

// Tina-Route eines Dokuments MIT Live-Vorschau. Wichtig: Tina hat zwei Routen —
//   /collections/edit/<name>/~/<slug>  -> NUR Formular (keine Vorschau)
//   /collections/<name>/~/<slug>       -> visuelle Ansicht MIT Live-Vorschau (wie Tinas eigene Navigation)
// Wir wollen letztere, damit „Bearbeiten" genau dort landet, wo man auch über die Übersicht hinkommt.
// relativePath MIT Endung (z. B. „slug.md"); die Route braucht den Dateinamen OHNE Endung.
export function editHref(collection: string, relativePath: string): string {
  const noExt = relativePath.replace(/\.[^.]+$/, '');
  return `/admin/index.html#/collections/${collection}/~/${noExt}`;
}

export function newHref(collection: string): string {
  return `/admin/index.html#/collections/new/${collection}`;
}

// Kleiner GraphQL-Helfer gegen die Tina-Content-API (mit Login-Token).
async function tinaGql(query: string, variables: Record<string, any>): Promise<{ ok: boolean; data?: any; error?: string }> {
  const token = authToken();
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
