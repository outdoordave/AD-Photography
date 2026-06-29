import React from 'react';
import { createPortal } from 'react-dom';
import { toLocalMedia } from './mediaPath';
import { listFreshMedia } from '../../src/lib/freshMedia';

// Gemeinsamer „Aus Mediathek wählen"-Picker für die Foto-Felder. Zeigt ein Raster ALLER
// vorhandenen /uploads-Bilder (public/uploads-manifest.json, beim Build erzeugt) -> Klick
// wählt ein vorhandenes Bild OHNE erneuten Upload (keine Doppel-Uploads).
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
  const [fresh, setFresh] = React.useState<Array<{ path: string; dataUrl: string }>>([]);
  const [err, setErr] = React.useState('');

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
    }
  }
  function pick(p: string) { onPick(p); if (!multi) setOpen(false); }

  // Modal an document.body portalen, damit es nicht im Stacking-Context der aufrufenden
  // Komponente gefangen ist (z. B. die `.ww-swap-overlay` auf z-index 4 in der CMS-Vorschau —
  // sonst läge das Modal UNTER der Wander-Titel-Leiste und die weiße Box wäre unsichtbar).
  const modal = open ? (
    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(28,24,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 'min(880px, 96vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 18px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #ece5d9' }}>
              <strong style={{ fontSize: 15, color: '#2a2218' }}>Mediathek — vorhandenes Bild wählen{multi ? ' (mehrere möglich)' : ''}</strong>
              <button type="button" onClick={() => setOpen(false)} style={{ border: 'none', background: '#efe7d9', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}>{multi ? 'Fertig' : 'Schließen'} ✕</button>
            </div>
            <div style={{ padding: 14, overflowY: 'auto' }}>
              {(() => {
                const freshPaths = new Set(fresh.map((f) => f.path));
                // Frische Uploads (data:-URL) zuerst, dann das Build-Manifest ohne Dubletten.
                const items: Array<{ key: string; path: string; src: string; isFresh: boolean }> = [
                  ...fresh.map((f) => ({ key: 'f:' + f.path, path: f.path, src: f.dataUrl, isFresh: true })),
                  ...(media || []).filter((p) => !freshPaths.has(p)).map((p) => ({ key: p, path: p, src: toLocalMedia(p), isFresh: false })),
                ];
                if (err && !items.length) return <div style={{ color: '#b00', fontSize: 13 }}>Mediathek nicht ladbar: {err}</div>;
                if (media == null && !items.length) return <div style={{ color: '#6e5e49', fontSize: 13 }}>Lade Bilder …</div>;
                if (!items.length) return <div style={{ color: '#6e5e49', fontSize: 13 }}>Noch keine Bilder in /uploads.</div>;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                    {items.map((it) => {
                      const picked = already.indexOf(it.path) !== -1;
                      return (
                        <button key={it.key} type="button" onClick={() => pick(it.path)} title={(it.isFresh ? 'Gerade hochgeladen — ' : '') + it.path.replace('/uploads/', '')}
                          style={{ position: 'relative', padding: 0, border: picked ? '2px solid #a7672f' : it.isFresh ? '2px solid #2d6a4f' : '1px solid #e1ddd5', borderRadius: 8, overflow: 'hidden', background: '#f4ede1', cursor: 'pointer', aspectRatio: '4 / 3' }}>
                          <img src={it.src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: picked ? 0.55 : 1 }} />
                          {picked ? <span style={{ position: 'absolute', top: 4, right: 4, background: '#a7672f', color: '#fff', borderRadius: '50%', width: 20, height: 20, lineHeight: '20px', fontSize: 13, textAlign: 'center' }}>✓</span> : null}
                          {it.isFresh && !picked ? <span style={{ position: 'absolute', top: 4, left: 4, background: '#2d6a4f', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>NEU</span> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
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

function btn(disabled: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, background: disabled ? '#b9b1a4' : '#7a674e', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' };
}

export default MediaPickerButton;
