import React from 'react';
import { loggedIn, restoreDocument, deleteDocument } from '../lib/tinaAdmin';

// „Papierkorb (N)" pro Bereich: Knopf öffnet eine bildschirmfüllende Papierkorb-Ansicht im Look der
// jeweiligen Sektion (gleicher Hintergrund/Kopf-Stil), die die entfernten Beiträge als schlichte
// LESE-Kärtchen zeigt (Titel + Datum + kurzer Teaser, KEIN Titelbild) — Klick öffnet den echten
// Beitrag. Über jedem Kärtchen: 🔁 Wiederherstellen (1 Klick, sicher) + 🗑️ Endgültig löschen (mit
// Nachfrage). Selbst-sichtbar nur bei Login (leak-sicher). Die Liste kommt vorbereitet von der Seite.
type Item = { relativePath: string; title: string; date?: string; teaser?: string; href?: string };
type Props = { collection: string; items: Item[]; lang: 'de' | 'en' };

const IconArchive = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 11h6" />
  </svg>
);
const IconRestore = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 15 4 10l5-5" /><path d="M4 10h10a6 6 0 0 1 0 12h-3" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
  </svg>
);

export default function AdminArchive({ collection, items, lang }: Props) {
  const isEn = lang === 'en';
  const [show, setShow] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState<Item | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null); // relativePath in Arbeit
  const [err, setErr] = React.useState<string | null>(null);
  const [gone, setGone] = React.useState<Record<string, 'restored' | 'deleted'>>({});

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { if (del) setDel(null); else setOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, del, busy]);

  if (!show) return null;
  const list = (items || []).filter((it) => !gone[it.relativePath]);
  const t = (de: string, en: string) => (isEn ? en : de);

  const onRestore = async (it: Item) => {
    if (busy) return;
    setBusy(it.relativePath); setErr(null);
    const r = await restoreDocument(collection, it.relativePath);
    if (r.ok) setGone((g) => ({ ...g, [it.relativePath]: 'restored' }));
    else setErr(r.error || t('Wiederherstellen fehlgeschlagen.', 'Restore failed.'));
    setBusy(null);
  };
  const onDelete = async () => {
    if (!del || busy) return;
    setBusy(del.relativePath); setErr(null);
    const r = await deleteDocument(collection, del.relativePath);
    if (r.ok) { setGone((g) => ({ ...g, [del.relativePath]: 'deleted' })); setDel(null); }
    else setErr(r.error || t('Löschen fehlgeschlagen.', 'Delete failed.'));
    setBusy(null);
  };

  return (
    <>
      <button type="button" className={`ww-archive-btn${(items || []).length === 0 ? ' is-empty' : ''}`} onClick={() => { setErr(null); setOpen(true); }}>
        <IconArchive />
        <span>{t('Papierkorb', 'Trash')}</span>
        <span className="ww-archive-count">{list.length}</span>
      </button>

      {open ? (
        <div className="ww-trash-screen" role="dialog" aria-modal="true" aria-label={t('Papierkorb', 'Trash')}>
          <div className="ww-trash-inner">
            <button type="button" className="ww-trash-back" onClick={() => setOpen(false)}>
              <span aria-hidden="true">←</span> {t('Zurück zur Übersicht', 'Back to overview')}
            </button>

            <div className="page-title ww-trash-head">
              <div className="kicker">{t('Papierkorb', 'Trash')}</div>
              <h1>{t('Entfernte Beiträge', 'Removed items')}</h1>
              <p>{list.length === 0
                ? t('Der Papierkorb ist leer.', 'The trash is empty.')
                : `${list.length} ${list.length === 1 ? t('Beitrag', 'item') : t('Beiträge', 'items')} · ${t('für Besucher unsichtbar', 'hidden from visitors')}`}</p>
            </div>

            {err ? <p className="ww-trash-err" role="alert">{err}</p> : null}

            {list.length > 0 ? (
              <div className="ww-trash-grid">
                {list.map((it) => (
                  <div
                    className={`ww-trash-card${it.href ? ' is-clickable' : ''}`}
                    key={it.relativePath}
                    onClick={it.href ? (e) => {
                      const el = e.target as HTMLElement;
                      if (el.closest('button')) return;
                      if (window.getSelection && String(window.getSelection())) return;
                      window.location.href = it.href as string;
                    } : undefined}
                  >
                    <div className="ww-doc-tools ww-doc-tools--card" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="ww-dt-btn ww-dt-restore" onClick={() => onRestore(it)} disabled={busy === it.relativePath} title={t('Wiederherstellen', 'Restore')} aria-label={t('Wiederherstellen', 'Restore')}><IconRestore /></button>
                      <button type="button" className="ww-dt-btn ww-dt-del" onClick={() => { setErr(null); setDel(it); }} disabled={!!busy} title={t('Endgültig löschen', 'Delete for good')} aria-label={t('Endgültig löschen', 'Delete for good')}><IconTrash /></button>
                    </div>
                    <div className="ww-trash-title">{it.title || it.relativePath}</div>
                    {it.date ? <div className="ww-trash-date">{it.date}</div> : null}
                    {it.teaser ? <div className="ww-trash-teaser">{it.teaser}</div> : null}
                    {it.href ? <span className="ww-trash-open">{t('Beitrag öffnen', 'Open item')} →</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {del ? (
            <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setDel(null); }}>
              <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ww-dt-modal-ic" aria-hidden="true"><IconTrash /></div>
                <h3>{t('Endgültig löschen?', 'Delete for good?')}</h3>
                <p className="ww-dt-note">{isEn ? <>“{del.title}” will be permanently removed. This can’t be undone.</> : <>„{del.title}“ wird dauerhaft entfernt. Das lässt sich nicht rückgängig machen.</>}</p>
                <div className="ww-dt-actions">
                  <button type="button" className="btn ww-dt-danger" onClick={onDelete} disabled={!!busy}>{busy ? t('Lösche …', 'Deleting …') : t('Endgültig löschen', 'Delete for good')}</button>
                  <button type="button" className="ww-dt-cancel" onClick={() => setDel(null)} disabled={!!busy}>{t('Abbrechen', 'Cancel')}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
