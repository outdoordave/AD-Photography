import React from 'react';
import { useCMS, wrapFieldsWithMeta } from 'tinacms';

// Eigenes Galerie-Feld fuer AD-Photography:
//  - mehrere Fotos AUF EINMAL auswaehlen (Bulk),
//  - jedes client-seitig auf max. 2400px verkleinern + in WebP wandeln (Q85),
//    wie das bisherige Sveltia-Verhalten,
//  - per cms.media.persist() git-basiert in /uploads speichern,
//  - Thumbnails mit Entfernen + Drag-&-Drop-Sortierung.
// Loest Tinas "ein Bild pro Upload"-Grenze (Issue #1589) ueber die persist-API,
// die ein ganzes Datei-Array akzeptiert.

const MAX_SIZE = 2400;
const QUALITY = 0.85;

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

// Ein File -> verkleinertes WebP-File
async function toWebp(file: File): Promise<File> {
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
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('WebP-Umwandlung fehlgeschlagen'))), 'image/webp', QUALITY)
  );
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
  return new File([blob], `${base}.webp`, { type: 'image/webp' });
}

const BulkPhotoFieldInner = wrapFieldsWithMeta(({ input }: any) => {
  const cms = useCMS();
  const value: string[] = Array.isArray(input.value) ? input.value : [];
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const dragIndex = React.useRef<number | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);
    setBusy(true);
    setError('');
    try {
      const webps: File[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Konvertiere ${i + 1}/${files.length} …`);
        webps.push(await toWebp(files[i]));
      }
      setProgress(`Lade ${webps.length} Bild(er) hoch …`);
      // directory '' = Wurzel von mediaRoot ('uploads') -> ergibt /uploads/<datei>.
      // (Nicht 'uploads' uebergeben, sonst /uploads/uploads/… doppelt.)
      const media = await cms.media.persist(webps.map((file) => ({ directory: '', file })));
      const newSrcs = media.map((m: any) => m.src).filter(Boolean);
      input.onChange([...value, ...newSrcs]);
    } catch (e: any) {
      setError(e?.message || 'Upload fehlgeschlagen');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  function removeAt(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    input.onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to || from == null || to == null) return;
    const next = value.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    input.onChange(next);
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {value.map((src, i) => (
          <div
            key={src + i}
            draggable
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              reorder(dragIndex.current as number, i);
              dragIndex.current = null;
            }}
            style={{
              position: 'relative',
              width: 92,
              height: 92,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid #e1ddd5',
              cursor: 'grab',
              background: '#f4ede1',
            }}
            title="Zum Sortieren ziehen"
          >
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={() => removeAt(i)}
              title="Entfernen"
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(28,24,18,0.7)',
                color: '#fff',
                cursor: 'pointer',
                lineHeight: '20px',
                fontSize: 13,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <label
        style={{
          display: 'inline-block',
          padding: '8px 14px',
          borderRadius: 6,
          background: busy ? '#b9b1a4' : '#a7672f',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? progress || 'Arbeite …' : '+ Fotos hinzufügen (mehrere, Auto-WebP)'}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </label>

      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 8 }}>{error}</div> : null}
      <div style={{ color: '#6e5e49', fontSize: 12, marginTop: 8 }}>
        Mehrere Bilder gleichzeitig waehlbar. Werden automatisch auf max. 2400px verkleinert und als WebP gespeichert. Reihenfolge per Ziehen.
      </div>
    </div>
  );
});

export default BulkPhotoFieldInner;
