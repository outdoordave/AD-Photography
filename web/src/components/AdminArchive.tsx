import React from 'react';
import { loggedIn, restoreDocument, deleteDocument, archivedNodes, mapArchived, invalidateArchived, showToast } from '../lib/tinaAdmin';

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
  const [emptyAll, setEmptyAll] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null); // relativePath in Arbeit ('__all__' = leeren)
  const [err, setErr] = React.useState<string | null>(null);
  const [gone, setGone] = React.useState<Record<string, 'restored' | 'deleted'>>({});
  // LIVE-Stand aus Tina Cloud (null = noch nicht geladen/fehlgeschlagen -> statischer `items`-Fallback).
  const [live, setLive] = React.useState<Item[] | null>(null);

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);
  const loadLive = React.useCallback((force = false) => {
    archivedNodes(collection, force)
      .then((ns) => { if (ns) setLive(ns.map((n) => mapArchived(collection, n, lang))); })
      .catch(() => { /* Fallback: statische items */ });
  }, [collection, lang]);
  React.useEffect(() => { if (show) loadLive(false); }, [show, loadLive]);
  // Zahl/Liste sofort nachziehen, wenn anderswo (Karten-Knopf) etwas archiviert/gelöscht wurde.
  React.useEffect(() => {
    const onChanged = (e: any) => { if (!e || !e.detail || e.detail.collection === collection) loadLive(true); };
    window.addEventListener('ww:archive-changed', onChanged as EventListener);
    return () => window.removeEventListener('ww:archive-changed', onChanged as EventListener);
  }, [collection, loadLive]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { if (emptyAll) setEmptyAll(false); else if (del) setDel(null); else setOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, del, emptyAll, busy]);

  if (!show) return null;
  // Live-Stand bevorzugen (aus Tina Cloud), sonst statischen Build-Stand als Fallback.
  const base = live ?? (items || []);
  const list = base.filter((it) => !gone[it.relativePath]);
  const t = (de: string, en: string) => (isEn ? en : de);

  const changed = () => { invalidateArchived(collection); try { window.dispatchEvent(new CustomEvent('ww:archive-changed', { detail: { collection } })); } catch (e) { /* egal */ } };

  const onRestore = async (it: Item) => {
    if (busy) return;
    setBusy(it.relativePath); setErr(null);
    const r = await restoreDocument(collection, it.relativePath);
    if (r.ok) { setGone((g) => ({ ...g, [it.relativePath]: 'restored' })); changed(); showToast(t('Wiederhergestellt', 'Restored'), 'success'); }
    else { const m = r.error || t('Wiederherstellen fehlgeschlagen.', 'Restore failed.'); setErr(m); showToast(m, 'error'); }
    setBusy(null);
  };
  const onDelete = async () => {
    if (!del || busy) return;
    setBusy(del.relativePath); setErr(null);
    const r = await deleteDocument(collection, del.relativePath);
    if (r.ok) { setGone((g) => ({ ...g, [del.relativePath]: 'deleted' })); changed(); setDel(null); showToast(t('Endgültig gelöscht', 'Deleted for good'), 'success'); }
    else { const m = r.error || t('Löschen fehlgeschlagen.', 'Delete failed.'); setErr(m); showToast(m, 'error'); }
    setBusy(null);
  };
  const onEmptyAll = async () => {
    if (busy) return;
    setBusy('__all__'); setErr(null);
    let failed: string | null = null; let n = 0;
    for (const it of list) {
      const r = await deleteDocument(collection, it.relativePath);
      if (r.ok) { setGone((g) => ({ ...g, [it.relativePath]: 'deleted' })); n++; }
      else { failed = r.error || t('Löschen fehlgeschlagen.', 'Delete failed.'); break; }
    }
    changed();
    setBusy(null); setEmptyAll(false);
    if (failed) { setErr(failed); showToast(failed, 'error'); }
    else showToast(t(`Archiv geleert (${n})`, `Archive emptied (${n})`), 'success');
  };

  return (
    <>
      <button type="button" className={`ww-archive-btn${list.length === 0 ? ' is-empty' : ''}`} onClick={() => { setErr(null); setOpen(true); loadLive(true); }}>
        <IconArchive />
        <span>{t('Archiv', 'Archive')}</span>
        <span className="ww-archive-count">{list.length}</span>
      </button>

      {open ? (
        <div className="ww-trash-screen" role="dialog" aria-modal="true" aria-label={t('Archiv', 'Archive')}>
          <div className="ww-trash-inner">
            <button type="button" className="ww-trash-back" onClick={() => setOpen(false)}>
              <span aria-hidden="true">←</span> {t('Zurück zur Übersicht', 'Back to overview')}
            </button>

            <div className="page-title ww-trash-head">
              <div className="kicker">{t('Archiv', 'Archive')}</div>
              <h1>{t('Archivierte Beiträge', 'Archived items')}</h1>
              <p>{list.length === 0
                ? t('Das Archiv ist leer.', 'The archive is empty.')
                : `${list.length} ${list.length === 1 ? t('Beitrag', 'item') : t('Beiträge', 'items')} · ${t('für Besucher unsichtbar', 'hidden from visitors')}`}</p>
              {list.length > 0 ? (
                <button type="button" className="ww-archive-empty-all" onClick={() => { setErr(null); setEmptyAll(true); }} disabled={!!busy}>
                  {t('Archiv leeren (alle endgültig löschen)', 'Empty archive (delete all for good)')}
                </button>
              ) : null}
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
                      <button type="button" className={`ww-dt-btn ww-dt-restore${busy === it.relativePath ? ' is-busy' : ''}`} onClick={() => onRestore(it)} disabled={!!busy} title={t('Wiederherstellen', 'Restore')} aria-label={t('Wiederherstellen', 'Restore')}><IconRestore /></button>
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

          {emptyAll ? (
            <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setEmptyAll(false); }}>
              <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ww-dt-modal-ic" aria-hidden="true"><IconTrash /></div>
                <h3>{t('Archiv leeren?', 'Empty archive?')}</h3>
                <p className="ww-dt-note">{t(`Alle ${list.length} archivierten Beiträge werden dauerhaft aus dem GitHub-Repo entfernt. Das lässt sich nicht rückgängig machen.`, `All ${list.length} archived items will be permanently removed from the GitHub repo. This can’t be undone.`)}</p>
                {err ? <p className="ww-dt-err">{err}</p> : null}
                <div className="ww-dt-actions">
                  <button type="button" className="btn ww-dt-danger" onClick={onEmptyAll} disabled={!!busy}>{busy === '__all__' ? t('Lösche …', 'Deleting …') : t('Ja, Archiv leeren', 'Yes, empty archive')}</button>
                  <button type="button" className="ww-dt-cancel" onClick={() => setEmptyAll(false)} disabled={!!busy}>{t('Abbrechen', 'Cancel')}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
