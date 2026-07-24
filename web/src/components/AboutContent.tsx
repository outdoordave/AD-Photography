import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
import { photoFrame } from '../lib/trips';
import { ILLUS } from '../lib/illus';
import RichText, { pickRich } from './RichText';
import { socialIcon } from '../lib/socialIcons';
import { personGearTokens, gearLinkFor, type GearItem } from '../lib/gear';
import PaperRip from './PaperRip';

// Über-uns als React-Insel (wie Stories/Gear): useTina = LIVE-Daten, data-tina-field
// = Klick auf der Seite springt zum Feld. Aufbau 1:1 wie #page-about in index.html:
// Seitenkopf + dunkler about-band mit 2 Personen-Karten + „Warum die USA?"-Block.
// Personen-Foto: hochgeladen -> echtes Bild; sonst Illustrations-Platzhalter
// (Person 1: „desert", Person 2: „coast") mit den Original-Platzhalterfarben.

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
  design?: string;
  channels?: { type?: string; label?: string; url?: string }[];
  gearItems?: GearItem[];   // Equipment-Geräte (für Verlinkung der Profil-Ausrüstung)
};

// Illustration + Platzhalterfarben nach Position (Eintrag 1 = desert, 2 = coast).
const PERSON_STYLE = [
  { illus: 'desert', c1: '#b08a5e', c2: '#5e3f20' },
  { illus: 'coast', c1: '#7e98a0', c2: '#3a5058' },
] as const;

export default function AboutContent(props: Props) {
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Vorschau-Navigation: Sidebar links automatisch auf das Dokument dieser Seite schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const about = (data.ueber_uns ?? {}) as Record<string, any>;
  const lang = props.lang;
  // Flache Felder (base_de/base_en): EN fällt auf DE zurück.
  const t = (o: any, base: string) => { if (!o) return ''; const de = o[base + '_de'], en = o[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };
  const tf = (o: any, base: string) => tinaField(o, (lang === 'en' ? base + '_en' : base + '_de') as any);
  const isEd = props.design === 'editorial';
  // Toggle „Ausrüstung unter Profil zeigen?" (Standard AN, solange Feld ungesetzt).
  const showGear = about.show_person_gear !== false;
  // Equipment-Geräte für die Verlinkung der Profil-Ausrüstung (gilt für beide Designs).
  const gearItems = (Array.isArray(props.gearItems) ? props.gearItems : []) as GearItem[];

  // --- Editorial: 2 Porträt-Spalten (Bild + Bio + Fakten aus echter Gear-Liste + IG) + Statement, 1:1 aus Ueber uns.dc.html.
  if (isEd) {
    const persons = (Array.isArray(about.persons) ? about.persons : []) as any[];
    const channels = props.channels || [];
    const igFor = (name: string) => {
      const key = String(name || '').trim().toLowerCase();
      const hit = channels.find((c) => {
        const s = `${c.label || ''} ${c.url || ''}`.toLowerCase();
        return (key.length >= 4 && s.includes(key.slice(0, 4))) || (key.startsWith('alex') && s.includes('alx'));
      });
      return hit || null;
    };
    const gearFacts = (person: any) => personGearTokens(t(person, 'gear'));
    const whyKicker = t(about, 'why_title');
    const whyText = t(about, 'why_text');
    return (
      <>
        <section className="ed-section" style={{ paddingTop: 'clamp(70px,10vw,96px)', paddingBottom: 0 }}>
          <div className="ed-about-grid">
            {persons.map((person, idx) => {
              const frame = photoFrame(person.photo);
              const facts = gearFacts(person);
              const ig = igFor(person.name);
              return (
                <div className="ed-about-person" data-reveal key={idx}>
                  <span className="ed-about-photo" data-tina-field={tinaField(person, 'photo')}>
                    {frame.src ? <img src={frame.src} alt={person.name || ''} data-zoom loading="lazy" decoding="async" /> : null}
                    <span className="ed-collage-vignette" aria-hidden="true" />
                    <span className="ed-duo-label">
                      <span className="ed-duo-kicker" data-tina-field={tf(person, 'role')}>{t(person, 'role')}</span>
                      <span className="ed-duo-name" data-tina-field={tinaField(person, 'name')}>{person.name}</span>
                    </span>
                  </span>
                  <div className="ed-about-bio ww-rich" data-tina-field={tf(person, 'bio')}><RichText value={pickRich(person.bio_de, person.bio_en, lang === 'en')} /></div>
                  {ig ? (
                    <a className="ed-about-ig" href={ig.url} target="_blank" rel="noopener">
                      <span className="ed-about-ig-ic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: socialIcon('instagram') }} />
                      {ig.label}
                    </a>
                  ) : null}
                  {showGear && facts.length > 0 ? (
                    <div className="ed-about-facts" data-tina-field={tf(person, 'gear')}>
                      {facts.map((f, i) => {
                        const link = gearLinkFor(f, gearItems);
                        return (
                          <span className="ed-about-fact" key={i}>
                            <span className="ed-about-fact-k">{String(i + 1).padStart(2, '0')}</span>
                            {link
                              ? <a className="ed-about-fact-v ed-about-fact-link" href={link} target="_blank" rel="noopener">{f}</a>
                              : <span className="ed-about-fact-v">{f}</span>}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
        {whyText ? (
          <section className="ed-statement">
            {whyKicker ? <p className="ed-statement-kicker" data-reveal data-tina-field={tf(about, 'why_title')}>{whyKicker}</p> : null}
            <p className="ed-statement-text" data-reveal data-tina-field={tf(about, 'why_text')}>{whyText}</p>
          </section>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="wrap">
        <div className="page-title">
          <div className="kicker" data-tina-field={tf(about, 'kicker')}>{t(about, 'kicker')}</div>
          <h1 data-tina-field={tf(about, 'title')}>{t(about, 'title')}</h1>
          <p data-tina-field={tf(about, 'intro')}>{t(about, 'intro')}</p>
        </div>
      </div>

      <section className="about-band">
        <PaperRip idp="aboutTop" className="band-rip band-rip-top" />
        <PaperRip idp="aboutBot" className="band-rip band-rip-bottom" />
        <div className="wrap">
          <div className="about-grid">
            {PERSON_STYLE.map((p, idx) => {
              const person = ((Array.isArray(about.persons) ? about.persons[idx] : null) ?? {}) as Record<string, any>;
              const frame = photoFrame(person.photo);
              const photo = frame.src;
              const illusStyle = {
                ['--ph-c1' as any]: p.c1,
                ['--ph-c2' as any]: p.c2,
                backgroundImage: `url('${ILLUS[p.illus]}')`,
              } as React.CSSProperties;
              return (
                <div className="person" key={idx}>
                  <div
                    className={`ph person-photo${photo ? '' : ' has-illus'}`}
                    style={photo ? undefined : illusStyle}
                    data-tina-field={tinaField(person, 'photo')}
                  >
                    {photo ? <img className="ww-person-img" src={photo} alt={person.name || ''} style={frame.style} /> : null}
                  </div>
                  <div className="info">
                    <h3 data-tina-field={tinaField(person, 'name')}>{person.name}</h3>
                    <div className="role" data-tina-field={tf(person, 'role')}>{t(person, 'role')}</div>
                    <div className="bio ww-rich" data-tina-field={tf(person, 'bio')}><RichText value={pickRich(person.bio_de, person.bio_en, lang === 'en')} /></div>
                    {showGear ? (
                      <div className="gear" data-tina-field={tf(person, 'gear')}>
                        {(() => {
                          const raw = String(t(person, 'gear') || '');
                          const tokens = personGearTokens(raw);
                          if (!tokens.length) return raw;
                          const m = raw.match(/^([^:]*:)\s*/);
                          const prefix = m ? m[1] + ' ' : '';
                          return (<>{prefix}{tokens.map((tok, i) => {
                            const link = gearLinkFor(tok, gearItems);
                            return (<span key={i}>{i > 0 ? ' · ' : ''}{link
                              ? <a href={link} target="_blank" rel="noopener">{tok}</a>
                              : tok}</span>);
                          })}</>);
                        })()}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="home-intro">
            <h2 data-tina-field={tf(about, 'why_title')}>{t(about, 'why_title')}</h2>
            <div className="divider-orn">✦</div>
            <p data-tina-field={tf(about, 'why_text')}>{t(about, 'why_text')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
