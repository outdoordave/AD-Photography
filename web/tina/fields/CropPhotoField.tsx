import React from 'react';
import { useCMS, wrapFieldsWithMeta } from 'tinacms';
import { detectEncoder, toOptimized, loadImage, type EncoderMode } from './webpEncode';
import { toLocalMedia, dedupeUploads } from './mediaPath';
import { MediaPickerButton } from './MediaPicker';

// Zuschnitt-Foto-Feld: EIN gerahmtes Bild mit Zoom + Verschieben. Wert = String-JSON
// { original, crop }:
//  - original = volles WebP-Bild (beim Upload Auto-WebP @2400px), bleibt erhalten,
//  - crop     = {x,y,w,h} (Bruchteile des Originals).
// „Übernehmen" speichert NUR den crop-Rahmen (kein neues Bild, kein Upload) -> sofort,
// nie „?"/Warten. Die Besucherseite schneidet das Original per CSS zu (photoFrame in
// lib/trips). Seitenverhältnis aus field.cropRatio (Default 4/3). Touch: Ziehen =
// verschieben, Pinch/Regler = zoomen.

type CropRect = { x: number; y: number; w: number; h: number };
type Parsed = { original: string; display: string; crop: CropRect | null };

// Wert ist jetzt ein STRING-Feld (nicht mehr Objekt -> nicht navigierbar -> Editor
// rendert immer inline). Inhalt: JSON-Blob {original,display,crop} ODER (alt) ein
// reiner /uploads-Pfad ODER (Slice-1/2-Migration) ein Objekt. Alles abgefangen.
function parseVal(v: any): Parsed {
  if (!v) return { original: '', display: '', crop: null };
  if (typeof v === 'object') { // alte Objekt-Daten
    let c: CropRect | null = null;
    try { c = v.crop ? (typeof v.crop === 'string' ? JSON.parse(v.crop) : v.crop) : null; } catch { c = null; }
    return { original: v.original || '', display: v.display || v.original || '', crop: c };
  }
  const s = String(v).trim();
  if (s.charAt(0) === '{') {
    try {
      const o = JSON.parse(s);
      return { original: o.original || '', display: o.display || o.original || '', crop: o.crop || null };
    } catch { /* faellt auf Pfad zurueck */ }
  }
  return { original: s, display: s, crop: null }; // reiner Pfad (Alt-Bestand)
}

// Serialisieren: leeres Original -> '' (Feld leer), sonst kompakter JSON-Blob.
function serialize(p: { original: string; display: string; crop: CropRect | null }): string {
  if (!p.original) return '';
  return JSON.stringify({ original: p.original, display: p.display || p.original, crop: p.crop || null });
}

const CropPhotoFieldInner = wrapFieldsWithMeta(({ input, field }: any) => {
  const cms = useCMS();
  const rawRatio = field?.cropRatio ?? field?.ui?.cropRatio;
  const ratio: number = (typeof rawRatio === 'number' && rawRatio > 0) ? rawRatio : 4 / 3;
  const val = parseVal(input.value);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');

  // Editor-Transform: scale (relativ zu „cover", >=1), Pan tx/ty (px, <=0).
  const [scale, setScale] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [frameW, setFrameW] = React.useState(260);
  const [nat, setNat] = React.useState<{ w: number; h: number } | null>(null);

  const frameRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const dragRef = React.useRef<{ id: number; sx: number; sy: number; tx: number; ty: number } | null>(null);
  const pinchRef = React.useRef<{ d: number; scale: number } | null>(null);
  const pointers = React.useRef<Map<number, { x: number; y: number }>>(new Map());

  const fh = Math.round(frameW / ratio);

  React.useEffect(() => { let a = true; detectEncoder().then((m) => a && setEncoder(m)); return () => { a = false; }; }, []);

  // Rahmenbreite messen (Tina-Sidebar ist schmal).
  React.useEffect(() => {
    const el = frameRef.current; if (!el) return;
    const measure = () => setFrameW(Math.max(160, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [val.original]);

  // Original laden -> Naturmaße. Dann Transform aus gespeichertem Crop (oder cover) setzen.
  React.useEffect(() => {
    const src = val.original ? toLocalMedia(val.original) : '';
    if (!src) { setNat(null); return; }
    let alive = true;
    loadImage(src).then((img) => {
      if (!alive) return;
      imgRef.current = img;
      const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      setNat({ w, h });
    }).catch(() => alive && setError('Original konnte nicht geladen werden'));
    return () => { alive = false; };
  }, [val.original]);

  const baseScale = nat ? Math.max(frameW / nat.w, fh / nat.h) : 1; // cover

  // Transform aus Crop (oder Vollbild) initialisieren, sobald Maße bekannt.
  React.useEffect(() => {
    if (!nat) return;
    if (val.crop) {
      const sc = (frameW / (val.crop.w * nat.w)) / baseScale; // relativer Zoom
      const s = Math.max(1, sc);
      const dispScale = baseScale * s;
      setScale(s);
      setTx(-val.crop.x * nat.w * dispScale);
      setTy(-val.crop.y * nat.h * dispScale);
    } else {
      // Vollbild cover, zentriert.
      setScale(1);
      const dw = nat.w * baseScale, dh = nat.h * baseScale;
      setTx((frameW - dw) / 2);
      setTy((fh - dh) / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nat, frameW]);

  function clampPan(nx: number, ny: number, s = scale) {
    if (!nat) return { x: nx, y: ny };
    const dw = nat.w * baseScale * s, dh = nat.h * baseScale * s;
    const minX = frameW - dw, minY = fh - dh;
    return { x: Math.min(0, Math.max(minX, nx)), y: Math.min(0, Math.max(minY, ny)) };
  }

  function applyZoom(nextS: number, centerX: number, centerY: number) {
    if (!nat) return;
    const s = Math.min(6, Math.max(1, nextS));
    // Punkt unter dem Finger/Cursor stabil halten.
    const k = (baseScale * s) / (baseScale * scale);
    const nx = centerX - (centerX - tx) * k;
    const ny = centerY - (centerY - ty) * k;
    const c = clampPan(nx, ny, s);
    setScale(s); setTx(c.x); setTy(c.y);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!nat) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = { d: Math.hypot(a.x - b.x, a.y - b.y), scale };
      dragRef.current = null;
    } else {
      dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, tx, ty };
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = frameRef.current!.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - rect.left, cy = (a.y + b.y) / 2 - rect.top;
      applyZoom(pinchRef.current.scale * (d / pinchRef.current.d), cx, cy);
    } else if (dragRef.current && dragRef.current.id === e.pointerId) {
      const dx = e.clientX - dragRef.current.sx, dy = e.clientY - dragRef.current.sy;
      const c = clampPan(dragRef.current.tx + dx, dragRef.current.ty + dy);
      setTx(c.x); setTy(c.y);
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (dragRef.current && dragRef.current.id === e.pointerId) dragRef.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    if (!nat) return;
    const rect = frameRef.current!.getBoundingClientRect();
    applyZoom(scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - rect.left, e.clientY - rect.top);
  }

  function currentCrop(): CropRect | null {
    if (!nat) return null;
    const dispScale = baseScale * scale;
    const srcX = -tx / dispScale, srcY = -ty / dispScale;
    const srcW = frameW / dispScale, srcH = fh / dispScale;
    return { x: srcX / nat.w, y: srcY / nat.h, w: srcW / nat.w, h: srcH / nat.h };
  }

  async function uploadOriginal(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const mode = encoder === 'checking' ? await detectEncoder() : encoder;
    setBusy(true); setError(''); setProgress('Konvertiere …');
    try {
      const { file } = await toOptimized(files[0], mode);
      setProgress('Lade hoch …');
      const media = await cms.media.persist([{ directory: '', file }]);
      const src = media.map((m: any) => dedupeUploads(m.src)).filter(Boolean)[0];
      if (!src) throw new Error('Upload ohne Ergebnis');
      input.onChange(serialize({ original: src, display: src, crop: null })); // erstmal unbeschnitten
    } catch (e: any) { setError(e?.message || 'Upload fehlgeschlagen'); }
    finally { setBusy(false); setProgress(''); }
  }

  // Speichert NUR den crop-Rahmen (kein neues Bild, kein Upload) -> sofort. Die
  // Besucherseite schneidet das Original per CSS zu (photoFrame). Kein „?"/Warten.
  function applyCrop() {
    const crop = currentCrop();
    if (!crop) return;
    setError('');
    input.onChange(serialize({ original: val.original, display: val.original, crop }));
  }

  function resetCrop() { input.onChange(serialize({ original: val.original, display: val.original, crop: null })); }
  function remove() { input.onChange(''); }

  const hasCrop = !!val.crop;

  return (
    <div>
      {val.original ? (
        <>
          <div
            ref={frameRef}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{ position: 'relative', width: '100%', height: fh, borderRadius: 8, overflow: 'hidden', border: '1px solid #d8cab2', background: '#1c1812', touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
          >
            {nat ? (
              <img
                src={toLocalMedia(val.original)} alt="" draggable={false}
                onError={() => setError('Bild lädt nicht (Pfad/Original prüfen)')}
                style={{ position: 'absolute', left: 0, top: 0, width: nat.w * baseScale * scale, height: nat.h * baseScale * scale, maxWidth: 'none', maxHeight: 'none', transform: `translate(${tx}px, ${ty}px)`, transformOrigin: '0 0', pointerEvents: 'none' }}
              />
            ) : <div style={{ color: '#cbb', fontSize: 12, padding: 12 }}>lädt …</div>}
            {/* Raster-Hilfslinien */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)', backgroundSize: `${100 / 3}% ${100 / 3}%` }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#6e5e49' }}>Zoom</span>
            <input type="range" min={1} max={6} step={0.01} value={scale} disabled={!nat || busy}
              onChange={(e) => { const rect = frameRef.current!.getBoundingClientRect(); applyZoom(parseFloat(e.target.value), rect.width / 2, rect.height / 2); }}
              style={{ flex: 1 }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={applyCrop} disabled={busy} style={btnStyle(busy, true)}>Zuschnitt übernehmen</button>
            {hasCrop ? <button type="button" onClick={resetCrop} disabled={busy} style={btnStyle(busy)}>Zuschnitt zurücksetzen</button> : null}
            <label style={btnStyle(busy)}>Bild ersetzen<input type="file" accept="image/*" disabled={busy} onChange={(e) => uploadOriginal(e.target.files)} style={{ display: 'none' }} /></label>
            <MediaPickerButton disabled={busy} onPick={(p) => input.onChange(serialize({ original: p, display: p, crop: null }))} />
            <button type="button" onClick={remove} disabled={busy} style={btnStyle(busy)}>Entfernen</button>
          </div>
          <div style={{ fontSize: 12, color: '#6e5e49', marginTop: 6 }}>
            Ziehen = verschieben · Pinch/Regler = zoomen. „Übernehmen" speichert den Zuschnitt (Original bleibt). {hasCrop ? '✓ zugeschnitten' : 'aktuell: Vollbild'}
          </div>
        </>
      ) : (
        <div>
          <label style={{ ...dropStyle(busy) }}>
            {busy ? (progress || 'Arbeite …') : '+ Foto wählen'}
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => uploadOriginal(e.target.files)} style={{ display: 'none' }} />
          </label>
          <div style={{ marginTop: 8 }}>
            <MediaPickerButton disabled={busy} onPick={(p) => input.onChange(serialize({ original: p, display: p, crop: null }))} />
          </div>
        </div>
      )}

      {progress && val.original ? <div style={{ fontSize: 12, color: '#6e5e49', marginTop: 6 }}>{progress}</div> : null}
      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 8 }}>{error}</div> : null}
    </div>
  );
});

function btnStyle(busy: boolean, primary = false): React.CSSProperties {
  return { display: 'inline-block', padding: '7px 12px', borderRadius: 6, background: busy ? '#b9b1a4' : primary ? '#a7672f' : '#efe7da', color: primary ? '#fff' : '#3a2e22', border: primary ? 'none' : '1px solid #d8cab2', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer' };
}
function dropStyle(busy: boolean): React.CSSProperties {
  return { display: 'block', textAlign: 'center', padding: '20px 14px', border: '2px dashed #d8cab2', borderRadius: 8, background: '#faf6ef', color: '#6e5e49', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer' };
}

export default CropPhotoFieldInner;
