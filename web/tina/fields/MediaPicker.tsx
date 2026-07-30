import React from 'react';
import { createPortal } from 'react-dom';
import { toLocalMedia } from './mediaPath';
import { listFreshMedia } from '../../src/lib/freshMedia';
import {
  viewOf, sortMedia, searchMedia, folderLabel, baseOf, relOf,
  SORT_LABEL, type MediaMeta, type MediaSortKey, type MediaSortDir,
} from '../../src/lib/mediaBrowse';

// Gemeinsamer „Aus Mediathek wählen"-Picker für die Foto-Felder. Zeigt ein Raster der
// vorhandenen /uploads-Bilder (public/uploads-manifest.json, beim Build erzeugt) -> Klick
// wählt ein vorhandenes Bild OHNE erneuten Upload (keine Doppel-Uploads).
// Geordnet WIE die Medien-Manager-Seite: Ordner-Navigation (Alben/Reisen/Journal …),
// Sortierung (Name/Datum/Kamera/Typ) und ordnerübergreifende Dateiname-Suche — gemeinsame
// Logik in src/lib/mediaBrowse.ts (kein Drift zum Manager).
//   onPick(path)  -> /uploads/<datei>
//   multi=false   -> schließt nach der Wahl; multi=true -> bleibt offen (mehrere wählen).
//   already       -> bereits gewählte Pfade (werden im Raster markiert).
export function MediaPickerButton({
  onPick, multi = false, label = '🖼️ Aus Mediathek', disabled = false, already = [], className,
}: {
  onPick: (path: string) => void;
  multi?: boolean;
  label?: string;
  disabled?: boolean;
  already?: string[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [media, setMedia] = React.useState<string[] | null>(null);
  const [meta, setMeta] = React.useState<MediaMeta>({});
  const [fresh, setFresh] = React.useState<Array<{ path: string; dataUrl: string }>>([]);
  const [err, setErr] = React.useState('');
  const [folder, setFolder] = React.useState('');
  const [sortKey, setSortKey] = React.useState<MediaSortKey>('name');
  const [sortDir, setSortDir] = React.useState<MediaSortDir>('asc');
  const [search, setSearch] = React.useState('');

  function openPicker() {
    setOpen(true);
    // Gerade hochgeladene (noch nicht deployte) Bilder oben anzeigen — stehen noch nicht im
    // Build-Manifest, sind aber über die Frisch-Upload-Brücke (localStorage) sofort verfügbar.
    setFresh(listFreshMedia());
    if (media == null && !err) {
      fetch('/uploads-manifest.json', { cache: 'no-store' })
        .then((r) => { if (!r.ok) throw new Error('Manifest ' + r.status); return r.json(); })
        .then((list: string[]) => setMedia(Array.isArray(list) ? list : []))
        .catch((e) => setErr(e?.message || 'Mediathek nicht ladbar'));
      // Meta (Datum/Kamera) für die Sortierung — additiv, Fehler egal.
      fetch('/uploads-meta.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : {})).then((m) => setMeta(m || {})).catch(() => {});
    }
  }
  function pick(p: string) { onPick(p); if (!multi) setOpen(false); }

  const searching = search.trim().length > 0;
  const all = media || [];
  const { subdirs, files } = searching ? { subdirs: [] as string[], files: [] as string[] } : viewOf(all, folder);
  const shownFiles = searching ? searchMedia(all, search) : sortMedia(files, meta, sortKey, sortDir);
  const crumbs = folder ? folder.split('/') : [];
  // Frische Uploads nur im Wurzelordner ohne Suche oben anpinnen (sie haben noch keinen Ordner).
  const freshItems = (!searching && !folder) ? fresh : [];
  const freshPaths = new Set(freshItems.map((f) => f.path));

  const modal = open ? (
    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(28,24,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 'min(920px, 96vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 18px 60px rgba(0,0,0,0.35)' }}>
        {/* Kopf */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #ece5d9' }}>
          <strong style={{ fontSize: 15, color: '#2a2218' }}>Mediathek — vorhandenes Bild wählen{multi ? ' (mehrere möglich)' : ''}</strong>
          <button type="button" onClick={() => setOpen(false)} style={{ border: 'none', background: '#efe7d9', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}>{multi ? 'Fertig' : 'Schließen'} ✕</button>
        </div>

        {/* Werkzeugleiste: Breadcrumb + Suche + Sortierung */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 16px', borderBottom: '1px solid #f0eadf', background: '#faf6ee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6e5e49', flex: '1 1 240px', minWidth: 0, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setFolder('')} style={crumbBtn(!folder)}>🖼️ Alle</button>
            {crumbs.map((seg, i) => (
              <React.Fragment key={i}>
                <span style={{ color: '#bcae98' }}>›</span>
                <button type="button" onClick={() => setFolder(crumbs.slice(0, i + 1).join('/'))} style={crumbBtn(i === crumbs.length - 1)}>{folderLabel(seg, i)}</button>
              </React.Fragment>
            ))}
          </div>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Dateiname suchen …"
            style={{ flex: '1 1 160px', minWidth: 0, padding: '7px 10px', border: '1px solid #ddd4c6', borderRadius: 6, fontSize: 13, background: '#fff' }}
          />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as MediaSortKey)} disabled={searching}
            title="Sortieren nach" style={{ padding: '7px 8px', border: '1px solid #ddd4c6', borderRadius: 6, fontSize: 13, background: '#fff', color: '#3a2f22' }}>
            {(Object.keys(SORT_LABEL) as MediaSortKey[]).map((k) => <option key={k} value={k}>{SORT_LABEL[k]}</option>)}
          </select>
          <button type="button" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} disabled={searching}
            title={sortDir === 'asc' ? 'Aufsteigend' : 'Absteigend'} style={{ padding: '7px 10px', border: '1px solid #ddd4c6', borderRadius: 6, background: '#fff', cursor: searching ? 'default' : 'pointer', fontWeight: 700, color: '#3a2f22', opacity: searching ? 0.5 : 1 }}>{sortDir === 'asc' ? '↑' : '↓'}</button>
        </div>

        {/* Inhalt */}
        <div style={{ padding: 14, overflowY: 'auto' }}>
          {err && !all.length ? <div style={{ color: '#b00', fontSize: 13 }}>Mediathek nicht ladbar: {err}</div> : null}
          {media == null && !all.length && !err ? <div style={{ color: '#6e5e49', fontSize: 13 }}>Lade Bilder …</div> : null}

          {/* Ordner (nicht bei Suche) */}
          {!searching && subdirs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: shownFiles.length || freshItems.length ? 16 : 0 }}>
              {subdirs.map((sub) => {
                const full = folder ? `${folder}/${sub}` : sub;
                return (
                  <button key={sub} type="button" onClick={() => { setFolder(full); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #e6ddcd', borderRadius: 8, background: '#fbf7ef', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#3a2f22', fontWeight: 600 }}>
                    <span style={{ fontSize: 18 }}>📁</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folderLabel(sub, folder ? 1 : 0)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {searching && !shownFiles.length ? <div style={{ color: '#6e5e49', fontSize: 13 }}>Kein Bild mit „{search.trim()}" gefunden.</div> : null}
          {!searching && !subdirs.length && !shownFiles.length && !freshItems.length && media != null ? <div style={{ color: '#6e5e49', fontSize: 13 }}>Dieser Ordner enthält keine Bilder.</div> : null}

          {/* Bilder-Raster: frische Uploads (nur Wurzel) zuerst, dann die Dateien */}
          {(freshItems.length || shownFiles.length) ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {freshItems.map((f) => {
                const picked = already.indexOf(f.path) !== -1;
                return (
                  <button key={'f:' + f.path} type="button" onClick={() => pick(f.path)} title={'Gerade hochgeladen — ' + relOf(f.path)}
                    style={tile(picked, true)}>
                    <img src={f.dataUrl} alt="" loading="lazy" style={tileImg(picked)} />
                    {picked ? <span style={badgePicked}>✓</span> : <span style={badgeFresh}>NEU</span>}
                  </button>
                );
              })}
              {shownFiles.filter((p) => !freshPaths.has(p)).map((p) => {
                const picked = already.indexOf(p) !== -1;
                return (
                  <button key={p} type="button" onClick={() => pick(p)} title={relOf(p)} style={tile(picked, false)}>
                    <img src={toLocalMedia(p)} alt="" loading="lazy" style={tileImg(picked)} />
                    {picked ? <span style={badgePicked}>✓</span> : null}
                    {searching ? <span style={folderTag}>{relOf(p).includes('/') ? relOf(p).slice(0, relOf(p).lastIndexOf('/')) : '—'}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button type="button" disabled={disabled} onClick={openPicker}
        className={className} style={className ? undefined : btn(disabled)}>{label}</button>
      {modal && typeof document !== 'undefined' ? createPortal(modal, document.body) : null}
    </>
  );
}

function crumbBtn(active: boolean): React.CSSProperties {
  return { border: 'none', background: active ? '#efe3cf' : 'transparent', color: active ? '#3a2f22' : '#6e5e49', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 600 };
}
function tile(picked: boolean, fresh: boolean): React.CSSProperties {
  return { position: 'relative', padding: 0, border: picked ? '2px solid #a7672f' : fresh ? '2px solid #2d6a4f' : '1px solid #e1ddd5', borderRadius: 8, overflow: 'hidden', background: '#f4ede1', cursor: 'pointer', aspectRatio: '4 / 3' };
}
function tileImg(picked: boolean): React.CSSProperties {
  return { width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: picked ? 0.55 : 1 };
}
const badgePicked: React.CSSProperties = { position: 'absolute', top: 4, right: 4, background: '#a7672f', color: '#fff', borderRadius: '50%', width: 20, height: 20, lineHeight: '20px', fontSize: 13, textAlign: 'center' };
const badgeFresh: React.CSSProperties = { position: 'absolute', top: 4, left: 4, background: '#2d6a4f', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 };
const folderTag: React.CSSProperties = { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(42,34,24,0.72)', color: '#fff', fontSize: 10, padding: '2px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function btn(disabled: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, background: disabled ? '#b9b1a4' : '#7a674e', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' };
}

export default MediaPickerButton;
