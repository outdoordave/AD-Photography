import React from 'react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { MediaBox } from './GalleryContent';
import { normalizePath } from '../lib/stories';
import type { Moment } from '../lib/home';

// Momentaufnahmen (1:1 aus renderRandomMoments): bis 6 Bilder, Klick → Lightbox-Gruppe.
// SSR + erster Client-Render: erste 6 in Reihenfolge (kein Hydration-Mismatch); nach
// dem Mount einmal mischen (lebendig, wie Live mit Math.random).
type Props = { moments: Moment[]; lang: 'de' | 'en' };

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeMoments({ moments, lang }: Props) {
  const [shown, setShown] = React.useState<Moment[]>(() => moments.slice(0, 6));
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);
  React.useEffect(() => {
    setShown(shuffle(moments).slice(0, 6));
  }, [moments]);
  if (!moments.length) return null;
  const photos = shown.map((m) => ({ photo: normalizePath(m.image) }));
  return (
    <>
      <div className="random-box">
        {shown.map((m, i) => (
          <div className="item" key={i} onClick={() => setLb({ photos, start: i })}>
            <MediaBox ph={{ image: m.image, c1: m.c1, c2: m.c2, img: m.img, idx: i }} alt={m.album ? (lang === 'en' ? `Photo from album ${m.album}` : `Foto aus Album ${m.album}`) : ''} />
            <div className="label"><div className="ttl">{m.album}</div></div>
          </div>
        ))}
      </div>
      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} photoAlt={lang === 'en' ? 'Photo from our albums' : 'Foto aus unseren Alben'} loop onClose={() => setLb(null)} />}
    </>
  );
}
