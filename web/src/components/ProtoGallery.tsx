import React from 'react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { normalizePath } from '../lib/stories';

// PROTOTYP-Wrapper: Thumbnail-Raster -> Klick oeffnet die wiederverwendbare
// Lightbox beim geklickten Bild (Galerie-Modus, Umlauf an).
export default function ProtoGallery({ photos, albumName }: { photos: LbPhoto[]; albumName?: string }) {
  const [open, setOpen] = React.useState(false);
  const [start, setStart] = React.useState(0);
  return (
    <>
      <div className="proto-grid">
        {photos.map((p, i) => (
          <button
            type="button"
            className="proto-cell"
            key={i}
            style={{ backgroundImage: `url('${normalizePath(p.photo)}')` }}
            onClick={() => {
              setStart(i);
              setOpen(true);
            }}
            aria-label={`Bild ${i + 1} öffnen`}
          />
        ))}
      </div>
      {open && (
        <Lightbox photos={photos} startIndex={start} albumName={albumName} loop onClose={() => setOpen(false)} />
      )}
    </>
  );
}
