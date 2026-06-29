import React from 'react';
import { MediaPickerButton } from '../../tina/fields/MediaPicker';
import { getSwapInfo } from '../lib/freshMedia';

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
//
// Rückmeldung: Das Feld meldet Erfolg/Fehler + Größen-Info per localStorage-Brücke zurück
// (putSwapInfo). Wir lesen sie per `storage`-Event (feuert in der iframe, da das Admin-Fenster
// schreibt) und zeigen einen kurzen Hinweis DIREKT am Bild — analog zur Info im CMS-Formular.

const EVENT = 'ww:swap-media';

type Status = { kind: 'idle' | 'busy' | 'ok' | 'err'; text: string };

export default function PhotoSwapOverlay({ value, label = 'Foto' }: { value: string; label?: string }) {
  const [editor, setEditor] = React.useState(false);
  const [status, setStatus] = React.useState<Status>({ kind: 'idle', text: '' });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const startTsRef = React.useRef(0);
  const hideTimer = React.useRef<any>(null);

  React.useEffect(() => {
    try { setEditor(window.self !== window.top); } catch (e) { setEditor(true); }
  }, []);

  // Ergebnis vom Upload-Feld einsammeln. Match über den Zeitstempel: Diese Overlay hat den
  // Upload selbst angestoßen (startTsRef), der Feldwert ändert sich dabei — daher NICHT über
  // `value` matchen, sondern „neuer als mein Start". Pro Cover existiert nur eine Overlay.
  React.useEffect(() => {
    const check = () => {
      if (startTsRef.current === 0) return;
      const info = getSwapInfo();
      if (!info || info.ts < startTsRef.current) return;
      startTsRef.current = 0;
      setStatus(info.ok
        ? { kind: 'ok', text: `✓ ersetzt · ${info.text}` }
        : { kind: 'err', text: `✗ ${info.text}` });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (info.ok) hideTimer.current = setTimeout(() => setStatus({ kind: 'idle', text: '' }), 6000);
    };
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('storage', check);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!editor) return null;

  const send = (detail: Record<string, any>) => {
    try {
      const w: any = window.parent || window;
      w.dispatchEvent(new CustomEvent(EVENT, { detail: { value, ...detail } }));
    } catch (e) { /* ignore */ }
  };

  const beginUpload = (f: File) => {
    startTsRef.current = Date.now();
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setStatus({ kind: 'busy', text: `⏳ „${f.name}" wird hochgeladen …` });
    send({ file: f });
  };

  return (
    <div className="ww-swap-overlay" onClick={(e) => e.stopPropagation()} aria-label={`${label} tauschen`}>
      <button type="button" className="ww-swap-btn" title={`${label} ersetzen (Finder)`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click(); }}>
        📷 Foto ersetzen
      </button>
      <MediaPickerButton label="🖼️ Aus Mediathek" className="ww-swap-btn" onPick={(p) => send({ pickedPath: p })} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) beginUpload(f); (e.target as HTMLInputElement).value = ''; }} />
      {status.kind !== 'idle' ? (
        <div className={`ww-swap-info ww-swap-info--${status.kind}`} role="status">{status.text}</div>
      ) : null}
    </div>
  );
}
