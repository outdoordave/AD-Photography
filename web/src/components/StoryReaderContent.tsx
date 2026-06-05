import { useTina, tinaField } from 'tinacms/dist/react';
import { buildStory, mdToHtml, wwYouTubeEmbed, normalizePath, type StoryData } from '../lib/stories';
import { ILLUS } from '../lib/illus';
import StoryAlbumBlock from './StoryAlbumBlock';

// Kleine React-Insel: NUR die editierbaren Reader-Felder (Hero-Cover/Kategorie/
// Titel, Body, ggf. Album-Lightbox, YouTube). useTina liefert LIVE-Daten
// (aktualisiert beim Tippen in der Tina-Sidebar). data-tina-field = Klick auf der
// Seite -> springt zum passenden Feld. reader-nav (Vor/Zurueck) bleibt in Astro.
//
// Body wird ueber unseren mdToHtml-Port gerendert (nicht Tina-Rich-Text) ->
// Pullquote/Dropcap/Listen/Bilder identisch zur Live-Seite. Der Platzhalter
// [[album]] im Text wird durch den Album-Lightbox-Block ersetzt (frei platzierbar).

type AlbumInfo = { name: string; photos: string[]; href: string } | null;

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
  album?: AlbumInfo;
};

const ALBUM_MARKER = '[[album]]';

export default function StoryReaderContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const story = (data.story ?? {}) as StoryData & Record<string, any>;
  const album = props.album ?? null;

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

  // Roh-Markdown (mit DE-Fallback wie buildStory), am [[album]]-Marker teilen.
  const hasEN = story.has_english === true;
  const rawDe = (story.body_de || '').trim();
  const rawEn = (story.body_en || '').trim();
  const raw = props.lang === 'en' ? (hasEN ? rawEn || rawDe : rawDe) : rawDe;
  const segments = raw.split(ALBUM_MARKER);

  // Album-Block-Knoten (oder null, wenn kein Album verknuepft / keine Fotos).
  const albumNode = album && (album.photos || []).filter(Boolean).length
    ? <StoryAlbumBlock name={album.name} photos={album.photos} href={album.href} linkLabel={props.lang === 'en' ? 'View full album →' : 'Ganzes Album ansehen →'} kicker={props.lang === 'en' ? 'Photo gallery' : 'Bildergalerie'} />
    : null;

  // Body rendern: Textstuecke (mdToHtml) + Album-Block an jeder Marker-Stelle.
  // Ohne Marker, aber mit Album: Block ans Ende anhaengen.
  const bodyChildren: any[] = [];
  segments.forEach((seg, i) => {
    bodyChildren.push(<div key={`seg-${i}`} dangerouslySetInnerHTML={{ __html: mdToHtml(seg) }} />);
    if (i < segments.length - 1 && albumNode) bodyChildren.push(<div key={`alb-${i}`}>{albumNode}</div>);
  });
  if (segments.length === 1 && albumNode) bodyChildren.push(<div key="alb-end">{albumNode}</div>);

  return (
    <>
      <div className="reader-hero">
        {cover ? (
          <img className="reader-cover-img" src={cover} alt="" data-tina-field={tinaField(story, 'cover')} />
        ) : (
          <div className="ph has-illus" data-ph="PLATZHALTER" data-tina-field={tinaField(story, 'cover')} style={phStyle} />
        )}
        <div className="reader-hero-inner">
          <div className="meta" data-tina-field={tinaField(story, fCat)}>{d.cat}</div>
          <h1 data-tina-field={tinaField(story, fTitle)}>{d.title}</h1>
        </div>
      </div>

      <div className="reader-body">
        <div data-tina-field={tinaField(story, fBody)}>{bodyChildren}</div>

        {ytHtml ? <div data-tina-field={tinaField(story, 'youtube_url')} dangerouslySetInnerHTML={{ __html: ytHtml }} /> : null}
      </div>
    </>
  );
}
