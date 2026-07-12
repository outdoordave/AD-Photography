// Erzeugt public/uploads-views.json = { "<dateiname>": <aufrufe> } für die Sortierung „Am meisten
// angesehen" im Medien-Manager. Datenquelle: Umami Cloud. Die Lightbox sendet pro Bild ein Event
// `foto` mit der Eigenschaft `bild` (= Dateiname); hier holen wir die Aufruf-Zahlen je `bild`.
//
// ZWEI Wege — es wird KEIN Bezahl-Plan gebraucht:
//   1) DEFAULT: über die ÖFFENTLICHE FREIGABE (Share-Link). Umami gibt unter /api/share/<id> einen
//      kurzlebigen Token zurück, mit dem man dieselben Daten wie das geteilte Dashboard abfragt —
//      ganz ohne API-Key. Share-URL steht in src/data/statistik.json (dashboard_url).
//   2) OPTIONAL: falls doch ein API-Key vorhanden ist (UMAMI_API_KEY), wird der genutzt (api.umami.is).
//
// Umgebungsvariablen (alle optional, sinnvolle Vorgaben):
//   UMAMI_SHARE_URL  (Vorgabe: der bekannte Share-Link)   UMAMI_REGION (Vorgabe: eu — Konto-Region)
//   UMAMI_API_KEY (optionaler Override, nutzt api.umami.is)   UMAMI_EVENT (foto)  UMAMI_PROP (bild)  UMAMI_SINCE (2024-01-01)
//
// Echte Umami-Cloud-Endpunkte (per Browser-Analyse ermittelt):
//   Token:  {origin}/analytics/{region}/api/share/{shareId}   -> { token, websiteId, parameters }
//   Daten:  {origin}/analytics/{region}/api/websites/{id}/event-data/values?...&eventName=foto&propertyName=bild
// ⚠️ STAND: Die ÖFFENTLICHE Freigabe liefert zwar einen Token, der Event-Daten-Endpunkt weist ihn aber mit
// 401 ab (Umami gibt Event-Eigenschaften über den freien Share offenbar NICHT frei). Zuverlässig geht es
// nur mit API-Key (Bezahl-Plan) — ODER über einen eigenen Zähler (Cloudflare KV), s. Rückmeldung an David.
// Fehlertolerant: bei jedem Problem LEERE Liste (Build bricht NIE ab) + Roh-Antwort ins Log.
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const SHARE_URL = process.env.UMAMI_SHARE_URL || 'https://cloud.umami.is/share/zN02SMrlAweIl9zv';
const REGION = process.env.UMAMI_REGION || 'eu';
const API_KEY = process.env.UMAMI_API_KEY || '';
const EVENT = process.env.UMAMI_EVENT || 'foto';
const PROP = process.env.UMAMI_PROP || 'bild';
const SINCE = process.env.UMAMI_SINCE || '2024-01-01';

const outDir = resolve('public');
const outFile = resolve(outDir, 'uploads-views.json');

function writeOut(map) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(map));
  console.log('[uploads-views]', Object.keys(map).length, 'Bilder mit Aufrufen ->', outFile);
}

// Aus [{value,total}] (bzw. Fallback-Feldern) ein { name: anzahl } machen.
function toMap(arr) {
  const map = {};
  for (const row of arr || []) {
    const key = row && (row.value ?? row.x ?? row.bild);
    const n = row && (row.total ?? row.count ?? row.y ?? row.views);
    if (key != null && n != null) map[String(key)] = Number(n) || 0;
  }
  return map;
}

// event-data/values abfragen: Werte + Häufigkeit der Eigenschaft `bild` beim `foto`-Event.
async function fetchValues(origin, websiteId, headers, startAt, endAt) {
  const url = `${origin}/api/websites/${websiteId}/event-data/values?startAt=${startAt}&endAt=${endAt}&eventName=${encodeURIComponent(EVENT)}&propertyName=${encodeURIComponent(PROP)}`;
  const res = await fetch(url, { headers: { accept: 'application/json', ...headers } });
  const text = await res.text();
  if (!res.ok) { console.warn(`[uploads-views] HTTP ${res.status} für ${url}\n  Antwort: ${text.slice(0, 300)}`); return null; }
  let json; try { json = JSON.parse(text); } catch { console.warn('[uploads-views] Antwort kein JSON:', text.slice(0, 300)); return null; }
  const arr = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : null);
  if (!arr) { console.warn('[uploads-views] Unerwartetes Format:', JSON.stringify(json).slice(0, 300)); return null; }
  return toMap(arr);
}

async function main() {
  const startAt = Date.parse(SINCE) || Date.UTC(2024, 0, 1);
  const endAt = Date.now();
  try {
    if (API_KEY) {
      // Weg 2: API-Key (api.umami.is)
      const origin = process.env.UMAMI_API_URL || 'https://api.umami.is';
      const websiteId = process.env.UMAMI_WEBSITE_ID || '4cef717c-7625-4587-b06f-c681996250ab';
      const map = await fetchValues(origin.replace(/\/v1$/, ''), websiteId, { 'x-umami-api-key': API_KEY }, startAt, endAt);
      return writeOut(map || {});
    }
    // Weg 1: Freigabe (Share-Link) — Token holen, dann Daten abfragen. Kein API-Key nötig.
    const m = SHARE_URL.match(/^(https?:\/\/[^/]+)\/share\/([^/?#]+)/);
    if (!m) { console.warn('[uploads-views] UMAMI_SHARE_URL unbrauchbar:', SHARE_URL); return writeOut({}); }
    const origin = `${m[1]}/analytics/${REGION}`, shareId = m[2]; // Konto-Region im API-Pfad
    const shareRes = await fetch(`${origin}/api/share/${shareId}`, { headers: { accept: 'application/json' } });
    const shareText = await shareRes.text();
    if (!shareRes.ok) { console.warn(`[uploads-views] Share-Token HTTP ${shareRes.status}: ${shareText.slice(0, 300)}`); return writeOut({}); }
    let share; try { share = JSON.parse(shareText); } catch { console.warn('[uploads-views] Share-Antwort kein JSON:', shareText.slice(0, 200)); return writeOut({}); }
    const token = share.token, websiteId = share.websiteId || share.id;
    if (!token || !websiteId) { console.warn('[uploads-views] Share ohne token/websiteId:', JSON.stringify(share).slice(0, 200)); return writeOut({}); }
    // Umami-Frontend schickt den Share-Token als Authorization-Bearer (und teils x-umami-share-token).
    const map = await fetchValues(origin, websiteId, { Authorization: `Bearer ${token}`, 'x-umami-share-token': token }, startAt, endAt);
    return writeOut(map || {});
  } catch (e) {
    console.warn('[uploads-views] Abruf fehlgeschlagen:', String(e?.message || e), '-> leere Liste.');
    return writeOut({});
  }
}

main();
