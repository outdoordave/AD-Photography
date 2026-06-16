import React from 'react';
import { MediaBox } from './GalleryContent';
import type { DiscoverItem } from '../lib/home';

// „Entdecken" (1:1 aus renderDiscover): 3 zufällige Teaser (Fotos/Alben/Reisen) → Link.
// Mischen beim Laden (lebendig); SSR zeigt die ersten 3 (kein Hydration-Mismatch).
type Props = { pool: DiscoverItem[] };

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeDiscover({ pool }: Props) {
  const [shown, setShown] = React.useState<DiscoverItem[]>(() => pool.slice(0, 3));
  React.useEffect(() => {
    setShown(shuffle(pool).slice(0, 3));
  }, [pool]);
  if (!pool.length) return null;
  return (
    <div className="teaser-grid">
      {shown.map((d, i) => (
        <a className="teaser" key={i} href={d.href}>
          <MediaBox ph={{ image: d.image, c1: d.c1, c2: d.c2, img: d.img, idx: i }} />
          <div className="ov">
            <div className="cat">{d.cat}</div>
            <div className="ttl">{d.title}</div>
          </div>
        </a>
      ))}
    </div>
  );
}
