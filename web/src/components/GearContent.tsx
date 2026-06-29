import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
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
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Vorschau-Navigation: Sidebar links automatisch auf das Dokument dieser Seite schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const gear = (data.gear ?? {}) as Record<string, any>;
  const lang = props.lang;
  // Flache Felder (base_de/base_en): EN fällt auf DE zurück.
  const t = (o: any, base: string) => { if (!o) return ''; const de = o[base + '_de'], en = o[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };
  const tf = (o: any, base: string) => tinaField(o, (lang === 'en' ? base + '_en' : base + '_de') as any);

  const items: GearItem[] = Array.isArray(gear.items) ? gear.items : [];
  const categories = Array.isArray(gear.categories) ? gear.categories : [];
  const groups = groupGear(items, categories);

  return (
    <>
      <div className="page-title">
        <div className="kicker" data-tina-field={tf(gear, 'kicker')}>{t(gear, 'kicker')}</div>
        <h1 data-tina-field={tf(gear, 'title')}>{t(gear, 'title')}</h1>
        <p data-tina-field={tf(gear, 'intro')}>{t(gear, 'intro')}</p>
      </div>

      <div className={`gear-list gear-style-${['plain', 'card', 'notes'].includes(gear.gear_style) ? gear.gear_style : 'card'} gear-scope-${gear.gear_scope === 'groups' ? 'groups' : 'whole'}`}>
        {groups.map((g) => {
          // Zugehöriges Kategorie-Objekt aus der Inline-Liste -> Klick auf die Überschrift
          // springt im CMS direkt zu DIESER Kategorie (wie der Klick auf ein Gerät).
          const catObj = categories.find((c: any) => (c?.key || '').trim() === g.id);
          return (
          <div className="gear-cat" key={g.id}>
            <h3 data-tina-field={catObj ? tinaField(catObj as any) : undefined}>{lang === 'en' ? g.en : g.de}</h3>
            {g.items.map((it, i) => {
              const href = safeUrl(it.link);
              return (
                // data-tina-field je Gegenstand (nicht auf der ganzen Liste) -> Klick
                // springt zu DIESEM Eintrag, statt die Liste zu fokussieren („+ hinzufügen").
                <div className="gear-row" key={i} data-tina-field={tinaField(it as any)}>
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
          );
        })}
      </div>
    </>
  );
}
