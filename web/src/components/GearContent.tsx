import { useTina, tinaField } from 'tinacms/dist/react';
import { groupGear, safeUrl, type GearItem } from '../lib/gear';

// Gear als kleine React-Insel (wie StoryReaderContent): useTina liefert LIVE-Daten
// (aktualisiert beim Tippen in der Tina-Sidebar), data-tina-field = Klick auf der
// Seite springt zum passenden Feld. Render-Logik 1:1 wie renderGear (Reihenfolge,
// Link-vs-kein-Link, „↗" per CSS). Astro rendert die Insel beim Build statisch vor
// (Besucher sehen volles HTML), im Tina-Editor hydratisiert sie fuer die Vorschau.

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
};

export default function GearContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const gear = (data.gear ?? {}) as Record<string, any>;
  const lang = props.lang;
  const t = (obj: any) => (obj ? (lang === 'en' ? obj.en : obj.de) : '');

  const items: GearItem[] = Array.isArray(gear.items) ? gear.items : [];
  const groups = groupGear(items);

  return (
    <>
      <div className="page-title">
        <div className="kicker" data-tina-field={tinaField(gear, 'kicker')}>{t(gear.kicker)}</div>
        <h1 data-tina-field={tinaField(gear, 'title')}>{t(gear.title)}</h1>
        <p data-tina-field={tinaField(gear, 'intro')}>{t(gear.intro)}</p>
      </div>

      <div className="gear-list" data-tina-field={tinaField(gear, 'items')}>
        {groups.map((g) => (
          <div className="gear-cat" key={g.cat}>
            <h3>{lang === 'en' ? g.en : g.de}</h3>
            {g.items.map((it, i) => {
              const href = safeUrl(it.link);
              return (
                <div className="gear-row" key={i}>
                  {href ? (
                    <a className="gr-name" href={href} target="_blank" rel="noopener">{it.name}</a>
                  ) : (
                    <span className="gr-name">{it.name}</span>
                  )}
                  <span className="gr-brand">{it.brand}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
