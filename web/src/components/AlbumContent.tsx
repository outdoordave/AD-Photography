import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { Tile } from './GalleryContent';
import { normalizePath } from '../lib/stories';
import { albumPhotos, bi, type RawAlbum, type Lang } from '../lib/albums';

// Album-Unterseite (1:1 aus renderAlbum): Kicker „Album" + Name + Notiz + flaches
// Kachel-Grid; Kachel-Klick -> Lightbox des Albums. Daten via useTina(alben) ->
// Live-Vorschau (Ziel von Tinas Router /portfolio/<slug>).

type Props = { query: string; variables: object; data: any; lang: Lang };

export default function AlbumContent(props: Props) {
  const { lang } = props;
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const alb = ((data as any)?.alben || {}) as RawAlbum;

  const photos = React.useMemo(() => albumPhotos(alb), [alb]);
  const name = (lang === 'en' ? alb.name_en || alb.name : alb.name) || '';
  const note = bi(alb, 'note', lang);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  function openAt(start: number) {
    if (!photos.length) return;
    setLb({ photos: photos.map((p) => ({ photo: normalizePath(p.image) })), start });
  }

  return (
    <>
      <div className="page-title">
        <div className="kicker">{lang === 'en' ? 'Album' : 'Album'}</div>
        <h1 data-tina-field={tinaField(alb as any, 'name')}>{name}</h1>
        {note ? <p data-tina-field={tinaField(alb as any, lang === 'en' ? 'note_en' : 'note_de')}>{note}</p> : null}
      </div>
      <div className="gallery">
        {photos.map((ph, i) => (
          <Tile key={ph.idx + ':' + i} albName={name} ph={ph} onOpen={() => openAt(i)} />
        ))}
      </div>
      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} albumName={name} loop onClose={() => setLb(null)} />}
    </>
  );
}
