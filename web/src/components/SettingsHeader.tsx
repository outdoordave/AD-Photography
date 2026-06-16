import { useTina, tinaField } from 'tinacms/dist/react';

// Wiederverwendbarer Seiten-Kopf (Kicker / Titel / Intro) für die „… – Einstellungen"-
// Collections (Galerie, Stories, Reisen). Als kleine React-Insel mit useTina:
//   • Tina registriert dadurch ein Formular für die Seite → Bearbeiten + Live-Vorschau
//     (kein „nothing to edit" mehr, weil das Dokument jetzt useTina-gebunden ist).
//   • data-tina-field (tinaField) → Klick auf Kicker/Titel/Intro springt zum Feld.
//   • Live-Update beim Tippen in der Tina-Sidebar.
// Astro rendert die Insel beim Build statisch vor → Besucher sehen identisches HTML
// wie die bisherige `.page-title`-Variante (t() repliziert lib/albums tl()-Fallback).

type Props = {
  query: string;
  variables: object;
  data: any;
  // Schlüssel des Dokuments im Query-Ergebnis (z. B. 'galerie_settings').
  docKey: string;
  lang: 'de' | 'en';
};

// FLACHE Felder (kicker_de/kicker_en …): Klick in der Vorschau springt direkt
// ins jeweilige Freitextfeld (kein DE/EN-Untermenü). EN fällt auf DE zurück.
export default function SettingsHeader(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const doc = (data?.[props.docKey] ?? {}) as Record<string, any>;
  const lang = props.lang;
  const t = (de: any, en: any) => (lang === 'en' ? en || de || '' : de || '');
  // tinaField auf das Feld der aktiven Sprache → Klick landet dort.
  const f = (base: string) => tinaField(doc, (lang === 'en' ? base + '_en' : base + '_de') as any);

  return (
    <div className="page-title">
      <div className="kicker" data-tina-field={f('kicker')}>{t(doc.kicker_de, doc.kicker_en)}</div>
      <h1 data-tina-field={f('title')}>{t(doc.title_de, doc.title_en)}</h1>
      <p data-tina-field={f('intro')}>{t(doc.intro_de, doc.intro_en)}</p>
    </div>
  );
}
