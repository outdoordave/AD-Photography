import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// AD-Photography — Astro-Grundgeruest (Stufe 1: Stories)
// -----------------------------------------------------------------------------
// output: 'static'
//   Fuer LOKALES Tina-Visual-Editing (React-Inseln + `tinacms dev`) ist statische
//   Ausgabe ausreichend — im Prototyp bereits bewiesen. Ein SSR-Server-Adapter
//   (z. B. @astrojs/cloudflare) wird ERST eingerichtet, falls Schritt 5 zeigt,
//   dass Tina-Visual-Editing ihn wirklich braucht. So bleibt das Geruest schlank.
//
// i18n (DE/EN-READY):
//   Bereitet nur die ROUTING-Struktur vor (DE = '/', EN = '/en/'), damit eine
//   saubere Zweisprachigkeit spaeter moeglich ist. Legt bewusst NICHT die
//   Body-/Inhalts-Struktur fest — diese Entscheidung faellt in Schritt 3.
export default defineConfig({
  output: 'static',
  integrations: [react()],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false, // '/' = DE, '/en/...' = EN
    },
  },
});
