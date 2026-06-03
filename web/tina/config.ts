import { defineConfig } from 'tinacms';
import BulkPhotoField from './fields/BulkPhotoField';
import LocationSearchField from './fields/LocationSearchField';

// LOKALER Modus (clientId/token leer): Tina laeuft ohne Tina-Cloud und liest/
// schreibt direkt die Markdown-Dateien in src/content/stories. Bilder bleiben
// git-basiert unter public/uploads (Symlink -> ../../uploads, also Repo-/uploads).
export default defineConfig({
  branch: 'astro-umbau',
  clientId: '',
  token: '',
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
