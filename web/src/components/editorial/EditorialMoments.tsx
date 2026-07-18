import React from 'react';
import Lightbox, { type LbPhoto } from '../Lightbox';
import { normalizePath } from '../../lib/stories';
import type { Moment } from '../../lib/home';

// Editorial „02 — Portfolio / Momentaufnahmen": 12-Spalten-Collage (1:1 aus dem Design), Hover-Overlay
// (Album), Zoom-Bilder (data-zoom) + Drift (data-drift) über EditorialMotion. Klick -> echte Lightbox
// (dieselbe Funktion wie die klassische Startseite). Reihenfolge wird nach dem Mount einmal gemischt.

type Props = { moments: Moment[]; lang: 'de' | 'en' };

// Collage-Raster (grid-column / grid-row / Drift) — 1:1 aus dem Claude-Design (Startseite 02, exakt 5 Kacheln).
const SPANS = [
  { col: '1 / span 7', row: 'span 6', drift: 10 },
  { col: '8 / span 5', row: 'span 4', drift: -18 },
  { col: '8 / span 5', row: 'span 5', drift: -12 },
  { col: '1 / span 4', row: 'span 4', drift: 16 },
  { col: '5 / span 8', row: 'span 4', drift: 8 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function EditorialMoments({ moments, lang }: Props) {
  const [shown, setShown] = React.useState<Moment[]>(() => moments.slice(0, SPANS.length));
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);
  React.useEffect(() => { setShown(shuffle(moments).slice(0, SPANS.length)); }, [moments]);
  if (!moments.length) return null;
  const photos: LbPhoto[] = shown.map((m) => ({ photo: normalizePath(m.image) }));
  return (
    <>
      <div className="ed-collage">
        {shown.map((m, i) => {
          const s = SPANS[i % SPANS.length];
          return (
            <a key={i} className="ed-collage-tile" data-reveal data-drift={s.drift}
              style={{ gridColumn: s.col, gridRow: s.row }}
              href="#" onClick={(e) => { e.preventDefault(); setLb({ photos, start: i }); }}>
              <img src={normalizePath(m.image)} alt={m.album ? (lang === 'en' ? `Photo from album ${m.album}` : `Foto aus Album ${m.album}`) : ''} data-zoom loading="lazy" decoding="async" />
              <span className="ed-collage-vignette" aria-hidden="true" />
              <span className="ed-collage-label">
                <span className="ed-collage-album">{m.album}</span>
              </span>
            </a>
          );
        })}
      </div>
      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} photoAlt={lang === 'en' ? 'Photo from our albums' : 'Foto aus unseren Alben'} loop onClose={() => setLb(null)} />}
    </>
  );
}
