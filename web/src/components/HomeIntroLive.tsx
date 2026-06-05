import { useTina, tinaField } from 'tinacms/dist/react';
import { bi, type Lang } from '../lib/albums';
import { socialIcon, socialUrl } from '../lib/socialIcons';

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
  const social: any[] = Array.isArray(intro.social) ? intro.social : [];
  const links = socialShow.intro !== false ? social.filter((s) => s && s.username) : [];

  return (
    <section>
      <div className="wrap">
        <div className="home-intro">
          <h2 data-tina-field={tf(intro, 'subline')}>{subline}</h2>
          <div className="divider-orn">✦</div>
          <p data-tina-field={tf(intro, 'subtext')}>{subtext}</p>
          {links.length > 0 && (
            <div className="insta-row">
              {links.map((s, i) => (
                <a className="insta-link" href={socialUrl(s.platform, s.username)} target="_blank" rel="noopener" key={i}>
                  <span className="ig-ic" dangerouslySetInnerHTML={{ __html: socialIcon(s.platform || 'instagram') }} />
                  @{s.username}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
