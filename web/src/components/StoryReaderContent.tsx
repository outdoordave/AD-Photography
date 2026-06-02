import { useTina, tinaField } from 'tinacms/dist/react';
import { buildStory, wwYouTubeEmbed, normalizePath, type StoryData } from '../lib/stories';
import { ILLUS } from '../lib/illus';

// Kleine React-Insel: NUR die editierbaren Reader-Felder (Hero-Cover/Kategorie/
// Titel, Body, Galerie, YouTube). useTina liefert LIVE-Daten (aktualisiert beim
// Tippen in der Tina-Sidebar). data-tina-field = Klick auf der Seite -> springt
// zum passenden Feld. reader-nav (Vor/Zurueck) bleibt ausserhalb in Astro.
//
// Body wird bewusst ueber unseren mdToHtml-Port gerendert (nicht Tina-Rich-Text)
// -> Pullquote/Dropcap/Listen/Bilder identisch zur Live-Seite.

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
};

export default function StoryReaderContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const story = (data.story ?? {}) as StoryData & Record<string, any>;

  const view = buildStory(story);
  const d = props.lang === 'en' ? view.en : view.de;
  const fTitle = props.lang === 'en' ? 'title_en' : 'title_de';
  const fCat = props.lang === 'en' ? 'category_en' : 'category_de';
  const fBody = props.lang === 'en' ? 'body_en' : 'body_de';

  const cover = story.cover ? normalizePath(story.cover) : '';
  const gallery: string[] = Array.isArray(story.gallery) ? story.gallery.filter(Boolean) : [];
  const ytHtml = wwYouTubeEmbed(story.youtube_url || '');
  const phStyle = {
    ['--ph-c1' as any]: '#8a9a7e',
    ['--ph-c2' as any]: '#3a4a38',
    backgroundImage: `url('${ILLUS['mountains']}')`,
  } as React.CSSProperties;

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
        <div data-tina-field={tinaField(story, fBody)} dangerouslySetInnerHTML={{ __html: d.bodyHtml }} />

        {gallery.length ? (
          <div className="story-gallery" data-tina-field={tinaField(story, 'gallery')}>
            {gallery.map((src, i) => (
              <img key={i} src={normalizePath(src)} alt="" loading="lazy" />
            ))}
          </div>
        ) : null}

        {ytHtml ? <div data-tina-field={tinaField(story, 'youtube_url')} dangerouslySetInnerHTML={{ __html: ytHtml }} /> : null}
      </div>
    </>
  );
}
