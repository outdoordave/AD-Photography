import React from 'react';

// Admin-Werkzeuge (Bearbeiten / Archivieren / Löschen) für EINEN Inhalt — wiederverwendbar über
// alle Bereiche (Stories, Reisen, Alben, Journal). Als React-Insel, die sich SELBST nur zeigt, wenn
// man im CMS angemeldet ist (leak-sicher: für Besucher wird gar nichts gerendert; kein Kampf mit dem
// globalen ww-admin-only-Script). Bearbeiten/Archivieren = Links in den CMS-Editor (target=_top);
// Archivieren landet direkt beim „Archiviert"-Schalter (erstes Feld). Löschen = 3-Wege-Dialog auf der
// Seite -> sichere deleteDocument-Mutation (Fehlwirkung = „nichts passiert"/Fehlermeldung, nie der
// falsche Datensatz). Der echte Mutations-Durchlauf ist nur im echten CMS bestätigbar.

const CLIENT_ID = 'defa5b44-687f-478c-a647-bad7355aedd3'; // öffentlich (steht ohnehin im Browser-Bundle)
const BRANCH = 'main';
const API_URL = `https://content.tinajs.io/1.6/content/${CLIENT_ID}/github/${BRANCH}`;

type Variant = 'card' | 'bar';
type Props = { collection: string; relativePath: string; title?: string; variant?: Variant };

function loggedIn(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /tina/i.test(k) && (localStorage.getItem(k) || '').length > 20) return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function authToken(): string | null {
  try {
    const raw = localStorage.getItem('tinacms-auth');
    if (!raw) return null;
    const o = JSON.parse(raw);
    return (o && (o.id_token || o.access_token)) || (typeof o === 'string' ? o : null);
  } catch (e) { return null; }
}

async function deleteDocument(collection: string, relativePath: string): Promise<{ ok: boolean; error?: string }> {
  const token = authToken();
  if (!token) return { ok: false, error: 'Kein Login-Token gefunden — bitte im CMS neu anmelden.' };
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: 'mutation d($collection:String!,$relativePath:String!){ deleteDocument(collection:$collection, relativePath:$relativePath){ __typename } }',
        variables: { collection, relativePath },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || (json && json.errors)) {
      return { ok: false, error: (json && json.errors && json.errors[0] && json.errors[0].message) || `Fehler (HTTP ${res.status}).` };
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: String((e as any)?.message || e) }; }
}

const Icon = ({ d, path2 }: { d: string; path2?: string }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />{path2 ? <path d={path2} /> : null}
  </svg>
);

export default function AdminDocTools(props: Props) {
  const variant: Variant = props.variant || 'card';
  const [show, setShow] = React.useState(false);
  const [dlg, setDlg] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => { setShow(loggedIn()); }, []);
  React.useEffect(() => {
    if (!dlg) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) setDlg(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dlg, busy]);

  if (!show) return null;

  const noExt = props.relativePath.replace(/\.[^.]+$/, '');
  const editHref = `/admin/index.html#/collections/edit/${props.collection}/~/${noExt}`;
  const t = props.title || '';

  const onDelete = async () => {
    setBusy(true); setErr(null);
    const r = await deleteDocument(props.collection, props.relativePath);
    if (r.ok) { setDone(true); setTimeout(() => window.location.reload(), 1400); }
    else { setBusy(false); setErr(r.error || 'Löschen fehlgeschlagen.'); }
  };

  return (
    <>
      <div className={`ww-doc-tools ww-doc-tools--${variant}`}>
        <a className="ww-dt-btn" href={editHref} target="_top" title="Bearbeiten" aria-label={t ? `„${t}" bearbeiten` : 'Bearbeiten'}>
          <Icon d="M12 20h9" path2="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </a>
        <a className="ww-dt-btn" href={editHref} target="_top" title="Archivieren (Schalter oben im CMS)" aria-label={t ? `„${t}" archivieren` : 'Archivieren'}>
          <Icon d="M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 11h6" />
        </a>
        <button type="button" className="ww-dt-btn ww-dt-del" onClick={() => { setErr(null); setDlg(true); }} title="Löschen" aria-label={t ? `„${t}" löschen` : 'Löschen'}>
          <Icon d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
        </button>
      </div>

      {dlg ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setDlg(false); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ww-dt-modal-ic" aria-hidden="true">
              <Icon d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
            </div>
            <h3>{done ? 'Gelöscht' : 'Beitrag entfernen?'}</h3>
            {done ? (
              <p className="ww-dt-note">„{t}" wurde gelöscht. Die Seite wird neu geladen …</p>
            ) : (
              <p className="ww-dt-note">{t ? <>„{t}“ </> : null}von der Website nehmen. <strong>Archivieren</strong> ist umkehrbar, <strong>Löschen</strong> nicht.</p>
            )}
            {err ? <p className="ww-dt-err">{err}</p> : null}
            {!done ? (
              <div className="ww-dt-actions">
                <a className="btn ww-dt-arch" href={editHref} target="_top"><span>Lieber archivieren</span></a>
                <button type="button" className="btn ww-dt-danger" onClick={onDelete} disabled={busy}>{busy ? 'Lösche …' : 'Endgültig löschen'}</button>
                <button type="button" className="ww-dt-cancel" onClick={() => setDlg(false)} disabled={busy}>Abbrechen</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
