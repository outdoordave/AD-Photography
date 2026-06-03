import React from 'react';
import { useCMS, wrapFieldsWithMeta } from 'tinacms';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Eigenes Galerie-Feld fuer AD-Photography:
//  - mehrere Fotos auf einmal: Button, Drag-&-Drop-Ablage ODER ganzer Ordner,
//  - Auto-Verkleinern auf Breite <= 2400px + WebP @Q85 — exakt wie die Live-Seite
//    (admin/config.yml: format webp, quality 85, width 2400),
//  - WebP-Encoding via jSquash (WASM) -> funktioniert in JEDEM Browser inkl.
//    Safari, genau wie Sveltia es macht. Fallback nur, falls jSquash nicht laedt:
//    natives canvas-WebP -> sonst optimiertes JPEG (nie PNG).
//  - via cms.media.persist() git-basiert nach /uploads (directory:'').
//  - apple-like Sortieren (dnd-kit), Entfernen per ×, Groessen-Anzeige.

const MAX_WIDTH = 2400;
const WEBP_QUALITY = 85; // jSquash: 0..100
const CANVAS_WEBP_Q = 0.85;
const JPEG_Q = 0.82;
const TILE = 92;

type EncoderMode = 'checking' | 'jsquash' | 'native' | 'jpeg';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function fmt(bytes: number): string {
  return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
}
function toBlobAsync(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, q));
}

// jSquash-WebP-Encoder. Die WASM wird NICHT aus dem Tina-Bundle geladen (dort
// 404), sondern per locateFile direkt vom CDN (unpkg) — genau wie Sveltia jSquash
// laedt. Funktioniert dadurch in JEDEM Browser inkl. Safari.
const JSQUASH_VER = '1.5.0';
let webpMod: any = null;
let webpInitPromise: Promise<any> | null = null;
async function jsquashWebp(imageData: ImageData): Promise<Blob> {
  if (!webpMod) webpMod = await import('@jsquash/webp/encode');
  if (!webpInitPromise) {
    webpInitPromise = webpMod.init(undefined, {
      locateFile: (path: string) => `https://unpkg.com/@jsquash/webp@${JSQUASH_VER}/codec/enc/${path}`,
    });
  }
  await webpInitPromise;
  const buf: ArrayBuffer = await webpMod.default(imageData, { quality: WEBP_QUALITY });
  return new Blob([buf], { type: 'image/webp' });
}

// Selbsttest: kann jSquash hier WebP erzeugen? (Beweist, dass die WASM laedt.)
async function detectEncoder(): Promise<EncoderMode> {
  try {
    const id = new ImageData(2, 2);
    id.data.fill(200);
    const blob = await jsquashWebp(id);
    if (blob && blob.size > 0) return 'jsquash';
  } catch {
    /* faellt durch */
  }
  // native canvas-WebP?
  try {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    const b = await toBlobAsync(c, 'image/webp', CANVAS_WEBP_Q);
    if (b && b.type === 'image/webp') return 'native';
  } catch {
    /* faellt durch */
  }
  return 'jpeg';
}

// Ein File -> optimiertes File (WebP wo moeglich, sonst JPEG). Breite <= 2400.
async function toOptimized(file: File, mode: EncoderMode): Promise<{ file: File; format: 'webp' | 'jpeg' }> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > MAX_WIDTH) {
    const s = MAX_WIDTH / w;
    w = MAX_WIDTH;
    h = Math.round(h * s);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas-Context fehlt');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');

  // 1) jSquash-WebP (alle Browser inkl. Safari)
  if (mode === 'jsquash') {
    try {
      const imageData = ctx.getImageData(0, 0, w, h);
      const blob = await jsquashWebp(imageData);
      return { file: new File([blob], `${base}.webp`, { type: 'image/webp' }), format: 'webp' };
    } catch {
      /* faellt auf canvas/jpeg zurueck */
    }
  }
  // 2) Natives canvas-WebP
  if (mode !== 'jpeg') {
    const blob = await toBlobAsync(canvas, 'image/webp', CANVAS_WEBP_Q);
    if (blob && blob.type === 'image/webp') {
      return { file: new File([blob], `${base}.webp`, { type: 'image/webp' }), format: 'webp' };
    }
  }
  // 3) JPEG-Fallback (klein, nicht PNG)
  const jblob = await toBlobAsync(canvas, 'image/jpeg', JPEG_Q);
  if (!jblob) throw new Error('Bild-Umwandlung fehlgeschlagen');
  return { file: new File([jblob], `${base}.jpg`, { type: 'image/jpeg' }), format: 'jpeg' };
}

const tileBase: React.CSSProperties = {
  position: 'relative', width: TILE, height: TILE, borderRadius: 6, overflow: 'hidden',
  border: '1px solid #e1ddd5', background: '#f4ede1', cursor: 'grab', touchAction: 'none',
};

function SortableTile({ src, onRemove }: { src: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: src });
  const style: React.CSSProperties = {
    ...tileBase, transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} title="Zum Sortieren ziehen">
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        title="Entfernen"
        style={{
          position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%',
          border: 'none', background: 'rgba(28,24,18,0.72)', color: '#fff', cursor: 'pointer',
          lineHeight: '20px', fontSize: 13, padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

const BulkPhotoFieldInner = wrapFieldsWithMeta(({ input }: any) => {
  const cms = useCMS();
  const value: string[] = Array.isArray(input.value) ? input.value : [];
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [savings, setSavings] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');
  const folderRef = React.useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  React.useEffect(() => {
    let alive = true;
    detectEncoder().then((m) => alive && setEncoder(m));
    if (folderRef.current) {
      folderRef.current.setAttribute('webkitdirectory', '');
      folderRef.current.setAttribute('directory', '');
    }
    return () => {
      alive = false;
    };
  }, []);

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const mode: EncoderMode = encoder === 'checking' ? await detectEncoder() : encoder;
    setBusy(true);
    setError('');
    setSavings('');
    try {
      const converted: File[] = [];
      let origBytes = 0;
      let newBytes = 0;
      let anyJpeg = false;
      for (let i = 0; i < files.length; i++) {
        setProgress(`Konvertiere ${i + 1}/${files.length} …`);
        const { file, format } = await toOptimized(files[i], mode);
        if (format === 'jpeg') anyJpeg = true;
        origBytes += files[i].size;
        newBytes += file.size;
        converted.push(file);
      }
      setProgress(`Lade ${converted.length} Bild(er) hoch …`);
      const media = await cms.media.persist(converted.map((file) => ({ directory: '', file })));
      const newSrcs = media.map((m: any) => m.src).filter(Boolean);
      input.onChange([...value, ...newSrcs]);
      const note = anyJpeg ? ' (JPEG)' : ' (WebP)';
      setSavings(`${converted.length} Foto(s): ${fmt(origBytes)} → ${fmt(newBytes)}${note}`);
    } catch (e: any) {
      setError(e?.message || 'Upload fehlgeschlagen');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  function removeOne(src: string) {
    input.onChange(value.filter((s) => s !== src));
  }
  function onDragEnd(e: any) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(active.id);
    const newIndex = value.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    input.onChange(arrayMove(value, oldIndex, newIndex));
  }

  const encoderLabel =
    encoder === 'checking' ? 'WebP-Encoder wird geprüft …'
    : encoder === 'jsquash' ? '✓ WebP-Encoder bereit (jSquash — auch Safari)'
    : encoder === 'native' ? '✓ WebP-Encoder bereit (Browser)'
    : 'WebP nicht verfügbar — Bilder werden als JPEG gespeichert';

  return (
    <div>
      {value.length ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(String(e.active.id))}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={value} strategy={rectSortingStrategy}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {value.map((src) => (
                <SortableTile key={src} src={src} onRemove={() => removeOne(src)} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div style={{ ...tileBase, cursor: 'grabbing', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <img src={activeId} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <div
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragOver ? '#a7672f' : '#d8cab2'}`,
          background: dragOver ? '#f6ede0' : '#faf6ef',
          borderRadius: 8, padding: '16px 14px', textAlign: 'center',
          transition: 'border-color .15s, background .15s',
        }}
      >
        <div style={{ color: '#6e5e49', fontSize: 13, marginBottom: 10 }}>
          {busy ? (progress || 'Arbeite …') : 'Fotos hierher ziehen — oder:'}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <label style={btnStyle(busy)}>
            + Dateien wählen
            <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
          </label>
          <label style={btnStyle(busy, true)}>
            + Ganzer Ordner
            <input ref={folderRef} type="file" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {savings ? <div style={{ color: '#2d6a4f', fontSize: 12, marginTop: 8 }}>✓ {savings}</div> : null}
      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 8 }}>{error}</div> : null}
      <div style={{ color: encoder === 'jpeg' ? '#a7672f' : '#6e5e49', fontSize: 12, marginTop: 8 }}>{encoderLabel}</div>
      <div style={{ color: '#6e5e49', fontSize: 12, marginTop: 4 }}>
        Mehrere Bilder gleichzeitig. Auto-Verkleinerung auf Breite max. 2400px + WebP (Q85, wie die Live-Seite). Reihenfolge per Ziehen.
      </div>
    </div>
  );
});

function btnStyle(busy: boolean, secondary = false): React.CSSProperties {
  return {
    display: 'inline-block', padding: '8px 14px', borderRadius: 6,
    background: busy ? '#b9b1a4' : secondary ? '#ebe1d1' : '#a7672f',
    color: busy ? '#fff' : secondary ? '#2e2418' : '#fff',
    border: secondary ? '1px solid #d8cab2' : 'none',
    fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
  };
}

export default BulkPhotoFieldInner;
