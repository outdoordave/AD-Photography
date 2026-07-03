import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
import { bi, type Lang } from '../lib/albums';
import { normalizePath } from '../lib/stories';
import { socialIcon, socialUrl } from '../lib/socialIcons';
import { formatFullDate, journalHeading, journalHasTitle, journalPlainText, journalAttachments } from '../lib/journal';
import { glyphSvg, glyphLabel } from '../lib/journalGlyphs';
import LogoLink from './LogoLink';
import PaperRip from './PaperRip';

// Hero als LIVE-Insel (useTina startseite) — 1:1-Port von HomeHero.astro:
// gleiche Klassen/Markup/Effekte (alle Politur-Effekte laufen über CSS-Klassen),
// Diashow per useEffect. Zusätzlich data-tina-field auf Headline + Buttons ->
// Klick in der Vorschau springt direkt ins Feld; Edits erscheinen sofort.

type Props = {
  query: string; variables: object; data: any; lang: Lang;
  logo?: string; showHeroLogo?: boolean; showStories?: boolean;
  logoQuery?: string; logoVariables?: object; logoData?: any;
  // Neuester Journal-Eintrag statt der Hero-Tagline (nur wenn Journal + Schalter an).
  heroJournal?: boolean; journalLatest?: any;
};

export default function HomeHeroLive(props: Props) {
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Vorschau-Navigation: Sidebar links automatisch auf das Dokument dieser Seite schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const st = (data?.startseite ?? {}) as Record<string, any>;
  const hero = (st.hero ?? {}) as Record<string, any>;
  const lang = props.lang;
  const isEn = lang === 'en';
  const prefix = isEn ? '/en' : '';
  const tf = (o: any, base: string) => tinaField(o, (isEn ? base + '_en' : base + '_de') as any);

  const logo = props.logo || '';
  const showHeroLogo = props.showHeroLogo !== false;
  const showStories = props.showStories === true;

  const mode = hero.mode || 'image';
  const logoSrc = logo && logo.charAt(0) !== '/' && !/^https?:/.test(logo) ? '/' + logo : logo;
  const slides = (Array.isArray(hero.slideshow) ? hero.slideshow : [])
    .map((s: any) => (typeof s === 'string' ? s : s && s.img))
    .filter(Boolean)
    .map((p: string) => normalizePath(p));
  const hasMedia =
    (mode === 'image' && hero.image) ||
    (mode === 'random' && slides.length) ||
    (mode === 'video' && hero.video);
  const headline = bi(hero, 'headline', lang);
  const ctaP = bi(hero, 'cta_portfolio', lang) || (isEn ? 'View portfolio' : 'Portfolio ansehen');
  const ctaS = bi(hero, 'cta_stories', lang) || (isEn ? 'Read our stories' : 'Reiseberichte lesen');

  const pol = hero.polish || {};
  const pKen = pol.ken_burns !== false;
  const pScrim = pol.scrim !== false;
  const pBig = pol.big_headline !== false;
  const scrollStyle = pol.scroll_style || (pol.scroll_indicator === false ? 'arrow' : 'line');
  const heroClass = ['hero', hasMedia ? 'has-media' : '', pKen ? 'polish-kenburns' : '', pScrim ? 'polish-scrim' : '', pBig ? 'polish-bigtag' : '']
    .filter(Boolean).join(' ');

  // Hero-Journal-Kachel (statt Tagline): neuester Eintrag, nur wenn Schalter an + Eintrag vorhanden.
  const jl = props.journalLatest;
  const jHero = props.heroJournal === true && !!jl && !!jl.date;
  const jSnippet = jHero ? journalPlainText(jl, lang, 150) : '';
  const jGlyphs = jHero ? journalAttachments(jl) : [];

  // Social-Links (Hero-Platzierung, wie HomeHero: social_show.hero === true).
  const socialShow = st.social_show || {};
  const social: any[] = Array.isArray(st.intro?.social) ? st.intro.social : [];
  const socialLinks = socialShow.hero === true ? social.filter((s) => s && s.username) : [];

  // Diashow: aktives Bild alle 5 s weiterschalten (nur bei >1 Bild).
  const mediaRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const imgs = el.querySelectorAll<HTMLElement>('.hero-slide');
    if (imgs.length < 2) return;
    let idx = 0;
    const t = window.setInterval(() => {
      imgs[idx].classList.remove('is-active');
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add('is-active');
    }, 5000);
    return () => window.clearInterval(t);
  }, [mode, slides.length]);

  return (
    <div className={heroClass}>
      <PaperRip idp="heroTopRip" className="band-rip band-rip-top" />
      <div className="hero-media" ref={mediaRef}>
        {mode === 'video' && hero.video ? (
          <video className="hero-vid" src={normalizePath(hero.video)} autoPlay loop muted playsInline preload="auto"
            poster={hero.video_poster ? normalizePath(hero.video_poster) : undefined} />
        ) : mode === 'random' && slides.length ? (
          slides.map((s: string, i: number) => (
            <img className={`hero-slide${i === 0 ? ' is-active' : ''}`} src={s} alt="" key={i} fetchPriority={i === 0 ? 'high' : undefined} decoding="async" />
          ))
        ) : mode === 'image' && hero.image ? (
          <img className="hero-img" src={normalizePath(hero.image)} alt="" fetchPriority="high" decoding="async" />
        ) : null}
      </div>

      {showHeroLogo ? (
        props.logoData ? (
          <LogoLink variant="hero" query={props.logoQuery!} variables={props.logoVariables!} data={props.logoData} />
        ) : (logoSrc ? <div className="hero-logo"><img src={logoSrc} alt="Wide & Wild" /></div> : null)
      ) : null}

      {jHero ? (
        <div className="hero-journal-wrap">
          <a className="hero-journal" href={`${prefix}/journal`}>
            <div className="hj-kicker">
              <span>{isEn ? 'From the journal' : 'Aus dem Journal'}</span>
              <span className="hj-rule" aria-hidden="true"></span>
              <span className="hj-more">{isEn ? 'Latest' : 'Neu'} →</span>
            </div>
            <div className="hj-date">{formatFullDate(jl.date, lang)}</div>
            {journalHasTitle(jl, lang) ? <div className="hj-title">{journalHeading(jl, lang)}</div> : null}
            {jSnippet ? <div className="hj-text">{jSnippet}</div> : null}
            {jGlyphs.length > 0 ? (
              <div className="hj-glyphs" aria-hidden="true">
                {jGlyphs.map((k) => (
                  <span className="hj-glyph" key={k} title={glyphLabel(k, lang)} dangerouslySetInnerHTML={{ __html: glyphSvg(k) }} />
                ))}
              </div>
            ) : null}
          </a>
        </div>
      ) : (
        <h1 className="hero-tag" data-tina-field={tf(hero, 'headline')}>{headline}</h1>
      )}

      <div className="hero-cta">
        <a className="btn" href={`${prefix}/portfolio`} data-tina-field={tf(hero, 'cta_portfolio')}>{ctaP}</a>
        {showStories ? <a className="btn ghost" href={`${prefix}/stories`} data-tina-field={tf(hero, 'cta_stories')}>{ctaS}</a> : null}
      </div>

      {socialLinks.length > 0 && (
        <div className="insta-row on-dark hero-social">
          {socialLinks.map((s, i) => (
            <a className="insta-link" href={socialUrl(s.platform, s.username)} target="_blank" rel="noopener" key={i}>
              <span className="ig-ic" dangerouslySetInnerHTML={{ __html: socialIcon(s.platform || 'instagram') }} />
              @{s.username}
            </a>
          ))}
        </div>
      )}

      {scrollStyle === 'arrow' ? (
        <div className="scroll-hint">↓</div>
      ) : scrollStyle === 'mouse' ? (
        <div className="scroll-mouse" aria-hidden="true"></div>
      ) : scrollStyle === 'none' ? null : (
        <div className="scroll-cue" aria-hidden="true"></div>
      )}

      <svg className="hero-rip" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="heroRipRamp" x1="0" y1="66" x2="0" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="0"></stop>
            <stop offset="1" stopColor="currentColor" stopOpacity="1"></stop>
          </linearGradient>
          <filter id="heroRipDry" x="-3%" y="-70%" width="106%" height="240%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.016 0.18" numOctaves="3" seed="7" stitchTiles="stitch" result="n"></feTurbulence>
            <feColorMatrix in="n" type="luminanceToAlpha" result="na"></feColorMatrix>
            <feComposite in="SourceGraphic" in2="na" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.42" result="sum"></feComposite>
            <feComponentTransfer in="sum" result="mask"><feFuncA type="linear" slope="7" intercept="-2.2"></feFuncA></feComponentTransfer>
            <feFlood floodColor="currentColor" result="cream"></feFlood>
            <feComposite in="cream" in2="mask" operator="in" result="col"></feComposite>
            <feDisplacementMap in="col" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
          </filter>
        </defs>
        <rect x="0" y="89" width="1200" height="31" fill="currentColor"></rect>
        <rect x="-20" y="62" width="1240" height="36" fill="url(#heroRipRamp)" filter="url(#heroRipDry)"></rect>
      </svg>
    </div>
  );
}
