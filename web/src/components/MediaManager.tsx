import React from 'react';
import { loggedIn } from '../lib/tinaAdmin';
import { uploadToCloud, deleteFromCloud } from '../lib/mediaCloud';
import { showToast } from '../lib/tinaAdmin';
import { detectEncoder, toOptimized, type EncoderMode } from '../../tina/fields/webpEncode';

// Medien-Manager — eigenständige, login-geschützte Seite (/medien-manager) im Website-Look mit
// Finder/Explorer-Logik: Ordner (aus dem rekursiven uploads-manifest.json abgeleitet), Breadcrumbs,
// Kachel-Grid mit Thumbnails, ordnerübergreifende Namens-Suche, Drag&Drop- + Datei-Dialog-Upload
// (WebP via webpEncode -> Assets-Client in den AKTUELLEN Ordner), Löschen mit Nachfrage. „Verwendet in"
// (Nutzungs-Check) + Rechtsklick-Zuweisung folgen in eigenen Commits. Nur bei Login sichtbar.
// iPad-tauglich: Tap statt Klick, Datei-Dialog als vollwertige Alternative zu Drag&Drop.

type Fresh = { path: string; url: string };

function relOf(p: string): string { return p.replace(/^\/uploads\//, ''); }

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

  React.useEffect(() => { try { setShow(loggedIn()); } catch { setShow(false); } }, []);
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

  const fileTile = (p: string) => (
    <button key={p} type="button" className={`ww-mm-file${sel === p ? ' is-sel' : ''}`} onClick={() => setSel(p)} title={relOf(p)}>
      <img src={previewOf(p)} alt="" loading="lazy" />
      <span className="ww-mm-fname">{p.split('/').pop()}</span>
    </button>
  );

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
          <div className="ww-mm-detail-actions">
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
    </div>
  );
}
