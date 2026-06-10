import type { APIRoute } from 'astro';

// robots.txt — als Endpoint statt statischer Datei, damit dieselbe selbstkorrigierende
// Logik wie beim noindex greift (siehe BaseLayout): Ist PUBLIC_PREVIEW_NOINDEX === 'true'
// (NUR im Vorschau-Cloudflare-Projekt gesetzt), wird das gesamte Crawling untersagt.
// Auf der spaeteren Live-Seite (Var NICHT gesetzt) wird normal erlaubt + Sitemap verlinkt.
// => Beim Cutover muss hier NICHTS geaendert werden.
const previewNoindex = import.meta.env.PUBLIC_PREVIEW_NOINDEX === 'true';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL('sitemap-index.xml', site).href : '/sitemap-index.xml';
  const body = previewNoindex
    ? ['User-agent: *', 'Disallow: /', ''].join('\n')
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemapUrl}`, ''].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
