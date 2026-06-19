import React from 'react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { normalizePath } from '../lib/stories';

// Album-Einbettung im Story-Text (an der [[album]]-Stelle): Vorschau-Kacheln des
// verknuepften Albums; Klick oeffnet die bestehende Lightbox (Filmstreifen, alle
// Album-Fotos). Die Fotos kommen aus dem Album selbst -> KEIN Doppel-Upload.

type Props = {
  name: string;
  photos: string[];
  href: string;
  loop?: boolean;
  linkLabel?: string;
  kicker?: string;
  photoAlt?: string; // Sammel-alt fuer die Galerie-Bilder (vom Aufrufer sprachrichtig gebaut)
};

export default function StoryAlbumBlock({ name, photos, href, loop = true, linkLabel = 'Ganzes Album ansehen →', kicker = 'Bildergalerie', photoAlt = '' }: Props) {
  const [open, setOpen] = React.useState(false);
  const [start, setStart] = React.useState(0);

  const list = (photos || []).filter(Boolean);
  if (!list.length) return null;

  const tiles = list.slice(0, 4);
  const more = list.length - tiles.length;
  const lbPhotos: LbPhoto[] = list.map((p) => ({ photo: normalizePath(p) }));

  return (
    <div className="story-album-embed">
      <div className="sae-head">
        <span className="sae-kicker">{kicker}</span>
        {name ? <span className="sae-name">{name}</span> : null}
        <a className="sae-link" href={href}>{linkLabel}</a>
      </div>
      <div className="sae-tiles">
        {tiles.map((p, i) => (
          <button
            type="button"
            key={i}
            className="sae-tile"
            onClick={() => { setStart(i); setOpen(true); }}
            aria-label={`Bild ${i + 1} von ${list.length} öffnen`}
          >
            <img src={normalizePath(p)} alt={photoAlt} loading="lazy" />
            {i === tiles.length - 1 && more > 0 ? <span className="sae-more">+{more}</span> : null}
          </button>
        ))}
      </div>
      {open ? (
        <Lightbox photos={lbPhotos} startIndex={start} albumName={name} photoAlt={photoAlt} loop={loop} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
