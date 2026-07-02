import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import RichText, { richIsEmpty } from './RichText';
import Lightbox, { type LbPhoto } from './Lightbox';
import JournalMap from './JournalMap';
import { selectActiveFormId } from '../lib/tinaForm';
import { socialIcon } from '../lib/socialIcons';
import { wwYouTubeEmbed, normalizePath } from '../lib/stories';
import {
  type JournalData, parseGeoPoint, formatFullDate, journalHeading, journalHasTitle,
  journalText, journalLink, resolveLinkedContent, resolveSocial,
} from '../lib/journal';

// Journal-Detail als kleine React-Insel (Tina-Live-Vorschau + Klick-zum-Feld), analog
// StoryReaderContent. Minimal: Datum/Titel + Text; angehängte Medien (Fotos-Lightbox,
// echte Karte, YouTube, verknüpfter Inhalt, Social-Karte) nur wenn vorhanden — keine
// erzwungene Bildfläche für Ein-Satz-Einträge.
type Props = { query: string; variables: object; data: any; lang: 'de' | 'en'; mapStyle?: string };

export default function JournalEntryContent(props: Props) {
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Vorschau-Navigation: Sidebar links automatisch auf dieses Journal-Dokument schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const j = (data.journal ?? {}) as JournalData & Record<string, any>;
  const lang = props.lang;

  const heading = journalHeading(j, lang);
  const hasTitle = journalHasTitle(j, lang);
  const dateLabel = formatFullDate(j.date || '', lang);
  const textAst = journalText(j, lang);
  const photos = (Array.isArray(j.photos) ? j.photos.filter(Boolean) : []) as string[];
  const point = parseGeoPoint(j.location);
  const ytHtml = wwYouTubeEmbed(j.youtube_url || '');
  const link = journalLink(j, lang);
  const linked = resolveLinkedContent(j, lang);
  const social = resolveSocial(j, lang);

  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);
  const fTitle = lang === 'en' ? 'title_en' : 'title_de';
  const fText = lang === 'en' ? 'text_en' : 'text_de';
  const openLb = (start: number) => setLb({ photos: photos.map((x) => ({ photo: normalizePath(x) })), start });

  return (
    <article className="journal-entry">
      <div className="journal-head">
        <h1 data-tina-field={tinaField(j, fTitle)}>{heading}</h1>
        {hasTitle ? <div className="journal-date" data-tina-field={tinaField(j, 'date')}>{dateLabel}</div> : null}
      </div>

      {textAst && !richIsEmpty(textAst) ? (
        <div className="journal-text ww-rich" data-tina-field={tinaField(j, fText)}><RichText value={textAst} /></div>
      ) : null}

      {photos.length ? (
        <div className="journal-photos" data-tina-field={tinaField(j, 'photos')}>
          {photos.map((p, i) => (
            <button key={p + i} type="button" className="journal-photo" onClick={() => openLb(i)} aria-label="Foto vergrößern">
              <img src={normalizePath(p)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}

      {point ? (
        <div className="journal-map-wrap" data-tina-field={tinaField(j, 'location')}>
          <JournalMap lon={point.lon} lat={point.lat} styleName={props.mapStyle || 'liberty'} />
        </div>
      ) : null}

      {ytHtml ? <div className="journal-yt" data-tina-field={tinaField(j, 'youtube_url')} dangerouslySetInnerHTML={{ __html: ytHtml }} /> : null}

      {linked ? (
        <a className={`journal-linkcard journal-linkcard--${linked.kind}`} href={linked.href} data-tina-field={tinaField(j, 'linked_content')}>
          {linked.cover ? <span className="jl-cover"><img src={linked.cover} alt="" loading="lazy" /></span> : null}
          <span className="jl-body">
            <span className="jl-type">{linked.typeLabel}</span>
            <span className="jl-title">{linked.title}</span>
          </span>
        </a>
      ) : null}

      {social ? (
        <a className={`journal-social journal-social--${social.platform}`} href={social.url} target="_blank" rel="noopener noreferrer" data-tina-field={tinaField(j, 'social')}>
          {social.thumbnail ? <span className="js-thumb"><img src={social.thumbnail} alt="" loading="lazy" /></span> : null}
          <span className="js-body">
            <span className="js-plat"><span className="js-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: socialIcon(social.platform) }} />{social.platform === 'tiktok' ? 'TikTok' : 'Instagram'}</span>
            {social.caption ? <span className="js-cap">{social.caption}</span> : null}
            <span className="js-open">{lang === 'en' ? 'View post ↗' : 'Beitrag ansehen ↗'}</span>
          </span>
        </a>
      ) : null}

      {link ? (
        <a className="journal-extlink" href={link.url} target="_blank" rel="noopener noreferrer" data-tina-field={tinaField(j, 'link')}>{link.label} ↗</a>
      ) : null}

      {lb ? <Lightbox photos={lb.photos} startIndex={lb.start} albumName={heading} onClose={() => setLb(null)} /> : null}
    </article>
  );
}
