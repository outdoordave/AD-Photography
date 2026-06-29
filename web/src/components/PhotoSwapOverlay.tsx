import React from 'react';
import { MediaPickerButton } from '../../tina/fields/MediaPicker';

// Dezente „Foto tauschen"-Knöpfe DIREKT auf dem Bild — NUR in der CMS-Live-Vorschau.
//
// Hintergrund: Die Vorschau ist ein iframe im selben Origin wie der Admin; das Upload-Feld
// (jSquash + cms.media.persist) lebt im Admin. Statt in Tinas Formular-Internas zu greifen,
// reicht dieses Overlay nur das ERGEBNIS (gewählte Datei ODER Mediathek-Pfad) per Custom-Event
// an das passende Feld im Admin weiter — das Feld erledigt Upload/Übernahme + zeigt Info (Größe).
//   • „Foto ersetzen" → eigener Datei-Dialog (Finder) IM iframe → File ans Feld.
//   • „Aus Mediathek"  → der bestehende MediaPickerButton (Bild-Raster) → gewählter Pfad ans Feld.
// Zuordnung Overlay↔Feld über den GESPEICHERTEN Wert (`value`). Sichtbar nur im iframe (Editor).
// WICHTIG: Die `.story-topline` (Wander-Titel-Leiste, z-index 1095) lag über den Knöpfen und
// schluckte Klicks — im Editor ist sie jetzt per CSS klick-durchlässig (s. global.css
// `html.ww-cms-preview .story-topline`).

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
      <button type="button" className="ww-swap-btn" title={`${label} ersetzen (Finder)`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click(); }}>
        📷 Foto ersetzen
      </button>
      <MediaPickerButton label="🖼️ Aus Mediathek" onPick={(p) => send({ pickedPath: p })} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) send({ file: f }); (e.target as HTMLInputElement).value = ''; }} />
    </div>
  );
}
