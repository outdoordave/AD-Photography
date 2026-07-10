import React from 'react';
import { loggedIn, restoreDocument, deleteDocument, archiveDocument, archivedNodes, mapArchived, invalidateArchived, showToast } from '../lib/tinaAdmin';
import { subscribeSelect, getSelect, enterSelect, exitSelect } from '../lib/adminSelect';

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
  // Mehrfachauswahl (relativePaths) + Nachfrage fürs Bulk-Löschen.
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkDel, setBulkDel] = React.useState(false);

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);
  // Auswahl-Modus der ÜBERSICHT (geteilter Speicher, koppelt die einzelnen Karten-Inseln). Neu rendern bei Änderung.
  const [, forceSel] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => subscribeSelect(forceSel), []);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [ovDel, setOvDel] = React.useState(false); // Nachfrage fürs Bulk-Löschen aus der ÜBERSICHT
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { if (bulkDel) setBulkDel(false); else if (emptyAll) setEmptyAll(false); else if (del) setDel(null); else if (selected.size) setSelected(new Set()); else setOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, del, emptyAll, bulkDel, busy, selected]);

  if (!show) return null;
  // Live-Stand bevorzugen (aus Tina Cloud), sonst statischen Build-Stand als Fallback.
  const base = live ?? (items || []);
  const list = base.filter((it) => !gone[it.relativePath]);
  const t = (de: string, en: string) => (isEn ? en : de);

  // Auswahl-Modus der ÜBERSICHT (geteilter Speicher; die Karten zeigen dann Häkchen). Getrennt von der
  // Mehrfachauswahl INNERHALB des Archivs (die nutzt den lokalen `selected`-State weiter unten).
  const ov = getSelect();
  const ovActive = ov.mode && ov.collection === collection;
  const ovCount = ov.selected.size;
  const onBulkArchive = async () => {
    const paths = Array.from(ov.selected);
    if (!paths.length || bulkBusy) return;
    setBulkBusy(true);
    let failed: string | null = null; let n = 0;
    for (const rp of paths) {
      const r = await archiveDocument(collection, rp);
      if (r.ok) n++; else { failed = r.error || t('Archivieren fehlgeschlagen.', 'Archiving failed.'); break; }
    }
    invalidateArchived(collection);
    try { window.dispatchEvent(new CustomEvent('ww:archive-changed', { detail: { collection } })); } catch (e) { /* egal */ }
    setBulkBusy(false); exitSelect();
    if (failed) showToast(failed, 'error'); else showToast(t(`${n} archiviert`, `${n} archived`), 'success');
  };
  // Bulk-LÖSCHEN aus der Übersicht (endgültig, aus dem GitHub-Repo). Danach die betroffenen Karten sofort
  // ausblenden (Event ww:docs-removed) — anders als beim Archivieren tauchen gelöschte NICHT im Archiv auf.
  const onBulkDeleteOverview = async () => {
    const paths = Array.from(ov.selected);
    if (!paths.length || bulkBusy) return;
    setBulkBusy(true);
    let failed: string | null = null; let n = 0; const doneP: string[] = [];
    for (const rp of paths) {
      const r = await deleteDocument(collection, rp);
      if (r.ok) { n++; doneP.push(rp); } else { failed = r.error || t('Löschen fehlgeschlagen.', 'Delete failed.'); break; }
    }
    invalidateArchived(collection);
    try { window.dispatchEvent(new CustomEvent('ww:docs-removed', { detail: { collection, paths: doneP } })); } catch (e) { /* egal */ }
    try { window.dispatchEvent(new CustomEvent('ww:archive-changed', { detail: { collection } })); } catch (e) { /* egal */ }
    setBulkBusy(false); setOvDel(false); exitSelect();
    if (failed) showToast(failed, 'error'); else showToast(t(`${n} endgültig gelöscht`, `${n} deleted for good`), 'success');
  };

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

  // --- Mehrfachauswahl ---
  const toggleSel = (rp: string) => setSelected((s) => { const n = new Set(s); if (n.has(rp)) n.delete(rp); else n.add(rp); return n; });
  const allSelected = list.length > 0 && list.every((it) => selected.has(it.relativePath));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((it) => it.relativePath)));
  const clearSel = () => setSelected(new Set());
  const selCount = list.filter((it) => selected.has(it.relativePath)).length;

  const onBulkRestore = async () => {
    if (busy) return;
    const picked = list.filter((it) => selected.has(it.relativePath));
    setBusy('__bulk__'); setErr(null);
    let failed: string | null = null; let n = 0;
    for (const it of picked) {
      const r = await restoreDocument(collection, it.relativePath);
      if (r.ok) { setGone((g) => ({ ...g, [it.relativePath]: 'restored' })); n++; }
      else { failed = r.error || t('Wiederherstellen fehlgeschlagen.', 'Restore failed.'); break; }
    }
    changed(); setBusy(null); clearSel();
    if (failed) { setErr(failed); showToast(failed, 'error'); }
    else showToast(t(`${n} wiederhergestellt`, `${n} restored`), 'success');
  };
  const onBulkDelete = async () => {
    if (busy) return;
    const picked = list.filter((it) => selected.has(it.relativePath));
    setBusy('__bulk__'); setErr(null);
    let failed: string | null = null; let n = 0;
    for (const it of picked) {
      const r = await deleteDocument(collection, it.relativePath);
      if (r.ok) { setGone((g) => ({ ...g, [it.relativePath]: 'deleted' })); n++; }
      else { failed = r.error || t('Löschen fehlgeschlagen.', 'Delete failed.'); break; }
    }
    changed(); setBusy(null); setBulkDel(false); clearSel();
    if (failed) { setErr(failed); showToast(failed, 'error'); }
    else showToast(t(`${n} endgültig gelöscht`, `${n} deleted for good`), 'success');
  };

  return (
    <>
      <button type="button" className={`ww-archive-btn${list.length === 0 ? ' is-empty' : ''}`} onClick={() => { setErr(null); setOpen(true); loadLive(true); }}>
        <IconArchive />
        <span>{t('Archiv', 'Archive')}</span>
        <span className="ww-archive-count">{list.length}</span>
      </button>

      <button type="button" className={`ww-archive-selmode${ovActive ? ' is-active' : ''}`} onClick={() => (ovActive ? exitSelect() : enterSelect(collection))}>
        {ovActive ? t('Auswahl beenden', 'Done selecting') : t('Mehrere auswählen', 'Select multiple')}
      </button>

      {ovActive ? (
        <div className="ww-bulkbar" role="region" aria-label={t('Auswahl-Aktionen', 'Selection actions')}>
          <span className="ww-bulkbar-count">{ovCount} {t('ausgewählt', 'selected')}</span>
          <button type="button" className="btn ww-bulkbar-arch" onClick={onBulkArchive} disabled={bulkBusy || ovCount === 0}>
            {bulkBusy ? t('Archiviere …', 'Archiving …') : t(`${ovCount} archivieren`, `Archive ${ovCount}`)}
          </button>
          <button type="button" className="btn ww-dt-danger" onClick={() => setOvDel(true)} disabled={bulkBusy || ovCount === 0}>
            {t(`${ovCount} löschen`, `Delete ${ovCount}`)}
          </button>
          <button type="button" className="ww-dt-cancel" onClick={exitSelect} disabled={bulkBusy}>{t('Fertig', 'Done')}</button>
        </div>
      ) : null}

      {ovDel ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!bulkBusy) setOvDel(false); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ww-dt-modal-ic" aria-hidden="true"><IconTrash /></div>
            <h3>{t('Auswahl endgültig löschen?', 'Delete selection for good?')}</h3>
            <p className="ww-dt-note">{t(`Die ${ovCount} ausgewählten Beiträge werden dauerhaft aus dem GitHub-Repo entfernt. Das lässt sich nicht rückgängig machen — umkehrbar wäre stattdessen Archivieren.`, `The ${ovCount} selected items will be permanently removed from the GitHub repo. This can’t be undone — archiving would be reversible instead.`)}</p>
            <div className="ww-dt-actions">
              <button type="button" className="btn ww-dt-danger" onClick={onBulkDeleteOverview} disabled={bulkBusy}>{bulkBusy ? t('Lösche …', 'Deleting …') : t(`Ja, ${ovCount} löschen`, `Yes, delete ${ovCount}`)}</button>
              <button type="button" className="ww-dt-cancel" onClick={() => setOvDel(false)} disabled={bulkBusy}>{t('Abbrechen', 'Cancel')}</button>
            </div>
          </div>
        </div>
      ) : null}

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
                <div className="ww-archive-headactions">
                  <button type="button" className="ww-archive-selall" onClick={toggleAll} disabled={!!busy}>
                    {allSelected ? t('Auswahl aufheben', 'Clear selection') : t('Alle auswählen', 'Select all')}
                  </button>
                  <button type="button" className="ww-archive-empty-all" onClick={() => { setErr(null); setEmptyAll(true); }} disabled={!!busy}>
                    {t('Archiv leeren (alle endgültig löschen)', 'Empty archive (delete all for good)')}
                  </button>
                </div>
              ) : null}
            </div>

            {err ? <p className="ww-trash-err" role="alert">{err}</p> : null}

            {selCount > 0 ? (
              <div className="ww-archive-selbar" role="region" aria-label={t('Auswahl-Aktionen', 'Selection actions')}>
                <span className="ww-archive-selcount">{selCount} {t('ausgewählt', 'selected')}</span>
                <button type="button" className="btn ww-archive-selrestore" onClick={onBulkRestore} disabled={!!busy}>{busy === '__bulk__' ? t('…', '…') : t('Wiederherstellen', 'Restore')}</button>
                <button type="button" className="btn ww-dt-danger" onClick={() => { setErr(null); setBulkDel(true); }} disabled={!!busy}>{t('Endgültig löschen', 'Delete for good')}</button>
                <button type="button" className="ww-dt-cancel" onClick={clearSel} disabled={!!busy}>{t('Auswahl aufheben', 'Clear')}</button>
              </div>
            ) : null}

            {list.length > 0 ? (
              <div className="ww-trash-grid">
                {list.map((it) => (
                  <div
                    className={`ww-trash-card${it.href ? ' is-clickable' : ''}${selected.has(it.relativePath) ? ' is-selected' : ''}`}
                    key={it.relativePath}
                    onClick={it.href ? (e) => {
                      const el = e.target as HTMLElement;
                      if (el.closest('button, label, input')) return;
                      if (window.getSelection && String(window.getSelection())) return;
                      window.location.href = it.href as string;
                    } : undefined}
                  >
                    <label className="ww-trash-check" onClick={(e) => e.stopPropagation()} title={t('Auswählen', 'Select')}>
                      <input type="checkbox" checked={selected.has(it.relativePath)} onChange={() => toggleSel(it.relativePath)} disabled={!!busy} aria-label={t('Auswählen', 'Select')} />
                    </label>
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

          {bulkDel ? (
            <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setBulkDel(false); }}>
              <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ww-dt-modal-ic" aria-hidden="true"><IconTrash /></div>
                <h3>{t('Auswahl endgültig löschen?', 'Delete selection for good?')}</h3>
                <p className="ww-dt-note">{t(`Die ${selCount} ausgewählten Beiträge werden dauerhaft aus dem GitHub-Repo entfernt. Das lässt sich nicht rückgängig machen.`, `The ${selCount} selected items will be permanently removed from the GitHub repo. This can’t be undone.`)}</p>
                {err ? <p className="ww-dt-err">{err}</p> : null}
                <div className="ww-dt-actions">
                  <button type="button" className="btn ww-dt-danger" onClick={onBulkDelete} disabled={!!busy}>{busy === '__bulk__' ? t('Lösche …', 'Deleting …') : t(`Ja, ${selCount} löschen`, `Yes, delete ${selCount}`)}</button>
                  <button type="button" className="ww-dt-cancel" onClick={() => setBulkDel(false)} disabled={!!busy}>{t('Abbrechen', 'Cancel')}</button>
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
