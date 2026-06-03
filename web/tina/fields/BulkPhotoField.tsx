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
//  - jedes client-seitig auf max. 2400px verkleinern + WebP (Q85), wie Sveltia,
//  - via cms.media.persist() git-basiert in /uploads (directory:'' -> /uploads/<datei>),
//  - apple-like Sortieren (dnd-kit): Bilder springen auseinander, echtes Bild
//    als Drag-Vorschau; Entfernen per ×,
//  - Groessen-Anzeige vorher->nachher + WebP-Browser-Check.

const MAX_SIZE = 2400;
const QUALITY = 0.85;
const TILE = 92;

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
  return bytes >= 1024 * 1024
    ? (bytes / 1024 / 1024).toFixed(1) + ' MB'
    : Math.round(bytes / 1024) + ' KB';
}

// Ein File -> verkleinertes WebP-File. Gibt zusaetzlich zurueck, ob WebP klappte.
async function toWebp(file: File): Promise<{ file: File; isWebp: boolean }> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  const longest = Math.max(w, h);
  if (longest > MAX_SIZE) {
    const s = MAX_SIZE / longest;
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas-Context fehlt');
  ctx.drawImage(img, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Bild-Umwandlung fehlgeschlagen'))), 'image/webp', QUALITY)
  );
  const isWebp = blob.type === 'image/webp';
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
  const ext = isWebp ? 'webp' : (blob.type.split('/')[1] || 'png');
  return { file: new File([blob], `${base}.${ext}`, { type: blob.type }), isWebp };
}

const tileBase: React.CSSProperties = {
  position: 'relative',
  width: TILE,
  height: TILE,
  borderRadius: 6,
  overflow: 'hidden',
  border: '1px solid #e1ddd5',
  background: '#f4ede1',
  cursor: 'grab',
  touchAction: 'none',
};

function SortableTile({ src, onRemove }: { src: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: src });
  const style: React.CSSProperties = {
    ...tileBase,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} title="Zum Sortieren ziehen">
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
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
  const [warn, setWarn] = React.useState('');
  const [savings, setSavings] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const folderRef = React.useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  React.useEffect(() => {
    // Ordner-Auswahl aktivieren (nicht-standardisierte Attribute per DOM setzen)
    if (folderRef.current) {
      folderRef.current.setAttribute('webkitdirectory', '');
      folderRef.current.setAttribute('directory', '');
    }
  }, []);

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setBusy(true);
    setError('');
    setWarn('');
    setSavings('');
    try {
      const converted: File[] = [];
      let origBytes = 0;
      let newBytes = 0;
      let webpFail = false;
      for (let i = 0; i < files.length; i++) {
        setProgress(`Konvertiere ${i + 1}/${files.length} …`);
        const { file, isWebp } = await toWebp(files[i]);
        if (!isWebp) webpFail = true;
        origBytes += files[i].size;
        newBytes += file.size;
        converted.push(file);
      }
      setProgress(`Lade ${converted.length} Bild(er) hoch …`);
      const media = await cms.media.persist(converted.map((file) => ({ directory: '', file })));
      const newSrcs = media.map((m: any) => m.src).filter(Boolean);
      input.onChange([...value, ...newSrcs]);
      setSavings(`${converted.length} Foto(s): ${fmt(origBytes)} → ${fmt(newBytes)}`);
      if (webpFail) setWarn('Dein Browser hat kein WebP erzeugt (Fallback) — Bilder sind evtl. nicht optimal verkleinert. Bitte aktuelles Chrome/Safari nutzen.');
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

  return (
    <div>
      {/* Sortierbares Bild-Raster */}
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

      {/* Drag-&-Drop-Ablage + Buttons */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${dragOver ? '#a7672f' : '#d8cab2'}`,
          background: dragOver ? '#f6ede0' : '#faf6ef',
          borderRadius: 8,
          padding: '16px 14px',
          textAlign: 'center',
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
      {warn ? <div style={{ color: '#a7672f', fontSize: 12, marginTop: 8 }}>{warn}</div> : null}
      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 8 }}>{error}</div> : null}
      <div style={{ color: '#6e5e49', fontSize: 12, marginTop: 8 }}>
        Mehrere Bilder gleichzeitig. Auto-Verkleinerung auf max. 2400px + WebP. Reihenfolge per Ziehen.
      </div>
    </div>
  );
});

function btnStyle(busy: boolean, secondary = false): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: 6,
    background: busy ? '#b9b1a4' : secondary ? '#ebe1d1' : '#a7672f',
    color: busy ? '#fff' : secondary ? '#2e2418' : '#fff',
    border: secondary ? '1px solid #d8cab2' : 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: busy ? 'default' : 'pointer',
  };
}

export default BulkPhotoFieldInner;
