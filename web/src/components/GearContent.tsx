import { useTina, tinaField } from 'tinacms/dist/react';
import { newHref } from '../lib/tinaAdmin';
import { groupGear, safeUrl, type GearItem, type GearCategory } from '../lib/gear';

// Gear-Insel: die Ausrüstungs-TEILE kommen jetzt aus der eigenen `equipment`-Collection (ein
// Dokument pro Teil) — via useTina(equipmentConnection) LIVE (neues Teil erscheint nach dem
// Speichern). Seitentexte + Kategorien + Stil kommen als Prop aus gear.json (selten geändert;
// die Editorial-Kopftexte sind über EditorialPageHero separat live). „+ Equipment" nutzt Tinas
// natives „Neues Dokument" (newHref) -> Formular mit Live-Vorschau, tippen/Dropdown/Speichern
// funktionieren nativ. data-tina-field je Teil = Klick springt ins jeweilige Dokument.

type Props = {
  query: string;
  variables: object;
  data: any;            // equipmentConnection
  gearDoc: any;         // gear.json (Texte, Kategorien, Stil)
  lang: 'de' | 'en';
  design?: string;
};

export default function GearContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const lang = props.lang;
  const gear = (props.gearDoc ?? {}) as Record<string, any>;
  const t = (o: any, base: string) => { if (!o) return ''; const de = o[base + '_de'], en = o[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };

  const nodes = ((data as any)?.equipmentConnection?.edges ?? [])
    .map((e: any) => e?.node)
    .filter(Boolean) as any[];
  // Sortierung: Reihenfolge-Zahl (leer = ganz hinten), dann Name.
  const items = [...nodes].sort((a, b) =>
    ((typeof a.sort === 'number' ? a.sort : 1e9) - (typeof b.sort === 'number' ? b.sort : 1e9))
    || String(a.name || '').localeCompare(String(b.name || '')),
  ) as (GearItem & { sort?: number })[];
  const categories = (Array.isArray(gear.categories) ? gear.categories : []) as GearCategory[];
  const groups = groupGear(items, categories);
  const isEd = props.design === 'editorial';

  // Admin-Button „+ Equipment" (nur eingeloggt, via .ww-admin-island + html.ww-loggedin):
  // Tinas natives „Neues Dokument" der equipment-Collection -> leeres Formular mit Live-Vorschau.
  const adminBtn = (
    <a className="btn ww-admin-newbtn ww-admin-island" href={newHref('equipment')} target="_top">
      {lang === 'en' ? '+ Add equipment' : '+ Equipment'}
    </a>
  );

  // --- Editorial: Kategorien mit Item-Zeilen (Name | Marke | ↗), 1:1 aus Equipment.dc.html.
  if (isEd) {
    return (
      <div className="ed-gear-page">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{adminBtn}</div>
        {groups.map((g, gi) => {
          const num = String(gi + 1).padStart(2, '0');
          const count = `${g.items.length} ${g.items.length === 1 ? (lang === 'en' ? 'item' : 'Teil') : (lang === 'en' ? 'items' : 'Teile')}`;
          return (
            <div id={g.id} key={g.id}>
              <div className="ed-gear-cathead" data-reveal>
                <span className="ed-gear-catnum">{num} — {lang === 'en' ? g.en : g.de}</span>
                <span className="ed-rule" />
                <span className="ed-gear-count">{count}</span>
              </div>
              {g.items.map((it, i) => {
                const href = safeUrl(it.link);
                const inner = (
                  <>
                    <span className="ed-gear-name">{it.name}</span>
                    <span className="ed-gear-note">{it.brand}</span>
                    {href ? <span className="ed-gear-who" aria-hidden="true">↗</span> : <span className="ed-gear-who" aria-hidden="true"></span>}
                  </>
                );
                // Mit Link: die GANZE Zeile ist der Link — Hover färbt die Schrift gold.
                // data-tina-field je Teil = Klick springt ins jeweilige Ausrüstungs-Dokument.
                return href ? (
                  <a className="ed-gear-row" key={i} href={href} target="_blank" rel="noopener" data-reveal data-tina-field={tinaField(it as any)}>{inner}</a>
                ) : (
                  <div className="ed-gear-row" key={i} data-reveal data-tina-field={tinaField(it as any)}>{inner}</div>
                );
              })}
            </div>
          );
        })}
        <div className="ed-gear-cathead" data-reveal style={{ marginBottom: 0 }}>
          <span className="ed-gear-catnum">{lang === 'en' ? 'Coming soon' : 'Bald hier'}</span>
          <span className="ed-rule" />
          <span className="ed-gear-count">{lang === 'en' ? 'More gear on the next trip' : 'Was die nächste Reise braucht'}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {adminBtn}
      <div className="page-title">
        <div className="kicker">{t(gear, 'kicker')}</div>
        <h1>{t(gear, 'title')}</h1>
        <p>{t(gear, 'intro')}</p>
      </div>

      <div className={`gear-list gear-style-${['plain', 'card', 'notes'].includes(gear.gear_style) ? gear.gear_style : 'card'} gear-scope-${gear.gear_scope === 'groups' ? 'groups' : 'whole'}`}>
        {groups.map((g) => (
          <div className="gear-cat" key={g.id}>
            <h3>{lang === 'en' ? g.en : g.de}</h3>
            {g.items.map((it, i) => {
              const href = safeUrl(it.link);
              return (
                // data-tina-field je Teil -> Klick springt ins jeweilige Ausrüstungs-Dokument.
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
        ))}
      </div>
    </>
  );
}
