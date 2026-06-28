import React from 'react';
import { MediaPickerButton } from '../../tina/fields/MediaPicker';

// Dezente „Foto tauschen"-Knöpfe DIREKT auf dem Bild — NUR in der CMS-Live-Vorschau.
//
// Hintergrund (s. CAPABILITIES/CHANGELOG): Die Vorschau ist ein iframe im selben Origin
// wie der Admin; das Upload-Feld (mit jSquash + cms.media.persist) lebt aber im Admin.
// Statt in Tinas Formular-Internas zu greifen, reicht dieses Overlay nur das ERGEBNIS
// (eine ausgewählte Datei ODER einen Mediathek-Pfad) per Custom-Event an das passende
// Feld im Admin weiter — das Feld erledigt Upload/Übernahme mit seiner bestehenden Logik.
// Sichtbar nur im iframe (Editor), nie live.

const EVENT = 'ww:swap-media';

export default function PhotoSwapOverlay({ value, label = 'Foto' }: { value: string; label?: string }) {
  const [editor, setEditor] = React.useState(false);
  const [dbg, setDbg] = React.useState(''); // TEMP-DIAGNOSE (s. u.)
  const fileRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    try { setEditor(window.self !== window.top); } catch (e) { setEditor(true); }
  }, []);

  // TEMP-DIAGNOSE: capture-phase-Klick-Lauscher auf document — sieht JEDEN Klick als Allererstes
  // (vor Tina, vor allem anderen) und zeigt das ECHTE Klick-Ziel oben im roten Streifen. Damit
  // sehen wir eindeutig, ob ein Klick auf „Foto ersetzen" wirklich den Knopf trifft oder etwas
  // anderes (z. B. das Cover-Bild). Wird nach der Diagnose wieder entfernt.
  React.useEffect(() => {
    if (!editor) return;
    const h = (e: any) => {
      let id = '?';
      try {
        const t = e.target;
        id = (t.tagName || '?') + (t.className ? '.' + String(t.className).trim().split(/\s+/)[0] : '');
        if (t.closest && t.closest('.ww-swap-btn, .ww-swap-overlay')) id += ' [✓ KNOPF erreicht]';
        if (t.closest && t.closest('[data-tina-field],[data-tina-field-overlay]')) id += ' [data-tina-field]';
      } catch (err) { id = 'err'; }
      setDbg(id);
    };
    document.addEventListener('click', h, true);
    return () => document.removeEventListener('click', h, true);
  }, [editor]);

  if (!editor) return null;

  const send = (detail: Record<string, any>) => {
    try {
      const w: any = window.parent || window;
      w.dispatchEvent(new CustomEvent(EVENT, { detail: { value, ...detail } }));
    } catch (e) { /* ignore */ }
  };

  return (
    <>
      {dbg ? (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2147483647, background: '#c0392b', color: '#fff', font: 'bold 13px/1.5 -apple-system, sans-serif', padding: '8px 12px', textAlign: 'center', pointerEvents: 'none' }}>
          KLICK-ZIEL: {dbg}
        </div>
      ) : null}
      <div className="ww-swap-overlay" onClick={(e) => e.stopPropagation()} aria-label={`${label} tauschen`}>
        <button type="button" className="ww-swap-btn" title={`${label} ersetzen (hochladen)`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDbg('onClick FEUERT → Datei-Dialog…'); fileRef.current?.click(); }}>
          📷 Foto ersetzen
        </button>
        <MediaPickerButton label="🖼️ Aus Mediathek" onPick={(p) => send({ pickedPath: p })} />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) send({ file: f }); (e.target as HTMLInputElement).value = ''; }} />
      </div>
    </>
  );
}
