import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// site: Kanonische Produktions-URL (fuer Sitemap + absolute Links). Default ist das
// Live-Cloudflare-Ziel; per Env SITE_URL ueberschreibbar (z. B. spaeterer Custom-Domain).
const SITE = process.env.SITE_URL || 'https://aandd-photography.pages.dev';

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
  site: SITE,
  output: 'static',
  integrations: [
    react(),
    // Sitemap: erzeugt sitemap-index.xml + sitemap-0.xml beim Build und listet alle
    // Seiten (DE auf '/', EN auf '/en/'). KEINE i18n-Option: die setzt einen Locale-
    // Pfad-Praefix auf JEDER Seite voraus — bei prefixDefaultLocale:false haben unsere
    // DE-Seiten aber keinen Praefix, was den Build crasht. hreflang-Alternates entfallen
    // daher bewusst; alle Seiten sind trotzdem vollstaendig in der Sitemap enthalten.
    // /proto/* sind interne Vorschauen (noindex) -> nicht in die Sitemap aufnehmen.
    // /statistik (DE + EN) ist noindex (versteckte Auswerte-Seite) -> ebenfalls raus,
    // sonst meldet die Search Console "Uebermittelte URL als 'noindex' gekennzeichnet".
    sitemap({ filter: (page) => !page.includes('/proto/') && !page.includes('/statistik') }),
  ],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false, // '/' = DE, '/en/...' = EN
    },
  },
});
