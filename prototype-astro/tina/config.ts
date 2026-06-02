import { defineConfig } from 'tinacms';

// LOKALER Modus: clientId/token leer -> Tina laeuft ohne Tina-Cloud, liest/
// schreibt direkt die Markdown-Dateien in content/stories. Fuer einen echten
// Online-Betrieb (mehrere Redakteure, Auth) braeuchte man Tina Cloud ODER ein
// self-hosted Backend - hier bewusst NICHT, weil reiner lokaler Prototyp.
export default defineConfig({
  branch: 'main',
  clientId: '', // leer = lokaler Modus (kein Tina-Cloud)
  token: '',
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      // Bilder bleiben git-basiert unter public/uploads (kein externes CDN).
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'story',
        label: 'Stories',
        path: 'content/stories',
        format: 'md',
        ui: {
          // Tina kann von einem Eintrag direkt die passende Seite oeffnen ->
          // Voraussetzung fuer Klick-zum-Feld / Live-Vorschau.
          router: ({ document }) => `/stories/${document._sys.filename}`,
        },
        fields: [
          { type: 'string', name: 'title_de', label: 'Titel', isTitle: true, required: true },
          { type: 'string', name: 'category_de', label: 'Ort / Kategorie' },
          { type: 'datetime', name: 'date', label: 'Datum', ui: { dateFormat: 'YYYY-MM-DD' } },
          { type: 'image', name: 'cover', label: 'Titelbild' },
          { type: 'string', name: 'youtube_url', label: 'YouTube-URL' },
          { type: 'string', name: 'excerpt_de', label: 'Anriss / Vorschautext', ui: { component: 'textarea' } },
          // === DEMO: sortierbares Bild-Array (Drag & Drop in der Tina-Sidebar) ===
          // Existiert in der echten Website NICHT - nur hier, um Tinas
          // Drag-&-Drop-Sortierung erlebbar zu machen.
          { type: 'image', name: 'gallery', label: 'Galerie (Demo: per Drag & Drop sortierbar)', list: true },
          // Haupttext = Markdown-Body der Datei (isBody)
          { type: 'rich-text', name: 'body', label: 'Haupttext', isBody: true },
          // === Englische Version (wie heute: Geschwister-Felder) ===
          { type: 'boolean', name: 'has_english', label: 'Englische Version anzeigen?' },
          { type: 'string', name: 'title_en', label: 'Title (EN)' },
          { type: 'string', name: 'category_en', label: 'Category (EN)' },
          { type: 'string', name: 'excerpt_en', label: 'Excerpt (EN)', ui: { component: 'textarea' } },
        ],
      },
    ],
  },
});
