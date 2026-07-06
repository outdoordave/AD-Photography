import React from 'react';
import { loggedIn, deleteDocument, editHref } from '../lib/tinaAdmin';

// „Archiv (N)"-Knopf + Panel: sammelt die archivierten Inhalte EINES Bereichs (für Besucher
// ausgeblendet) an einem Ort. Zurückholen = CMS-Editor öffnen (Archiv-Schalter, erstes Feld -> aus).
// Löschen = sichere deleteDocument-Mutation mit Nachfrage. Selbst-sichtbar nur bei Login; ohne
// archivierte Inhalte wird nichts gerendert. Die Liste kommt vorbereitet von der jeweiligen Seite.
type Item = { relativePath: string; title: string };
type Props = { collection: string; items: Item[]; lang: 'de' | 'en' };

const ArchiveIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 11h6" />
  </svg>
);

export default function AdminArchive({ collection, items, lang }: Props) {
  const isEn = lang === 'en';
  const [show, setShow] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState<Item | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [doneName, setDoneName] = React.useState<string | null>(null);

  // Nur auf der echten Live-Seite (self===top) UND angemeldet — nicht im CMS-Vorschau-iframe.
  React.useEffect(() => { try { setShow(loggedIn() && window.self === window.top); } catch { setShow(false); } }, []);
  React.useEffect(() => {
    if (!open && !del) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { setDel(null); if (!del) setOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, del, busy]);

  if (!show) return null;
  const list = items || [];

  const onDelete = async () => {
    if (!del) return;
    setBusy(true); setErr(null);
    const r = await deleteDocument(collection, del.relativePath);
    if (r.ok) { setDoneName(del.title); setTimeout(() => window.location.reload(), 1400); }
    else { setBusy(false); setErr(r.error || (isEn ? 'Delete failed.' : 'Löschen fehlgeschlagen.')); }
  };

  return (
    <>
      <button type="button" className={`ww-archive-btn${list.length === 0 ? ' is-empty' : ''}`} onClick={() => setOpen(true)}>
        <ArchiveIcon />
        <span>{isEn ? 'Archive' : 'Archiv'}</span>
        <span className="ww-archive-count">{list.length}</span>
      </button>

      {open ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="ww-dt-modal ww-archive-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isEn ? 'Archive' : 'Archiv'} ({list.length})</h3>
            <p className="ww-dt-note">{isEn ? 'Hidden from visitors. Restore an item or delete it for good.' : 'Für Besucher ausgeblendet — einen Eintrag zurückholen oder endgültig löschen.'}</p>
            {list.length === 0 ? (
              <p className="ww-archive-empty">{isEn ? 'Nothing archived here yet.' : 'Hier ist noch nichts archiviert.'}</p>
            ) : (
              <ul className="ww-archive-list">
                {list.map((it) => (
                  <li className="ww-archive-item" key={it.relativePath}>
                    <span className="ww-archive-title" title={it.title}>{it.title || it.relativePath}</span>
                    <span className="ww-archive-item-actions">
                      <a className="ww-archive-restore" href={editHref(collection, it.relativePath)} target="_top">{isEn ? 'Restore' : 'Zurückholen'}</a>
                      <button type="button" className="ww-archive-del" onClick={() => { setErr(null); setDel(it); }}>{isEn ? 'Delete' : 'Löschen'}</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="ww-archive-foot">
              <button type="button" className="ww-dt-cancel" onClick={() => setOpen(false)}>{isEn ? 'Close' : 'Schließen'}</button>
            </div>
          </div>
        </div>
      ) : null}

      {del ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setDel(null); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ww-dt-modal-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" /></svg>
            </div>
            <h3>{doneName ? (isEn ? 'Deleted' : 'Gelöscht') : (isEn ? 'Delete for good?' : 'Endgültig löschen?')}</h3>
            {doneName ? (
              <p className="ww-dt-note">{isEn ? `“${doneName}” was deleted. Reloading …` : `„${doneName}" wurde gelöscht. Die Seite wird neu geladen …`}</p>
            ) : (
              <p className="ww-dt-note">{isEn ? <>“{del.title}” will be permanently removed. This can’t be undone.</> : <>„{del.title}“ wird dauerhaft entfernt. Das lässt sich nicht rückgängig machen.</>}</p>
            )}
            {err ? <p className="ww-dt-err">{err}</p> : null}
            {!doneName ? (
              <div className="ww-dt-actions">
                <button type="button" className="btn ww-dt-danger" onClick={onDelete} disabled={busy}>{busy ? (isEn ? 'Deleting …' : 'Lösche …') : (isEn ? 'Delete for good' : 'Endgültig löschen')}</button>
                <button type="button" className="ww-dt-cancel" onClick={() => setDel(null)} disabled={busy}>{isEn ? 'Cancel' : 'Abbrechen'}</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
