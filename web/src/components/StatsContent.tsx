import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';

// Statistik-Seite (/statistik) als React-Insel — useTina = LIVE-Daten, data-tina-field =
// Klick-ins-Feld. Bettet das öffentliche Dashboard des gewählten (cookielosen) Analyse-
// Diensts per iframe ein. Ist keine Dashboard-URL hinterlegt, zeigt die Seite eine kurze
// Einrichtungs-Anleitung. Die eigentliche Tracking-Einbindung passiert im BaseLayout-<head>.

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
};

export default function StatsContent(props: Props) {
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    // Vorschau-Navigation: Sidebar links automatisch auf das Dokument dieser Seite schalten.
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const s = (data.statistik ?? {}) as Record<string, any>;
  const lang = props.lang;
  const t = (base: string) => { const de = s[base + '_de'], en = s[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };
  const tf = (base: string) => tinaField(s, (lang === 'en' ? base + '_en' : base + '_de') as any);

  const dashboardUrl = String(s.dashboard_url || '').trim();
  const intro = t('intro');

  return (
    <section>
      <div className="wrap">
        <div className="page-title">
          <div className="kicker">📊 {lang === 'en' ? 'Analytics' : 'Statistik'}</div>
          <h1>{lang === 'en' ? 'Site statistics' : 'Website-Statistik'}</h1>
          {intro ? <p data-tina-field={tf('intro')}>{intro}</p> : null}
        </div>

        {dashboardUrl ? (
          <div className="stats-embed" data-tina-field={tinaField(s, 'dashboard_url')}>
            <iframe
              src={dashboardUrl}
              title={lang === 'en' ? 'Analytics dashboard' : 'Statistik-Dashboard'}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="stats-setup" data-tina-field={tinaField(s, 'dashboard_url')}>
            <h3>{lang === 'en' ? 'Set up in 3 steps' : 'In 3 Schritten einrichten'}</h3>
            <ol>
              <li>{lang === 'en'
                ? 'Create a free, cookieless analytics account (e.g. Cloudflare Web Analytics, Plausible or Umami).'
                : 'Kostenloses, cookieloses Analyse-Konto anlegen (z. B. Cloudflare Web Analytics, Plausible oder Umami).'}</li>
              <li>{lang === 'en'
                ? 'Paste the tracking snippet into the CMS field “Analytics-Code” (📊 Statistik) and switch it on.'
                : 'Den Tracking-Code im CMS-Feld „Analytics-Code" (📊 Statistik) einfügen und aktivieren.'}</li>
              <li>{lang === 'en'
                ? 'Paste the public dashboard URL into “Dashboard-URL” — it then shows up right here.'
                : 'Die öffentliche Dashboard-URL ins Feld „Dashboard-URL" einfügen — sie erscheint dann hier.'}</li>
            </ol>
            <p className="form-note">{lang === 'en'
              ? 'Note: Cloudflare Web Analytics cannot be embedded — for an in-page view use Plausible or Umami (both support embeddable shared dashboards).'
              : 'Hinweis: Cloudflare Web Analytics lässt sich nicht einbetten — für die Ansicht direkt hier eignen sich Plausible oder Umami (beide bieten einbettbare Dashboards).'}</p>
          </div>
        )}
      </div>
    </section>
  );
}
