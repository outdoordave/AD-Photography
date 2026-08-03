import React from 'react';

// Editorial-Album-Kachel als Mini-Diashow (Portfolio-Übersicht): rotiert durch die ersten
// Fotos des Albums (Autoplay ~4 s), wischbar per Pointer/Touch, Klick öffnet die Album-Seite.
// Ersetzt die statische Einzel-Cover-Kachel — bringt die „Durchswipen + alle paar Sekunden
// wechseln"-Mechanik des hellen Designs ins dunkle Collage-Raster (Layout bleibt via col/row).

type Props = {
  href: string;
  title: string;
  meta: string;
  photos: string[];      // bereits normalisierte Pfade (max. ~6 sinnvoll)
  col: string;           // grid-column
  row: string;           // grid-row
};

const AUTO_MS = 4000;

export default function EditorialAlbumTile({ href, title, meta, photos, col, row }: Props) {
  const slides = (Array.isArray(photos) ? photos : []).filter(Boolean).slice(0, 6);
  const [idx, setIdx] = React.useState(0);
  const timerRef = React.useRef<number | null>(null);
  const startX = React.useRef<number | null>(null);
  const draggedRef = React.useRef(false);
  const n = slides.length;

  const rootRef = React.useRef<HTMLAnchorElement | null>(null);

  // Ein Bild weiter/zurück (funktional -> immer der aktuelle Index, auch aus Listenern heraus).
  const step = React.useCallback((dir: number) => {
    if (n <= 1) return;
    setIdx((i) => ((i + dir) % n + n) % n);
  }, [n]);

  const stop = React.useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const start = React.useCallback(() => {
    if (n <= 1) return;
    stop();
    timerRef.current = window.setInterval(() => setIdx((i) => (i + 1) % n), AUTO_MS);
  }, [n, stop]);

  React.useEffect(() => { start(); return stop; }, [start, stop]);

  // Trackpad-Zweifinger / Mausrad quer -> blättern (wie der native Scroll-Track im hellen Design).
  // Nativer, nicht-passiver Listener, damit horizontales Wischen die Seite nicht seitlich scrollt.
  // Akkumulator + kurze Sperre: ein Wisch = ein Bild, nicht mehrere auf einmal.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || n <= 1) return;
    let accum = 0, lock = false, idleTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertikal -> Seite scrollt normal
      e.preventDefault();
      stop();
      accum += e.deltaX;
      if (!lock && Math.abs(accum) > 36) {
        step(accum > 0 ? 1 : -1);
        accum = 0; lock = true;
        window.setTimeout(() => { lock = false; }, 220);
      }
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => { accum = 0; start(); }, 700);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { el.removeEventListener('wheel', onWheel); window.clearTimeout(idleTimer); };
  }, [n, step, stop, start]);

  // Wisch-Gesten: horizontaler Drag > 40px blättert; danach unterdrückt der Klick die Navigation nicht doppelt.
  const onPointerDown = (e: React.PointerEvent) => { startX.current = e.clientX; draggedRef.current = false; stop(); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    if (Math.abs(e.clientX - startX.current) > 8) draggedRef.current = true;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current != null) {
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    }
    startX.current = null;
    start();
  };
  // Nach einem Wisch keinen Klick-Navigations-Sprung auslösen.
  const onClick = (e: React.MouseEvent) => { if (draggedRef.current) { e.preventDefault(); draggedRef.current = false; } };

  return (
    <a
      ref={rootRef}
      className="ed-album-tile ed-album-slideshow"
      href={href}
      style={{ gridColumn: col, gridRow: row }}
      data-reveal
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => { startX.current = null; start(); }}
      onMouseEnter={stop}
      onClick={onClick}
    >
      <span className="ed-album-slides">
        {slides.map((src, i) => (
          <img key={i} src={src} alt={i === 0 ? title : ''} className={i === idx ? 'on' : ''} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
        ))}
      </span>
      <span className="ed-collage-vignette" aria-hidden="true" />
      <span className="ed-album-label">
        <span className="ed-album-meta">{meta}</span>
        <span className="ed-album-title">{title}</span>
      </span>
      {n > 1 && (
        <span className="ed-album-dots" aria-hidden="true">
          {slides.map((_, i) => <i key={i} className={i === idx ? 'on' : ''} />)}
        </span>
      )}
    </a>
  );
}
