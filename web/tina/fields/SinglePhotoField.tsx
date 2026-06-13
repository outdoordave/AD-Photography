import React from 'react';
import { useCMS, wrapFieldsWithMeta } from 'tinacms';
import { fmt, detectEncoder, toOptimized, type EncoderMode } from './webpEncode';
import { toLocalMedia } from './mediaPath';
import { MediaPickerButton } from './MediaPicker';

// Einzelfoto-Feld mit Auto-WebP (gleiche Logik wie BulkPhotoField, aber EIN Bild):
//  - Datei waehlen oder hierher ziehen,
//  - Auto-Verkleinern Breite <= 2400px + WebP @Q85 (jSquash, auch Safari),
//  - via cms.media.persist() git-basiert nach /uploads (directory:''),
//  - speichert EINEN URL-String. Genutzt z. B. fuer die Personen-Fotos (Ueber uns).

const PREVIEW = 120;

const SinglePhotoFieldInner = wrapFieldsWithMeta(({ input }: any) => {
  const cms = useCMS();
  const value: string = typeof input.value === 'string' ? input.value : '';
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [savings, setSavings] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');

  React.useEffect(() => {
    let alive = true;
    detectEncoder().then((m) => alive && setEncoder(m));
    return () => {
      alive = false;
    };
  }, []);

  async function handleFile(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const mode: EncoderMode = encoder === 'checking' ? await detectEncoder() : encoder;
    setBusy(true);
    setError('');
    setSavings('');
    try {
      setProgress('Konvertiere …');
      const { file, format } = await toOptimized(files[0], mode);
      setProgress('Lade hoch …');
      const media = await cms.media.persist([{ directory: '', file }]);
      const src = media.map((m: any) => m.src).filter(Boolean)[0];
      if (!src) throw new Error('Upload ohne Ergebnis');
      input.onChange(src);
      const note = format === 'jpeg' ? ' (JPEG)' : ' (WebP)';
      setSavings(`${fmt(files[0].size)} → ${fmt(file.size)}${note}`);
    } catch (e: any) {
      setError(e?.message || 'Upload fehlgeschlagen');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  const encoderLabel =
    encoder === 'checking' ? 'WebP-Encoder wird geprüft …'
    : encoder === 'jsquash' ? '✓ WebP-Encoder bereit (jSquash — auch Safari)'
    : encoder === 'native' ? '✓ WebP-Encoder bereit (Browser)'
    : 'WebP nicht verfügbar — Bild wird als JPEG gespeichert';

  return (
    <div>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{ position: 'relative', width: PREVIEW, height: PREVIEW, borderRadius: 8, overflow: 'hidden', border: '1px solid #e1ddd5', background: '#f4ede1', flex: '0 0 auto' }}>
            <img src={toLocalMedia(value)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={() => input.onChange('')}
              title="Foto entfernen"
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(28,24,18,0.72)', color: '#fff', cursor: 'pointer', lineHeight: '22px', fontSize: 14, padding: 0 }}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <div
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) handleFile(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragOver ? '#a7672f' : '#d8cab2'}`,
          background: dragOver ? '#f6ede0' : '#faf6ef',
          borderRadius: 8, padding: '14px', textAlign: 'center',
          transition: 'border-color .15s, background .15s',
        }}
      >
        <div style={{ color: '#6e5e49', fontSize: 13, marginBottom: 10 }}>
          {busy ? (progress || 'Arbeite …') : value ? 'Anderes Foto ziehen — oder:' : 'Foto hierher ziehen — oder:'}
        </div>
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <label style={btnStyle(busy)}>
            {value ? 'Foto ersetzen' : '+ Foto wählen'}
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => handleFile(e.target.files)} style={{ display: 'none' }} />
          </label>
          <MediaPickerButton disabled={busy} onPick={(p) => input.onChange(p)} />
        </div>
      </div>

      {savings ? <div style={{ color: '#2d6a4f', fontSize: 12, marginTop: 8 }}>✓ {savings}</div> : null}
      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 8 }}>{error}</div> : null}
      <div style={{ color: encoder === 'jpeg' ? '#a7672f' : '#6e5e49', fontSize: 12, marginTop: 8 }}>{encoderLabel}</div>
      <div style={{ color: '#6e5e49', fontSize: 12, marginTop: 4 }}>
        Ein Foto. Auto-Verkleinerung auf Breite max. 2400px + WebP (Q85, wie die Live-Seite).
      </div>
    </div>
  );
});

function btnStyle(busy: boolean): React.CSSProperties {
  return {
    display: 'inline-block', padding: '8px 14px', borderRadius: 6,
    background: busy ? '#b9b1a4' : '#a7672f', color: '#fff', border: 'none',
    fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
  };
}

export default SinglePhotoFieldInner;
