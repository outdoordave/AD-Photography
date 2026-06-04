import { defineConfig } from 'tinacms';
import BulkPhotoField from './fields/BulkPhotoField';
import SinglePhotoField from './fields/SinglePhotoField';
import { BilingualField, BilingualTextField } from './fields/BilingualField';
import EnglishToggle from './fields/EnglishToggle';
import LocationSearchField from './fields/LocationSearchField';

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

export default defineConfig({
  branch,
  clientId,
  token,
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
      {
        name: 'story',
        label: 'Stories',
        path: 'src/content/stories',
        format: 'md',
        ui: {
          // Damit Tina von einem Eintrag direkt die passende Seite oeffnet
          // (Voraussetzung fuer Live-Vorschau / Klick-zum-Feld).
          router: ({ document }) => `/stories/${document._sys.filename}`,
        },
        fields: [
          // --- Deutsch (Haupt) ---
          { type: 'string', name: 'title_de', label: 'Titel', isTitle: true, required: true },
          { type: 'string', name: 'category_de', label: 'Ort / Kategorie' },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)' },
          { type: 'image', name: 'cover', label: 'Titelbild' },
          { type: 'string', name: 'excerpt_de', label: 'Anriss / Vorschautext', ui: { component: 'textarea' } },
          // Haupttext als Markdown-String (Textarea) -> wird ueber unseren
          // mdToHtml-Port gerendert (Pullquote `>`, Listen, Bilder usw. identisch
          // zur Live-Seite). BEWUSST kein Tina-Rich-Text (wuerde Speicherformat +
          // Rendering aendern).
          { type: 'string', name: 'body_de', label: 'Haupttext (Markdown)', ui: { component: 'textarea' } },
          // --- Galerie: eigenes Bulk-Upload-Feld (mehrere Fotos auf einmal,
          //     Auto-WebP @2400px, Sortieren per Drag & Drop) ---
          {
            type: 'image',
            name: 'gallery',
            label: 'Galerie (Mehrfach-Upload, Auto-WebP)',
            list: true,
            ui: { component: BulkPhotoField },
          },
          // --- Optionales Video ---
          { type: 'string', name: 'youtube_url', label: 'YouTube-URL (optional)' },
          // --- Englische Version ---
          { type: 'boolean', name: 'has_english', label: 'Englische Version anzeigen?' },
          { type: 'string', name: 'title_en', label: 'Title (EN)' },
          { type: 'string', name: 'category_en', label: 'Category (EN)' },
          { type: 'string', name: 'excerpt_en', label: 'Excerpt (EN)', ui: { component: 'textarea' } },
          { type: 'string', name: 'body_en', label: 'Body (EN, Markdown)', ui: { component: 'textarea' } },
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
          // --- Seitenkopf-Texte (DE/EN) ---
          {
            type: 'object',
            name: 'kicker',
            label: 'Mini-Titel (Kicker)',
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
          {
            type: 'object',
            name: 'title',
            label: 'Titel',
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
          {
            type: 'object',
            name: 'intro',
            label: 'Beschreibung',
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch', ui: { component: 'textarea' } },
              { type: 'string', name: 'en', label: 'Englisch', ui: { component: 'textarea' } },
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
          // --- Sprach-Schalter (nur Editor, nichts wird gespeichert) ---
          {
            type: 'string',
            name: 'editor_language',
            label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch anzeigen. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf (Deutsch direkt; Englisch erscheint bei Schalter „an") ---
          {
            type: 'object', name: 'kicker', label: 'Mini-Titel (Kicker)',
            ui: { component: BilingualField },
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
          {
            type: 'object', name: 'title', label: 'Titel',
            ui: { component: BilingualField },
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
          {
            type: 'object', name: 'intro', label: 'Einleitung',
            ui: { component: BilingualTextField },
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
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
              { type: 'image', name: 'photo', label: 'Foto (Auto-WebP)', ui: { component: SinglePhotoField } },
              {
                type: 'object', name: 'role', label: 'Rolle',
                ui: { component: BilingualField },
                fields: [
                  { type: 'string', name: 'de', label: 'Deutsch' },
                  { type: 'string', name: 'en', label: 'Englisch' },
                ],
              },
              {
                type: 'object', name: 'bio', label: 'Bio',
                ui: { component: BilingualTextField },
                fields: [
                  { type: 'string', name: 'de', label: 'Deutsch' },
                  { type: 'string', name: 'en', label: 'Englisch' },
                ],
              },
              {
                type: 'object', name: 'gear', label: 'Ausrüstungs-Zeile',
                description: 'Freie Textzeile (z. B. „Ausrüstung: Sony A7 IV · …"). NICHT automatisch aus der Equipment-Liste.',
                ui: { component: BilingualField },
                fields: [
                  { type: 'string', name: 'de', label: 'Deutsch' },
                  { type: 'string', name: 'en', label: 'Englisch' },
                ],
              },
            ],
          },
          // --- „Warum die USA?" — flach (Überschrift + Text), je inline aufklappbar ---
          {
            type: 'object', name: 'why_title', label: '„Warum die USA?" — Überschrift',
            ui: { component: BilingualField },
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
          {
            type: 'object', name: 'why_text', label: '„Warum die USA?" — Text',
            ui: { component: BilingualTextField },
            fields: [
              { type: 'string', name: 'de', label: 'Deutsch' },
              { type: 'string', name: 'en', label: 'Englisch' },
            ],
          },
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
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch anzeigen. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          // --- Seitenkopf ---
          { type: 'object', name: 'kicker', label: 'Mini-Titel (Kicker)', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'title', label: 'Titel', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'intro', label: 'Einleitung', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          // --- „Schreib uns direkt" ---
          { type: 'object', name: 'direct_title', label: '„Schreib uns direkt" — Überschrift', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'direct_text', label: '„Schreib uns direkt" — Text', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'location', label: 'Standort-Zeile', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
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
          { type: 'object', name: 'form_success', label: 'Formular — Erfolgs-Meldung', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'form_name', label: 'Formular — Label „Name"', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'form_email', label: 'Formular — Label „E-Mail"', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'form_message', label: 'Formular — Label „Nachricht"', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'form_send', label: 'Formular — Senden-Button', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'form_note', label: 'Formular — Hinweis darunter', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
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
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Schalter: nur Deutsch — oder Deutsch + Englisch. Gilt für alle Felder. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'number', name: 'order', label: 'Reihenfolge (Tab)', description: 'Kleinere Zahl = weiter links in den Reise-Tabs.' },
          { type: 'object', name: 'title', label: 'Reise-Titel (Tab)', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'string', name: 'date', label: 'Datum (YYYY-MM-DD)', description: 'Für Sortierung/Meta.' },
          { type: 'object', name: 'meta', label: 'Meta-Zeile (Datum · km · …)', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'summary', label: 'Zusammenfassung', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'boolean', name: 'upcoming', label: 'Kommende Reise? (zeigt „bald ✦")' },
          {
            type: 'object', name: 'stops', label: 'Stationen', list: true,
            ui: { itemProps: (i: any) => ({ label: i?.name || 'Neue Station' }) },
            fields: [
              { type: 'string', name: 'name', label: 'Name (kurz – für Marker & Liste)', required: true, description: 'z. B. San Francisco' },
              { type: 'string', name: 'location', label: '📍 Ort auf der Karte', description: 'Suchen & auf der Karte feinjustieren.', ui: { component: LocationSearchField } },
              { type: 'object', name: 'title', label: 'Stations-Titel', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
              { type: 'object', name: 'date', label: 'Datum/Zeitraum', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
              { type: 'object', name: 'text', label: 'Text', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
              { type: 'image', name: 'photo', label: 'Titelbild (Auto-WebP)', ui: { component: SinglePhotoField } },
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
              { type: 'object', name: 'caption', label: 'Bildunterschrift', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
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
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: 'string', name: 'editor_language', label: 'Sprache',
            description: 'Nur Deutsch — oder Deutsch + Englisch. (Nur Anzeige im Editor.)',
            ui: { component: EnglishToggle },
          },
          { type: 'object', name: 'kicker', label: 'Mini-Titel (Kicker)', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'title', label: 'Seiten-Titel', ui: { component: BilingualField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
          { type: 'object', name: 'intro', label: 'Einleitung', ui: { component: BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
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
        ],
      },
      // --- PROTOTYP: isolierte Test-Collection fuer das Ortssuche-Feld ---
      {
        name: 'proto_ort',
        label: 'PROTOTYP · Ortssuche',
        path: 'src/content/proto',
        format: 'md',
        fields: [
          { type: 'string', name: 'name', label: 'Name (Test)', isTitle: true, required: true },
          {
            type: 'string',
            name: 'location',
            label: '📍 Ort auf der Karte',
            // Speichert GeoJSON-Point-String wie Sveltias widget:map (pickStopCoord-kompatibel)
            ui: { component: LocationSearchField },
          },
        ],
      },
    ],
  },
});
