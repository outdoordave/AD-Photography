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
  // Frisch angelegte (noch leere) Ordner — nur Session; werden erst durch ein hineingelegtes Bild dauerhaft.
  const [newFolders, setNewFolders] = React.useState<Set<string>>(new Set());
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  // Desktop-Auswahl-Gesten + Ansicht.
  const [anchor, setAnchor] = React.useState<number | null>(null); // Index für Shift-Bereichsauswahl
  const [sortDesc, setSortDesc] = React.useState(false);           // Name Z–A statt A–Z
  // Für den (mount-once) Tastatur-Handler: aktueller Zustand in einem Ref, damit keine veralteten Closures.
  const stateRef = React.useRef<any>({});
  // Drag & Drop: aktuelles Ziel (Ordnerpfad) beim Drüberziehen + Nutzlast (gezogene Bildpfade).
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const dragRef = React.useRef<string[]>([]);
  // Gummiband-Auswahl (Marquee): das aufgezogene Rechteck (Viewport-Koordinaten) + „hat sich bewegt?".
  const [marquee, setMarquee] = React.useState<null | { x0: number; y0: number; x1: number; y1: number }>(null);
  const marqueeMovedRef = React.useRef(false);

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);
  // Ordnerwechsel -> Auswahl leeren (sonst blieben unsichtbare Dateien ausgewählt).
  React.useEffect(() => { setPicked(new Set()); }, [folder]);
  // Tastatur-Gesten (mount-once, Zustand über stateRef): Cmd/Strg+A = alle, Entf = löschen, Esc = abwählen/
  // Lightbox schließen, ←/→ = Lightbox blättern. In Eingabefeldern nichts abfangen.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (s.sel) { // Lightbox offen: ←/→ blättert, Esc schließt
        if (s.anyModal) return; // Zuweisen/Löschen-Dialog offen -> Tasten dort lassen
        if (e.key === 'Escape') { setSel(null); return; }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const v: string[] = s.visible || []; const i = v.indexOf(s.sel);
          if (i >= 0) { const ni = e.key === 'ArrowRight' ? Math.min(v.length - 1, i + 1) : Math.max(0, i - 1); setSel(v[ni]); }
          return;
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault(); setPicked(new Set(s.visible || [])); setSelMode(true); return;
      }
      if (e.key === 'Escape' && s.selMode && !s.anyModal) { setSelMode(false); setPicked(new Set()); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.pickedSize > 0 && !s.anyModal) { e.preventDefault(); setBulkDel(true); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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

  // Vollständige Ordnerliste (aus Dateien abgeleitet + frisch angelegte leere) — für Baum-Leiste + Verschieben.
  const folderList = Array.from(new Set([...allFolders(all), ...Array.from(newFolders)])).sort((a, b) => a.localeCompare(b));
  // Frisch angelegte, noch leere Unterordner des aktuellen Ordners mit ins Grid aufnehmen.
  const newSubs = Array.from(newFolders)
    .filter((f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '') === folder)
    .map((f) => f.split('/').pop() as string);
  const allSubdirs = Array.from(new Set([...subdirs, ...newSubs])).sort((a, b) => a.localeCompare(b));

  // Sichtbare Datei-Reihenfolge (für Shift-Bereich, Cmd+A, Lightbox-Blättern) — nach Name A–Z bzw. Z–A.
  const visible = (searching ? searchHits : files).slice().sort((a, b) => (sortDesc ? b.localeCompare(a) : a.localeCompare(b)));
  stateRef.current = {
    visible, selMode, sel, pickedSize: picked.size,
    anyModal: !!(del || bulkDel || moveOpen || assignFor || creating),
  };
  // Lightbox weiterblättern (Pfeil-Knöpfe): zum vorigen/nächsten sichtbaren Bild.
  const navSel = (dir: 1 | -1) => {
    if (!sel) return; const i = visible.indexOf(sel); if (i < 0) return;
    const ni = Math.min(visible.length - 1, Math.max(0, i + dir)); setSel(visible[ni]);
  };

  // Klick auf eine Kachel — mit Standard-Desktop-Modifiern: Shift = Bereich ab Anker, Cmd/Strg = einzeln
  // dazu/weg, sonst im Auswahl-Modus umschalten bzw. normal das Detail-Panel öffnen.
  const onTileClick = (e: React.MouseEvent, p: string, idx: number) => {
    if (e.shiftKey && anchor !== null) {
      const [lo, hi] = anchor < idx ? [anchor, idx] : [idx, anchor];
      setPicked(new Set(visible.slice(lo, hi + 1))); setSelMode(true); return;
    }
    if (e.metaKey || e.ctrlKey) { togglePick(p); setAnchor(idx); setSelMode(true); return; }
    if (selMode) { togglePick(p); setAnchor(idx); return; }
    setSel(p); setAnchor(idx);
  };

  // Gummiband-Auswahl: auf leerer Grid-Fläche mit der linken Maustaste ein Rechteck aufziehen -> alle
  // Kacheln darin markieren (live). Startet nur auf Leerraum (nicht auf Kachel/Ordner/Knopf).
  const onGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = e.target as HTMLElement;
    if (el.closest('.ww-mm-file, .ww-mm-folder, button, a, input, .ww-mm-detail')) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    marqueeMovedRef.current = false;
    const onMove = (me: MouseEvent) => {
      const x0 = Math.min(sx, me.clientX), y0 = Math.min(sy, me.clientY), x1 = Math.max(sx, me.clientX), y1 = Math.max(sy, me.clientY);
      if (Math.abs(me.clientX - sx) + Math.abs(me.clientY - sy) > 4) marqueeMovedRef.current = true;
      setMarquee({ x0, y0, x1, y1 });
      const hit = new Set<string>();
      document.querySelectorAll('.ww-mm-grid .ww-mm-file').forEach((node) => {
        const r = (node as HTMLElement).getBoundingClientRect();
        if (r.left < x1 && r.right > x0 && r.top < y1 && r.bottom > y0) { const p = (node as HTMLElement).getAttribute('data-path'); if (p) hit.add(p); }
      });
      setPicked(hit);
      if (hit.size) setSelMode(true);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); setMarquee(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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

  // Neuen (leeren) Ordner IM AKTUELLEN Ordner anlegen und hineinwechseln. Persistiert erst, sobald ein
  // Bild darin liegt (Upload/Verschieben) — leere Ordner gibt es im statischen Repo nicht.
  function createFolder() {
    const raw = newName.trim().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');
    setCreating(false); setNewName('');
    if (!raw) return;
    const full = folder ? `${folder}/${raw}` : raw;
    setNewFolders((s) => new Set(s).add(full));
    setSel(null); setFolder(full);
  }

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

  // Kern: mehrere Bilder in einen Zielordner verschieben (aus Modal ODER per Drag&Drop).
  async function moveMany(paths: string[], targetDir: string) {
    const target = (targetDir || '').replace(/^\/+|\/+$/g, '');
    if (!paths.length || bulkBusy) return;
    setBulkBusy(true);
    let okN = 0; let refsN = 0; let lastErr = ''; let warn = '';
    for (let i = 0; i < paths.length; i++) {
      setProgress(`Verschiebe ${i + 1}/${paths.length} …`);
      const r = await moveInCloud(paths[i], target);
      if (r.ok && r.newPath) {
        const np = r.newPath;
        setFresh((prev) => [{ path: np, url: np }, ...prev.filter((x) => x.path !== np)]);
        okN++; refsN += r.refs || 0;
        // Teil-Erfolg: kopiert + Verweise umgeschrieben, aber die ALTE Datei blieb liegen (Löschen scheiterte).
        // Dann die alte Kachel NICHT ausblenden — so kann man sie sehen und ggf. manuell löschen. Warnung zeigen.
        if (r.error) warn = r.error;
        else setGone((g) => new Set(g).add(paths[i]));
      } else { lastErr = r.error || 'Verschieben fehlgeschlagen'; break; }
    }
    if (sel && paths.indexOf(sel) !== -1) setSel(null);
    setBulkBusy(false); setProgress(''); setPicked(new Set());
    if (okN) showToast(`${okN} verschoben${refsN ? ` · ${refsN} Verweise angepasst` : ''} → ${target || 'uploads'}/`, 'success');
    if (warn) showToast(warn, 'error');
    if (lastErr) showToast(lastErr, 'error');
  }

  async function doBulkMove() {
    const target = moveNew.trim() || moveTarget;
    setMoveOpen(false); setMoveNew(''); setMoveTarget('');
    await moveMany(Array.from(picked), target);
  }

  // Ordner als Drop-Ziel: Drüberziehen hebt hervor, Loslassen verschiebt die gezogenen Bilder dorthin.
  const folderDropProps = (targetFolder: string) => ({
    onDragEnter: (e: React.DragEvent) => { if (dragRef.current.length) { e.preventDefault(); e.stopPropagation(); setDropTarget(targetFolder); } },
    onDragOver: (e: React.DragEvent) => { if (dragRef.current.length) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDropTarget(targetFolder); } },
    onDragLeave: () => setDropTarget((cur) => (cur === targetFolder ? null : cur)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); const payload = dragRef.current.slice(); dragRef.current = []; setDropTarget(null); if (payload.length) moveMany(payload, targetFolder); },
  });

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

  const fileTile = (p: string, idx: number) => {
    const isPicked = picked.has(p);
    return (
      <button key={p} type="button" draggable data-path={p}
        className={`ww-mm-file${sel === p ? ' is-sel' : ''}${isPicked ? ' is-picked' : ''}`}
        onClick={(e) => onTileClick(e, p, idx)}
        onDoubleClick={(e) => { e.preventDefault(); setSel(p); }}
        onDragStart={(e) => { const payload = isPicked && picked.size > 0 ? Array.from(picked) : [p]; dragRef.current = payload; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', payload.join('\n')); } catch (err) { /* egal */ } }}
        onDragEnd={() => { dragRef.current = []; setDropTarget(null); }}
        onContextMenu={(e) => { e.preventDefault(); if (!selMode) { setSel(p); setAssignFor(p); } }}
        title={`${relOf(p)}\n(Doppelklick: groß · Shift/Strg-Klick: mehrfach · auf einen Ordner ziehen: verschieben)`}>
        {selMode ? <span className={`ww-mm-check${isPicked ? ' is-on' : ''}`} aria-hidden="true">{isPicked ? '✓' : ''}</span> : null}
        {!selMode ? (
          // Direkt-Löschen je Kachel (mit Nachfrage). Kein <button> im <button> -> span mit role. stopPropagation
          // verhindert das Öffnen der Lightbox/Auswahl. In der Mehrfachauswahl ausgeblendet (dort löscht die Leiste).
          <span className="ww-mm-tiledel" role="button" tabIndex={-1} aria-label="Löschen" title="Löschen"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSel(null); setDel(p); }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
            </svg>
          </span>
        ) : null}
        <img src={previewOf(p)} alt="" loading="lazy" draggable={false} />
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

      <div className="ww-mm-body">
      {/* Ordner-Baum-Leiste (Explorer-Optik) */}
      <aside className="ww-mm-tree" aria-label="Ordner">
        <div className="ww-mm-tree-head">Ordner</div>
        <button type="button" className={`ww-mm-treeitem${folder === '' ? ' is-here' : ''}${dropTarget === '' ? ' is-drop' : ''}`} onClick={() => { setSel(null); setFolder(''); }} title="uploads" {...folderDropProps('')}>
          <span className="ww-mm-treeicon" aria-hidden="true">🗂️</span> uploads
        </button>
        {folderList.map((f) => (
          <button key={f} type="button" className={`ww-mm-treeitem${folder === f ? ' is-here' : ''}${dropTarget === f ? ' is-drop' : ''}`}
            style={{ paddingLeft: `${12 + f.split('/').length * 15}px` }}
            onClick={() => { setSel(null); setFolder(f); }} title={f} {...folderDropProps(f)}>
            <span className="ww-mm-treeicon" aria-hidden="true">📁</span> {f.split('/').pop()}
          </button>
        ))}
        {creating ? (
          <div className="ww-mm-tree-new">
            <input autoFocus value={newName} placeholder="Ordnername …"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setCreating(false); setNewName(''); } }} />
            <button type="button" onClick={createFolder} title="Anlegen">✓</button>
          </div>
        ) : (
          <button type="button" className="ww-mm-tree-add" onClick={() => setCreating(true)}>
            ＋ Neuer Ordner{folder ? ` in ${folder}/` : ''}
          </button>
        )}
      </aside>

      <div className="ww-mm-main">
      {/* Toolbar */}
      <div className="ww-mm-toolbar">
        <input type="search" className="ww-mm-search" placeholder="Dateiname suchen (ordnerübergreifend) …" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="button" className="ww-mm-sort" onClick={() => setSortDesc((s) => !s)} title="Sortierung umschalten">
          {sortDesc ? 'Name Z–A' : 'Name A–Z'}
        </button>
        <button type="button" className={`ww-mm-selmode${selMode ? ' is-active' : ''}`} onClick={() => (selMode ? exitSel() : setSelMode(true))}>
          {selMode ? 'Auswahl beenden' : 'Auswählen'}
        </button>
        <label className={`btn ww-mm-upload${busy ? ' is-busy' : ''}`}>
          {busy ? <><span className="ww-spinner" />{progress || 'Arbeite …'}</> : `+ Hochladen (→ ${uploadTarget}/)`}
          <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files)} hidden />
        </label>
      </div>

      {loadErr ? <p className="ww-mm-err">Mediathek nicht ladbar: {loadErr}</p> : null}

      {/* Grid / Drop-Zone */}
      <div
        className={`ww-mm-grid-wrap${dragOver ? ' is-drag' : ''}`}
        onMouseDown={onGridMouseDown}
        onClick={(e) => { if (marqueeMovedRef.current) { marqueeMovedRef.current = false; return; } const el = e.target as HTMLElement; if (el.closest('.ww-mm-file, .ww-mm-folder, button, a, input')) return; if (picked.size) setPicked(new Set()); }}
        onDragOver={(e) => { if (dragRef.current.length) return; e.preventDefault(); if (!busy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { if (dragRef.current.length) return; e.preventDefault(); setDragOver(false); if (!busy) handleFiles(e.dataTransfer.files); }}
      >
        {searching ? (
          <div className="ww-mm-grid">
            {visible.length ? visible.map((p, i) => fileTile(p, i)) : <p className="ww-mm-empty">Keine Treffer für „{search}".</p>}
          </div>
        ) : (
          <div className="ww-mm-grid">
            {allSubdirs.map((d) => {
              const dPath = folder ? `${folder}/${d}` : d;
              return (
                <button key={'d:' + d} type="button" className={`ww-mm-folder${dropTarget === dPath ? ' is-drop' : ''}`} onClick={() => { setSel(null); setFolder(dPath); }} title={d} {...folderDropProps(dPath)}>
                  <span className="ww-mm-foldericon" aria-hidden="true">📁</span>
                  <span className="ww-mm-fname">{d}</span>
                </button>
              );
            })}
            {visible.map((p, i) => fileTile(p, i))}
            {!allSubdirs.length && !visible.length ? <p className="ww-mm-empty">Dieser Ordner ist leer. Zieh Bilder hierher oder nutze „Hochladen".</p> : null}
          </div>
        )}
        {dragOver ? <div className="ww-mm-dropnote">Loslassen zum Hochladen → {uploadTarget}/</div> : null}
      </div>
      </div>{/* .ww-mm-main */}
      </div>{/* .ww-mm-body */}

      {/* Lightbox mit Infos — Klick auf ein Bild öffnet groß; ←/→ blättert; Esc/Backdrop/✕ schließt. */}
      {sel ? (
        <div className="ww-mm-lb" role="dialog" aria-modal="true" aria-label="Bild-Ansicht" onClick={() => setSel(null)}>
          <button type="button" className="ww-mm-lb-close" onClick={() => setSel(null)} aria-label="Schließen">✕</button>
          {visible.length > 1 ? <button type="button" className="ww-mm-lb-nav prev" onClick={(e) => { e.stopPropagation(); navSel(-1); }} aria-label="Vorheriges">‹</button> : null}
          <div className="ww-mm-lb-stage" onClick={(e) => e.stopPropagation()}>
            <div className="ww-mm-lb-imgwrap"><img src={previewOf(sel)} alt={sel.split('/').pop() || ''} /></div>
            <div className="ww-mm-lb-info">
              <div className="ww-mm-lb-name">{sel.split('/').pop()}</div>
              <div className="ww-mm-lb-path">{sel}</div>
              <div className="ww-mm-usage">
                <div className="ww-mm-usage-title">Verwendet in</div>
                {usage.loading ? <div className="ww-mm-usage-note">wird geprüft …</div>
                  : usage.err ? <div className="ww-mm-usage-err">{usage.err}</div>
                  : usage.items && usage.items.length ? (
                    <ul className="ww-mm-usage-list">
                      {usage.items.map((u, i) => (
                        // Bei Einzel-Seiten (Startseite/Highlights/…) gibt es kein Titelfeld -> label fällt auf den
                        // Datei-Slug zurück (z. B. „home-settings"). Diesen Roh-Slug NICHT anzeigen — die Bereichs-
                        // Pille allein reicht. Nur echte Titel (z. B. Album „USA 2023") als Klartext dahinter zeigen.
                        <li key={i}>
                          <span className="ww-mm-usage-coll">{COLL_LABEL[u.collection] || u.collection}</span>
                          {u.label && u.label !== u.filename ? <> {u.label}</> : null}
                        </li>
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
          </div>
          {visible.length > 1 ? <button type="button" className="ww-mm-lb-nav next" onClick={(e) => { e.stopPropagation(); navSel(1); }} aria-label="Nächstes">›</button> : null}
        </div>
      ) : null}

      {/* Lösch-Nachfrage */}
      {del ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setDel(null); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bild löschen?</h3>
            <p className="ww-dt-note">„{del.split('/').pop()}" wird dauerhaft aus dem Repo entfernt. Falls es noch irgendwo verwendet wird, bricht dort das Bild.</p>
            <div className="ww-dt-actions">
              <button type="button" className="btn ww-dt-danger" onClick={() => doDelete(del)} disabled={busy}>{busy ? <><span className="ww-spinner" />Lösche …</> : 'Endgültig löschen'}</button>
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
                  <button type="button" className="btn ww-dt-danger" onClick={() => doAssign(true)} disabled={aBusy}>{aBusy ? <><span className="ww-spinner" />Ersetze …</> : 'Ersetzen'}</button>
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
                  <button type="button" className="btn ww-dt-arch-alt" onClick={() => doAssign(false)} disabled={aBusy || !aColl || !aDoc || !aFieldPath}>{aBusy ? <><span className="ww-spinner" />Weise zu …</> : 'Zuweisen'}</button>
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
              <button type="button" className="btn ww-dt-danger" onClick={doBulkDelete} disabled={bulkBusy}>{bulkBusy ? <><span className="ww-spinner" />Lösche …</> : `Endgültig löschen (${picked.size})`}</button>
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
                {folderList.map((f) => <option key={f} value={f}>{f}/</option>)}
              </select>
            </label>
            <label className="ww-mm-assign-row"><span>Neuer Ordner</span>
              <input type="text" placeholder="z. B. tiere  oder  landschaft/berge" value={moveNew} onChange={(e) => setMoveNew(e.target.value)} disabled={bulkBusy} />
            </label>
            <div className="ww-mm-move-target">Ziel: <code>uploads/{(moveNew.trim() || moveTarget).replace(/^\/+|\/+$/g, '')}/</code></div>
            <div className="ww-dt-actions">
              <button type="button" className="btn" onClick={doBulkMove} disabled={bulkBusy}>{bulkBusy ? <><span className="ww-spinner" />{progress || 'Verschiebe …'}</> : 'Verschieben'}</button>
              <button type="button" className="ww-dt-cancel" onClick={() => setMoveOpen(false)} disabled={bulkBusy}>Abbrechen</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Gummiband-Rechteck */}
      {marquee ? <div className="ww-mm-marquee" style={{ left: marquee.x0, top: marquee.y0, width: marquee.x1 - marquee.x0, height: marquee.y1 - marquee.y0 }} /> : null}
    </div>
  );
}
