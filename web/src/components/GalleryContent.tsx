import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { normalizePath } from '../lib/stories';
import { ILLUS } from '../lib/illus';
import {
  sortAlbums, albumPhotos, tl,
  type RawAlbum, type Lang, type GalleryMode, type ViewPhoto,
} from '../lib/albums';

// Galerie-Insel (Vollausbau, 1:1 aus index.html): Modus-Leiste (Alben/Neueste/A–Z),
// Album-Karten mit Auto-Diashow (Snap-Bahn, Autoplay 4 s, Pfeile, Klick→Lightbox),
// Flach-Modi (alle Fotos sortiert), Kacheln mit Hover-Name, Lightbox (abgenommene
// Komponente). Daten via useTina(albenConnection) -> Live-Vorschau + data-tina-field.

type Modes = { album?: boolean; chronological?: boolean; alphabetical?: boolean };
type Props = { query: string; variables: object; data: any; lang: Lang; modes?: Modes };

export type LbState = { photos: LbPhoto[]; start: number; album: string } | null;

// ---- Platzhalter-Medienbox: Palette/Illustration + echtes Bild (wie wwMediaBox) ----
export function MediaBox({ ph }: { ph: ViewPhoto }) {
  const src = ph.image ? normalizePath(ph.image) : '';
  const style = {
    ['--ph-c1' as any]: ph.c1,
    ['--ph-c2' as any]: ph.c2,
    backgroundImage: ILLUS[ph.img] ? `url('${ILLUS[ph.img]}')` : undefined,
  } as React.CSSProperties;
  return (
    <div className={`ph ww-photo${src ? '' : ' has-illus'}`} style={src ? undefined : style}>
      {src ? <img src={src} alt="" loading="lazy" /> : null}
    </div>
  );
}

// ---- Eine Galerie-Kachel (Foto eines Albums) + Hover-Albumname ----
export function Tile({ albName, ph, onOpen }: { albName: string; ph: ViewPhoto; onOpen: () => void }) {
  return (
    <div className="item" onClick={onOpen}>
      <MediaBox ph={ph} />
      <div className="tile-hover">{albName}</div>
    </div>
  );
}

// ---- Album-Diashow (zugeklappte Karte): Snap-Bahn + Autoplay 4 s + Pfeile + Klick→LB ----
function AlbumSlideshow({ photos, onOpenAt }: { photos: ViewPhoto[]; onOpenAt: (i: number) => void }) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const autoRef = React.useRef<number | null>(null);

  function currentCell(): number {
    const track = trackRef.current;
    if (!track) return 0;
    const cells = track.children;
    const sl = track.scrollLeft;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < cells.length; i++) {
      const d = Math.abs((cells[i] as HTMLElement).offsetLeft - sl);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function scrollToCell(n: number, smooth: boolean) {
    const track = trackRef.current;
    const c = track && (track.children[n] as HTMLElement);
    if (c) track!.scrollTo({ left: c.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }
  function stopAuto() {
    if (autoRef.current) { window.clearInterval(autoRef.current); autoRef.current = null; }
  }
  function startAuto() {
    if (photos.length <= 1) return;
    stopAuto();
    autoRef.current = window.setInterval(() => {
      const nx = currentCell() + 1;
      if (nx >= photos.length) scrollToCell(0, false); // am Ende instant zurueck
      else scrollToCell(nx, true);
    }, 4000);
  }

  React.useEffect(() => {
    startAuto();
    return stopAuto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  return (
    <div className="album-slideshow">
      <div
        className="album-track"
        ref={trackRef}
        onClick={() => onOpenAt(currentCell())}
        onPointerDown={stopAuto}
        onWheel={(e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stopAuto(); }}
      >
        {photos.map((p, i) => {
          const src = normalizePath(p.image);
          return (
            <div
              className="album-cell"
              key={i}
              style={src ? { backgroundImage: `url('${src}')` } : undefined}
            />
          );
        })}
      </div>
      {photos.length > 1 && (
        <>
          <button
            className="album-slide-arrow prev" type="button" aria-label="Vorheriges"
            onClick={(e) => { e.stopPropagation(); stopAuto(); scrollToCell(Math.max(0, currentCell() - 1), true); }}
          >‹</button>
          <button
            className="album-slide-arrow next" type="button" aria-label="Nächstes"
            onClick={(e) => { e.stopPropagation(); stopAuto(); scrollToCell(Math.min(photos.length - 1, currentCell() + 1), true); }}
          >›</button>
        </>
      )}
    </div>
  );
}

const MODE_LABELS: Record<GalleryMode, { de: string; en: string }> = {
  album: { de: 'Alben', en: 'Albums' },
  chronological: { de: 'Neueste', en: 'Newest' },
  alphabetical: { de: 'A–Z', en: 'A–Z' },
};

export default function GalleryContent(props: Props) {
  const { lang } = props;
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const hrefPrefix = lang === 'en' ? '/en' : '';

  const albums = React.useMemo(() => {
    const edges = (data as any)?.albenConnection?.edges || [];
    return sortAlbums(
      edges.filter(Boolean).map((e: any) => ({ slug: e?.node?._sys?.filename || '', data: (e?.node || {}) as RawAlbum }))
    );
  }, [data]);

  // Sichtbare Modi aus den Einstellungen (Fallback: alle an). Ist nichts an -> nur Alben.
  const modes: Modes = props.modes && (props.modes.album || props.modes.chronological || props.modes.alphabetical)
    ? props.modes
    : { album: true, chronological: false, alphabetical: false };
  const order: GalleryMode[] = ['album', 'chronological', 'alphabetical'];
  const visible = order.filter((m) => !!modes[m]);
  const showBar = visible.length > 1;

  const [mode, setMode] = React.useState<GalleryMode>(visible[0] || 'album');
  const [lb, setLb] = React.useState<LbState>(null);

  const albName = (a: { data: RawAlbum }) => tl(a.data.name, lang);

  function openAlbumLightbox(photos: ViewPhoto[], start: number, name: string) {
    if (!photos.length) return;
    setLb({ photos: photos.map((p) => ({ photo: normalizePath(p.image) })), start, album: name });
  }

  // Flache, sortierte Foto-Liste fuer die Flach-Modi (Neueste/A–Z).
  type FlatItem = { alb: { slug: string; data: RawAlbum }; ph: ViewPhoto; photos: ViewPhoto[] };
  const flat: FlatItem[] = React.useMemo(() => {
    const list: FlatItem[] = [];
    for (const alb of albums) {
      const photos = albumPhotos(alb.data);
      for (const ph of photos) list.push({ alb, ph, photos });
    }
    if (mode === 'alphabetical') {
      list.sort((a, b) => {
        const c = albName(a.alb).localeCompare(albName(b.alb));
        if (c !== 0) return c;
        return a.ph.idx - b.ph.idx;
      });
    } else if (mode === 'chronological') {
      list.sort((a, b) => {
        const c = (b.alb.data.date || '').localeCompare(a.alb.data.date || '');
        if (c !== 0) return c;
        return a.ph.idx - b.ph.idx;
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albums, mode, lang]);

  return (
    <>
      {showBar && (
        <div className="filter-bar" id="galleryModes">
          {visible.map((m) => (
            <button key={m} className={m === mode ? 'active' : ''} data-mode={m} onClick={() => setMode(m)}>
              {MODE_LABELS[m][lang]}
            </button>
          ))}
        </div>
      )}

      {mode === 'album' ? (
        <div id="galleryGrid" className="album-mode">
          {albums.map((alb) => {
            const photos = albumPhotos(alb.data);
            const name = albName(alb);
            const note = tl(alb.data.note, lang);
            return (
              <div className="album-section" key={alb.slug}>
                <div className="album-head">
                  <a className="album-head-text" href={`${hrefPrefix}/portfolio/${alb.slug}`}>
                    <h3 className="gallery-group-title" data-tina-field={tinaField(alb.data as any, 'name')}>
                      {name}
                      <span className="album-go-arrow" aria-hidden="true"> →</span>
                      <span className="album-go-count">{photos.length}</span>
                    </h3>
                    {note ? <p className="album-note" data-tina-field={tinaField(alb.data as any, 'note')}>{note}</p> : null}
                  </a>
                </div>
                <div className="album-body">
                  <AlbumSlideshow photos={photos} onOpenAt={(i) => openAlbumLightbox(photos, i, name)} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div id="galleryGrid">
          <div className="gallery">
            {flat.map((it, k) => (
              <Tile
                key={it.alb.slug + ':' + it.ph.idx + ':' + k}
                albName={albName(it.alb)}
                ph={it.ph}
                onOpen={() => openAlbumLightbox(it.photos, it.photos.indexOf(it.ph), albName(it.alb))}
              />
            ))}
          </div>
        </div>
      )}

      {lb && (
        <Lightbox
          photos={lb.photos}
          startIndex={lb.start}
          albumName={lb.album}
          loop
          onClose={() => setLb(null)}
        />
      )}
    </>
  );
}
