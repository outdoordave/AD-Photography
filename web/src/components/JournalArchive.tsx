import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import RichText from './RichText';
import { socialIcon } from '../lib/socialIcons';
import {
  sortJournalNodes, journalHeading, journalHasTitle, formatFullDate, journalText,
  journalFirstPhoto, parseGeoPoint, resolveLinkedContent, resolveSocial, journalLink,
} from '../lib/journal';

// Journal-Archiv als kleine React-Insel — damit die Besucher-Seite /journal in der CMS-Vorschau
// bearbeitbar ist: Klick auf einen Eintrag springt zu dessen Feld (data-tina-field), und weil es
// eine CONNECTION-Query ist, registriert sich pro Eintrag ein Formular -> Tina zeigt links die
// „Auswahl der aktuellen Journals". BEWUSST OHNE experimental___selectFormByFormId (Connection ->
// würde undefined posten und die Auswahl löschen; s. GalleryContent-Lehre).
type Props = { query: string; variables: object; data: any; lang: 'de' | 'en'; prefix?: string; styleName?: string };

const STYLES = ['stream', 'plain', 'card', 'notes'];

export default function JournalArchive(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const lang = props.lang;
  const prefix = props.prefix || '';
  const style = STYLES.includes(props.styleName || '') ? props.styleName : 'stream';
  const nodes = sortJournalNodes(((data as any).journalConnection?.edges ?? []).map((e: any) => e?.node).filter(Boolean));

  if (!nodes.length) return <p className="journal-empty">{lang === 'en' ? 'No entries yet.' : 'Noch keine Einträge.'}</p>;

  return (
    <ol className={`journal-list journal-style-${style}`}>
      {nodes.map((j: any) => {
        const slug = j._sys.filename;
        const text = journalText(j, lang);
        const photo = journalFirstPhoto(j);
        const point = parseGeoPoint(j.location);
        const linked = resolveLinkedContent(j, lang);
        const social = resolveSocial(j, lang);
        const extLink = journalLink(j, lang);
        const fTitle = lang === 'en' ? 'title_en' : 'title_de';
        const fText = lang === 'en' ? 'text_en' : 'text_de';
        return (
          <li className="journal-item" key={slug}>
            <a className="journal-item-head" href={`${prefix}/journal/${slug}`}>
              <span className="ji-title" data-tina-field={tinaField(j, fTitle)}>{journalHeading(j, lang)}</span>
              {journalHasTitle(j, lang) ? <span className="ji-date" data-tina-field={tinaField(j, 'date')}>{formatFullDate(j.date || '', lang)}</span> : null}
            </a>
            {text ? <div className="journal-item-text ww-rich" data-tina-field={tinaField(j, fText)}><RichText value={text} /></div> : null}
            {(photo || point || social || linked || j.youtube_url || extLink) ? (
              <div className="journal-item-media">
                {photo ? <a className="jm-thumb" href={`${prefix}/journal/${slug}`} data-tina-field={tinaField(j, 'photos')}><img src={photo} alt="" loading="lazy" /></a> : null}
                {point ? <span className="jm-badge" title={lang === 'en' ? 'Location' : 'Standort'} aria-label={lang === 'en' ? 'Location' : 'Standort'} data-tina-field={tinaField(j, 'location')}>📍</span> : null}
                {social ? <span className="jm-badge jm-social" title={social.platform} aria-label={social.platform} data-tina-field={tinaField(j, 'social')} dangerouslySetInnerHTML={{ __html: socialIcon(social.platform) }} /> : null}
                {linked ? <span className="jm-badge jm-linked" data-tina-field={tinaField(j, 'linked_content')}>{linked.typeLabel}</span> : null}
                {j.youtube_url ? <span className="jm-badge" title="Video" aria-label="Video" data-tina-field={tinaField(j, 'youtube_url')}>▶</span> : null}
                {extLink ? <span className="jm-badge" title="Link" aria-label="Link" data-tina-field={tinaField(j, 'link')}>↗</span> : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
