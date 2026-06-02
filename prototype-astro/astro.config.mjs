import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Statisches Output reicht fuer die lokale Tina-Live-Vorschau im Dev-Modus.
// Fuer einen PRODUKTIONS-Deploy MIT Editieren braeuchte man zusaetzlich einen
// Server-Adapter (z.B. @astrojs/node) + Tina Cloud / self-hosted Backend.
export default defineConfig({
  integrations: [react()],
});
