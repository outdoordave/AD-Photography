import { useTina, tinaField } from 'tinacms/dist/react';
import { photoFrame } from '../lib/trips';
import { ILLUS } from '../lib/illus';
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
};

// Illustration + Platzhalterfarben nach Position (Eintrag 1 = desert, 2 = coast).
const PERSON_STYLE = [
  { illus: 'desert', c1: '#b08a5e', c2: '#5e3f20' },
  { illus: 'coast', c1: '#7e98a0', c2: '#3a5058' },
] as const;

export default function AboutContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const about = (data.ueber_uns ?? {}) as Record<string, any>;
  const lang = props.lang;
  // Flache Felder (base_de/base_en): EN fällt auf DE zurück.
  const t = (o: any, base: string) => { if (!o) return ''; const de = o[base + '_de'], en = o[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };
  const tf = (o: any, base: string) => tinaField(o, (lang === 'en' ? base + '_en' : base + '_de') as any);

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
                    <p className="bio" data-tina-field={tf(person, 'bio')}>{t(person, 'bio')}</p>
                    <div className="gear" data-tina-field={tf(person, 'gear')}>{t(person, 'gear')}</div>
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
