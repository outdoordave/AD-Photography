// Cloudflare Pages Function: einfacher Bild-Aufruf-Zähler in KV (gratis, kein Umami-Bezahlplan nötig).
//   POST /api/view   Body { "img": "<dateiname>" }  (oder ?img=)  -> zählt dieses Bild +1
//   GET  /api/view                                                -> { "<dateiname>": <anzahl>, … }
// Die Lightbox pingt beim Öffnen eines Bildes POST /api/view; der Medien-Manager liest per GET und
// sortiert danach („Am meisten angesehen").
//
// EINRICHTUNG (einmalig, durch David in Cloudflare):
//   1) Workers & Pages -> KV -> „Create namespace" (z. B. „ad-photography-views").
//   2) Pages-Projekt aandd-photography -> Settings -> Functions -> „KV namespace bindings":
//      Variable name = VIEWS, Namespace = der eben erstellte. (Für Production UND Preview.)
// Ohne Binding ist `env.VIEWS` leer -> die Function antwortet neutral (kein Fehler), Zähler bleibt leer.
//
// Hinweis: Zählung = read-modify-write auf einem JSON-Schlüssel. Für eine kleine Foto-Seite völlig
// ausreichend; bei sehr vielen gleichzeitigen Aufrufen könnten einzelne Zähler minimal ungenau sein.

const KEY = 'counts';

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
function parse(raw) { try { const o = JSON.parse(raw); return o && typeof o === 'object' ? o : {}; } catch { return {}; } }

export async function onRequestGet({ env }) {
  if (!env || !env.VIEWS) return json({});
  const raw = await env.VIEWS.get(KEY);
  return json(raw ? parse(raw) : {});
}

export async function onRequestPost({ request, env }) {
  if (!env || !env.VIEWS) return new Response(null, { status: 204 });
  let img = '';
  try { const b = await request.json(); img = String((b && b.img) || ''); } catch { /* evtl. kein JSON */ }
  if (!img) { try { img = new URL(request.url).searchParams.get('img') || ''; } catch { /* egal */ } }
  img = (img.split('/').pop() || '').trim().slice(0, 200); // nur Dateiname, begrenzt
  if (!img) return new Response(null, { status: 204 });
  const raw = await env.VIEWS.get(KEY);
  const counts = raw ? parse(raw) : {};
  counts[img] = (counts[img] || 0) + 1;
  await env.VIEWS.put(KEY, JSON.stringify(counts));
  return new Response(null, { status: 204 });
}
