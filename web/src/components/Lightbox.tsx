import React from 'react';
import { normalizePath } from '../lib/stories';

// Wiederverwendbare Lightbox + Filmstreifen — 1:1-Port aus index.html
// (openLightboxGallery/buildLbTrack/buildFilmstrip/observeLbSlides/setLbCurrent/
//  lbCenterStrip/lbScrollToIndex/lbStep/lbFilmstripCenterIndex/lbStripUser +
//  Wheel-/Touch-/Key-Verdrahtung). Wird spaeter ueberall genutzt
//  (Stories/Stationen/Reisen/Alben). Galerie-Modus (mehrere Bilder).

export type LbPhoto = { photo: string; caption?: string };

type Props = {
  photos: LbPhoto[];
  startIndex: number;
  albumName?: string;
  loop?: boolean; // Default true (entspricht gallery_loop Default an)
  onClose: () => void;
};

export default function Lightbox({ photos, startIndex, albumName = '', loop = true, onClose }: Props) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const stripRef = React.useRef<HTMLDivElement | null>(null);
  const indexRef = React.useRef<number>(startIndex);
  const stripActiveRef = React.useRef<boolean>(false);
  const stripIdleRef = React.useRef<any>(null);
  const wheelIdleRef = React.useRef<any>(null);
  const [index, setIndexState] = React.useState<number>(startIndex);

  const multi = photos.length > 1;
  const caption = albumName ? `${albumName} · ${index + 1} / ${photos.length}` : '';

  // --- Filmstreifen mittig setzen (Snap-off/on-Trick gegen mandatory-Snap) ---
  function centerStrip(idx: number) {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelectorAll<HTMLElement>('.lb-thumb')[idx];
    if (!active) return;
    const left = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
    const prevSnap = strip.style.scrollSnapType;
    strip.style.scrollSnapType = 'none';
    strip.scrollLeft = left;
    requestAnimationFrame(() => {
      strip.style.scrollSnapType = prevSnap;
    });
  }

  // --- Aktuellen Stand spiegeln (Caption + Thumb + ggf. Streifen zentrieren) ---
  function setCurrent(idx: number) {
    indexRef.current = idx;
    setIndexState(idx);
    if (!stripActiveRef.current) centerStrip(idx);
  }

  // --- Zu Slide N scrollen (offsetLeft, gap-sicher) ---
  function scrollToIndex(idx: number, smooth: boolean) {
    const track = trackRef.current;
    if (!track || !track.children[idx]) return;
    track.scrollTo({ left: (track.children[idx] as HTMLElement).offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }

  // --- Welcher Thumb steht mittig? ---
  function filmstripCenterIndex(): number {
    const strip = stripRef.current;
    if (!strip) return -1;
    const thumbs = strip.querySelectorAll<HTMLElement>('.lb-thumb');
    if (!thumbs.length) return -1;
    const center = strip.scrollLeft + strip.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    thumbs.forEach((t, i) => {
      const d = Math.abs(t.offsetLeft + t.clientWidth / 2 - center);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  // --- Pfeile/Tastatur: ein Bild weiter/zurueck (Umlauf oder klemmen) ---
  function step(dir: number) {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.children;
    const n = slides.length;
    let cur = 0;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs((slides[i] as HTMLElement).offsetLeft - track.scrollLeft);
      if (d < best) {
        best = d;
        cur = i;
      }
    }
    const target = loop ? (cur + dir + n) % n : Math.max(0, Math.min(n - 1, cur + dir));
    if (slides[target]) track.scrollTo({ left: (slides[target] as HTMLElement).offsetLeft, behavior: 'smooth' });
  }

  function stripUser() {
    stripActiveRef.current = true;
    clearTimeout(stripIdleRef.current);
    stripIdleRef.current = setTimeout(() => {
      stripActiveRef.current = false;
    }, 180);
  }

  function bgClick(e: React.MouseEvent) {
    if (e.target === rootRef.current) onClose();
  }

  // --- Setup (Mount): instant zur Start-Slide, Observer, Strip-Handler, Tastatur ---
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    scrollToIndex(startIndex, false);
    setCurrent(startIndex);

    // IntersectionObserver: mittige Slide -> aktiv
    let io: IntersectionObserver | null = null;
    const track = trackRef.current;
    if (track && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting && en.intersectionRatio >= 0.6) {
              const idx = parseInt((en.target as HTMLElement).getAttribute('data-idx') || '0', 10);
              if (idx !== indexRef.current) setCurrent(idx);
            }
          }
        },
        { root: track, threshold: [0.6, 0.9] }
      );
      track.querySelectorAll('.lb-slide').forEach((s) => io!.observe(s));
    }

    // Streifen: Wheel (entprellt), Touch, Scroll (treibt Hauptbild)
    const strip = stripRef.current;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) {
        clearTimeout(wheelIdleRef.current);
        if (strip) strip.style.scrollSnapType = '';
        stripUser();
        return;
      }
      const d = e.deltaY;
      if (!d || !strip) return;
      e.preventDefault();
      strip.style.scrollSnapType = 'none';
      strip.scrollLeft += d;
      stripUser();
      clearTimeout(wheelIdleRef.current);
      wheelIdleRef.current = setTimeout(() => {
        strip.style.scrollSnapType = '';
      }, 140);
    };
    const onStripScroll = () => {
      if (!stripActiveRef.current) return;
      stripUser();
      const idx = filmstripCenterIndex();
      if (idx < 0 || idx === indexRef.current) return;
      indexRef.current = idx;
      setIndexState(idx);
      scrollToIndex(idx, false);
    };
    if (strip) {
      strip.addEventListener('wheel', onWheel, { passive: false });
      strip.addEventListener('touchmove', stripUser, { passive: true });
      strip.addEventListener('scroll', onStripScroll);
    }

    // Tastatur
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      if (io) io.disconnect();
      if (strip) {
        strip.removeEventListener('wheel', onWheel);
        strip.removeEventListener('touchmove', stripUser);
        strip.removeEventListener('scroll', onStripScroll);
      }
      document.removeEventListener('keydown', onKey);
      clearTimeout(stripIdleRef.current);
      clearTimeout(wheelIdleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lightbox open lb-gallery" ref={rootRef} onClick={bgClick}>
      <button className="lb-close" onClick={onClose} aria-label="Schließen">✕</button>
      <div className="lb-inner">
        {multi && <button className="lb-nav lb-prev" onClick={() => step(-1)} aria-label="Vorheriges Bild">‹</button>}
        {multi && <button className="lb-nav lb-next" onClick={() => step(1)} aria-label="Nächstes Bild">›</button>}
        <div className="ph" data-ph="PLATZHALTER"><img alt="" style={{ display: 'none' }} /></div>
        <div className="lb-track" ref={trackRef}>
          {photos.map((p, i) => (
            <div className="lb-slide" data-idx={i} key={i}>
              <img src={normalizePath(p.photo)} alt="" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="cap">{caption}</div>
      </div>
      <div className="lb-filmstrip" ref={stripRef}>
        {photos.map((p, i) => (
          <div
            className={'lb-thumb' + (i === index ? ' active' : '')}
            data-idx={i}
            key={i}
            style={{ backgroundImage: `url('${normalizePath(p.photo)}')` }}
            onClick={(e) => {
              e.stopPropagation();
              scrollToIndex(i, true);
            }}
          />
        ))}
      </div>
      <div className="lb-strip-marker" aria-hidden="true" />
    </div>
  );
}
