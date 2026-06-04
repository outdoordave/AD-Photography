import { useTina, tinaField } from 'tinacms/dist/react';
import { normalizePath } from '../lib/stories';
import { ILLUS } from '../lib/illus';

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

const PERSONS = [
  { key: 'person1', illus: 'desert', c1: '#b08a5e', c2: '#5e3f20' },
  { key: 'person2', illus: 'coast', c1: '#7e98a0', c2: '#3a5058' },
] as const;

export default function AboutContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const about = (data.ueber_uns ?? {}) as Record<string, any>;
  const lang = props.lang;
  const t = (o: any) => (o ? (lang === 'en' ? o.en : o.de) : '');

  return (
    <>
      <div className="wrap">
        <div className="page-title">
          <div className="kicker" data-tina-field={tinaField(about, 'kicker')}>{t(about.kicker)}</div>
          <h1 data-tina-field={tinaField(about, 'title')}>{t(about.title)}</h1>
          <p data-tina-field={tinaField(about, 'intro')}>{t(about.intro)}</p>
        </div>
      </div>

      <section className="about-band">
        <div className="wrap">
          <div className="about-grid">
            {PERSONS.map((p) => {
              const person = (about[p.key] ?? {}) as Record<string, any>;
              const photo = person.photo ? normalizePath(person.photo) : '';
              const illusStyle = {
                ['--ph-c1' as any]: p.c1,
                ['--ph-c2' as any]: p.c2,
                backgroundImage: `url('${ILLUS[p.illus]}')`,
              } as React.CSSProperties;
              return (
                <div className="person" key={p.key}>
                  <div
                    className={`ph person-photo${photo ? '' : ' has-illus'}`}
                    style={photo ? undefined : illusStyle}
                    data-tina-field={tinaField(person, 'photo')}
                  >
                    {photo ? <img className="ww-person-img" src={photo} alt="" /> : null}
                  </div>
                  <div className="info">
                    <h3 data-tina-field={tinaField(person, 'name')}>{person.name}</h3>
                    <div className="role" data-tina-field={tinaField(person, 'role')}>{t(person.role)}</div>
                    <p className="bio" data-tina-field={tinaField(person, 'bio')}>{t(person.bio)}</p>
                    <div className="gear" data-tina-field={tinaField(person, 'gear')}>{t(person.gear)}</div>
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
            <h2 data-tina-field={tinaField(about.why, 'title')}>{t(about.why?.title)}</h2>
            <div className="divider-orn">✦</div>
            <p data-tina-field={tinaField(about.why, 'text')}>{t(about.why?.text)}</p>
          </div>
        </div>
      </section>
    </>
  );
}
