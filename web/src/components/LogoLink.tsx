import { useTina, tinaField } from 'tinacms/dist/react';
import { normalizePath } from '../lib/stories';

// Logo als kleine Tina-Insel: liest die „Darstellung"-Doc (appearance-settings) live
// und hängt data-tina-field ans <img> -> Klick aufs Logo (in der CMS-Vorschau) springt
// direkt ins Logo-Feld unter 🎨 Darstellung. Markup je Einsatzort (Nav/Footer/Hero)
// 1:1 wie zuvor, damit die bestehende CSS unverändert greift.

type Props = {
  query: string;
  variables: object;
  data: any;
  variant: 'nav' | 'footer' | 'hero';
  href?: string;
  ariaLabel?: string;
};

export default function LogoLink(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const ap = ((data as any)?.darstellung ?? {}) as Record<string, any>;
  const logo = ap.logo || '';
  const src = logo ? normalizePath(logo) : '';
  const tf = tinaField(ap as any, 'logo');
  const href = props.href || '/';

  if (props.variant === 'hero') {
    if (!src) return null;
    return (
      <div className="hero-logo">
        <img src={src} alt="Wide & Wild" data-tina-field={tf} />
      </div>
    );
  }

  if (props.variant === 'footer') {
    if (!src) return null;
    return (
      <div className="footer-logo">
        <a href={href} aria-label={props.ariaLabel}>
          <img src={src} alt="Wide & Wild" loading="lazy" data-tina-field={tf} />
        </a>
      </div>
    );
  }

  // nav
  return (
    <a className="nav-logo" href={href} aria-label={props.ariaLabel}>
      {src ? <img src={src} alt="Wide & Wild Logo" data-tina-field={tf} /> : <strong>Wide &amp; Wild</strong>}
    </a>
  );
}
