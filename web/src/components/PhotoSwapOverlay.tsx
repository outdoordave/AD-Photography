import React from 'react';
import { MediaPickerButton } from '../../tina/fields/MediaPicker';

// Dezente „Foto tauschen"-Knöpfe DIREKT auf dem Bild — NUR in der CMS-Live-Vorschau.
//
// Hintergrund (s. CAPABILITIES/CHANGELOG): Die Vorschau ist ein iframe im selben Origin
// wie der Admin; das Upload-Feld (mit jSquash + cms.media.persist) lebt aber im Admin.
// Statt in Tinas Formular-Internas zu greifen, reicht dieses Overlay nur das ERGEBNIS
// (eine ausgewählte Datei ODER einen Mediathek-Pfad) per Custom-Event an das passende
// Feld im Admin weiter — das Feld erledigt Upload/Übernahme mit seiner bestehenden Logik.
//   • „Foto ersetzen" → eigener Datei-Dialog IM iframe (User-Geste vorhanden) → File ans Feld.
//   • „Aus Mediathek"  → der bestehende, eigenständige MediaPickerButton → gewählter Pfad ans Feld.
// Zuordnung Overlay↔Feld über den GESPEICHERTEN Wert (`value`): das Feld reagiert nur, wenn
// sein `input.value` exakt diesem Wert entspricht. Sichtbar nur im iframe (Editor), nie live.

const EVENT = 'ww:swap-media';

export default function PhotoSwapOverlay({ value, label = 'Foto' }: { value: string; label?: string }) {
  const [editor, setEditor] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    try { setEditor(window.self !== window.top); } catch (e) { setEditor(true); }
  }, []);
  if (!editor) return null;

  const send = (detail: Record<string, any>) => {
    try {
      const w: any = window.parent || window;
      w.dispatchEvent(new CustomEvent(EVENT, { detail: { value, ...detail } }));
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="ww-swap-overlay" onClick={(e) => e.stopPropagation()} aria-label={`${label} tauschen`}>
      <button type="button" className="ww-swap-btn" title={`${label} ersetzen (hochladen)`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click(); }}>
        📷 Foto ersetzen
      </button>
      <MediaPickerButton label="🖼️ Aus Mediathek" onPick={(p) => send({ pickedPath: p })} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) send({ file: f }); (e.target as HTMLInputElement).value = ''; }} />
    </div>
  );
}
