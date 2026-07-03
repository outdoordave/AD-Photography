import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
import RichText from './RichText';
import { socialIcon } from '../lib/socialIcons';
import {
  sortJournalNodes, partitionJournal, journalHeading, journalHasTitle, formatFullDate, journalText,
  journalFirstPhoto, parseGeoPoint, resolveLinkedContent, resolveSocial, journalLink,
} from '../lib/journal';

// MapLibre erst laden, wenn die Standort-Lightbox geöffnet wird (hält das Journal-Bundle schlank).
const JournalMap = React.lazy(() => import('./JournalMap'));

// Journal-Archiv als React-Insel — damit /journal in der CMS-Vorschau editierbar ist.
// ZWEI useTina-Quellen (zwei verschiedene Dokumente, daher keine Formular-Dopplung):
//   • journal_settings (Einzeldoc) -> Kopf-Texte, Listen-Stil UND Archiv-Schwelle LIVE.
//     Nur HIER experimental___selectFormByFormId (Einzeldoc) -> Sidebar folgt der Vorschau.
//   • journalConnection -> die Einträge live (Klick auf ein Feld springt dorthin; pro Eintrag
//     ein Formular = „Auswahl der aktuellen Journals" links). BEWUSST OHNE Selektor (Connection).
// Listen-Symbole: LIVE echte Links/Buttons (Album/Reise öffnen, Pin -> Karten-Lightbox, Pfeil/Social
// -> Link); IM EDITOR (iframe) bleiben es Spans mit data-tina-field (Klick = zum Feld springen).
type Props = {
  query: string; variables: object; data: any;
  setQuery: string; setVariables: object; setData: any;
  lang: 'de' | 'en'; prefix?: string;
};

const STYLES = ['stream', 'plain', 'card', 'notes'];
const NEW_HREF = '/admin/index.html#/collections/new/journal';

export default function JournalArchive(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const { data: sdata } = useTina({
    query: props.setQuery, variables: props.setVariables, data: props.setData,
    experimental___selectFormByFormId: () => selectActiveFormId(props.setData),
  });
  const lang = props.lang;
  const prefix = props.prefix || '';
  const isEn = lang === 'en';

  // Im Editor-iframe (self !== top) -> Symbole als Feld-Sprung; live -> echte Links/Aktionen.
  const [isEditor, setIsEditor] = React.useState(false);
  React.useEffect(() => { try { setIsEditor(window.self !== window.top); } catch { setIsEditor(true); } }, []);

  // Standort-Lightbox (OpenFreeMap-Karte).
  const [mapPoint, setMapPoint] = React.useState<{ lon: number; lat: number } | null>(null);
  React.useEffect(() => {
    if (!mapPoint) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMapPoint(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapPoint]);

  const s = (sdata as any)?.journal_settings ?? {};
  const style = STYLES.includes(s.journal_style) ? s.journal_style : 'stream';
  const months = Number(s.archive_after_months) || 0;
  const t = (de: any, en: any) => (isEn ? en || de || '' : de || '');
  const sf = (base: string) => tinaField(s, (isEn ? base + '_en' : base + '_de') as any);

  const nodes = sortJournalNodes(((data as any).journalConnection?.edges ?? []).map((e: any) => e?.node).filter(Boolean));
  const { main, archive } = partitionJournal(nodes as any[], months);

  const renderItem = (j: any) => {
    const slug = j._sys.filename;
    const text = journalText(j, lang);
    const photo = journalFirstPhoto(j);
    const point = parseGeoPoint(j.location);
    const linked = resolveLinkedContent(j, lang);
    const social = resolveSocial(j, lang);
    const extLink = journalLink(j, lang);
    const fTitle = isEn ? 'title_en' : 'title_de';
    const fText = isEn ? 'text_en' : 'text_de';
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

            {point ? (isEditor
              ? <span className="jm-badge" title={isEn ? 'Location' : 'Standort'} aria-label={isEn ? 'Location' : 'Standort'} data-tina-field={tinaField(j, 'location')}>📍</span>
              : <button type="button" className="jm-badge" title={isEn ? 'Open map' : 'Karte öffnen'} aria-label={isEn ? 'Open map' : 'Karte öffnen'} onClick={() => setMapPoint(point)}>📍</button>
            ) : null}

            {social ? (isEditor
              ? <span className="jm-badge jm-social" title={social.platform} aria-label={social.platform} data-tina-field={tinaField(j, 'social')} dangerouslySetInnerHTML={{ __html: socialIcon(social.platform) }} />
              : <a className="jm-badge jm-social" href={social.url} target="_blank" rel="noopener" title={social.platform} aria-label={social.platform} dangerouslySetInnerHTML={{ __html: socialIcon(social.platform) }} />
            ) : null}

            {linked ? (isEditor
              ? <span className="jm-badge jm-linked" data-tina-field={tinaField(j, 'linked_content')}>{linked.typeLabel}</span>
              : <a className="jm-badge jm-linked" href={linked.href}>{linked.typeLabel}</a>
            ) : null}

            {j.youtube_url ? (isEditor
              ? <span className="jm-badge" title="Video" aria-label="Video" data-tina-field={tinaField(j, 'youtube_url')}>▶</span>
              : <a className="jm-badge" href={j.youtube_url} target="_blank" rel="noopener" title="Video" aria-label="Video">▶</a>
            ) : null}

            {extLink ? (isEditor
              ? <span className="jm-badge" title="Link" aria-label="Link" data-tina-field={tinaField(j, 'link')}>↗</span>
              : <a className="jm-badge" href={extLink.url} target="_blank" rel="noopener" title={extLink.label || 'Link'} aria-label="Link">↗</a>
            ) : null}
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <>
      <div className="page-title">
        <div className="kicker" data-tina-field={sf('kicker')}>{t(s.kicker_de, s.kicker_en)}</div>
        <h1 data-tina-field={sf('title')}>{t(s.title_de, s.title_en)}</h1>
        <p data-tina-field={sf('intro')}>{t(s.intro_de, s.intro_en)}</p>
      </div>

      <a className="ww-admin-only journal-new-btn" hidden href={NEW_HREF}>{isEn ? '+ New entry' : '+ Neuer Beitrag'}</a>

      {main.length === 0 && archive.length === 0 ? (
        <p className="journal-empty">{isEn ? 'No entries yet.' : 'Noch keine Einträge.'}</p>
      ) : (
        <>
          <ol className={`journal-list journal-style-${style}`}>{main.map(renderItem)}</ol>
          {archive.length > 0 ? (
            <details className="journal-arch-fold">
              <summary>{isEn ? `Archive (${archive.length})` : `Archiv (${archive.length})`}</summary>
              <ol className={`journal-list journal-style-${style}`}>{archive.map(renderItem)}</ol>
            </details>
          ) : null}
        </>
      )}

      {mapPoint ? (
        <div className="journal-map-lb" role="dialog" aria-modal="true" onClick={() => setMapPoint(null)}>
          <div className="jmlb-inner" onClick={(e) => e.stopPropagation()}>
            <button className="jmlb-close" type="button" onClick={() => setMapPoint(null)} aria-label={isEn ? 'Close' : 'Schließen'}>✕</button>
            <React.Suspense fallback={<div style={{ padding: 20, color: 'var(--c-ink-soft)' }}>…</div>}>
              <JournalMap lon={mapPoint.lon} lat={mapPoint.lat} />
            </React.Suspense>
          </div>
        </div>
      ) : null}
    </>
  );
}
