import React from 'react';
import { useCMS, wrapFieldsWithMeta } from 'tinacms';
import { detectEncoder, toOptimized, fmt, type EncoderMode } from './webpEncode';

// Story-Haupttext-Editor — laientauglich, OHNE Markdown-Syntax tippen.
// Gespeichert wird weiterhin normales Markdown (der mdToHtml-Port bleibt 1:1),
// aber der Nutzer bedient nur zwei Knoepfe ueber einem normalen Textfeld:
//  📷 „Bild einfuegen"  -> Datei waehlen -> Auto-WebP-Upload (jSquash, kein
//     Media-Manager / kein „?") -> setzt ![](pfad) an die Cursor-Stelle.
//  📸 „Album hier einfuegen" -> setzt den Platzhalter [[album]] an die
//     Cursor-Stelle. Welches Album = das Dropdown „Verknuepftes Album".
//     Auf der Seite erscheint dort die Lightbox mit den Album-Fotos
//     (kein Doppel-Upload — die Bilder kommen aus dem Album selbst).

const StoryBodyFieldInner = wrapFieldsWithMeta(({ input }: any) => {
  const cms = useCMS();
  const ref = React.useRef<HTMLTextAreaElement | null>(null);
  const pendingCaret = React.useRef<number | null>(null);
  const value: string = typeof input.value === 'string' ? input.value : '';
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [note, setNote] = React.useState('');
  const [encoder, setEncoder] = React.useState<EncoderMode>('checking');

  React.useEffect(() => {
    let alive = true;
    detectEncoder().then((m) => alive && setEncoder(m));
    return () => { alive = false; };
  }, []);

  // Nach dem onChange (Einfuegen) den Cursor hinter den eingefuegten Text setzen.
  React.useEffect(() => {
    if (pendingCaret.current != null && ref.current) {
      const pos = pendingCaret.current;
      pendingCaret.current = null;
      try { ref.current.focus(); ref.current.setSelectionRange(pos, pos); } catch { /* egal */ }
    }
  });

  // Block-Snippet an der Cursor-Stelle einfuegen, mit sauberen Leerzeilen drumherum.
  function insertAtCursor(snippet: string) {
    const ta = ref.current;
    const v = value;
    let start = v.length;
    let end = v.length;
    if (ta) { start = ta.selectionStart ?? v.length; end = ta.selectionEnd ?? start; }
    const before = v.slice(0, start);
    const after = v.slice(end);
    const nlBefore = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const nlAfter = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';
    const next = before + nlBefore + snippet + nlAfter + after;
    pendingCaret.current = (before + nlBefore + snippet).length;
    input.onChange(next);
  }

  async function handleFile(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const mode: EncoderMode = encoder === 'checking' ? await detectEncoder() : encoder;
    setBusy(true); setError(''); setNote('');
    try {
      setProgress('Konvertiere …');
      const { file, format } = await toOptimized(files[0], mode);
      setProgress('Lade hoch …');
      const media = await cms.media.persist([{ directory: '', file }]);
      const src = media.map((m: any) => m.src).filter(Boolean)[0];
      if (!src) throw new Error('Upload ohne Ergebnis');
      insertAtCursor(`![](${src})`);
      setNote(`✓ Bild eingefügt — ${fmt(files[0].size)} → ${fmt(file.size)} (${format === 'jpeg' ? 'JPEG' : 'WebP'})`);
    } catch (e: any) {
      setError(e?.message || 'Upload fehlgeschlagen');
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={btn(busy)}>
          📷 Bild einfügen
          <input type="file" accept="image/*" disabled={busy} onChange={(e) => handleFile(e.target.files)} style={{ display: 'none' }} />
        </label>
        <button type="button" disabled={busy} onClick={() => insertAtCursor('[[album]]')} style={btn(busy)}>
          📸 Album hier einfügen
        </button>
        {busy ? <span style={{ fontSize: 12, color: '#6e5e49' }}>{progress || 'Arbeite …'}</span> : null}
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => input.onChange(e.target.value)}
        rows={14}
        spellCheck
        style={{
          width: '100%', minHeight: 240, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.55,
          padding: 10, border: '1px solid #d8cab2', borderRadius: 8, background: '#fff',
          resize: 'vertical', boxSizing: 'border-box',
        }}
      />

      {note ? <div style={{ color: '#2d6a4f', fontSize: 12, marginTop: 6 }}>{note}</div> : null}
      {error ? <div style={{ color: '#b00', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
      <div style={{ color: '#6e5e49', fontSize: 12, marginTop: 6 }}>
        „📷 Bild einfügen" lädt ein Foto hoch und setzt es an die Cursor-Stelle. „📸 Album hier einfügen"
        platziert dort die Bilder-Lightbox des unten gewählten Albums (ohne erneuten Upload).
      </div>
    </div>
  );
});

function btn(busy: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 6,
    background: busy ? '#b9b1a4' : '#a7672f', color: '#fff', border: 'none',
    fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
  };
}

export default StoryBodyFieldInner;
