import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
import Lightbox, { type LbPhoto } from './Lightbox';
import { Tile } from './GalleryContent';
import { normalizePath } from '../lib/stories';
import { albumPhotos, bi, type RawAlbum, type Lang } from '../lib/albums';

// Album-Unterseite (1:1 aus renderAlbum): Kicker „Album" + Name + Notiz + flaches
// Kachel-Grid; Kachel-Klick -> Lightbox des Albums. Daten via useTina(alben) ->
// Live-Vorschau (Ziel von Tinas Router /portfolio/<slug>).

type Props = { query: string; variables: object; data: any; lang: Lang; design?: string };

export default function AlbumContent(props: Props) {
  const { lang } = props;
  const isEd = props.design === 'editorial';
  const base = lang === 'en' ? '/en' : '';
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Vorschau-Navigation: Sidebar links automatisch auf das Dokument dieser Seite schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  // Absicherung: Falls die Live-Daten (Hydration) leer/unvollständig zurückkommen, auf die
  // serverseitig gerenderten Daten zurückfallen -> Galerie verschwindet nicht (leere Seite).
  const alb = ((data as any)?.alben || (props.data as any)?.alben || {}) as RawAlbum;

  const photos = React.useMemo(() => albumPhotos(alb), [alb]);
  const name = (lang === 'en' ? alb.name_en || alb.name : alb.name) || '';
  const note = bi(alb, 'note', lang);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  function openAt(start: number) {
    if (!photos.length) return;
    setLb({ photos: photos.map((p) => ({ photo: normalizePath(p.image) })), start });
  }

  // --- Editorial: dunkler Album-Hero (Titelbild = erstes Foto) + Editorial-Raster, Lightbox wie gehabt. ---
  if (isEd) {
    const cover = photos[0] ? normalizePath(photos[0].image) : '';
    return (
      <div id="page-album">
        <a className="ed-reader-back" href={`${base}/portfolio`}>← {lang === 'en' ? 'Albums' : 'Alben'}</a>
        <header className="ed-reader-hero ed-album-hero">
          <div className="ed-reader-hero-img" data-ed-hero-img>{cover ? <img src={cover} alt="" fetchPriority="high" decoding="async" /> : null}</div>
          <div className="ed-reader-hero-scrim" aria-hidden="true" />
          <div className="ed-reader-hero-content" data-ed-hero-content>
            <p className="ed-reader-kicker">Album</p>
            <h1 className="ed-reader-title" data-tina-field={tinaField(alb as any, 'name')}>{name}</h1>
            {note ? <p className="ed-reader-meta" data-tina-field={tinaField(alb as any, lang === 'en' ? 'note_en' : 'note_de')}>{note}</p> : null}
          </div>
        </header>
        <section className="ed-album-section">
          <div className="ed-album-grid">
            {photos.map((ph, i) => (
              <button type="button" className="ed-album-cell" key={ph.idx + ':' + i} onClick={() => openAt(i)} aria-label={lang === 'en' ? 'Enlarge photo' : 'Foto vergrößern'}>
                <img src={normalizePath(ph.image)} alt="" loading="lazy" decoding="async" />
                <span className="ed-collage-vignette" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
        {lb && <Lightbox photos={lb.photos} startIndex={lb.start} albumName={name} loop onClose={() => setLb(null)} />}
      </div>
    );
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
