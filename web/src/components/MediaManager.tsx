import React from 'react';
import { loggedIn } from '../lib/tinaAdmin';
import {
  uploadToCloud, deleteFromCloud, moveInCloud, findUsage, type UsageItem,
  ASSIGN_TARGETS, listAssignDocs, assignImage, type AssignTarget,
  findAllUsed, listAlbumsForOrganize, type AlbumForOrganize,
} from '../lib/mediaCloud';
import { showToast } from '../lib/tinaAdmin';
import { detectEncoder, toOptimized, type EncoderMode } from '../../tina/fields/webpEncode';

// Medien-Manager — eigenständige, login-geschützte Seite (/medien-manager) im Website-Look mit
// Finder/Explorer-Logik: Ordnerbaum, Breadcrumbs, drei Ansichten (Kacheln/Liste/Details mit Vorschau),
// Sortierung (Name/Größe/Datum/Typ/Unbenutzt), ordnerübergreifende Suche, Drag&Drop-/Dialog-Upload
// (WebP via webpEncode), Löschen, Verschieben mit Referenz-Umschreiben, „Verwendet in", Zuweisen,
// „Nach Alben ordnen". Nur bei Login sichtbar. iPad-tauglich (Tap + Datei-Dialog).

type Fresh = { path: string; url: string };
type PhotoExif = { aperture?: string; shutter?: string; iso?: string; focal?: string; lens?: string; taken?: string };
type Meta = Record<string, { size: number; added: string; camera?: string; exif?: PhotoExif }>;
type View = 'grid' | 'list' | 'details';
type SortKey = 'name' | 'size' | 'date' | 'type' | 'camera' | 'views' | 'unused';
type SortDir = 'asc' | 'desc';

const COLL_LABEL: Record<string, string> = {
  startseite: 'Startseite', journal: 'Journal', alben: 'Album', story: 'Story',
  reisen: 'Reise', ueber_uns: 'Über uns', highlights: 'Highlights', darstellung: 'Darstellung',
};

const SORT_LABEL: Record<SortKey, string> = {
  name: 'Name', size: 'Größe', date: 'Upload-Datum', type: 'Datei-Typ', camera: 'Kamera', views: 'Am meisten angesehen', unused: 'Unbenutzt zuerst',
};

function relOf(p: string): string { return p.replace(/^\/uploads\//, ''); }
function baseOf(p: string): string { return p.split('/').pop() || p; }
function extOf(p: string): string { const b = baseOf(p); const i = b.lastIndexOf('.'); return i >= 0 ? b.slice(i + 1).toLowerCase() : ''; }
function fmtSize(b?: number): string {
  if (!b && b !== 0) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

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
  return { subdirs: Array.from(subdirs).sort((a, b) => a.localeCompare(b)), files };
}

export default function MediaManager() {
  const [show, setShow] = React.useState<null | boolean>(null);
  const [manifest, setManifest] = React.useState<string[] | null>(null);
  const [meta, setMeta] = React.useState<Meta>({});
  const [views, setViews] = React.useState<Record<string, number>>({}); // Dateiname -> Aufrufe (Umami)
  const [loadErr, setLoadErr] = React.useState('');
  const [folder, setFolder] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [sel, setSel] = React.useState<string | null>(null);
  const [lbOpen, setLbOpen] = React.useState(false); // Lightbox offen (Kacheln/Liste). Details zeigt sel in der Leiste.
  const [fresh, setFresh] = React.useState<Fresh[]>([]);
  const [gone, setGone] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');
  const [del, setDel] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<{ loading: boolean; items?: UsageItem[]; err?: string }>({ loading: false });
  // Ansicht + Sortierung.
  const [view, setView] = React.useState<View>('grid');
  const [sortKey, setSortKey] = React.useState<SortKey>('name');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');
  const [usedBlob, setUsedBlob] = React.useState<string | null>(null); // für „Unbenutzt"-Sortierung (lazy)
  const [usedLoading, setUsedLoading] = React.useState(false);
  // Zuweisen-Modal
  const [assignFor, setAssignFor] = React.useState<string | null>(null);
  const [aColl, setAColl] = React.useState('');
  const [aDocs, setADocs] = React.useState<{ filename: string; label: string }[] | null>(null);
  const [aDoc, setADoc] = React.useState('');
  const [aFieldPath, setAFieldPath] = React.useState('');
  const [aBusy, setABusy] = React.useState(false);
  const [aConfirm, setAConfirm] = React.useState<string | null>(null);
  // Mehrfachauswahl + Bulk-Aktionen.
  const [selMode, setSelMode] = React.useState(false);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [bulkDel, setBulkDel] = React.useState(false);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [moveTarget, setMoveTarget] = React.useState('');
  const [moveNew, setMoveNew] = React.useState('');
  // Frisch angelegte (noch leere) Ordner — nur Session.
  const [newFolders, setNewFolders] = React.useState<Set<string>>(new Set());
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  // Alben (für Upload-Ziel + „Nach Alben ordnen").
  const [albums, setAlbums] = React.useState<AlbumForOrganize[] | null>(null);
  const [albumsLoading, setAlbumsLoading] = React.useState(false);
  const [organizeOpen, setOrganizeOpen] = React.useState(false);
  // Upload-Fenster (eigenes Modal mit Drop-Feld + Zielwahl statt allem in der Toolbar).
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [upDest, setUpDest] = React.useState<'current' | 'album' | 'new'>('current');
  const [upAlbum, setUpAlbum] = React.useState(''); // Album-slug bei upDest==='album'
  const [upNew, setUpNew] = React.useState('');      // neuer Ordnername bei upDest==='new'
  // Desktop-Auswahl-Gesten.
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const stateRef = React.useRef<any>({});
  // Drag & Drop zwischen Ordnern.
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const dragRef = React.useRef<string[]>([]);
  // Marquee (Gummiband) — Rechteck in VIEWPORT-Koordinaten (position:fixed); der Anker liegt im
  // Inhalts-Raum des internen Scroll-Containers, damit Auto-Scroll nicht verrutscht (s. onGridMouseDown).
  const [marquee, setMarquee] = React.useState<null | { x0: number; y0: number; x1: number; y1: number }>(null);
  const marqueeMovedRef = React.useRef(false);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);

  // Finder-Höhe: der Body füllt vom eigenen Oberrand bis kurz vor den Viewport-Boden -> jede Spalte
  // (Ordner, Liste, Vorschau) scrollt IN SICH; Toolbar und Vorschau bleiben dadurch fest stehen.
  React.useEffect(() => {
    if (!show) return;
    const el = bodyRef.current; if (!el) return;
    const set = () => { const top = el.getBoundingClientRect().top; el.style.setProperty('--mm-h', `${Math.max(380, window.innerHeight - top - 24)}px`); };
    set();
    const t = window.setTimeout(set, 120); // nach Bild-/Font-Layout nachjustieren
    window.addEventListener('resize', set);
    return () => { window.removeEventListener('resize', set); window.clearTimeout(t); };
  }, [show, view, folder]);
  React.useEffect(() => { setPicked(new Set()); }, [folder]);

  // Tastatur: Lightbox blättern/schließen; in Details ←/→ = Vorschau blättern; Cmd+A / Entf / Esc.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (s.lbOpen) {
        if (s.anyModal) return;
        if (e.key === 'Escape') { setLbOpen(false); return; }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const v: string[] = s.visible || []; const i = v.indexOf(s.sel);
          if (i >= 0) { const ni = e.key === 'ArrowRight' ? Math.min(v.length - 1, i + 1) : Math.max(0, i - 1); setSel(v[ni]); }
          return;
        }
        return;
      }
      if (s.view === 'details' && s.sel && !s.anyModal && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const v: string[] = s.visible || []; const i = v.indexOf(s.sel);
        if (i >= 0) { e.preventDefault(); const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown'; const ni = fwd ? Math.min(v.length - 1, i + 1) : Math.max(0, i - 1); setSel(v[ni]); }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); setPicked(new Set(s.visible || [])); setSelMode(true); return; }
      if (e.key === 'Escape' && s.selMode && !s.anyModal) { setSelMode(false); setPicked(new Set()); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && s.pickedSize > 0 && !s.anyModal) { e.preventDefault(); setBulkDel(true); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // „Verwendet in" für die aktuell gewählte Datei (Lightbox ODER Details-Vorschau).
  React.useEffect(() => {
    if (!sel) { setUsage({ loading: false }); return; }
    let alive = true;
    setUsage({ loading: true });
    findUsage(sel).then((r) => { if (alive) setUsage({ loading: false, items: r.ok ? r.items : undefined, err: r.ok ? undefined : r.error }); })
      .catch((e) => { if (alive) setUsage({ loading: false, err: String(e?.message || e) }); });
    return () => { alive = false; };
  }, [sel]);

  // „Unbenutzt"-Sortierung gewählt und noch nicht geladen -> Bulk-Nutzung einmal holen.
  React.useEffect(() => {
    if (sortKey !== 'unused' || usedBlob !== null || usedLoading || !show) return;
    setUsedLoading(true);
    findAllUsed().then((r) => { setUsedBlob(r.ok ? (r.usedBlob || '') : ''); if (!r.ok) showToast(r.error || 'Nutzungs-Abfrage fehlgeschlagen', 'error'); })
      .catch(() => setUsedBlob('')).finally(() => setUsedLoading(false));
  }, [sortKey, usedBlob, usedLoading, show]);

  React.useEffect(() => { if (assignFor) { setAColl(''); setADocs(null); setADoc(''); setAFieldPath(''); setAConfirm(null); } }, [assignFor]);
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
    fetch('/uploads-meta.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).then((m) => setMeta(m || {})).catch(() => {});
    // Aufrufe LIVE aus dem KV-Zähler (/api/view); Fallback auf die statische Datei (lokaler Dev ohne Function).
    fetch('/api/view', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => fetch('/uploads-views.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})))
      .then((v) => setViews(v && typeof v === 'object' ? v : {}))
      .catch(() => {});
    // Alben für Upload-Ziel + „Nach Alben ordnen" (nur eingeloggt, best effort).
    listAlbumsForOrganize().then((r) => { if (r.ok) setAlbums(r.albums || []); }).catch(() => {});
  }, [show]);

  if (show === null) return null;
  if (!show) return <p className="ww-mm-note">Bitte im CMS anmelden, um die Mediathek zu verwalten.</p>;

  const freshPaths = fresh.map((f) => f.path);
  const all = Array.from(new Set([...(manifest || []), ...freshPaths])).filter((p) => !gone.has(p));
  const previewOf = (p: string) => { const f = fresh.find((x) => x.path === p); return f ? f.url : p; };
  const isUsed = (p: string) => (usedBlob ? usedBlob.indexOf(p) !== -1 : false);

  const crumbs = folder ? folder.split('/') : [];
  const goTo = (i: number) => { closePreview(); setFolder(crumbs.slice(0, i + 1).join('/')); };

  const searching = search.trim().length > 0;
  const searchHits = searching ? all.filter((p) => relOf(p).toLowerCase().includes(search.trim().toLowerCase())) : [];
  const { subdirs, files } = viewOf(all, folder);

  const folderList = Array.from(new Set([...allFolders(all), ...Array.from(newFolders)])).sort((a, b) => a.localeCompare(b));
  const newSubs = Array.from(newFolders)
    .filter((f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '') === folder)
    .map((f) => f.split('/').pop() as string);
  const allSubdirs = Array.from(new Set([...subdirs, ...newSubs])).sort((a, b) => a.localeCompare(b));

  // Sortierung anwenden.
  const cmp = (a: string, b: string): number => {
    let d = 0;
    if (sortKey === 'name') d = baseOf(a).localeCompare(baseOf(b));
    else if (sortKey === 'size') d = (meta[a]?.size || 0) - (meta[b]?.size || 0);
    else if (sortKey === 'date') d = (meta[a]?.added || '').localeCompare(meta[b]?.added || '');
    else if (sortKey === 'type') d = extOf(a).localeCompare(extOf(b)) || baseOf(a).localeCompare(baseOf(b));
    else if (sortKey === 'camera') d = (meta[a]?.camera || '￿').localeCompare(meta[b]?.camera || '￿') || baseOf(a).localeCompare(baseOf(b));
    else if (sortKey === 'views') d = (views[baseOf(b)] || 0) - (views[baseOf(a)] || 0) || baseOf(a).localeCompare(baseOf(b)); // meiste zuerst bei „aufsteigend"
    else if (sortKey === 'unused') d = (isUsed(a) ? 1 : 0) - (isUsed(b) ? 1 : 0) || baseOf(a).localeCompare(baseOf(b));
    return d;
  };
  const visible = (searching ? searchHits : files).slice().sort((a, b) => (sortDir === 'desc' ? -cmp(a, b) : cmp(a, b)));

  stateRef.current = {
    visible, selMode, sel, lbOpen, view, pickedSize: picked.size,
    anyModal: !!(del || bulkDel || moveOpen || assignFor || creating || organizeOpen || uploadOpen),
  };

  const navSel = (dir: 1 | -1) => {
    if (!sel) return; const i = visible.indexOf(sel); if (i < 0) return;
    const ni = Math.min(visible.length - 1, Math.max(0, i + dir)); setSel(visible[ni]);
  };
  const closePreview = () => { setSel(null); setLbOpen(false); };

  // Ein Bild „öffnen": in Details nur die Vorschau-Leiste, sonst die Lightbox.
  const openItem = (p: string) => { setSel(p); setLbOpen(view !== 'details'); };

  // Klick auf Kachel/Zeile — Standard-Desktop-Modifier: Shift = Bereich, Cmd/Strg = einzeln, sonst öffnen/wählen.
  const onItemClick = (e: React.MouseEvent, p: string, idx: number) => {
    if (e.shiftKey && anchor !== null) {
      const [lo, hi] = anchor < idx ? [anchor, idx] : [idx, anchor];
      setPicked(new Set(visible.slice(lo, hi + 1))); setSelMode(true); return;
    }
    if (e.metaKey || e.ctrlKey) { togglePick(p); setAnchor(idx); setSelMode(true); return; }
    if (selMode) { togglePick(p); setAnchor(idx); return; }
    openItem(p); setAnchor(idx);
  };

  // Marquee (Gummiband) mit Text-Auswahl-Sperre + Auto-Scroll am Rand. Scroll-Container ist die interne
  // Liste (.ww-mm-content). Der Anker liegt im INHALTS-Raum (clientY + scrollTop) — so verrutscht die
  // Auswahl beim Auto-Scrollen nicht. Rechteck + Trefferprüfung laufen in Viewport-Koordinaten.
  const onGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || view === 'details') return;
    const el = e.target as HTMLElement;
    if (el.closest('.ww-mm-file, .ww-mm-folder, button, a, input, select, .ww-mm-row')) return;
    e.preventDefault();
    const container = e.currentTarget as HTMLElement; // .ww-mm-content = interner Scroll-Container
    document.body.classList.add('ww-mm-marqueeing'); // user-select: none -> markiert keinen Text mehr
    const startX = e.clientX;
    const anchorY = e.clientY + container.scrollTop;
    let lastX = e.clientX, lastY = e.clientY;
    marqueeMovedRef.current = false;

    const update = () => {
      const aY = anchorY - container.scrollTop; // aktuelle Bildschirm-Y des Ankers
      const x0 = Math.min(startX, lastX), x1 = Math.max(startX, lastX);
      const y0 = Math.min(aY, lastY), y1 = Math.max(aY, lastY);
      if (Math.abs(lastX - startX) + Math.abs(lastY - aY) > 4) marqueeMovedRef.current = true;
      setMarquee({ x0, y0, x1, y1 }); // Viewport-Koordinaten (Rechteck ist position:fixed)
      const hit = new Set<string>();
      container.querySelectorAll('[data-path]').forEach((node) => {
        const r = (node as HTMLElement).getBoundingClientRect();
        if (r.left < x1 && r.right > x0 && r.top < y1 && r.bottom > y0) { const p = (node as HTMLElement).getAttribute('data-path'); if (p) hit.add(p); }
      });
      setPicked(hit);
      if (hit.size) setSelMode(true);
    };

    const onMove = (me: MouseEvent) => { lastX = me.clientX; lastY = me.clientY; update(); };
    // Auto-Scroll, solange der Zeiger nahe der Ober-/Unterkante des Containers gehalten wird.
    const timer = window.setInterval(() => {
      const rc = container.getBoundingClientRect();
      let dy = 0;
      if (lastY < rc.top + 24) dy = -Math.min(26, (rc.top + 24 - lastY) / 3 + 4);
      else if (lastY > rc.bottom - 24) dy = Math.min(26, (lastY - (rc.bottom - 24)) / 3 + 4);
      if (dy) { container.scrollTop += dy; update(); }
    }, 30);

    const onUp = () => {
      window.clearInterval(timer);
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('ww-mm-marqueeing');
      setMarquee(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const quickTarget = folder || 'allgemein'; // Schnell-Drop in die Ansicht: aktueller Ordner
  const slugify = (s: string) => s.trim().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');
  // Ziel aus der Modal-Auswahl (aktueller Ordner / Album / neuer Ordner unter dem aktuellen).
  const uploadModalTarget = (): string => {
    if (upDest === 'album' && upAlbum) return `alben/${upAlbum}`;
    if (upDest === 'new' && upNew.trim()) { const s = slugify(upNew); return folder ? `${folder}/${s}` : s; }
    return quickTarget;
  };

  async function handleFiles(list: FileList | File[] | null, target: string) {
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
        const r = await uploadToCloud(file, target);
        if (r.ok && r.path) {
          const url = URL.createObjectURL(file);
          setFresh((prev) => [{ path: r.path as string, url }, ...prev.filter((x) => x.path !== r.path)]);
          okCount++;
        } else { lastErr = r.error || 'Upload fehlgeschlagen'; }
      } catch (e: any) { lastErr = e?.message || 'Upload fehlgeschlagen'; }
    }
    setBusy(false); setProgress('');
    if (okCount) showToast(`${okCount} hochgeladen → ${target}/`, 'success');
    if (lastErr) showToast(lastErr, 'error');
  }

  async function doDelete(path: string) {
    setBusy(true);
    const r = await deleteFromCloud(path);
    setBusy(false); setDel(null);
    if (r.ok) { setGone((g) => new Set(g).add(path)); if (sel === path) closePreview(); showToast('Gelöscht', 'success'); }
    else showToast(r.error || 'Löschen fehlgeschlagen', 'error');
  }

  const togglePick = (p: string) => setPicked((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });
  const exitSel = () => { setSelMode(false); setPicked(new Set()); };

  function createFolder() {
    const raw = newName.trim().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-');
    setCreating(false); setNewName('');
    if (!raw) return;
    const full = folder ? `${folder}/${raw}` : raw;
    setNewFolders((s) => new Set(s).add(full));
    closePreview(); setFolder(full);
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
    if (sel && items.indexOf(sel) !== -1) closePreview();
    setBulkBusy(false); setBulkDel(false); setPicked(new Set());
    if (okN) showToast(`${okN} gelöscht`, 'success');
    if (lastErr) showToast(lastErr, 'error');
  }

  // Kern: mehrere Bilder in EINEN Zielordner verschieben (Modal/DnD).
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
        if (r.error) warn = r.error; else setGone((g) => new Set(g).add(paths[i]));
      } else { lastErr = r.error || 'Verschieben fehlgeschlagen'; break; }
    }
    if (sel && paths.indexOf(sel) !== -1) closePreview();
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

  // Ordnername aus dem Album-NAMEN (nicht dem Datei-slug): „USA 2023" -> „USA-2023". Leerzeichen -> Bindestrich,
  // Slashes/Sonderzeichen raus, Groß-/Kleinschreibung bleibt. Fallback: der Datei-slug.
  const albumFolder = (a: AlbumForOrganize): string => {
    const s = (a.name || '').trim().replace(/[\/\\]+/g, '-').replace(/\s+/g, '-').replace(/[^\wäöüÄÖÜß.\-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return s || a.slug;
  };
  // „Nach Alben ordnen": pro Album die noch nicht einsortierten Fotos in alben/<Album-Name>/ verschieben.
  const organizePlan = (albums || []).map((a) => {
    const folder = albumFolder(a);
    return { slug: a.slug, name: a.name, folder, photos: a.photos.filter((ph) => all.includes(ph) && !relOf(ph).startsWith(`alben/${folder}/`)) };
  }).filter((a) => a.photos.length);
  const organizeCount = organizePlan.reduce((n, a) => n + a.photos.length, 0);
  const orgPct = (() => { const m = /(\d+)\s*\/\s*(\d+)/.exec(progress || ''); return m && +m[2] ? Math.round((+m[1] / +m[2]) * 100) : 5; })();

  // Button-Klick: Alben ggf. erst jetzt laden (mit Spinner + Fehler-Hinweis), dann Vorschau öffnen.
  async function openOrganize() {
    if (albums) { setOrganizeOpen(true); return; }
    setAlbumsLoading(true);
    const r = await listAlbumsForOrganize();
    setAlbumsLoading(false);
    if (r.ok) { setAlbums(r.albums || []); setOrganizeOpen(true); }
    else showToast(r.error || 'Alben konnten nicht geladen werden — im CMS angemeldet?', 'error');
  }

  async function doOrganize() {
    // Modal bleibt OFFEN und zeigt den Fortschritt (Balken) — erst am Ende schließen.
    const flat = organizePlan.flatMap((a) => a.photos.map((ph) => ({ ph, target: `alben/${a.folder}` })));
    if (!flat.length || bulkBusy) return;
    setBulkBusy(true);
    let okN = 0; let refsN = 0; let lastErr = ''; let warn = '';
    for (let i = 0; i < flat.length; i++) {
      setProgress(`Ordne ${i + 1}/${flat.length} …`);
      const r = await moveInCloud(flat[i].ph, flat[i].target);
      if (r.ok && r.newPath) {
        const np = r.newPath;
        setFresh((prev) => [{ path: np, url: np }, ...prev.filter((x) => x.path !== np)]);
        okN++; refsN += r.refs || 0;
        if (r.error) warn = r.error; else setGone((g) => new Set(g).add(flat[i].ph));
      } else { lastErr = r.error || 'Ordnen fehlgeschlagen'; break; }
    }
    setBulkBusy(false); setProgress(''); setOrganizeOpen(false);
    if (okN) showToast(`${okN} nach Alben geordnet${refsN ? ` · ${refsN} Verweise angepasst` : ''}`, 'success');
    if (warn) showToast(warn, 'error');
    if (lastErr) showToast(lastErr, 'error');
  }

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

  // gemeinsame Drag-Props einer Datei (Kachel & Zeile).
  const dragProps = (p: string, isPicked: boolean) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { const payload = isPicked && picked.size > 0 ? Array.from(picked) : [p]; dragRef.current = payload; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', payload.join('\n')); } catch (err) { /* egal */ } },
    onDragEnd: () => { dragRef.current = []; setDropTarget(null); },
  });

  const fileTile = (p: string, idx: number) => {
    const isPicked = picked.has(p);
    return (
      <button key={p} type="button" data-path={p}
        className={`ww-mm-file${sel === p ? ' is-sel' : ''}${isPicked ? ' is-picked' : ''}`}
        onClick={(e) => onItemClick(e, p, idx)}
        onDoubleClick={(e) => { e.preventDefault(); setSel(p); setLbOpen(true); }}
        {...dragProps(p, isPicked)}
        onContextMenu={(e) => { e.preventDefault(); if (!selMode) { setSel(p); setAssignFor(p); } }}
        title={`${relOf(p)}\n(Doppelklick: groß · Shift/Strg-Klick: mehrfach · auf einen Ordner ziehen: verschieben)`}>
        {selMode ? <span className={`ww-mm-check${isPicked ? ' is-on' : ''}`} aria-hidden="true">{isPicked ? '✓' : ''}</span> : null}
        {!selMode ? (
          <span className="ww-mm-tiledel" role="button" tabIndex={-1} aria-label="Löschen" title="Löschen"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); closePreview(); setDel(p); }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
            </svg>
          </span>
        ) : null}
        <img src={previewOf(p)} alt="" loading="lazy" draggable={false} />
        <span className="ww-mm-fname">{baseOf(p)}</span>
      </button>
    );
  };

  const fileRow = (p: string, idx: number) => {
    const isPicked = picked.has(p);
    return (
      <div key={p} data-path={p} role="button" tabIndex={0}
        className={`ww-mm-row${sel === p ? ' is-sel' : ''}${isPicked ? ' is-picked' : ''}`}
        onClick={(e) => onItemClick(e, p, idx)}
        onDoubleClick={(e) => { e.preventDefault(); setSel(p); setLbOpen(true); }}
        {...dragProps(p, isPicked)}
        onContextMenu={(e) => { e.preventDefault(); if (!selMode) { setSel(p); setAssignFor(p); } }}
        title={relOf(p)}>
        {selMode ? <span className={`ww-mm-check-row${isPicked ? ' is-on' : ''}`} aria-hidden="true">{isPicked ? '✓' : ''}</span> : null}
        <img className="ww-mm-row-thumb" src={previewOf(p)} alt="" loading="lazy" draggable={false} />
        <span className="ww-mm-row-name">{baseOf(p)}</span>
        <span className="ww-mm-row-meta ww-mm-row-cam">{meta[p]?.camera || '—'}</span>
        <span className="ww-mm-row-meta ww-mm-row-type">{extOf(p) || '—'}</span>
        <span className="ww-mm-row-meta ww-mm-row-size">{fmtSize(meta[p]?.size)}</span>
        <span className="ww-mm-row-meta ww-mm-row-date">{fmtDate(meta[p]?.added)}</span>
        {!selMode ? (
          <span className="ww-mm-rowdel" role="button" tabIndex={-1} aria-label="Löschen" title="Löschen"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); closePreview(); setDel(p); }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
            </svg>
          </span>
        ) : null}
      </div>
    );
  };

  const folderTile = (d: string) => {
    const dPath = folder ? `${folder}/${d}` : d;
    return (
      <button key={'d:' + d} type="button" className={`ww-mm-folder${dropTarget === dPath ? ' is-drop' : ''}`} onClick={() => { closePreview(); setFolder(dPath); }} title={d} {...folderDropProps(dPath)}>
        <span className="ww-mm-foldericon" aria-hidden="true">📁</span>
        <span className="ww-mm-fname">{d}</span>
      </button>
    );
  };
  const folderRow = (d: string) => {
    const dPath = folder ? `${folder}/${d}` : d;
    return (
      <div key={'d:' + d} role="button" tabIndex={0} className={`ww-mm-row ww-mm-row-folder${dropTarget === dPath ? ' is-drop' : ''}`} onClick={() => { closePreview(); setFolder(dPath); }} title={d} {...folderDropProps(dPath)}>
        <span className="ww-mm-row-thumb ww-mm-row-foldericon" aria-hidden="true">📁</span>
        <span className="ww-mm-row-name">{d}</span>
        <span className="ww-mm-row-meta ww-mm-row-cam" />
        <span className="ww-mm-row-meta ww-mm-row-type">Ordner</span>
        <span className="ww-mm-row-meta ww-mm-row-size" /><span className="ww-mm-row-meta ww-mm-row-date" />
      </div>
    );
  };

  const emptyNote = <p className="ww-mm-empty">{searching ? `Keine Treffer für „${search}".` : 'Dieser Ordner ist leer. Zieh Bilder hierher oder nutze „Hochladen".'}</p>;

  // Vorschau-Inhalt (für Lightbox UND Details-Leiste): Bild + Infos + Aktionen.
  const previewInfo = (p: string) => (
    <>
      <div className="ww-mm-lb-name">{baseOf(p)}</div>
      <div className="ww-mm-lb-path">{p}</div>
      <div className="ww-mm-lb-facts">
        <span>{fmtSize(meta[p]?.size)}</span><span>·</span><span>{extOf(p).toUpperCase() || '—'}</span><span>·</span><span>{fmtDate(meta[p]?.added)}</span>
        {meta[p]?.camera ? <><span>·</span><span className="ww-mm-fact-cam">📷 {meta[p]!.camera}</span></> : null}
        {views[baseOf(p)] ? <><span>·</span><span className="ww-mm-fact-views">👁 {views[baseOf(p)]}×</span></> : null}
      </div>
      {(() => { const ex = meta[p]?.exif; if (!ex) return null; return (
        <dl className="ww-mm-exif">
          {ex.aperture ? <><dt>Blende</dt><dd>{ex.aperture}</dd></> : null}
          {ex.shutter ? <><dt>Belichtung</dt><dd>{ex.shutter}</dd></> : null}
          {ex.iso ? <><dt>ISO</dt><dd>{ex.iso.replace(/^ISO /, '')}</dd></> : null}
          {ex.focal ? <><dt>Brennweite</dt><dd>{ex.focal}</dd></> : null}
          {ex.taken ? <><dt>Aufnahme</dt><dd>{ex.taken}</dd></> : null}
          {ex.lens ? <><dt>Objektiv</dt><dd>{ex.lens}</dd></> : null}
        </dl>
      ); })()}
      <div className="ww-mm-usage">
        <div className="ww-mm-usage-title">Verwendet in</div>
        {usage.loading ? <div className="ww-mm-usage-note">wird geprüft …</div>
          : usage.err ? <div className="ww-mm-usage-err">{usage.err}</div>
          : usage.items && usage.items.length ? (
            <ul className="ww-mm-usage-list">
              {usage.items.map((u, i) => (
                <li key={i}>
                  <span className="ww-mm-usage-coll">{COLL_LABEL[u.collection] || u.collection}</span>
                  {u.label && u.label !== u.filename ? <> {u.label}</> : null}
                </li>
              ))}
            </ul>
          ) : <div className="ww-mm-usage-note ww-mm-usage-free">Unbenutzt — wird nirgends verwendet.</div>}
      </div>
      <div className="ww-mm-detail-actions">
        <button type="button" className="btn" onClick={() => setAssignFor(p)}>Einem Inhalt zuweisen</button>
        <a className="btn ghost" href={p} target="_blank" rel="noopener">Original öffnen</a>
        <button type="button" className="btn ww-mm-delbtn" onClick={() => setDel(p)} disabled={busy}>Löschen</button>
      </div>
    </>
  );

  // Klick auf eine Spaltenüberschrift: nach dieser Spalte sortieren; erneuter Klick dreht die Richtung.
  const setSort = (k: SortKey) => { if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortKey(k); setSortDir('asc'); } };
  const headCell = (k: SortKey, label: string, cls: string) => (
    <span className={`${cls} ww-mm-th${sortKey === k ? ' is-on' : ''}`} role="button" tabIndex={0}
      onClick={() => setSort(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSort(k); } }}
      title="Nach dieser Spalte sortieren">
      {label}{sortKey === k ? <span className="ww-mm-th-arr">{sortDir === 'asc' ? '↑' : '↓'}</span> : null}
    </span>
  );

  return (
    <div className="ww-mm">
      <div className="page-title ww-mm-head">
        <div className="kicker">Medien</div>
        <h1>Medien-Manager</h1>
        <p>Bilder durchsuchen, ordnen, hochladen und löschen — direkt im Repo, ohne GitHub.</p>
      </div>

      <div className="ww-mm-crumbs">
        <button type="button" onClick={() => { closePreview(); setFolder(''); }} className={folder ? '' : 'is-here'}>uploads</button>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}><span className="sep">/</span>
            <button type="button" onClick={() => goTo(i)} className={i === crumbs.length - 1 ? 'is-here' : ''}>{c}</button>
          </React.Fragment>
        ))}
      </div>

      <div className="ww-mm-body" ref={bodyRef}>
      <aside className="ww-mm-tree" aria-label="Ordner">
        <div className="ww-mm-tree-head">Ordner</div>
        <button type="button" className={`ww-mm-treeitem${folder === '' ? ' is-here' : ''}${dropTarget === '' ? ' is-drop' : ''}`} onClick={() => { closePreview(); setFolder(''); }} title="uploads" {...folderDropProps('')}>
          <span className="ww-mm-treeicon" aria-hidden="true">🗂️</span> uploads
        </button>
        {folderList.map((f) => (
          <button key={f} type="button" className={`ww-mm-treeitem${folder === f ? ' is-here' : ''}${dropTarget === f ? ' is-drop' : ''}`}
            style={{ paddingLeft: `${12 + f.split('/').length * 15}px` }}
            onClick={() => { closePreview(); setFolder(f); }} title={f} {...folderDropProps(f)}>
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
        <button type="button" className="ww-mm-tree-organize" onClick={openOrganize} disabled={bulkBusy || albumsLoading} title="Fotos jedes Albums in alben/<slug>/ einsortieren">
          {albumsLoading ? <><span className="ww-spinner" />Lade Alben …</> : <>🗃️ Nach Alben ordnen{organizeCount ? ` (${organizeCount})` : ''}</>}
        </button>
      </aside>

      <div className="ww-mm-main">
      <div className="ww-mm-toolbar">
        <input type="search" className="ww-mm-search" placeholder="Dateiname suchen (ordnerübergreifend) …" value={search} onChange={(e) => setSearch(e.target.value)} />
        {/* Ansicht */}
        <div className="ww-mm-viewtoggle" role="group" aria-label="Ansicht">
          <button type="button" className={view === 'grid' ? 'is-on' : ''} onClick={() => setView('grid')} title="Kacheln" aria-label="Kacheln">▦</button>
          <button type="button" className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')} title="Liste" aria-label="Liste">≣</button>
          <button type="button" className={view === 'details' ? 'is-on' : ''} onClick={() => setView('details')} title="Details mit Vorschau" aria-label="Details">◫</button>
        </div>
        {/* Sortierung */}
        <select className="ww-mm-sortsel" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} title="Sortieren nach">
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABEL[k]}{k === 'unused' && usedLoading ? ' …' : ''}</option>)}
        </select>
        <button type="button" className="ww-mm-sortdir" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} title="Richtung umschalten" aria-label="Sortierrichtung">
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
        <button type="button" className={`ww-mm-selmode${selMode ? ' is-active' : ''}`} onClick={() => (selMode ? exitSel() : setSelMode(true))}>
          {selMode ? 'Auswahl beenden' : 'Auswählen'}
        </button>
        <button type="button" className={`btn ww-mm-upload${busy ? ' is-busy' : ''}`} onClick={() => { setUpDest('current'); setUpNew(''); setUploadOpen(true); }} disabled={busy}>
          {busy ? <><span className="ww-spinner" />{progress || 'Arbeite …'}</> : '+ Hochladen'}
        </button>
      </div>

      {loadErr ? <p className="ww-mm-err">Mediathek nicht ladbar: {loadErr}</p> : null}

      {/* Inhalt: Kacheln/Liste im Drop-Feld; in der Details-Ansicht liegt die Vorschau-Leiste DANEBEN
          (außerhalb des Drop-Felds) und der Block hat feste Höhe -> Liste scrollt intern, Vorschau bleibt. */}
      <div className={`ww-mm-viewport ww-mm-viewport--${view}`}>
        <div
          className={`ww-mm-content ww-mm-content--${view}${dragOver ? ' is-drag' : ''}`}
          onMouseDown={onGridMouseDown}
          onClick={(e) => { if (marqueeMovedRef.current) { marqueeMovedRef.current = false; return; } const el = e.target as HTMLElement; if (el.closest('.ww-mm-file, .ww-mm-folder, .ww-mm-row, button, a, input, select')) return; if (picked.size) setPicked(new Set()); }}
          onDragOver={(e) => { if (dragRef.current.length) return; e.preventDefault(); if (!busy) setDragOver(true); }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
          onDrop={(e) => { if (dragRef.current.length) return; e.preventDefault(); setDragOver(false); if (!busy) handleFiles(e.dataTransfer.files, quickTarget); }}
        >
          {view === 'grid' ? (
            <div className="ww-mm-grid">
              {!searching && allSubdirs.map((d) => folderTile(d))}
              {visible.map((p, i) => fileTile(p, i))}
              {(!allSubdirs.length || searching) && !visible.length ? emptyNote : null}
            </div>
          ) : (
            <div className="ww-mm-list">
              <div className="ww-mm-row ww-mm-row-head">
                <span className="ww-mm-row-thumb" />
                {headCell('name', 'Name', 'ww-mm-row-name')}
                {headCell('camera', 'Kamera', 'ww-mm-row-meta ww-mm-row-cam')}
                {headCell('type', 'Typ', 'ww-mm-row-meta ww-mm-row-type')}
                {headCell('size', 'Größe', 'ww-mm-row-meta ww-mm-row-size')}
                {headCell('date', 'Hochgeladen', 'ww-mm-row-meta ww-mm-row-date')}
              </div>
              {!searching && allSubdirs.map((d) => folderRow(d))}
              {visible.map((p, i) => fileRow(p, i))}
              {(!allSubdirs.length || searching) && !visible.length ? emptyNote : null}
            </div>
          )}
          {dragOver ? <div className="ww-mm-dropnote">Loslassen zum Hochladen → {quickTarget}/</div> : null}
        </div>
        {view === 'details' ? (
          <div className="ww-mm-details-pane">
            {sel ? (
              <>
                <div className="ww-mm-details-imgwrap"><img src={previewOf(sel)} alt={baseOf(sel)} /></div>
                <div className="ww-mm-lb-info">{previewInfo(sel)}</div>
              </>
            ) : <div className="ww-mm-details-hint">Ein Bild links wählen für die Vorschau.</div>}
          </div>
        ) : null}
      </div>
      </div>{/* .ww-mm-main */}
      </div>{/* .ww-mm-body */}

      {/* Lightbox (Kacheln/Liste) */}
      {lbOpen && sel ? (
        <div className="ww-mm-lb" role="dialog" aria-modal="true" aria-label="Bild-Ansicht" onClick={() => setLbOpen(false)}>
          <button type="button" className="ww-mm-lb-close" onClick={() => setLbOpen(false)} aria-label="Schließen">✕</button>
          {visible.length > 1 ? <button type="button" className="ww-mm-lb-nav prev" onClick={(e) => { e.stopPropagation(); navSel(-1); }} aria-label="Vorheriges">‹</button> : null}
          <div className="ww-mm-lb-stage" onClick={(e) => e.stopPropagation()}>
            <div className="ww-mm-lb-imgwrap"><img src={previewOf(sel)} alt={baseOf(sel)} /></div>
            <div className="ww-mm-lb-info">{previewInfo(sel)}</div>
          </div>
          {visible.length > 1 ? <button type="button" className="ww-mm-lb-nav next" onClick={(e) => { e.stopPropagation(); navSel(1); }} aria-label="Nächstes">›</button> : null}
        </div>
      ) : null}

      {/* Lösch-Nachfrage */}
      {del ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setDel(null); }}>
          <div className="ww-dt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bild löschen?</h3>
            <p className="ww-dt-note">„{baseOf(del)}" wird dauerhaft aus dem Repo entfernt. Falls es noch irgendwo verwendet wird, bricht dort das Bild.</p>
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
                <p className="ww-dt-note">Dieses Feld hat bereits ein Bild (<code>{baseOf(aConfirm)}</code>). Ersetzen?</p>
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

      {/* Fixe Auswahl-Leiste */}
      {selMode ? (
        <div className="ww-bulkbar ww-mm-bulkbar" role="region" aria-label="Auswahl-Aktionen">
          <span className="ww-bulkbar-count">{picked.size} ausgewählt</span>
          <button type="button" className="ww-mm-selall" onClick={() => setPicked(new Set(visible))} disabled={bulkBusy}>Alle im Ordner</button>
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

      {/* Verschieben-Modal */}
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

      {/* „Nach Alben ordnen"-Vorschau */}
      {organizeOpen ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!bulkBusy) setOrganizeOpen(false); }}>
          <div className="ww-dt-modal ww-mm-organize" onClick={(e) => e.stopPropagation()}>
            <h3>Nach Alben ordnen</h3>
            {bulkBusy ? (
              <div className="ww-mm-org-run">
                <div className="ww-mm-org-bar"><div style={{ width: `${orgPct}%` }} /></div>
                <p className="ww-dt-note ww-mm-org-status"><span className="ww-spinner" />{progress || 'Ordne …'} · Referenzen ziehen automatisch mit</p>
              </div>
            ) : organizeCount === 0 ? (
              <p className="ww-dt-note">Alles bereits einsortiert — es gibt nichts zu verschieben. (Portfolio/Alben ist der Master; Storys &amp; Reisen verweisen auf dieselben Bilder und werden automatisch mitgezogen. Journal bleibt außen vor.)</p>
            ) : (
              <>
                <p className="ww-dt-note">Fotos jedes Albums werden nach <code>alben/&lt;Album-Name&gt;/</code> verschoben — Referenzen in Storys &amp; Reisen ziehen automatisch mit. Nur bereits vorhandene, noch nicht einsortierte Bilder:</p>
                <ul className="ww-mm-organize-list">
                  {organizePlan.map((a) => <li key={a.slug}><strong>{a.name}</strong> <span>→ alben/{a.folder}/</span> <em>{a.photos.length}</em></li>)}
                </ul>
              </>
            )}
            {!bulkBusy ? (
              <div className="ww-dt-actions">
                {organizeCount > 0 ? <button type="button" className="btn" onClick={doOrganize}>{`${organizeCount} verschieben`}</button> : null}
                <button type="button" className="ww-dt-cancel" onClick={() => setOrganizeOpen(false)}>{organizeCount > 0 ? 'Abbrechen' : 'Schließen'}</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Upload-Fenster (Drop-Feld + Zielwahl + neuer Ordner) */}
      {uploadOpen ? (
        <div className="ww-dt-overlay" role="dialog" aria-modal="true" onClick={() => { if (!busy) setUploadOpen(false); }}>
          <div className="ww-dt-modal ww-mm-uploadmodal" onClick={(e) => e.stopPropagation()}>
            <h3>Bilder hochladen</h3>
            <div className="ww-mm-up-dest">
              <label className={upDest === 'current' ? 'is-on' : ''}>
                <input type="radio" name="updest" checked={upDest === 'current'} onChange={() => setUpDest('current')} disabled={busy} />
                <span>Aktueller Ordner (<code>{quickTarget}/</code>)</span>
              </label>
              <label className={upDest === 'album' ? 'is-on' : ''}>
                <input type="radio" name="updest" checked={upDest === 'album'} onChange={() => setUpDest('album')} disabled={busy || !(albums && albums.length)} />
                <span>Album</span>
                <select value={upAlbum} onChange={(e) => { setUpAlbum(e.target.value); setUpDest('album'); }} disabled={busy || !(albums && albums.length)}>
                  <option value="">— wählen —</option>
                  {(albums || []).map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                </select>
              </label>
              <label className={upDest === 'new' ? 'is-on' : ''}>
                <input type="radio" name="updest" checked={upDest === 'new'} onChange={() => setUpDest('new')} disabled={busy} />
                <span>Neuer Ordner</span>
                <input type="text" placeholder={`z. B. tiere${folder ? ` (in ${folder}/)` : ''}`} value={upNew} onChange={(e) => { setUpNew(e.target.value); setUpDest('new'); }} disabled={busy} />
              </label>
            </div>
            <div className="ww-mm-up-target">Ziel: <code>uploads/{uploadModalTarget()}/</code></div>
            <label className={`ww-mm-up-drop${busy ? ' is-busy' : ''}`}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (!busy) handleFiles(e.dataTransfer.files, uploadModalTarget()); }}>
              <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files, uploadModalTarget())} hidden />
              {busy ? <><span className="ww-spinner" />{progress || 'Arbeite …'}</>
                : <><strong>Bilder hierher ziehen</strong><span>oder klicken zum Auswählen · werden automatisch zu WebP optimiert (Kamera-Info bleibt erhalten)</span></>}
            </label>
            <div className="ww-dt-actions">
              <button type="button" className="ww-dt-cancel" onClick={() => setUploadOpen(false)} disabled={busy}>Schließen</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Gummiband-Rechteck */}
      {marquee ? <div className="ww-mm-marquee" style={{ left: marquee.x0, top: marquee.y0, width: marquee.x1 - marquee.x0, height: marquee.y1 - marquee.y0 }} /> : null}
    </div>
  );
}
