import React from 'react';
import { loggedIn, archiveDocument, editHref } from '../lib/tinaAdmin';

// Admin-Werkzeuge für EINEN Inhalt — wiederverwendbar über alle Bereiche (Stories, Reisen, Alben,
// Journal). Zwei Knöpfe: ✏️ Bearbeiten (Link in den CMS-Editor, target=_top) und 🗑️ „In den Papierkorb"
// (EIN Klick -> sichere archiveDocument-Mutation, setzt nur `archived:true`, kein Datenverlust; kein
// Dialog). Endgültig gelöscht wird NUR im Papierkorb (eigene Seite je Bereich). Als React-Insel, die
// sich SELBST nur bei Login zeigt (leak-sicher: für Besucher wird nichts gerendert) — auf der Live-Seite
// UND in der CMS-Vorschau. Echter Mutations-Durchlauf nur im echten CMS (mit gültigem Token).

type Variant = 'card' | 'bar';
type Props = { collection: string; relativePath: string; title?: string; variant?: Variant };

const Icon = ({ d, path2 }: { d: string; path2?: string }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />{path2 ? <path d={path2} /> : null}
  </svg>
);

const D_EDIT = 'M12 20h9';
const D_EDIT2 = 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z';
const D_TRASH = 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7';
const D_CHECK = 'M20 6 9 17l-5-5';

export default function AdminDocTools(props: Props) {
  const variant: Variant = props.variant || 'card';
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Sichtbar, sobald angemeldet — Live-Seite UND CMS-Vorschau. Besucher (kein Token) -> nichts.
  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);

  if (!show) return null;

  const href = editHref(props.collection, props.relativePath);
  const t = props.title || '';

  // Ein Klick -> in den Papierkorb (archived:true). Reversibel über die Papierkorb-Seite.
  const onArchive = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (busy || done) return;
    setBusy(true); setErr(null);
    const r = await archiveDocument(props.collection, props.relativePath);
    if (r.ok) { setDone(true); setTimeout(() => window.location.reload(), 1200); }
    else { setBusy(false); setErr(r.error || 'Verschieben fehlgeschlagen.'); }
  };

  return (
    <div className={`ww-doc-tools ww-doc-tools--${variant}`} onClick={(e) => e.stopPropagation()}>
      <a className="ww-dt-btn" href={href} target="_top" title="Bearbeiten" aria-label={t ? `„${t}" bearbeiten` : 'Bearbeiten'}>
        <Icon d={D_EDIT} path2={D_EDIT2} />
      </a>
      <button
        type="button"
        className={`ww-dt-btn ww-dt-trash${done ? ' is-done' : ''}`}
        onClick={onArchive}
        disabled={busy || done}
        title={done ? 'Im Papierkorb' : 'In den Papierkorb'}
        aria-label={t ? `„${t}" in den Papierkorb` : 'In den Papierkorb'}
      >
        <Icon d={done ? D_CHECK : D_TRASH} />
      </button>
      {err ? <span className="ww-dt-inlineerr" role="alert">{err}</span> : null}
    </div>
  );
}
