import React from 'react';
import { useCMS } from 'tinacms';
import { detectEncoder, toOptimized, fmt, type EncoderMode } from './webpEncode';
import { toLocalMedia, dedupeUploads } from './mediaPath';

// Foto-Feld für den „📷 Foto"-Rich-Text-Baustein (Story-Haupttext).
// Setzt KEINEN Tina-Medien-Manager ein — stattdessen wie der bisherige StoryBodyField:
//  • 📷 Hochladen  -> Datei wählen -> Auto-WebP (jSquash) -> cms.media.persist -> Pfad in input.value.
//  • 🖼️ Mediathek   -> Raster ALLER /uploads-Bilder (uploads-manifest.json) -> Klick übernimmt Pfad.
// Der Wert (Bildpfad) landet im `src`-Feld des Foto-Bausteins; gerendert wird er als <img>.

export default function PhotoUploadField({ input, field }: any) {
  const cms = useCMS();
  const value: string = typeof input.value === 'string' ? input.value : '';
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [note, setNote] = React.useState('');
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [media, setMedia] = React.useState<string[] | null>(null);
  const [mediaErr, setMediaErr] = React.useState('');
  // Lokale Sofort-Vorschau (blob:) des frisch hochgeladenen Bildes. Grund: gespeichert wird
  // ein /uploads-Pfad, der erst nach dem nächsten Deploy ausgeliefert wird — direkt nach dem
  // Upload zeigt er sonst ein „?" (404). Der blob:-URL des gerade gewählten Files greift sofort.
  const [localPreview, setLocalPreview] = React.useState('');
  const urlRef = React.useRef('');
  const setPreview = (url: string) => {
    if (urlRef.current && urlRef.current !== url) { try { URL.revokeObjectURL(urlRef.current); } catch (e) { /* ignore */ } }
    urlRef.current = url;
    setLocalPreview(url);
  };

  React.useEffect(() => {
    let alive = true;
    detectEncoder().then((m) => alive && setEncoder(m));
    return () => { alive = false; };
  }, []);
  // Beim Verlassen den blob:-URL freigeben (kein Speicherleck).
  React.useEffect(() => () => { if (urlRef.current) { try { URL.revokeObjectURL(urlRef.current); } catch (e) { /* ignore */ } } }, []);

  async function handleFile(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const mode: EncoderMode = encoder === 'checking' ? await detectEncoder() : encoder;
    setBusy(true); setError(''); setNote('');
    try {
      setProgress('Konvertiere …');
      const { file, format } = await toOptimized(files[0], mode);
      // Sofort-Vorschau zeigen, bevor der (noch nicht ausgelieferte) /uploads-Pfad greift.
      try { setPreview(URL.createObjectURL(file)); } catch (e) { /* ignore */ }
      setProgress('Lade hoch …');
      const m = await cms.media.persist([{ directory: '', file }]);
      const src = m.map((x: any) => dedupeUploads(x.src)).filter(Boolean)[0];
      if (!src) throw new Error('Upload ohne Ergebnis');
      input.onChange(src);
      setNote(`✓ ${fmt(files[0].size)} → ${fmt(file.size)} (${format === 'jpeg' ? 'JPEG' : 'WebP'})`);
    } catch (e: any) {
      setError(e?.message || 'Upload fehlgeschlagen');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  function openPicker() {
    setPickerOpen(true);
    if (media == null && !mediaErr) {
      fetch('/uploads-manifest.json', { cache: 'no-store' })
        .then((r) => { if (!r.ok) throw new Error('Manifest ' + r.status); return r.json(); })
        .then((list: string[]) => setMedia(Array.isArray(list) ? list : []))
        .catch((e) => setMediaErr(e?.message || 'Mediathek nicht ladbar'));
    }
  }

  function pickFromMedia(path: string) {
    input.onChange(path);
    setPreview(''); // Mediathek-Bilder sind bereits ausgeliefert -> über toLocalMedia anzeigen.
    setPickerOpen(false);
    setNote('✓ Aus der Mediathek übernommen');
  }

  return (
    <div style={{ marginBottom: 6 }}>
      {field?.label ? <div style={{ fontSize: 12, fontWeight: 600, color: '#6e5e49', marginBottom: 6 }}>{field.label}</div> : null}
      {value || localPreview ? (
        <div style={{ marginBottom: 8 }}>
          <img src={localPreview || toLocalMedia(value)} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #e1ddd5', display: 'block' }} />
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={btn(busy)}>
          📷 {value ? 'Anderes Bild' : 'Bild hochladen'}
          <input type="file" accept="image/*" disabled={busy} onChange={(e) => handleFile(e.target.files)} style={{ display: 'none' }} />
        </label>
        <button type="button" disabled={busy} onClick={openPicker} style={btn(busy)}>🖼️ Aus Mediathek</button>
        {value ? <button type="button" onClick={() => { input.onChange(''); setPreview(''); }} style={miniBtn}>entfernen</button> : null}
        {busy ? <span style={{ fontSize: 12, color: '#6e5e49' }}>{progress || 'Arbeite …'}</span> : null}
      </div>
      {note ? <div style={{ color: '#2d6a4f', fontSize: 12, marginTop: 6 }}>{note}</div> : null}
      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 6 }}>{error}</div> : null}

      {pickerOpen ? (
        <div onClick={() => setPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(28,24,18,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 'min(880px, 96vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 18px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #ece5d9' }}>
              <strong style={{ fontSize: 15, color: '#2a2218' }}>Mediathek — Bild wählen</strong>
              <button type="button" onClick={() => setPickerOpen(false)} style={{ border: 'none', background: '#efe7d9', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}>Schließen ✕</button>
            </div>
            <div style={{ padding: 14, overflowY: 'auto' }}>
              {mediaErr ? (
                <div style={{ color: '#b00', fontSize: 13 }}>Mediathek nicht ladbar: {mediaErr}</div>
              ) : media == null ? (
                <div style={{ color: '#6e5e49', fontSize: 13 }}>Lade Bilder …</div>
              ) : media.length === 0 ? (
                <div style={{ color: '#6e5e49', fontSize: 13 }}>Noch keine Bilder in /uploads.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                  {media.map((p) => (
                    <button key={p} type="button" onClick={() => pickFromMedia(p)} title={p.replace('/uploads/', '')} style={{ padding: 0, border: '1px solid #e1ddd5', borderRadius: 8, overflow: 'hidden', background: '#f4ede1', cursor: 'pointer', aspectRatio: '4 / 3' }}>
                      <img src={toLocalMedia(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function btn(busy: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6,
    background: busy ? '#b9b1a4' : '#a7672f', color: '#fff', border: 'none',
    fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
  };
}

const miniBtn: React.CSSProperties = {
  border: '1px solid #d8cab2', background: '#fff', color: '#7a674e', borderRadius: 6,
  padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
