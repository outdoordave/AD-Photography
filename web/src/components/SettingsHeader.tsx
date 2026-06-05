import { useTina, tinaField } from 'tinacms/dist/react';

// Wiederverwendbarer Seiten-Kopf (Kicker / Titel / Intro) für die „… – Einstellungen"-
// Collections (Galerie, Stories, Reisen). Als kleine React-Insel mit useTina:
//   • Tina registriert dadurch ein Formular für die Seite → Bearbeiten + Live-Vorschau
//     (kein „nothing to edit" mehr, weil das Dokument jetzt useTina-gebunden ist).
//   • data-tina-field (tinaField) → Klick auf Kicker/Titel/Intro springt zum Feld.
//   • Live-Update beim Tippen in der Tina-Sidebar.
// Astro rendert die Insel beim Build statisch vor → Besucher sehen identisches HTML
// wie die bisherige `.page-title`-Variante (t() repliziert lib/albums tl()-Fallback).

type Bi = { de?: string | null; en?: string | null } | null | undefined;

type Props = {
  query: string;
  variables: object;
  data: any;
  // Schlüssel des Dokuments im Query-Ergebnis (z. B. 'galerie_settings').
  docKey: string;
  lang: 'de' | 'en';
};

export default function SettingsHeader(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const doc = (data?.[props.docKey] ?? {}) as Record<string, any>;
  const lang = props.lang;
  // Exakt wie tl(): EN fällt auf DE zurück, DE nie auf EN.
  const t = (b: Bi) => (!b ? '' : lang === 'en' ? b.en || b.de || '' : b.de || '');

  return (
    <div className="page-title">
      <div className="kicker" data-tina-field={tinaField(doc, 'kicker')}>{t(doc.kicker)}</div>
      <h1 data-tina-field={tinaField(doc, 'title')}>{t(doc.title)}</h1>
      <p data-tina-field={tinaField(doc, 'intro')}>{t(doc.intro)}</p>
    </div>
  );
}
