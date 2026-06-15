import { defineConfig } from 'tinacms';
import BulkPhotoField from './fields/BulkPhotoField';
import SinglePhotoField from './fields/SinglePhotoField';
import { EnglishOnlyField, EnglishOnlyTextField, EnglishStyledField, EnglishStyledTextField } from './fields/EnglishOnlyField';
import CropPhotoField from './fields/CropPhotoField';
import StoryBodyField from './fields/StoryBodyField';
import ImageFrameField from './fields/ImageFrameField';
import GearStyleField from './fields/GearStyleField';
import SectionBanner from './fields/SectionBanner';
import EnglishToggle from './fields/EnglishToggle';
import LocationSearchField from './fields/LocationSearchField';
import { backToSiteScreen } from './screens/BackToSiteScreen';
import { logoutScreen } from './screens/LogoutScreen';

// Tina-Cloud-Anbindung:
//   clientId + branch sind OEFFENTLICH (clientId steht ohnehin im Browser-Bundle).
//   Daher fest verdrahtet als Fallback -> der Build haengt fuer diese beiden NICHT
//   mehr an Umgebungsvariablen. Hintergrund: Auf Cloudflare laeuft `tinacms build`
//   als pkg-Binary, die die Custom-Env-Variablen beim Config-Laden nicht zuverlaessig
//   sieht; ausserdem filtert Tina beim Bundeln process.env auf TINA_PUBLIC_/NEXT_PUBLIC_.
//   Der TOKEN bleibt GEHEIM und kommt ausschliesslich aus der Umgebung (TINA_TOKEN) —
//   niemals im Repo. Ist TINA_TOKEN leer (z. B. am Mac ohne .env), laeuft Tina im
//   LOKALEN Modus (liest/schreibt direkt die Markdown-Dateien in src/content/stories).
const clientId = process.env.TINA_CLIENT_ID || 'defa5b44-687f-478c-a647-bad7355aedd3';
const token = process.env.TINA_TOKEN || '';
const branch = process.env.TINA_BRANCH || 'astro-umbau';

// Zentrale Reise-Design-Werte (Tuning) je Design. EINE Quelle mit lib/tripDesigns.ts (dort die
// Defaults + CSS-Erzeugung). Schritt 1: schlichte Zahlenfelder. Schritt 3 ersetzt die Anzeige durch
// den Regler-Editor (ui.component) — gleiche Datenfelder, daher KEIN weiterer Re-Index.
const designTuningField = (name: string, label: string) => ({
  type: 'object' as const, name, label,
  fields: [
    { type: 'number' as const, name: 'dimOp', label: 'Dimmung inaktiver Stationen (0–0.9)', description: '0 = unsichtbar, 1 = voll. Standard 0.30, luftig 0.15.' },
    { type: 'number' as const, name: 'gap', label: 'Luft zwischen Stationen (px)', description: 'Standard 14, luftig 50.' },
    { type: 'number' as const, name: 'titlePx', label: 'Titelgröße aktive Station (px)', description: 'Standard 30, luftig 26.' },
    { type: 'number' as const, name: 'scale', label: 'Inaktiv-Größe (0.70–1.00)', description: '1 = keine Verkleinerung. Standard 0.975, luftig 0.80.' },
    { type: 'number' as const, name: 'photoShadow', label: 'Foto-Schatten-Stärke (0–100)', description: '0 = keiner. luftig 40 (Foto schwebt).' },
  ],
});

export default defineConfig({
  branch,
  clientId,
  token,
  // TEIL 3A(b): globaler „Zur Website"-Menüpunkt in der CMS-Seitenleiste (Kategorie „Site").
  cmsCallback: (cms: any) => {
    try { cms.plugins.add(backToSiteScreen); } catch (e) { /* ignore */ }
    try { cms.plugins.add(logoutScreen); } catch (e) { /* ignore */ }
    // Auch Tinas EINGEBAUTEN Logout sauber zur Startseite führen (statt auf dem /admin-Login-
    // Screen festzuhängen). Zwei abgesicherte Wege:
    try {
      const goHome = () => { try { (window.top || window).location.assign('/'); } catch (e) { window.location.assign('/'); } };
      const clearTokens = () => {
        try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && /tina/i.test(k)) localStorage.removeItem(k); } } catch (e) { /* ignore */ }
        try { for (let i = sessionStorage.length - 1; i >= 0; i--) { const k = sessionStorage.key(i); if (k && /tina/i.test(k)) sessionStorage.removeItem(k); } } catch (e) { /* ignore */ }
      };

      // (a) Interne authProvider.logout-Methode patchen (falls in dieser Version vorhanden).
      const patch = (obj: any) => {
        if (obj && typeof obj.logout === 'function' && !obj.__wwPatched) {
          const orig = obj.logout.bind(obj);
          obj.logout = async function () { try { return await orig.apply(this, arguments); } finally { goHome(); } };
          obj.__wwPatched = true; return true;
        }
        return false;
      };
      const tryPatch = () => { let ok = false; try { ok = patch(cms?.api?.tina?.authProvider) || ok; } catch (e) {} try { ok = patch(cms?.api?.tina) || ok; } catch (e) {} return ok; };
      if (!tryPatch() && typeof setTimeout !== 'undefined') { setTimeout(tryPatch, 1500); setTimeout(tryPatch, 4000); }

      // (b) Robuster Fallback: Klick auf Tinas „Log out"-Schaltfläche im /admin-Dokument
      //     abfangen (Text-Erkennung) -> Tina seinen Logout machen lassen, dann hart heim.
      if (typeof document !== 'undefined' && !(document as any).__wwLogoutHook) {
        (document as any).__wwLogoutHook = true;
        document.addEventListener('click', (e: any) => {
          const start = e.target as HTMLElement;
          const el = start && start.closest ? start.closest('button, a, [role="button"]') : null;
          if (!el) return;
          const txt = (el.textContent || '').trim().toLowerCase();
          if (txt === 'log out' || txt === 'logout' || txt === 'sign out' || txt === 'abmelden') {
            clearTokens();
            setTimeout(goHome, 150); // kurz warten, damit Tinas eigener Logout noch durchläuft
          }
        }, true);
      }
    } catch (e) { /* ignore */ }
    return cms;
  },
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      // --- Startseite: Hero (Medien + Texte). Intro/Social folgen in Etappe 4. ---
      {
        name: 'startseite',
        label: '🏠 Startseite',
        path: 'src/data',
        format: 'json',
        match: { include: 'home-settings' },
        // Router -> Vorschau + Bearbeiten auf / (Hero/Intro/Sektion-Köpfe sind dort
        // useTina-Inseln -> Formular + Klick-ins-Feld, kein „nothing to edit").
        ui: { allowedActions: { create: false, delete: false }, router: () => '/' },
        fields: [
          { type: 'string', name: 'ww_here', label: '🏠 Startseite', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          {
            type: 'object', name: 'hero', label: 'Hero (Kopfbereich)',
            fields: [
              {
                type: 'string', name: 'mode', label: 'Hintergrund-Typ',
                description: 'Einzelbild, Diashow (mehrere Bilder) oder Video.',
                options: [
                  { value: 'image', label: 'Einzelbild' },
                  { value: 'random', label: 'Diashow (mehrere Bilder)' },
                  { value: 'video', label: 'Video' },
                ],
              },
              { type: 'image', name: 'image', label: 'Einzelbild (Auto-WebP)', ui: { component: SinglePhotoField } },
              { type: 'image', name: 'slideshow', label: 'Diashow-Bilder (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
              { type: 'string', name: 'video', label: 'Video (optional)', description: 'Pfad zu /uploads/… — Video vorher lokal komprimieren (HandBrake/CapCut).' },
              { type: 'image', name: 'video_poster', label: 'Video-Vorschaubild (Poster)', ui: { component: SinglePhotoField } },
              { type: 'string', name: 'headline_de', label: 'Überschrift', ui: { component: 'textarea' } },
              { type: 'string', name: 'headline_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
              { type: 'string', name: 'cta_portfolio_de', label: 'Knopf 1 (→ Portfolio)' },
              { type: 'string', name: 'cta_portfolio_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'cta_stories_de', label: 'Knopf 2 (→ Stories)' },
              { type: 'string', name: 'cta_stories_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              {
                type: 'object', name: 'polish', label: 'Politur (edler Look, abschaltbar)',
                description: 'Feinschliff-Effekte für den Hero. Aus = 1:1 schlichter Look.',
                fields: [
                  { type: 'boolean', name: 'ken_burns', label: 'Langsamer Bild-Zoom (Ken-Burns)' },
                  { type: 'boolean', name: 'scrim', label: 'Stärkerer Verlauf (Text hebt sich ab)' },
                  { type: 'boolean', name: 'big_headline', label: 'Große, edle Überschrift (Display-Schrift)' },
                  {
                    type: 'string', name: 'scroll_style', label: 'Scroll-Hinweis (Stil)',
                    description: 'Welcher Hinweis unten im Hero zum Weiterscrollen.',
                    options: [
                      { value: 'line', label: 'Linie (elegant)' },
                      { value: 'arrow', label: 'Pfeil ↓ (klassisch / wie Live)' },
                      { value: 'mouse', label: 'Maus (Puls)' },
                      { value: 'none', label: 'Keiner' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object', name: 'intro', label: 'Intro-Block (unter dem Hero)',
            fields: [
              { type: 'string', name: 'subline_de', label: 'Zwischenüberschrift' },
              { type: 'string', name: 'subline_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'subtext_de', label: 'Intro-Text', ui: { component: 'textarea' } },
              { type: 'string', name: 'subtext_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
              // Social-Links (Instagram etc.) werden NICHT mehr hier gepflegt, sondern zentral
              // auf der KONTAKTSEITE (✉️ Kontakt -> Kanäle / contact.json -> channels). Die Intro-
              // Reihe zieht ihre Links von dort -> nur EINE Pflegestelle. An/aus via social_show.intro.
            ],
          },
          {
            type: 'object', name: 'sections', label: 'Sektion-Überschriften (Startseite)',
            fields: [
              { type: 'string', name: 'gallery_kicker_de', label: 'Momentaufnahmen — Kicker' },
              { type: 'string', name: 'gallery_kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'gallery_title_de', label: 'Momentaufnahmen — Titel' },
              { type: 'string', name: 'gallery_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'latest_kicker_de', label: 'Aktuell — Kicker' },
              { type: 'string', name: 'latest_kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'latest_title_de', label: 'Aktuell — Titel' },
              { type: 'string', name: 'latest_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'discover_kicker_de', label: 'Entdecken — Kicker' },
              { type: 'string', name: 'discover_kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'discover_title_de', label: 'Entdecken — Titel' },
              { type: 'string', name: 'discover_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
            ],
          },
          {
            type: 'object', name: 'social_show', label: 'Social-Links anzeigen — wo?',
            description: 'Wo die Instagram-Links (aus der Kontaktseite) erscheinen. Standard: nur Intro (wie Live).',
            fields: [
              { type: 'boolean', name: 'intro', label: 'Im Intro-Block (unter dem Hero)' },
              { type: 'boolean', name: 'hero', label: 'Im Hero (unter den Buttons)' },
              { type: 'boolean', name: 'footer', label: 'Im Footer (auf jeder Seite)' },
            ],
          },
        ],
      },
      // --- Alben: jedes Album ein Eintrag (Mehrfach-Collection wie Reisen) ---
      {
        name: 'alben',
        label: '🖼️ Portfolio Alben',
        path: 'src/data/albums',
        format: 'json',
        // Router -> Live-Vorschau der Album-Unterseite /portfolio/<slug> (useTina).
        ui: {
          router: ({ document }: any) => `/portfolio/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🖼️ Portfolio – Album', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'name', label: 'Album-Name', isTitle: true, required: true, description: 'Erscheint als Anzeigename in der Übersicht.' },
          { type: 'string', name: 'name_en', label: 'Album-Name (Englisch)', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'note_de', label: 'Notiz (optional)', ui: { component: 'textarea' } },
          { type: 'string', name: 'note_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)', description: 'Für Sortierung „Neueste" und die Galerie-Reihenfolge.' },
          { type: 'string', name: 'linked_trip', label: 'Verknüpfte Reise (Slug, optional)', description: 'Slug einer Reise (Dateiname ohne .json, z. B. „florida"). Dann zeigt diese Reise einen „Mehr Fotos im Album"-Link.' },
          {
            type: 'object', name: 'pin', label: 'In der Galerie anheften',
            description: 'Angeheftete Alben stehen in der Galerie vorne.',
            fields: [
              { type: 'boolean', name: 'highlight', label: 'Anheften?' },
              { type: 'number', name: 'highlight_order', label: 'Reihenfolge (kleiner = weiter vorne)' },
            ],
          },
          { type: 'image', name: 'photos', label: 'Fotos (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
        ],
      },
      // --- Galerie: Seiten-Einstellungen (Texte + Sortier-Modi) ---
      {
        name: 'galerie_settings',
        label: '🖼️ Portfolio',
        path: 'src/data',
        format: 'json',
        match: { include: 'gallery-settings' },
        // Router -> Vorschau + Bearbeiten auf /portfolio (Kopf-Block ist dort eine
        // useTina-Insel <SettingsHeader> -> Formular + Live-Update, kein „nothing to edit").
        ui: { allowedActions: { create: false, delete: false }, router: () => '/portfolio' },
        fields: [
          { type: 'string', name: 'ww_here', label: '🖼️ Portfolio – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          {
            type: 'object', name: 'modes', label: 'Sichtbare Sortier-Modi',
            description: 'Welche Sortier-Knöpfe Besucher sehen. Ist nur einer (oder keiner) an, wird die Leiste versteckt und „Alben" als Standard genutzt.',
            fields: [
              { type: 'boolean', name: 'album', label: 'Alben (Karten)' },
              { type: 'boolean', name: 'chronological', label: 'Neueste (flach, nach Datum)' },
              { type: 'boolean', name: 'alphabetical', label: 'A–Z (flach, nach Name)' },
            ],
          },
        ],
      },
      {
        name: 'story',
        label: '📖 Stories',
        path: 'src/content/stories',
        format: 'md',
        ui: {
          // Damit Tina von einem Eintrag direkt die passende Seite oeffnet
          // (Voraussetzung fuer Live-Vorschau / Klick-zum-Feld).
          router: ({ document }) => `/stories/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '📖 Stories – Beitrag', ui: { component: SectionBanner } },
          // --- Deutsch (Haupt) ---
          { type: 'string', name: 'title_de', label: 'Titel', isTitle: true, required: true },
          { type: 'string', name: 'category_de', label: 'Ort / Kategorie' },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)' },
          { type: 'image', name: 'cover', label: 'Titelbild (Auto-WebP)', ui: { component: SinglePhotoField } },
          { type: 'string', name: 'excerpt_de', label: 'Anriss / Vorschautext', ui: { component: 'textarea' } },
          // Haupttext: gespeichert als Markdown-String -> wird ueber unseren
          // mdToHtml-Port gerendert (Pullquote `>`, Listen, Bilder identisch zur
          // Live-Seite). BEWUSST kein Tina-Rich-Text (wuerde Speicherformat +
          // Rendering aendern). Editor = StoryBodyField: Laien-Knoepfe ueber dem
          // Textfeld — „📷 Bild einfuegen" (Auto-WebP-Upload an die Cursor-Stelle)
          // + „📸 Album hier einfuegen" (setzt den [[album]]-Platzhalter -> dort
          // erscheint die Lightbox des unten verknuepften Albums).
          { type: 'string', name: 'body_de', label: 'Haupttext', ui: { component: StoryBodyField } },
          // --- Verknuepftes Album: per Dropdown ein vorhandenes Album waehlen.
          //     Mit „📸 Album hier einfuegen" im Text frei platzierbar (Lightbox),
          //     ohne die Bilder erneut hochzuladen (sie kommen aus dem Album). ---
          {
            type: 'reference',
            name: 'linked_album',
            label: 'Verknüpftes Album (für „📸 Album hier einfügen")',
            description: 'Optional. Wähle ein vorhandenes Album — seine Fotos erscheinen als Lightbox an der [[album]]-Stelle im Text (kein erneuter Upload).',
            collections: ['alben'],
          },
          // --- Optionales Video ---
          { type: 'string', name: 'youtube_url', label: 'YouTube-URL (optional)' },
          // --- Englische Version ---
          { type: 'boolean', name: 'has_english', label: 'Englische Version anzeigen?' },
          { type: 'string', name: 'title_en', label: 'Title (EN)', ui: { component: EnglishStyledField } },
          { type: 'string', name: 'category_en', label: 'Category (EN)', ui: { component: EnglishStyledField } },
          { type: 'string', name: 'excerpt_en', label: 'Excerpt (EN)', ui: { component: EnglishStyledTextField } },
          { type: 'string', name: 'body_en', label: 'Body (EN)', ui: { component: StoryBodyField } },
        ],
      },
      // --- Stories: Seiten-Einstellungen (Kopf-Texte der Stories-Liste) ---
      {
        name: 'stories_settings',
        label: '📖 Stories – Einstellungen',
        path: 'src/data',
        format: 'json',
        match: { include: 'stories-settings' },
        // Router -> Vorschau + Bearbeiten auf /stories (useTina-Insel <SettingsHeader>).
        ui: { allowedActions: { create: false, delete: false }, router: () => '/stories' },
        fields: [
          { type: 'string', name: 'ww_here', label: '📖 Stories – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Reisen: jede Reise ein Eintrag (Mehrfach-Collection wie Stories) ---
      {
        name: 'reisen',
        label: '🧭 Reisen',
        path: 'src/data/trips',
        format: 'json',
        // Router -> Live-Vorschau: eigene Pfad-Route je Reise (/trips/<slug>), damit
        // Tina die richtige Reise zuverlaessig anzeigt (Query-Strings verwirft Tina).
        // Die Route nutzt useTina -> Visual-Editing (Klick=Feld + Live-Update).
        ui: {
          router: ({ document }: any) => `/trips/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🧭 Reisen – Reise', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'number', name: 'order', label: 'Reihenfolge (Tab)', description: 'Kleinere Zahl = weiter links in den Reise-Tabs.' },
          { type: 'string', name: 'title', label: 'Reise-Titel (Tab)', isTitle: true, required: true, description: 'Erscheint als Anzeigename in der Übersicht & als Tab.' },
          { type: 'string', name: 'title_en', label: 'Reise-Titel (Englisch)', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)', description: 'Für Sortierung/Meta.' },
          { type: 'string', name: 'meta_de', label: 'Meta-Zeile (Datum · km · …)' },
          { type: 'string', name: 'meta_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'summary_de', label: 'Zusammenfassung', ui: { component: 'textarea' } },
          { type: 'string', name: 'summary_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'boolean', name: 'upcoming', label: 'Kommende Reise? (zeigt „bald ✦")' },
          {
            type: 'string', name: 'vehicle', label: 'Fahrzeug auf der Karte',
            description: 'Silhouette, die diese Reise auf der Karte fährt. Leer = Ford Expedition.',
            options: [
              { value: 'expedition', label: 'Ford Expedition (Standard)' },
              { value: 'pickup', label: 'Pickup' },
              { value: 'jeep', label: 'Jeep / SUV' },
            ],
          },
          { type: 'string', name: 'vehicle_custom_svg', label: '↳ Eigenes Fahrzeug-SVG (optional)', description: 'Fortgeschritten: kompletter <svg>…</svg>-Code. Überschreibt die Auswahl oben.', ui: { component: 'textarea' } },
          {
            type: 'object', name: 'stops', label: 'Stationen', list: true,
            // 2-in-1: Anreise (✈/🚗) + Zwischenstopp diskret direkt in der Listen-Beschriftung jeder Station.
            ui: { itemProps: (i: any) => ({ label: (i?.arriveBy === 'flight' ? '✈️ ' : '🚗 ') + (i?.name || 'Neue Station') + (i?.kind === 'intermediate' ? ' · Zwischenstopp' : '') }) },
            fields: [
              { type: 'string', name: 'name', label: 'Name (kurz – für Marker & Liste)', required: true, description: 'z. B. San Francisco' },
              {
                type: 'string', name: 'kind', label: 'Art der Station',
                description: 'Hauptstation = voller Block (Titelbild, Text, weitere Fotos). Zwischenstopp = schlank (Titel, Datum, 1–3 Sätze). Leer = Hauptstation.',
                options: [
                  { value: 'main', label: 'Hauptstation' },
                  { value: 'intermediate', label: 'Zwischenstopp' },
                ],
              },
              {
                type: 'string', name: 'arriveBy', label: 'Anreise zu dieser Station',
                description: 'Wie diese Station vom vorherigen Stopp erreicht wird. Fahrt = durchgezogene Linie + Auto. Flug = gekrümmter, gestrichelter Bogen + Flugzeug (zoomt heraus). Leer = Fahrt.',
                options: [
                  { value: 'drive', label: '🚗 Fahrt' },
                  { value: 'flight', label: '✈️ Flug' },
                ],
              },
              { type: 'string', name: 'location', label: '📍 Ort auf der Karte', description: 'Suchen & auf der Karte feinjustieren.', ui: { component: LocationSearchField } },
              { type: 'string', name: 'title_de', label: 'Stations-Titel' },
              { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'date_de', label: 'Datum/Zeitraum' },
              { type: 'string', name: 'date_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'text_de', label: 'Text', ui: { component: 'textarea' } },
              { type: 'string', name: 'text_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
              { type: 'string', name: 'photo', label: 'Titelbild (Zoom/Zuschnitt 16:10, Auto-WebP)', cropRatio: 16 / 10, ui: { component: CropPhotoField } },
              { type: 'image', name: 'photos', label: 'Weitere Fotos (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
              { type: 'string', name: 'video', label: 'Video-Loop (optional)', description: 'Pfad zu /uploads/… — Video vorher lokal komprimieren (HandBrake/CapCut).' },
              { type: 'string', name: 'youtube', label: 'YouTube-URL (optional)' },
            ],
          },
          {
            type: 'object', name: 'gallery', label: '„Reisefazit"-Galerie (optional)', list: true,
            ui: { itemProps: (i: any) => ({ label: i?.image ? i.image.split('/').pop() : 'Neues Bild' }) },
            fields: [
              { type: 'image', name: 'image', label: 'Bild (Auto-WebP)', ui: { component: SinglePhotoField } },
              { type: 'string', name: 'caption_de', label: 'Bildunterschrift' },
              { type: 'string', name: 'caption_en', label: '↳ English', ui: { component: EnglishOnlyField } },
            ],
          },
        ],
      },
      // --- Reisen: Seiten-Einstellungen (Texte + Karten-Stil) ---
      {
        name: 'reisen_settings',
        label: '🧭 Reisen – Einstellungen',
        path: 'src/data',
        format: 'json',
        match: { include: 'trips-settings' },
        // Router -> Vorschau + Bearbeiten auf /trips (useTina-Insel <SettingsHeader>).
        ui: { allowedActions: { create: false, delete: false }, router: () => '/trips' },
        fields: [
          { type: 'string', name: 'ww_here', label: '🧭 Reisen – Einstellungen', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Seiten-Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          {
            type: 'string', name: 'map_style', label: 'Karten-Stil',
            description: 'Stil der MapLibre-Karte (OpenFreeMap).',
            options: [
              { value: 'liberty', label: 'Liberty (Standard)' },
              { value: 'positron', label: 'Positron (hell/minimal)' },
              { value: 'bright', label: 'Bright' },
              { value: 'fiord', label: 'Fiord (gedeckt)' },
              { value: 'dark', label: 'Dark' },
            ],
          },
          {
            type: 'boolean', name: 'map_scroll_zoom', label: 'Karte: Mit Mausrad zoomen',
            description: 'AN (Standard): Mausrad über der Karte zoomt die Karte (am Handy: ein Finger bewegt die Karte). AUS: Mausrad scrollt die Seite (am Handy zwei Finger für die Karte) — wie auf der alten Live-Seite.',
          },
          // --- Globale Timeline-Regler (gelten für ALLE Reisen, auch mobil). Leer = Standard. ---
          { type: 'number', name: 'spotlight_strength', label: 'Spotlight-Stärke (%)', description: 'Wie stark Stationen abseits des Lesefokus zurücktreten. Empfohlen: 70. Höher = klarer Spotlight, niedriger = ruhiger/gleichmäßiger. Bereich 0–90. Leer = 70.' },
          { type: 'number', name: 'dim_fade_ms', label: 'Übergang (ms)', description: 'Weiche Ein-/Ausblend-Dauer des Fokus. Leer = 800.' },
          { type: 'number', name: 'reveal_ms', label: 'Reveal-Dauer (ms)', description: 'Sanftes Einblenden, wenn eine Station erstmals erscheint. Leer = 800.' },
          { type: 'boolean', name: 'snap_enabled', label: 'Stationen einrasten', description: 'AUS (empfohlen): frei scrollen, nichts rastet ein. AN: beim Ruhen rückt die nächste Station sanft an die Lese-Position.' },
        ],
      },
      // --- Reisen: ZENTRALE Design-Werte (eine Datei, 4 Vorlagen). Pro Reise wird nur AUSGEWÄHLT
      //     (Feld `design` in der reisen-Collection); hier werden die WERTE der 4 Designs zentral
      //     gepflegt -> Änderung wirkt global auf alle Reisen mit diesem Design. ---
      {
        name: 'reisen_designs',
        label: '🎨 Reisen – Designs',
        path: 'src/data',
        format: 'json',
        match: { include: 'trip-designs' }, // nur src/data/trip-designs.json
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/trips', // Vorschau-Kontext: Reisen-Seite
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🎨 Reisen – Designs', ui: { component: SectionBanner } },
          designTuningField('none', 'Design „Ohne Rahmen"'),
          designTuningField('soft', 'Design „Ausgewogen"'),
          designTuningField('strong', 'Design „Kräftig" (Standard)'),
          designTuningField('luftig', 'Design „Luftig" (Apple-leicht)'),
        ],
      },
      // --- Equipment / Gear: EIN Eintrag (Seitentexte + Liste) mit Live-Vorschau ---
      {
        name: 'gear',
        label: '🎒 Equipment',
        path: 'src/data',
        format: 'json',
        match: { include: 'gear' }, // nur src/data/gear.json
        ui: {
          // Eine einzige Datei -> kein Anlegen/Loeschen ueber Tina.
          allowedActions: { create: false, delete: false },
          // „Seite öffnen" / Live-Vorschau -> /gear
          router: () => '/gear',
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '🎒 Equipment', ui: { component: SectionBanner } },
          // --- Sprach-Schalter (nur Editor; steuert die EN-Felder) ---
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf-Texte (DE/EN, flach) ---
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Beschreibung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- Listen-Stil (Vorschau im CMS) ---
          {
            type: 'string', name: 'gear_style', label: 'Listen-Stil',
            description: 'Aussehen der Ausrüstungs-Liste. Vorschau unten — einen Stil anklicken.',
            ui: { component: GearStyleField },
            options: [
              { value: 'plain', label: 'Schlicht' },
              { value: 'card', label: 'Karte (erhaben)' },
              { value: 'notes', label: 'Field-Notes / Notizzettel' },
            ],
          },
          {
            type: 'string', name: 'gear_scope', label: 'Reichweite des Stils',
            description: 'Nur relevant bei „Karte" / „Field-Notes": EIN Block um die ganze Liste — oder je Kategorie ein eigener Block.',
            options: [
              { value: 'whole', label: 'Ganze Liste (ein Block / ein Zettel)' },
              { value: 'groups', label: 'Nach Gruppe (je Kategorie ein Block)' },
            ],
          },
          // --- Ausrüstungs-Liste ---
          {
            type: 'object',
            name: 'items',
            label: 'Ausrüstung',
            list: true,
            ui: {
              itemProps: (item: any) => ({
                label: item?.name
                  ? `${item.name}${item.brand ? ' — ' + item.brand : ''}`
                  : 'Neues Ausrüstungsteil',
              }),
            },
            fields: [
              { type: 'string', name: 'name', label: 'Name', required: true, description: 'z. B. Sony A7 IV' },
              { type: 'string', name: 'brand', label: 'Marke', description: 'z. B. Sony' },
              {
                type: 'string',
                name: 'category',
                label: 'Kategorie',
                description: 'Bestimmt, unter welcher Überschrift das Teil erscheint.',
                // Dropdown statt Freitext: kein Vertippen, keine erfundenen Kategorien.
                options: [
                  { value: 'cameras', label: 'Kameras (Cameras)' },
                  { value: 'lenses', label: 'Objektive (Lenses)' },
                  { value: 'drones', label: 'Drohne & Action (Drone & Action)' },
                  { value: 'phone', label: 'Smartphone (Phone)' },
                  { value: 'tripod', label: 'Stativ (Tripod)' },
                  { value: 'backpack', label: 'Rucksack (Backpack)' },
                  { value: 'cooking', label: 'Kochen & Camp (Cooking & Camp)' },
                ],
              },
              { type: 'string', name: 'link', label: 'Link (optional)', description: 'Volle URL (https://…). Leer lassen = kein Link.' },
            ],
          },
        ],
      },
      // --- Über uns: EIN Eintrag (Kopf-Texte + 2 Personen + „Warum die USA?") ---
      {
        name: 'ueber_uns',
        label: '📄 Über uns',
        path: 'src/data',
        format: 'json',
        match: { include: 'about' }, // nur src/data/about.json
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/about',
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '📄 Über uns', ui: { component: SectionBanner } },
          // --- Sprach-Schalter (nur Editor, nichts wird gespeichert) ---
          {
            type: 'string',
            name: 'editor_language',
            label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch anzeigen. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf (Deutsch direkt; Englisch erscheint bei Schalter „an") ---
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- Personen: aufklappbare Liste (Eintrag 1 = links, Eintrag 2 = rechts) ---
          {
            type: 'object',
            name: 'persons',
            label: 'Personen',
            list: true,
            // Jede Person = ein zuklappbarer Eintrag mit dem Namen als Titel.
            ui: { itemProps: (i: any) => ({ label: i?.name || 'Person' }) },
            fields: [
              { type: 'string', name: 'name', label: 'Name', description: 'z. B. Alexandra Apostel' },
              { type: 'string', name: 'photo', label: 'Foto (Zuschnitt 4:3, Auto-WebP)', cropRatio: 4 / 3, ui: { component: CropPhotoField } },
              { type: 'string', name: 'role_de', label: 'Rolle' },
              { type: 'string', name: 'role_en', label: '↳ English', ui: { component: EnglishOnlyField } },
              { type: 'string', name: 'bio_de', label: 'Bio', ui: { component: 'textarea' } },
              { type: 'string', name: 'bio_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
              { type: 'string', name: 'gear_de', label: 'Ausrüstungs-Zeile', description: 'Freie Textzeile (z. B. „Ausrüstung: Sony A7 IV · …"). NICHT automatisch aus der Equipment-Liste.' },
              { type: 'string', name: 'gear_en', label: '↳ English', ui: { component: EnglishOnlyField } },
            ],
          },
          // --- „Warum die USA?" — flach (Überschrift + Text), je inline aufklappbar ---
          { type: 'string', name: 'why_title_de', label: '„Warum die USA?" — Überschrift' },
          { type: 'string', name: 'why_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'why_text_de', label: '„Warum die USA?" — Text', ui: { component: 'textarea' } },
          { type: 'string', name: 'why_text_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Kontakt: EIN Eintrag (Kopf + Direkt-Block + Kanäle + Formular-Texte) ---
      {
        name: 'kontakt',
        label: '✉️ Kontakt',
        path: 'src/data',
        format: 'json',
        match: { include: 'contact' }, // nur src/data/contact.json
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/contact',
        },
        fields: [
          { type: 'string', name: 'ww_here', label: '✉️ Kontakt', ui: { component: SectionBanner } },
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch anzeigen. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf ---
          { type: 'string', name: 'kicker_de', label: 'Mini-Titel (Kicker)' },
          { type: 'string', name: 'kicker_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'intro_de', label: 'Einleitung', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- „Schreib uns direkt" ---
          { type: 'string', name: 'direct_title_de', label: '„Schreib uns direkt" — Überschrift' },
          { type: 'string', name: 'direct_title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'direct_text_de', label: '„Schreib uns direkt" — Text', ui: { component: 'textarea' } },
          { type: 'string', name: 'direct_text_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'location_de', label: 'Standort-Zeile' },
          { type: 'string', name: 'location_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          // --- Kontakt-Kanäle ---
          {
            type: 'object', name: 'channels', label: 'Kontakt-Kanäle (E-Mail, Social)', list: true,
            ui: { itemProps: (i: any) => ({ label: i?.label ? `${i.type || '?'}: ${i.label}` : 'Neuer Kanal' }) },
            fields: [
              {
                type: 'string', name: 'type', label: 'Typ / Plattform',
                description: 'Bestimmt das Symbol automatisch.',
                options: [
                  { value: 'email', label: 'E-Mail' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'x', label: 'X / Twitter' },
                  { value: 'phone', label: 'Telefon' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'pinterest', label: 'Pinterest' },
                  { value: 'web', label: 'Website / Sonstiges' },
                ],
              },
              { type: 'string', name: 'label', label: 'Anzeigetext', description: 'z. B. @name oder die E-Mail-Adresse' },
              { type: 'string', name: 'url', label: 'Link (URL)', description: 'z. B. mailto:hallo@… oder https://…  (leer = kein Link)' },
            ],
          },
          // --- Formular-Texte ---
          { type: 'string', name: 'form_success_de', label: 'Formular — Erfolgs-Meldung', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_success_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'form_name_de', label: 'Formular — Label „Name"' },
          { type: 'string', name: 'form_name_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_email_de', label: 'Formular — Label „E-Mail"' },
          { type: 'string', name: 'form_email_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_message_de', label: 'Formular — Label „Nachricht"' },
          { type: 'string', name: 'form_message_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_send_de', label: 'Formular — Senden-Button' },
          { type: 'string', name: 'form_send_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'form_note_de', label: 'Formular — Hinweis darunter (nur sichtbar, solange KEIN Access-Key gesetzt ist)', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_note_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          // --- Echter Versand (Web3Forms) ---
          {
            type: 'string',
            name: 'form_access_key',
            label: '✉️ Formular-Versand: Web3Forms Access-Key',
            description: 'Leer = Formular ist nur Vorschau (sendet nichts). Key holen auf web3forms.com (kostenlos, mit eurer E-Mail) und hier einfügen — dann versendet das Formular echt an dieses Postfach. Der Key ist öffentlich (kein Geheimnis).',
          },
          { type: 'string', name: 'form_consent_de', label: 'Formular — Datenschutz-Häkchen (Text)', description: 'Pflicht-Häkchen vor dem Senden. Leer = kein Häkchen.', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_consent_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
          { type: 'string', name: 'form_error_de', label: 'Formular — Fehlermeldung (wenn Senden scheitert)', ui: { component: 'textarea' } },
          { type: 'string', name: 'form_error_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Highlights: album-übergreifende Lieblingsfotos (speisen die Home-Teaser) ---
      {
        name: 'highlights',
        label: '⭐ Highlights',
        path: 'src/data',
        format: 'json',
        match: { include: 'highlights' },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'ww_here', label: '⭐ Highlights', ui: { component: SectionBanner } },
          { type: 'image', name: 'images', label: 'Highlight-Fotos (Auto-WebP)', list: true, ui: { component: BulkPhotoField } },
        ],
      },
      // --- Darstellung: globale Optik (Logo + Sichtbarkeits-Schalter) ---
      {
        name: 'darstellung',
        label: '🎨 Darstellung',
        path: 'src/data',
        format: 'json',
        match: { include: 'appearance-settings' },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          { type: 'string', name: 'ww_here', label: '🎨 Darstellung', ui: { component: SectionBanner } },
          { type: 'image', name: 'logo', label: 'Logo (Nav / Hero / Footer)', ui: { component: SinglePhotoField } },
          {
            type: 'string', name: 'image_frame', label: 'Bild-Rahmen & Schatten',
            description: 'Gilt global für ALLE Kästchen (Karten, Kacheln, Fotos, Reise-Tabs, Stationen, Karte, optional Buttons/Felder). Gleiche Rahmendicke pro Stufe. Hero-Bild & Lightbox bleiben vollflächig. Vorschau unten — eine Stufe anklicken.',
            ui: { component: ImageFrameField },
            options: [
              { value: 'none', label: 'Keine' },
              { value: 'soft', label: 'Ausgewogen' },
              { value: 'strong', label: 'Kräftig' },
            ],
          },
          {
            type: 'boolean', name: 'frame_controls', label: 'Auch Buttons & Eingabefelder rahmen?',
            description: 'AN (Standard): auch Buttons/CTAs (im Hero mit durchsichtigem Schatten) und die Kontakt-Eingabefelder bekommen den Rahmen+Schatten. AUS: nur Anzeige-Boxen (Karten/Kacheln/Fotos/Tabs/Stationen/Karte).',
          },
          {
            type: 'boolean', name: 'album_hover', label: 'Alben beim Drüberfahren anheben?',
            description: 'AN (Standard): Portfolio-Alben heben sich beim Hovern leicht an (Klick-Signal). AUS: keine Hover-Bewegung bei den Alben (sinnvoll, da man Alben auch ohne Klick durchscrollen kann).',
          },
          { type: 'boolean', name: 'show_hero_logo', label: 'Logo im Hero zeigen?' },
          { type: 'boolean', name: 'show_discover', label: '„Entdecken"-Bereich auf der Startseite zeigen?' },
          { type: 'boolean', name: 'show_stories', label: 'Stories zeigen? (Nav-Link, Footer, Startseiten-Teaser)' },
          { type: 'boolean', name: 'show_contact', label: 'Kontakt zeigen? (Nav-Link + Footer-Link)' },
          { type: 'boolean', name: 'show_admin_bar', label: 'Admin-Leiste auf der Website zeigen? (nur sichtbar, wenn im CMS angemeldet)' },
        ],
      },
      // --- Datenschutzerklärung: eigene Rechtstext-Seite (/datenschutz) ---
      {
        name: 'datenschutz',
        label: '⚖️ Datenschutz',
        path: 'src/data',
        format: 'json',
        match: { include: 'datenschutz' }, // nur src/data/datenschutz.json
        ui: { allowedActions: { create: false, delete: false }, router: () => '/datenschutz' },
        fields: [
          { type: 'string', name: 'ww_here', label: '⚖️ Datenschutz', ui: { component: SectionBanner } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'updated_de', label: 'Stand (z. B. „Stand: Juni 2026")' },
          { type: 'string', name: 'updated_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'body_de', label: 'Inhalt (Markdown: ## Überschrift, - Liste, [Text](Link))', description: 'Du kannst Text aus einem Datenschutz-Generator hier einfügen — Markdown ODER fertiges HTML funktioniert.', ui: { component: 'textarea' } },
          { type: 'string', name: 'body_en', label: '↳ English (leer = Deutsch wird gezeigt)', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Impressum: eigene Rechtstext-Seite (/impressum) ---
      {
        name: 'impressum',
        label: '⚖️ Impressum',
        path: 'src/data',
        format: 'json',
        match: { include: 'impressum' }, // nur src/data/impressum.json
        ui: { allowedActions: { create: false, delete: false }, router: () => '/impressum' },
        fields: [
          { type: 'string', name: 'ww_here', label: '⚖️ Impressum', ui: { component: SectionBanner } },
          { type: 'string', name: 'title_de', label: 'Titel' },
          { type: 'string', name: 'title_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'updated_de', label: 'Stand (optional)' },
          { type: 'string', name: 'updated_en', label: '↳ English', ui: { component: EnglishOnlyField } },
          { type: 'string', name: 'body_de', label: 'Inhalt (Markdown: ## Überschrift, - Liste, [Text](Link))', description: 'Du kannst Text aus einem Impressum-Generator hier einfügen — Markdown ODER fertiges HTML funktioniert.', ui: { component: 'textarea' } },
          { type: 'string', name: 'body_en', label: '↳ English (leer = Deutsch wird gezeigt)', ui: { component: EnglishOnlyTextField } },
        ],
      },
      // --- Statistik: versteckte Auswerte-Seite (/statistik), cookielose Web-Analyse ---
      {
        name: 'statistik',
        label: '📊 Statistik',
        path: 'src/data',
        format: 'json',
        match: { include: 'statistik' }, // nur src/data/statistik.json
        ui: { allowedActions: { create: false, delete: false }, router: () => '/statistik' },
        fields: [
          { type: 'string', name: 'ww_here', label: '📊 Statistik', ui: { component: SectionBanner } },
          {
            type: 'boolean', name: 'enabled', label: 'Statistik aktiv? (Tracking-Code auf der Website einbinden)',
            description: 'AUS (Standard): es wird NICHTS getrackt. AN: der unten eingefügte Analytics-Code wird auf allen Seiten geladen. Nutze einen cookielosen Dienst, dann ist kein Cookie-Banner nötig.',
          },
          {
            type: 'string', name: 'analytics_snippet', label: 'Analytics-Code (Tracking-Snippet deines Diensts)',
            description: 'Den kompletten <script>…</script>-Schnipsel deines Analyse-Diensts (z. B. Cloudflare Web Analytics, Plausible, Umami) hier einfügen. Wird nur geladen, wenn „Statistik aktiv?" an ist. (Öffentlicher Code, kein Geheimnis.)',
            ui: { component: 'textarea' },
          },
          {
            type: 'string', name: 'dashboard_url', label: 'Dashboard-URL (öffentlicher Freigabe-Link zum Einbetten)',
            description: 'Optional: die öffentliche „Shared Dashboard"-URL deines Diensts (Plausible/Umami) — dann erscheint die Auswertung direkt auf /statistik. Cloudflare Web Analytics lässt sich nicht einbetten; dort dann leer lassen.',
          },
          { type: 'string', name: 'intro_de', label: 'Einleitungstext', ui: { component: 'textarea' } },
          { type: 'string', name: 'intro_en', label: '↳ English', ui: { component: EnglishOnlyTextField } },
        ],
      },
    ],
  },
});
