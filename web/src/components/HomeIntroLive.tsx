import { useTina, tinaField } from 'tinacms/dist/react';
import { bi, type Lang } from '../lib/albums';
import { socialIcon } from '../lib/socialIcons';
import contact from '../data/contact.json';

// Intro-Block als LIVE-Insel (useTina startseite) — 1:1-Port von HomeIntro.astro.
// data-tina-field auf Zwischenüberschrift + Text. Social-Platzierung „intro".

type Props = { query: string; variables: object; data: any; lang: Lang };

export default function HomeIntroLive(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const st = (data?.startseite ?? {}) as Record<string, any>;
  const intro = (st.intro ?? {}) as Record<string, any>;
  const lang = props.lang;
  const isEn = lang === 'en';
  const tf = (o: any, base: string) => tinaField(o, (isEn ? base + '_en' : base + '_de') as any);

  const subline = bi(intro, 'subline', lang);
  const subtext = bi(intro, 'subtext', lang);
  const socialShow = st.social_show || {};
  // Social-Links kommen ZENTRAL aus der Kontaktseite (contact.json -> channels): nur EINE
  // Pflegestelle, funktioniert auch wenn /contact ausgeblendet ist (Build-Time-Import).
  // E-Mail/Telefon werden hier ausgefiltert (nur Social-Pillen).
  const channels: any[] = Array.isArray((contact as any).channels) ? (contact as any).channels : [];
  const links =
    socialShow.intro !== false
      ? channels.filter((c) => c && c.url && c.type && c.type !== 'email' && c.type !== 'phone')
      : [];

  return (
    <section>
      <div className="wrap">
        <div className="home-intro">
          <h2 data-tina-field={tf(intro, 'subline')}>{subline}</h2>
          <div className="divider-orn">✦</div>
          <p data-tina-field={tf(intro, 'subtext')}>{subtext}</p>
          {links.length > 0 && (
            <div className="insta-row">
              {links.map((c, i) => (
                <a className="insta-link" href={c.url} target="_blank" rel="noopener" key={i}>
                  <span className="ig-ic" dangerouslySetInnerHTML={{ __html: socialIcon(c.type) }} />
                  {c.label || c.url}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
