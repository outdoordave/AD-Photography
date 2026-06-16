import { useTina, tinaField } from 'tinacms/dist/react';
import { bi, type Lang } from '../lib/albums';

// Sektion-Überschrift (Kicker + H2) als LIVE-Insel (useTina startseite). Feldnamen:
// sections.<key>_kicker_de/en + sections.<key>_title_de/en. data-tina-field -> Klick.

type Props = { query: string; variables: object; data: any; lang: Lang; sectionKey: 'gallery' | 'latest' | 'discover' };

export default function HomeSectionHead(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const st = (data?.startseite ?? {}) as Record<string, any>;
  const sec = (st.sections ?? {}) as Record<string, any>;
  const lang = props.lang;
  const isEn = lang === 'en';
  const k = props.sectionKey;
  const tf = (base: string) => tinaField(sec, (isEn ? base + '_en' : base + '_de') as any);

  return (
    <div className="section-head" style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
      <div className="kicker" data-tina-field={tf(`${k}_kicker`)}>{bi(sec, `${k}_kicker`, lang)}</div>
      <h2 data-tina-field={tf(`${k}_title`)}>{bi(sec, `${k}_title`, lang)}</h2>
    </div>
  );
}
