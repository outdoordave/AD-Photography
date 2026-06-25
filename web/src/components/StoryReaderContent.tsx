import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { buildStory, mdToHtml, wwYouTubeEmbed, normalizePath, type StoryData } from '../lib/stories';
import { ILLUS } from '../lib/illus';
import StoryAlbumBlock from './StoryAlbumBlock';
import Lightbox, { type LbPhoto } from './Lightbox';

// Kleine React-Insel: NUR die editierbaren Reader-Felder (Hero-Cover/Kategorie/
// Titel, Body, ggf. Album-Lightbox, YouTube). useTina liefert LIVE-Daten
// (aktualisiert beim Tippen in der Tina-Sidebar). data-tina-field = Klick auf der
// Seite -> springt zum passenden Feld. reader-nav (Vor/Zurueck) bleibt in Astro.
//
// Body wird ueber unseren mdToHtml-Port gerendert (nicht Tina-Rich-Text) ->
// Pullquote/Dropcap/Listen/Bilder identisch zur Live-Seite. Der Platzhalter
// [[album]] im Text wird durch den Album-Lightbox-Block ersetzt (frei platzierbar).
// Das verknuepfte Album wird DIREKT aus den useTina-Daten gelesen (linked_album ist
// im Tina-Fragment mit name/photos/_sys expandiert) -> erscheint sofort in der
// Live-Vorschau. Inline-Bilder im Beitrag oeffnen als Gruppe die Lightbox (wie Live).

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
};

const ALBUM_MARKER = '[[album]]';

export default function StoryReaderContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const story = (data.story ?? {}) as StoryData & Record<string, any>;

  const view = buildStory(story);
  const d = props.lang === 'en' ? view.en : view.de;
  const fTitle = props.lang === 'en' ? 'title_en' : 'title_de';
  const fCat = props.lang === 'en' ? 'category_en' : 'category_de';
  const fBody = props.lang === 'en' ? 'body_en' : 'body_de';

  const cover = story.cover ? normalizePath(story.cover) : '';
  const ytHtml = wwYouTubeEmbed(story.youtube_url || '');
  const phStyle = {
    ['--ph-c1' as any]: '#8a9a7e',
    ['--ph-c2' as any]: '#3a4a38',
    backgroundImage: `url('${ILLUS['mountains']}')`,
  } as React.CSSProperties;

  // --- Verknuepftes Album direkt aus den Live-Daten (linked_album expandiert) ---
  const la: any = story.linked_album;
  const albumPhotos: string[] = la && Array.isArray(la.photos) ? la.photos.filter(Boolean) : [];
  const albumName = props.lang === 'en' ? la?.name_en || la?.name || 'Album' : la?.name || 'Album';
  const albumSlug: string = la?._sys?.filename || '';
  const albumHref = (props.lang === 'en' ? '/en/portfolio/' : '/portfolio/') + albumSlug;
  const albumNode = albumPhotos.length ? (
    <StoryAlbumBlock
      name={albumName}
      photos={albumPhotos}
      href={albumHref}
      photoAlt={props.lang === 'en' ? `Photo from album ${albumName}` : `Foto aus Album ${albumName}`}
      linkLabel={props.lang === 'en' ? 'View full album →' : 'Ganzes Album ansehen →'}
      kicker={props.lang === 'en' ? 'Photo gallery' : 'Bildergalerie'}
    />
  ) : null;

  // --- Roh-Markdown (mit DE-Fallback wie buildStory), am [[album]]-Marker teilen ---
  const hasEN = story.has_english === true;
  const rawDe = (story.body_de || '').trim();
  const rawEn = (story.body_en || '').trim();
  const raw = props.lang === 'en' ? (hasEN ? rawEn || rawDe : rawDe) : rawDe;
  const segments = raw.split(ALBUM_MARKER);

  // Body rendern: Textstuecke (mdToHtml) + Album-Block an jeder Marker-Stelle.
  // Ohne Marker, aber mit Album: Block ans Ende anhaengen.
  const bodyChildren: any[] = [];
  segments.forEach((seg, i) => {
    bodyChildren.push(<div key={`seg-${i}`} dangerouslySetInnerHTML={{ __html: mdToHtml(seg) }} />);
    if (i < segments.length - 1 && albumNode) bodyChildren.push(<div key={`alb-${i}`}>{albumNode}</div>);
  });
  if (segments.length === 1 && albumNode) bodyChildren.push(<div key="alb-end">{albumNode}</div>);

  // --- Inline-Bilder im Beitrag klickbar machen -> Lightbox als Gruppe (wie Live,
  //     index.html ~2883: alle .reader-body img, blaetterbar). Album-Kacheln
  //     (.story-album-embed) sind ausgenommen (haben eigene Lightbox). ---
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  // --- Mobil (<=767): EIN Titel wandert beim Scrollen von groß/tief (Hero-Unterkante) nach klein/oben
  //     in eine sticky Zeile und schrumpft dabei. Strecke an die Hero-Höhe gekoppelt. Lange Titel
  //     werden so skaliert, dass sie EINZEILIG in die Breite passen (--st-scale-big), in der Zeile mit …
  //     gekürzt -> bricht nie. Fortschritt --st-m (0..1) via rAF-Lerp (magnetischer Nachlauf). ---
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const stTargetRef = React.useRef(0);
  const stSmoothRef = React.useRef(0);
  const stRafRef = React.useRef<number | null>(null);
  const stPrevTRef = React.useRef(0);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Glättung: frame-raten-unabhängig (echte Frame-Zeit dt) + Pro-Frame-k wächst mit dem Rückstand
    // (langsam -> sanft, schnell -> holt nahezu voll auf, kein Hinterherhinken). smoothstep glättet
    // den Übergang. Siehe TripTimeline (gleiche Technik).
    const ST_BASE = 0.14, ST_LAG_FULL = 0.4;
    const frameF = (k: number, dt: number) => 1 - Math.pow(1 - k, dt / 16.7);
    const apply = (m: number) => root.style.setProperty('--st-m', String(Math.round(m * 1000) / 1000));
    const measure = () => {
      const heroEl = heroRef.current;
      const h = heroEl ? heroEl.offsetHeight : window.innerHeight * 0.6;
      // (--st-bigY entfällt: die vertikale Wanderung macht jetzt natives Sticky, nicht mehr translateY.)
      // Großtitel-Skalierung: so groß wie möglich, aber einzeilig passend (Breite minus Rand). Die h1
      // liegt jetzt in .reader-hero-inner (Geschwister des Hero) -> von dort messen, nicht aus dem Hero.
      const titleEl = innerRef.current ? innerRef.current.querySelector('h1') as HTMLElement | null : null;
      const w = titleEl && titleEl.offsetWidth ? titleEl.offsetWidth : 1;
      const big = Math.max(1, Math.min(1.85, (window.innerWidth - 32) / w));
      root.style.setProperty('--st-scale-big', String(Math.round(big * 1000) / 1000));
      // Scroll-Strecke = native Sticky-Wanderung (bis der Titel andockt). STELLSCHRAUBE: ~ Hero-Höhe
      // minus Andock-/Lift-Offset; muss grob zur margin-top-Anhebung passen, damit der Titel fertig
      // geschrumpft ist, wenn er oben andockt.
      root.style.setProperty('--st-range', Math.max(140, Math.round(h - 100)) + 'px');
      return h;
    };
    const target = () => {
      const h = measure();
      const range = Math.max(140, h - 100); // = --st-range (native Sticky-Wanderstrecke)
      const r = Math.min(1, Math.max(0, window.scrollY / range));
      return r * r * (3 - 2 * r); // smoothstep
    };
    const step = (now: number) => {
      stRafRef.current = null;
      const prev = stPrevTRef.current; stPrevTRef.current = now;
      const dt = prev ? Math.min(48, Math.max(1, now - prev)) : 16.7;
      const t = stTargetRef.current;
      const lag = Math.abs(t - stSmoothRef.current);
      const k = ST_BASE + (1 - ST_BASE) * (() => { const r = Math.min(1, lag / ST_LAG_FULL); return r * r * (3 - 2 * r); })();
      const f = frameF(k, dt);
      let n = stSmoothRef.current + (t - stSmoothRef.current) * f;
      if (Math.abs(t - n) < 0.001) n = t;
      stSmoothRef.current = n; apply(n);
      if (n !== t) stRafRef.current = requestAnimationFrame(step);
      else stPrevTRef.current = 0;
    };
    // Scroll-Driven-Support (Mobil): CSS koppelt das Schrumpfen direkt an den Scroll (kein JS-Lerp).
    // JS misst dann nur Titelbreite/Hero-Höhe -> --st-scale-big/--st-range (Keyframe & animation-range
    // lesen diese Vars) und aktualisiert das bei resize. Kein Scroll-Listener (vertikal = natives Sticky).
    const sdaSupported = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: scroll()');
    if (sdaSupported && window.matchMedia('(max-width: 767px)').matches) {
      measure();
      const onResize = () => measure();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    const onScroll = () => {
      stTargetRef.current = target();
      if (reduce) { stSmoothRef.current = stTargetRef.current; apply(stSmoothRef.current); return; }
      if (stRafRef.current == null) stRafRef.current = requestAnimationFrame(step);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (stRafRef.current != null) cancelAnimationFrame(stRafRef.current);
    };
  }, []);

  // (Der frühere --st-ov-Overscroll-Effekt entfällt: der Titel liegt jetzt via .reader-hero-inner
  //  { position: sticky } im Fluss und federt NATIV mit dem Inhalt — kein JS-Nachjagen, kein Pendeln.)

  React.useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const imgs = Array.from(root.querySelectorAll('img')).filter(
      (im) => !im.closest('.story-album-embed')
    ) as HTMLImageElement[];
    const list = imgs.map((im) => im.getAttribute('src') || '').filter(Boolean);
    const cleanups: Array<() => void> = [];
    imgs.forEach((im, idx) => {
      im.style.cursor = 'zoom-in';
      const onClick = () => setLb({ photos: list.map((p) => ({ photo: normalizePath(p) })), start: idx });
      im.addEventListener('click', onClick);
      cleanups.push(() => im.removeEventListener('click', onClick));
    });
    return () => cleanups.forEach((fn) => fn());
  }, [raw, props.lang, albumPhotos.length]);

  return (
    <>
      {/* Mobile sticky Titel-Zeile (nur <=767, CSS): deckend, trägt die Zurück-Pille. Der Hero-Titel
          wandert beim Scrollen hier hinein (fixiert, via --st-m). Desktop: display:none. */}
      <div className="story-topline">
        <a className="story-back-line" href={props.lang === 'en' ? '/en/stories' : '/stories'}>← Stories</a>
      </div>
      <div className="reader-hero" ref={heroRef}>
        {cover ? (
          <img className="reader-cover-img" src={cover} alt={d.title} data-tina-field={tinaField(story, 'cover')} />
        ) : (
          <div className="ph has-illus" data-ph="PLATZHALTER" data-tina-field={tinaField(story, 'cover')} style={phStyle} />
        )}
      </div>
      {/* hero-inner ist jetzt GESCHWISTER des Hero (nicht mehr darin) -> Kind von #page-story (hoch).
          Mobil: position:sticky -> der Titel dockt an-und-bleibt UND federt nativ mit dem Inhalt (wie
          .tl-herohead in .tl-stage bei Reise). Desktop: per CSS absolut an den Hero-Unterrand
          zurückgesetzt -> Optik unverändert. */}
      <div className="reader-hero-inner" ref={innerRef}>
        <div className="meta" data-tina-field={tinaField(story, fCat)}>{d.cat}</div>
        <h1 data-tina-field={tinaField(story, fTitle)}>{d.title}</h1>
      </div>

      <div className="reader-body">
        <div ref={bodyRef} data-tina-field={tinaField(story, fBody)}>{bodyChildren}</div>

        {ytHtml ? <div data-tina-field={tinaField(story, 'youtube_url')} dangerouslySetInnerHTML={{ __html: ytHtml }} /> : null}
      </div>

      {lb ? (
        <Lightbox photos={lb.photos} startIndex={lb.start} albumName={d.title || ''} onClose={() => setLb(null)} />
      ) : null}
    </>
  );
}
