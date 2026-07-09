import React from 'react';
import { loggedIn, archiveDocument, deleteDocument, archivedNodes, invalidateArchived, showToast } from '../lib/tinaAdmin';
import { subscribeSelect, getSelect, toggleSelectItem } from '../lib/adminSelect';

// Admin-Werkzeuge für EINEN Inhalt — wiederverwendbar über alle Bereiche (Stories, Reisen, Alben,
// Journal). DREI Knöpfe: ✏️ Bearbeiten (Link in die CMS-Ansicht, target=_top), 🗄️ Archivieren (EIN Klick
// -> sichere archiveDocument-Mutation, umkehrbar), 🗑️ Löschen (Nachfrage-Dialog: endgültig löschen ODER
// als Sicherheitsnetz „Lieber archivieren"). Endgültig löschen = Datei via Tina Cloud wirklich aus dem
// GitHub-Repo entfernt. Als React-Insel, die sich SELBST nur bei Login zeigt (leak-sicher). Feedback:
// laufende Aktion = Rahmen des Knopfes rotiert (is-busy) in seiner Farbe; Ergebnis = dezenter Toast
// (grün/rot). Nach Erfolg wird das Kärtchen ausgeblendet (leere Jahres-Gruppe mit) + ein Event feuert,
// damit die „Archiv"-Zahl sofort nachzieht. Echter Mutations-Durchlauf nur im echten CMS (mit Token).

type Variant = 'card' | 'bar';
type Props = { collection: string; relativePath: string; title?: string; variant?: Variant };
type Busy = null | 'archive' | 'delete' | 'archive-alt';

const Icon = ({ d, path2 }: { d: string; path2?: string }) => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />{path2 ? <path d={path2} /> : null}
  </svg>
);

const D_EDIT = 'M12 20h9';
const D_EDIT2 = 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z';
const D_ARCHIVE = 'M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M9 11h6';
const D_TRASH = 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7';
const D_CHECK = 'M20 6 9 17l-5-5';

// Übersichtsseite eines Bereichs (für die Weiterleitung nach Aktion auf einer Detailseite).
const OVERVIEW: Record<string, string> = { story: '/stories', reisen: '/trips', alben: '/portfolio', journal: '/journal' };

export default function AdminDocTools(props: Props) {
  const variant: Variant = props.variant || 'card';
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [show, setShow] = React.useState(false);
  const [dlg, setDlg] = React.useState(false);
  const [busy, setBusy] = React.useState<Busy>(null);
  const [done, setDone] = React.useState<null | 'archived' | 'deleted'>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);

  // Mehrfach-Auswahl-Modus (geteilter Speiter über alle Karten des Bereichs). Bei Änderung neu rendern.
  const [, forceSel] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => subscribeSelect(forceSel), []);

  // Kärtchen ausblenden + leere Jahres-Gruppe (Stories) gleich mit — sonst bliebe eine Überschrift ohne
  // Beiträge stehen (nur transient bis zum nächsten Build; danach baut groupByYear die leere Gruppe eh nicht).
  const removeCardFromView = React.useCallback(() => {
    const card = rootRef.current && (rootRef.current.closest('.ww-card-wrap, .journal-item') as HTMLElement | null);
    if (!card) return;
    card.style.display = 'none';
    const chapter = card.closest('.year-chapter') as HTMLElement | null;
    if (chapter) {
      const anyVisible = Array.from(chapter.querySelectorAll('.ww-card-wrap')).some((c) => (c as HTMLElement).style.display !== 'none');
      if (!anyVisible) chapter.style.display = 'none';
    }
  }, []);

  // Live-Abgleich: schon in Tina archiviert (z. B. eben archiviert + neu geladen vor dem Build)? -> Kärtchen
  // sofort ausblenden, damit die Übersicht 1:1 stimmt. Nur Karten-Variante; Fehler = nichts ausblenden.
  React.useEffect(() => {
    if (!show || variant !== 'card') return;
    let alive = true;
    const mine = props.relativePath.replace(/\.[^.]+$/, '');
    archivedNodes(props.collection).then((ns) => {
      if (alive && ns && ns.some((n: any) => n && n._sys && n._sys.filename === mine)) removeCardFromView();
    }).catch(() => { /* Fallback: nichts ausblenden */ });
    return () => { alive = false; };
  }, [show, variant, props.collection, props.relativePath, removeCardFromView]);

  React.useEffect(() => {
    if (!dlg) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) setDlg(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dlg, busy]);

  // Nach einer (Bulk-)Aktion irgendwo im Bereich neu prüfen, ob DIESER Beitrag jetzt archiviert ist ->
  // dann sein Kärtchen ausblenden. So verschwinden auch beim Bulk-Archivieren die Karten sofort.
  React.useEffect(() => {
    if (variant !== 'card') return;
    const mine = props.relativePath.replace(/\.[^.]+$/, '');
    const onChanged = (e: any) => {
      if (e && e.detail && e.detail.collection !== props.collection) return;
      archivedNodes(props.collection).then((ns) => {
        if (ns && ns.some((n: any) => n && n._sys && n._sys.filename === mine)) removeCardFromView();
      }).catch(() => { /* egal */ });
    };
    window.addEventListener('ww:archive-changed', onChanged as EventListener);
    return () => window.removeEventListener('ww:archive-changed', onChanged as EventListener);
  }, [variant, props.collection, props.relativePath, removeCardFromView]);

  if (!show) return null;

  // Auswahl-Modus für DIESEN Bereich? -> Karte zeigt ein Häkchen statt der drei Knöpfe.
  const sel = getSelect();
  const selMode = sel.mode && sel.collection === props.collection && variant === 'card';
  const selectedNow = sel.selected.has(props.relativePath);

  // „Bearbeiten" = einfach zur Detailseite navigieren (im SELBEN Fenster, kein target=_top). In der
  // CMS-Vorschau springt die Vorschau damit auf die Story -> Tinas visuelle Bearbeitung (Formular +
  // Live-Vorschau), exakt so, als hätte man die Karte angeklickt. Auf der Live-Seite: normale Navigation.
  const en = typeof location !== 'undefined' && location.pathname.startsWith('/en/');
  const filename = props.relativePath.replace(/\.[^.]+$/, '');
  const href = `${en ? '/en' : ''}${OVERVIEW[props.collection] || ''}/${filename}`;
  const t = props.title || '';

  const finish = (kind: 'archived' | 'deleted') => {
    invalidateArchived(props.collection); // Live-Cache verwerfen -> Archiv/Zahl/andere Karten holen frisch
    try { window.dispatchEvent(new CustomEvent('ww:archive-changed', { detail: { collection: props.collection } })); } catch (e) { /* egal */ }
    showToast(kind === 'archived' ? 'In den Archiv verschoben' : 'Endgültig gelöscht', 'success');
    setDone(kind);
    setTimeout(() => {
      if (variant === 'bar') {
        const en = typeof location !== 'undefined' && location.pathname.startsWith('/en/');
        const base = OVERVIEW[props.collection] || '/';
        window.location.href = en ? `/en${base}` : base;
        return;
      }
      const card = rootRef.current && (rootRef.current.closest('.ww-card-wrap, .journal-item') as HTMLElement | null);
      if (card) { card.style.transition = 'opacity .25s ease'; card.style.opacity = '0'; setTimeout(removeCardFromView, 250); }
    }, 1100);
  };
  const fail = (msg: string) => { setBusy(null); setErr(msg); showToast(msg, 'error'); };

  const onArchive = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (busy || done) return;
    setBusy('archive'); setErr(null);
    const r = await archiveDocument(props.collection, props.relativePath);
    if (r.ok) finish('archived'); else fail(r.error || 'Archivieren fehlgeschlagen.');
  };
  const onDelete = async () => {
    if (busy || done) return;
    setBusy('delete'); setErr(null);
    const r = await deleteDocument(props.collection, props.relativePath);
    if (r.ok) { setDlg(false); finish('deleted'); } else fail(r.error || 'Löschen fehlgeschlagen.');
  };
  const onArchiveFromDlg = async () => {
    if (busy || done) return;
    setBusy('archive-alt'); setErr(null);
    const r = await archiveDocument(props.collection, props.relativePath);
    if (r.ok) { setDlg(false); finish('archived'); } else fail(r.error || 'Archivieren fehlgeschlagen.');
  };

  return (
    <div ref={rootRef} className={`ww-doc-tools ww-doc-tools--${variant}`} onClick={(e) => e.stopPropagation()}>
      {done ? (
        <span className="ww-dt-doneflag" role="status">
          <Icon d={D_CHECK} /> {done === 'archived' ? 'Archiviert' : 'Gelöscht'}
        </span>
      ) : selMode ? (
        <label className="ww-dt-selbox" title="Auswählen" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selectedNow} onChange={() => toggleSelectItem(props.relativePath)} aria-label={t ? `„${t}" auswählen` : 'Auswählen'} />
        </label>
      ) : (
        <>
          <a className="ww-dt-btn" href={href} title="Bearbeiten (öffnet die Story mit Live-Vorschau)" aria-label={t ? `„${t}" bearbeiten` : 'Bearbeiten'}>
            <Icon d={D_EDIT} path2={D_EDIT2} />
          </a>
          <button type="button" className={`ww-dt-btn ww-dt-arch${busy === 'archive' ? ' is-busy' : ''}`} onClick={onArchive} disabled={!!busy} title="Archivieren (umkehrbar)" aria-label={t ? `„${t}" archivieren` : 'Archivieren'}>
            <Icon d={D_ARCHIVE} />
          </button>
          <button type="button" className="ww-dt-btn ww-dt-del" onClick={() => { setErr(null); setDlg(true); }} disabled={!!busy} title="Löschen (endgültig)" aria-label={t ? `„${t}" löschen` : 'Löschen'}>
            <Icon d={D_TRASH} />
          </button>
          {err ? <span className="ww-dt-inlineerr" role="alert">{err}</span> : null}
        </>
      )}

      {dlg ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={(e) => { e.stopPropagation(); if (!busy) setDlg(false); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ww-dt-modal-ic" aria-hidden="true"><Icon d={D_TRASH} /></div>
            <h3>Endgültig löschen?</h3>
            <p className="ww-dt-note">{t ? <>„{t}“ </> : null}wird <strong>dauerhaft aus dem GitHub-Repo entfernt</strong> — das lässt sich nicht rückgängig machen. Umkehrbar wäre <strong>Archivieren</strong>.</p>
            {err ? <p className="ww-dt-err">{err}</p> : null}
            <div className="ww-dt-actions">
              <button type="button" className={`btn ww-dt-danger${busy === 'delete' ? ' is-loading' : ''}`} onClick={onDelete} disabled={!!busy}>{busy === 'delete' ? 'Lösche …' : 'Endgültig löschen'}</button>
              <button type="button" className={`btn ww-dt-arch-alt${busy === 'archive-alt' ? ' is-loading' : ''}`} onClick={onArchiveFromDlg} disabled={!!busy}>{busy === 'archive-alt' ? 'Archiviere …' : 'Lieber archivieren'}</button>
              <button type="button" className="ww-dt-cancel" onClick={() => setDlg(false)} disabled={!!busy}>Abbrechen</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
