import React from 'react';
import { loggedIn } from '../lib/tinaAdmin';
import { uploadToCloud, deleteFromCloud, moveInCloud, findUsage, type UsageItem, ASSIGN_TARGETS, listAssignDocs, assignImage, type AssignTarget } from '../lib/mediaCloud';
import { showToast } from '../lib/tinaAdmin';
import { detectEncoder, toOptimized, type EncoderMode } from '../../tina/fields/webpEncode';

// Medien-Manager — eigenständige, login-geschützte Seite (/medien-manager) im Website-Look mit
// Finder/Explorer-Logik: Ordner (aus dem rekursiven uploads-manifest.json abgeleitet), Breadcrumbs,
// Kachel-Grid mit Thumbnails, ordnerübergreifende Namens-Suche, Drag&Drop- + Datei-Dialog-Upload
// (WebP via webpEncode -> Assets-Client in den AKTUELLEN Ordner), Löschen mit Nachfrage. „Verwendet in"
// (Nutzungs-Check) + Rechtsklick-Zuweisung folgen in eigenen Commits. Nur bei Login sichtbar.
// iPad-tauglich: Tap statt Klick, Datei-Dialog als vollwertige Alternative zu Drag&Drop.

type Fresh = { path: string; url: string };

const COLL_LABEL: Record<string, string> = {
  startseite: 'Startseite', journal: 'Journal', alben: 'Album', story: 'Story',
  reisen: 'Reise', ueber_uns: 'Über uns', highlights: 'Highlights', darstellung: 'Darstellung',
};

function relOf(p: string): string { return p.replace(/^\/uploads\//, ''); }

// Alle vorhandenen Ordnerpfade (inkl. Zwischenebenen) aus der Dateiliste ableiten — für die Ziel-Auswahl.
function allFolders(paths: string[]): string[] {
  const s = new Set<string>();
  for (const p of paths) {
    const parts = relOf(p).split('/'); parts.pop(); // Dateiname weg
    let acc = '';
    for (const seg of parts) { acc = acc ? `${acc}/${seg}` : seg; s.add(acc); }
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

// Aus der flachen Manifest-Liste die Unterordner + Dateien des aktuellen Ordners ableiten.
function viewOf(all: string[], folder: string): { subdirs: string[]; files: string[] } {
  const prefix = folder ? folder + '/' : '';
  const subdirs = new Set<string>();
  const files: string[] = [];
  for (const p of all) {
    const rel = relOf(p);
    if (prefix && !rel.startsWith(prefix)) continue;
    const rest = rel.slice(prefix.length);
    if (!rest) continue;
    const slash = rest.indexOf('/');
    if (slash >= 0) subdirs.add(rest.slice(0, slash));
    else files.push(p);
  }
  return { subdirs: Array.from(subdirs).sort((a, b) => a.localeCompare(b)), files: files.sort((a, b) => a.localeCompare(b)) };
}

export default function MediaManager() {
  const [show, setShow] = React.useState<null | boolean>(null);
  const [manifest, setManifest] = React.useState<string[] | null>(null);
  const [loadErr, setLoadErr] = React.useState('');
  const [folder, setFolder] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [sel, setSel] = React.useState<string | null>(null);
  const [fresh, setFresh] = React.useState<Fresh[]>([]);
  const [gone, setGone] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');
  const [del, setDel] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<{ loading: boolean; items?: UsageItem[]; err?: string }>({ loading: false });
  // Zuweisen-Modal
  const [assignFor, setAssignFor] = React.useState<string | null>(null);
  const [aColl, setAColl] = React.useState('');
  const [aDocs, setADocs] = React.useState<{ filename: string; label: string }[] | null>(null);
  const [aDoc, setADoc] = React.useState('');
  const [aFieldPath, setAFieldPath] = React.useState('');
  const [aBusy, setABusy] = React.useState(false);
  const [aConfirm, setAConfirm] = React.useState<string | null>(null); // aktueller Wert bei set-Überschreibung
  // Mehrfachauswahl (Finder-artig) + Bulk-Aktionen.
  const [selMode, setSelMode] = React.useState(false);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [bulkDel, setBulkDel] = React.useState(false);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [moveTarget, setMoveTarget] = React.useState(''); // vorhandener Ordner (Select)
  const [moveNew, setMoveNew] = React.useState('');        // ODER neuer Ordnername (Eingabe)

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);
  // Ordnerwechsel -> Auswahl leeren (sonst blieben unsichtbare Dateien ausgewählt).
  React.useEffect(() => { setPicked(new Set()); }, [folder]);
  // „Verwendet in" für die aktuell gewählte Datei laden.
  React.useEffect(() => {
    if (!sel) { setUsage({ loading: false }); return; }
    let alive = true;
    setUsage({ loading: true });
    findUsage(sel).then((r) => { if (alive) setUsage({ loading: false, items: r.ok ? r.items : undefined, err: r.ok ? undefined : r.error }); })
      .catch((e) => { if (alive) setUsage({ loading: false, err: String(e?.message || e) }); });
    return () => { alive = false; };
  }, [sel]);
  // Zuweisen-Modal öffnen -> Auswahl zurücksetzen.
  React.useEffect(() => { if (assignFor) { setAColl(''); setADocs(null); setADoc(''); setAFieldPath(''); setAConfirm(null); } }, [assignFor]);
  // Sammlung gewählt -> Dokumentliste laden + erstes Feld vorwählen.
  React.useEffect(() => {
    if (!assignFor || !aColl) { setADocs(null); return; }
    const tgt = ASSIGN_TARGETS.find((t) => t.collection === aColl);
    setAFieldPath(tgt?.fields[0]?.path || ''); setADoc(''); setADocs(null);
    let alive = true;
    listAssignDocs(tgt as AssignTarget).then((r) => { if (alive) setADocs(r.ok ? (r.docs || []) : []); }).catch(() => { if (alive) setADocs([]); });
    return () => { alive = false; };
  }, [assignFor, aColl]);
  React.useEffect(() => {
    if (!show) return;
    detectEncoder().then(setEncoder).catch(() => {});
    fetch('/uploads-manifest.json', { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('Manifest ' + r.status); return r.json(); })
      .then((l: string[]) => setManifest(Array.isArray(l) ? l : []))
      .catch((e) => setLoadErr(e?.message || 'Mediathek nicht ladbar'));
  }, [show]);

  if (show === null) return null;
  if (!show) return <p className="ww-mm-note">Bitte im CMS anmelden, um die Mediathek zu verwalten.</p>;

  // Gesamtliste = Manifest + frisch Hochgeladene, ohne gelöschte.
  const freshPaths = fresh.map((f) => f.path);
  const all = Array.from(new Set([...(manifest || []), ...freshPaths])).filter((p) => !gone.has(p));
  const previewOf = (p: string) => { const f = fresh.find((x) => x.path === p); return f ? f.url : p; };

  const crumbs = folder ? folder.split('/') : [];
  const goTo = (i: number) => { setSel(null); setFolder(crumbs.slice(0, i + 1).join('/')); };

  const searching = search.trim().length > 0;
  const searchHits = searching
    ? all.filter((p) => relOf(p).toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => a.localeCompare(b))
    : [];
  const { subdirs, files } = viewOf(all, folder);

  const uploadTarget = folder || 'allgemein';

  async function handleFiles(list: FileList | File[] | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    const mode: EncoderMode = encoder === 'checking' ? await detectEncoder() : encoder;
    setBusy(true);
    let okCount = 0; let lastErr = '';
    for (let i = 0; i < imgs.length; i++) {
      setProgress(`Konvertiere & lade ${i + 1}/${imgs.length} …`);
      try {
        const { file } = await toOptimized(imgs[i], mode);
        const r = await uploadToCloud(file, uploadTarget);
        if (r.ok && r.path) {
          const url = URL.createObjectURL(file);
          setFresh((prev) => [{ path: r.path as string, url }, ...prev.filter((x) => x.path !== r.path)]);
          okCount++;
        } else { lastErr = r.error || 'Upload fehlgeschlagen'; }
      } catch (e: any) { lastErr = e?.message || 'Upload fehlgeschlagen'; }
    }
    setBusy(false); setProgress('');
    if (okCount) showToast(`${okCount} hochgeladen → ${uploadTarget}/`, 'success');
    if (lastErr) showToast(lastErr, 'error');
  }

  async function doDelete(path: string) {
    setBusy(true);
    const r = await deleteFromCloud(path);
    setBusy(false); setDel(null);
    if (r.ok) { setGone((g) => new Set(g).add(path)); if (sel === path) setSel(null); showToast('Gelöscht', 'success'); }
    else showToast(r.error || 'Löschen fehlgeschlagen', 'error');
  }

  // --- Mehrfachauswahl ---
  const togglePick = (p: string) => setPicked((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });
  const exitSel = () => { setSelMode(false); setPicked(new Set()); };

  async function doBulkDelete() {
    const items = Array.from(picked);
    if (!items.length || bulkBusy) return;
    setBulkBusy(true);
    let okN = 0; let lastErr = '';
    for (const p of items) {
      const r = await deleteFromCloud(p);
      if (r.ok) { setGone((g) => new Set(g).add(p)); okN++; } else { lastErr = r.error || 'Löschen fehlgeschlagen'; break; }
    }
    if (sel && items.indexOf(sel) !== -1) setSel(null);
    setBulkBusy(false); setBulkDel(false); setPicked(new Set());
    if (okN) showToast(`${okN} gelöscht`, 'success');
    if (lastErr) showToast(lastErr, 'error');
  }

  async function doBulkMove() {
    const target = (moveNew.trim() || moveTarget).replace(/^\/+|\/+$/g, '');
    const items = Array.from(picked);
    if (!items.length || bulkBusy) return;
    setBulkBusy(true);
    let okN = 0; let refsN = 0; let lastErr = '';
    for (let i = 0; i < items.length; i++) {
      setProgress(`Verschiebe ${i + 1}/${items.length} …`);
      const r = await moveInCloud(items[i], target);
      if (r.ok && r.newPath) {
        const np = r.newPath;
        setGone((g) => new Set(g).add(items[i]));
        setFresh((prev) => [{ path: np, url: np }, ...prev.filter((x) => x.path !== np)]);
        okN++; refsN += r.refs || 0;
      } else { lastErr = r.error || 'Verschieben fehlgeschlagen'; break; }
    }
    if (sel && items.indexOf(sel) !== -1) setSel(null);
    setBulkBusy(false); setProgress(''); setMoveOpen(false); setMoveNew(''); setMoveTarget(''); setPicked(new Set());
    if (okN) showToast(`${okN} verschoben${refsN ? ` · ${refsN} Verweise angepasst` : ''} → ${target || 'uploads'}/`, 'success');
    if (lastErr) showToast(lastErr, 'error');
  }

  async function doAssign(overwrite: boolean) {
    const tgt = ASSIGN_TARGETS.find((t) => t.collection === aColl);
    const field = tgt?.fields.find((f) => f.path === aFieldPath);
    if (!assignFor || !tgt || !field || !aDoc) return;
    setABusy(true);
    const r = await assignImage(tgt, aDoc, field, assignFor, { overwrite });
    setABusy(false);
    if (r.needConfirm) { setAConfirm(r.current || ''); return; }
    if (r.ok) { showToast('Bild zugewiesen', 'success'); setAssignFor(null); }
    else showToast(r.error || 'Zuweisen fehlgeschlagen', 'error');
  }

  const fileTile = (p: string) => {
    const isPicked = picked.has(p);
    return (
      <button key={p} type="button"
        className={`ww-mm-file${sel === p ? ' is-sel' : ''}${selMode && isPicked ? ' is-picked' : ''}`}
        onClick={() => (selMode ? togglePick(p) : setSel(p))}
        onContextMenu={(e) => { e.preventDefault(); if (!selMode) { setSel(p); setAssignFor(p); } }}
        title={selMode ? relOf(p) : `${relOf(p)}\n(Rechtsklick: einem Inhalt zuweisen)`}>
        {selMode ? <span className={`ww-mm-check${isPicked ? ' is-on' : ''}`} aria-hidden="true">{isPicked ? '✓' : ''}</span> : null}
        <img src={previewOf(p)} alt="" loading="lazy" />
        <span className="ww-mm-fname">{p.split('/').pop()}</span>
      </button>
    );
  };

  return (
    <div className="ww-mm">
      <div className="page-title ww-mm-head">
        <div className="kicker">Medien</div>
        <h1>Medien-Manager</h1>
        <p>Bilder durchsuchen, ordnen, hochladen und löschen — direkt im Repo, ohne GitHub.</p>
      </div>

      {/* Breadcrumbs */}
      <div className="ww-mm-crumbs">
        <button type="button" onClick={() => { setSel(null); setFolder(''); }} className={folder ? '' : 'is-here'}>uploads</button>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}><span className="sep">/</span>
            <button type="button" onClick={() => goTo(i)} className={i === crumbs.length - 1 ? 'is-here' : ''}>{c}</button>
          </React.Fragment>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ww-mm-toolbar">
        <input type="search" className="ww-mm-search" placeholder="Dateiname suchen (ordnerübergreifend) …" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="button" className={`ww-mm-selmode${selMode ? ' is-active' : ''}`} onClick={() => (selMode ? exitSel() : setSelMode(true))}>
          {selMode ? 'Auswahl beenden' : 'Auswählen'}
        </button>
        <label className={`btn ww-mm-upload${busy ? ' is-busy' : ''}`}>
          {busy ? (progress || 'Arbeite …') : `+ Hochladen (→ ${uploadTarget}/)`}
          <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files)} hidden />
        </label>
      </div>

      {loadErr ? <p className="ww-mm-err">Mediathek nicht ladbar: {loadErr}</p> : null}

      {/* Grid / Drop-Zone */}
      <div
        className={`ww-mm-grid-wrap${dragOver ? ' is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) handleFiles(e.dataTransfer.files); }}
      >
        {searching ? (
          <div className="ww-mm-grid">
            {searchHits.length ? searchHits.map(fileTile) : <p className="ww-mm-empty">Keine Treffer für „{search}".</p>}
          </div>
        ) : (
          <div className="ww-mm-grid">
            {subdirs.map((d) => (
              <button key={'d:' + d} type="button" className="ww-mm-folder" onClick={() => { setSel(null); setFolder(folder ? `${folder}/${d}` : d); }} title={d}>
                <span className="ww-mm-foldericon" aria-hidden="true">📁</span>
                <span className="ww-mm-fname">{d}</span>
              </button>
            ))}
            {files.map(fileTile)}
            {!subdirs.length && !files.length ? <p className="ww-mm-empty">Dieser Ordner ist leer. Zieh Bilder hierher oder nutze „Hochladen".</p> : null}
          </div>
        )}
        {dragOver ? <div className="ww-mm-dropnote">Loslassen zum Hochladen → {uploadTarget}/</div> : null}
      </div>

      {/* Detail-Panel */}
      {sel ? (
        <div className="ww-mm-detail">
          <button type="button" className="ww-mm-detail-close" onClick={() => setSel(null)} aria-label="Schließen">✕</button>
          <img className="ww-mm-detail-img" src={previewOf(sel)} alt="" />
          <div className="ww-mm-detail-name">{sel.split('/').pop()}</div>
          <div className="ww-mm-detail-path">{sel}</div>

          <div className="ww-mm-usage">
            <div className="ww-mm-usage-title">Verwendet in</div>
            {usage.loading ? <div className="ww-mm-usage-note">wird geprüft …</div>
              : usage.err ? <div className="ww-mm-usage-err">{usage.err}</div>
              : usage.items && usage.items.length ? (
                <ul className="ww-mm-usage-list">
                  {usage.items.map((u, i) => (
                    <li key={i}><span className="ww-mm-usage-coll">{COLL_LABEL[u.collection] || u.collection}</span> {u.label}</li>
                  ))}
                </ul>
              ) : <div className="ww-mm-usage-note ww-mm-usage-free">Unbenutzt — wird nirgends verwendet.</div>}
          </div>

          <div className="ww-mm-detail-actions">
            <button type="button" className="btn" onClick={() => setAssignFor(sel)}>Einem Inhalt zuweisen</button>
            <a className="btn ghost" href={sel} target="_blank" rel="noopener">Original öffnen</a>
            <button type="button" className="btn ww-mm-delbtn" onClick={() => setDel(sel)} disabled={busy}>Löschen</button>
          </div>
        </div>
      ) : null}

      {/* Lösch-Nachfrage */}
      {del ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setDel(null); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bild löschen?</h3>
            <p className="ww-dt-note">„{del.split('/').pop()}" wird dauerhaft aus dem Repo entfernt. Falls es noch irgendwo verwendet wird, bricht dort das Bild.</p>
            <div className="ww-dt-actions">
              <button type="button" className="btn ww-dt-danger" onClick={() => doDelete(del)} disabled={busy}>{busy ? 'Lösche …' : 'Endgültig löschen'}</button>
              <button type="button" className="ww-dt-cancel" onClick={() => setDel(null)} disabled={busy}>Abbrechen</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Zuweisen-Modal */}
      {assignFor ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!aBusy) setAssignFor(null); }}>
          <div className="ww-dt-modal ww-mm-assign" onClick={(e) => e.stopPropagation()}>
            <h3>Bild einem Inhalt zuweisen</h3>
            <img className="ww-mm-assign-img" src={previewOf(assignFor)} alt="" />
            {aConfirm !== null ? (
              <>
                <p className="ww-dt-note">Dieses Feld hat bereits ein Bild (<code>{aConfirm.split('/').pop()}</code>). Ersetzen?</p>
                <div className="ww-dt-actions">
                  <button type="button" className="btn ww-dt-danger" onClick={() => doAssign(true)} disabled={aBusy}>{aBusy ? 'Ersetze …' : 'Ersetzen'}</button>
                  <button type="button" className="ww-dt-cancel" onClick={() => setAConfirm(null)} disabled={aBusy}>Abbrechen</button>
                </div>
              </>
            ) : (
              <>
                <label className="ww-mm-assign-row"><span>Bereich</span>
                  <select value={aColl} onChange={(e) => setAColl(e.target.value)}>
                    <option value="">— wählen —</option>
                    {ASSIGN_TARGETS.map((t) => <option key={t.collection} value={t.collection}>{t.label}</option>)}
                  </select>
                </label>
                <label className="ww-mm-assign-row"><span>Beitrag</span>
                  <select value={aDoc} onChange={(e) => setADoc(e.target.value)} disabled={!aColl || !aDocs}>
                    <option value="">{!aColl ? '— erst Bereich —' : aDocs == null ? 'lädt …' : '— wählen —'}</option>
                    {(aDocs || []).map((d) => <option key={d.filename} value={d.filename}>{d.label}</option>)}
                  </select>
                </label>
                <label className="ww-mm-assign-row"><span>Feld</span>
                  <select value={aFieldPath} onChange={(e) => setAFieldPath(e.target.value)} disabled={!aColl}>
                    {(ASSIGN_TARGETS.find((t) => t.collection === aColl)?.fields || []).map((f) => <option key={f.path} value={f.path}>{f.label}</option>)}
                  </select>
                </label>
                <div className="ww-dt-actions">
                  <button type="button" className="btn ww-dt-arch-alt" onClick={() => doAssign(false)} disabled={aBusy || !aColl || !aDoc || !aFieldPath}>{aBusy ? 'Weise zu …' : 'Zuweisen'}</button>
                  <button type="button" className="ww-dt-cancel" onClick={() => setAssignFor(null)} disabled={aBusy}>Abbrechen</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Fixe Auswahl-Leiste (bleibt beim Scrollen unten stehen) */}
      {selMode ? (
        <div className="ww-bulkbar ww-mm-bulkbar" role="region" aria-label="Auswahl-Aktionen">
          <span className="ww-bulkbar-count">{picked.size} ausgewählt</span>
          <button type="button" className="ww-mm-selall" onClick={() => setPicked(new Set(searching ? searchHits : files))} disabled={bulkBusy}>Alle im Ordner</button>
          <button type="button" className="btn ww-bulkbar-move" onClick={() => { setMoveTarget(''); setMoveNew(''); setMoveOpen(true); }} disabled={bulkBusy || picked.size === 0}>Verschieben nach …</button>
          <button type="button" className="btn ww-dt-danger" onClick={() => setBulkDel(true)} disabled={bulkBusy || picked.size === 0}>{picked.size} löschen</button>
          <button type="button" className="ww-dt-cancel" onClick={exitSel} disabled={bulkBusy}>Fertig</button>
        </div>
      ) : null}

      {/* Bulk-Lösch-Nachfrage */}
      {bulkDel ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!bulkBusy) setBulkDel(false); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{picked.size} Bilder löschen?</h3>
            <p className="ww-dt-note">Die ausgewählten Bilder werden dauerhaft aus dem Repo entfernt. Wo sie noch verwendet werden, bricht dort das Bild.</p>
            <div className="ww-dt-actions">
              <button type="button" className="btn ww-dt-danger" onClick={doBulkDelete} disabled={bulkBusy}>{bulkBusy ? 'Lösche …' : `Endgültig löschen (${picked.size})`}</button>
              <button type="button" className="ww-dt-cancel" onClick={() => setBulkDel(false)} disabled={bulkBusy}>Abbrechen</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Verschieben-nach-Ordner-Modal */}
      {moveOpen ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!bulkBusy) setMoveOpen(false); }}>
          <div className="ww-dt-modal ww-mm-move" onClick={(e) => e.stopPropagation()}>
            <h3>{picked.size} {picked.size === 1 ? 'Bild' : 'Bilder'} verschieben</h3>
            <p className="ww-dt-note">Wähle einen vorhandenen Ordner oder tippe einen neuen Namen. Verwendete Bilder werden automatisch überall auf den neuen Pfad umgeschrieben.</p>
            <label className="ww-mm-assign-row"><span>Ordner</span>
              <select value={moveTarget} onChange={(e) => { setMoveTarget(e.target.value); setMoveNew(''); }} disabled={bulkBusy || !!moveNew.trim()}>
                <option value="">(Wurzel: uploads/)</option>
                {allFolders(all).map((f) => <option key={f} value={f}>{f}/</option>)}
              </select>
            </label>
            <label className="ww-mm-assign-row"><span>Neuer Ordner</span>
              <input type="text" placeholder="z. B. tiere  oder  landschaft/berge" value={moveNew} onChange={(e) => setMoveNew(e.target.value)} disabled={bulkBusy} />
            </label>
            <div className="ww-mm-move-target">Ziel: <code>uploads/{(moveNew.trim() || moveTarget).replace(/^\/+|\/+$/g, '')}/</code></div>
            <div className="ww-dt-actions">
              <button type="button" className="btn" onClick={doBulkMove} disabled={bulkBusy}>{bulkBusy ? (progress || 'Verschiebe …') : 'Verschieben'}</button>
              <button type="button" className="ww-dt-cancel" onClick={() => setMoveOpen(false)} disabled={bulkBusy}>Abbrechen</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
