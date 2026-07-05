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

// Tina-Editor-Route eines Dokuments. relativePath MIT Endung (z. B. „slug.md"); die Route braucht
// den Dateinamen OHNE Endung.
export function editHref(collection: string, relativePath: string): string {
  const noExt = relativePath.replace(/\.[^.]+$/, '');
  return `/admin/index.html#/collections/edit/${collection}/~/${noExt}`;
}

export function newHref(collection: string): string {
  return `/admin/index.html#/collections/new/${collection}`;
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
