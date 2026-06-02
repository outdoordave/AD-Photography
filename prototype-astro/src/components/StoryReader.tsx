import { useTina, tinaField } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';

// Extrahiert die 11-stellige YouTube-ID (wie auf der echten Seite).
function youTubeId(url?: string | null): string {
  if (!url) return '';
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : '';
}

type Props = {
  query: string;
  variables: object;
  data: any;
};

// React-Insel: useTina liefert LIVE-Daten (aktualisiert sich, waehrend man in
// der Tina-Sidebar tippt). data-tina-field = Klick-auf-der-Seite -> springt zum
// Feld. Genau das ist der Punkt, den dieser Prototyp testen soll.
export default function StoryReader(props: Props) {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });

  const story = data.story;
  const ytId = youTubeId(story.youtube_url);
  const gallery: string[] = Array.isArray(story.gallery) ? story.gallery.filter(Boolean) : [];

  return (
    <article>
      <div className="reader-hero">
        {story.cover ? (
          <img
            className="reader-cover-img"
            src={story.cover}
            alt=""
            data-tina-field={tinaField(story, 'cover')}
          />
        ) : null}
        <div className="reader-hero-inner">
          {story.category_de ? (
            <div className="meta" data-tina-field={tinaField(story, 'category_de')}>
              {story.category_de}
            </div>
          ) : null}
          <h1 data-tina-field={tinaField(story, 'title_de')}>{story.title_de}</h1>
        </div>
      </div>

      <div className="reader-body">
        <div data-tina-field={tinaField(story, 'body')}>
          <TinaMarkdown content={story.body} />
        </div>

        {gallery.length ? (
          <div className="proto-gallery" data-tina-field={tinaField(story, 'gallery')}>
            {gallery.map((src, i) => (
              <img key={i} src={src} alt="" />
            ))}
          </div>
        ) : null}

        {ytId ? (
          <div className="yt-embed" data-tina-field={tinaField(story, 'youtube_url')}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
