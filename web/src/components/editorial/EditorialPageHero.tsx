import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../../lib/tinaForm';

// Editorial-Unterseiten-Hero als LIVE-Insel (Editierbarkeits-Parität zum klassischen Design):
// useTina liefert Kicker/Titel/Intro live (Tippen in der Sidebar aktualisiert die Vorschau),
// data-tina-field = Klick aufs Element springt zum Feld. Das Hero-Bild kommt als Prop aus
// der Seite (abgeleitet aus echten Inhalten); Parallax/Scrim wie gehabt über die ed-*-Klassen
// + EditorialMotion (data-ed-hero-img/-content). Nur vorhandene Felder -> kein Re-Index nötig.

type Props = {
  query: string; variables: object; data: any;
  docKey: string;               // z. B. 'stories_settings' | 'galerie_settings' | 'gear' | 'ueber_uns' …
  lang: 'de' | 'en';
  img?: string;                 // Hero-Bild (bereits normalisiert)
  titleFallback?: string;
  children?: React.ReactNode;   // optionale Extras unter dem Intro (z. B. Equipment-Sprungpillen)
};

export default function EditorialPageHero(props: Props) {
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Sidebar folgt der Vorschau: Formular dieses Settings-Dokuments aktiv schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const d = ((data as any)?.[props.docKey] ?? {}) as Record<string, any>;
  const isEn = props.lang === 'en';
  const t = (base: string) => (isEn ? d[base + '_en'] || d[base + '_de'] || '' : d[base + '_de'] || '');
  const tf = (base: string) => tinaField(d, (isEn ? base + '_en' : base + '_de') as any);

  const title = t('title') || props.titleFallback || '';
  const kicker = t('kicker');
  const intro = t('intro');

  return (
    <header className="ed-page-hero">
      <div className="ed-page-hero-img" data-ed-hero-img>
        {props.img ? <img src={props.img} alt="" fetchPriority="high" decoding="async" /> : null}
      </div>
      <div className="ed-page-hero-scrim" aria-hidden="true" />
      <div className="ed-page-hero-content" data-ed-hero-content>
        {kicker ? <p className="ed-kicker" data-tina-field={tf('kicker')}>{kicker}</p> : null}
        <h1 className="ed-page-title" data-tina-field={tf('title')}>{title}</h1>
        {intro ? <p className="ed-page-sub" data-tina-field={tf('intro')}>{intro}</p> : null}
        {props.children}
      </div>
    </header>
  );
}
