import { useTina, tinaField } from 'tinacms/dist/react';
import RichText, { pickRich } from './RichText';

// Rechtstext-Seiten (Datenschutz / Impressum) als React-Insel — wie ContactContent:
// useTina = LIVE-Daten, data-tina-field = Klick-ins-Feld. Body ist Markdown (oder rohes
// HTML aus einem Generator) und wird über unseren mdToHtml-Port gerendert. EN fällt auf DE
// zurück (Rechtstexte sind i. d. R. deutsch maßgeblich).

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
  docKey: 'datenschutz' | 'impressum';
};

export default function LegalContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const d = (data[props.docKey] ?? {}) as Record<string, any>;
  const lang = props.lang;
  const t = (base: string) => { const de = d[base + '_de'], en = d[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };
  const tf = (base: string) => tinaField(d, (lang === 'en' ? base + '_en' : base + '_de') as any);

  const updated = t('updated');

  return (
    <section>
      <div className="wrap">
        <div className="page-title">
          <h1 data-tina-field={tf('title')}>{t('title')}</h1>
          {updated ? <p className="legal-updated">{updated}</p> : null}
        </div>
        <div className="reader-body legal-body" data-tina-field={tf('body')}>
          <RichText value={pickRich(d.body_de, d.body_en, lang === 'en')} />
        </div>
      </div>
    </section>
  );
}
