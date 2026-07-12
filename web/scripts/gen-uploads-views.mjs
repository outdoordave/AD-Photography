// Erzeugt public/uploads-views.json = { "<dateiname>": <aufrufe> } für die Sortierung „Am meisten
// angesehen" im Medien-Manager. Datenquelle: Umami Cloud. Die Lightbox sendet pro Bild ein Event
// `foto` mit der Eigenschaft `bild` (= Dateiname); hier holen wir die Aufruf-Zahlen je `bild`.
//
// Braucht einen Umami-API-Key als Umgebungsvariable (in Cloudflare Pages als Secret hinterlegen):
//   UMAMI_API_KEY   – Pflicht. Ohne Key wird eine LEERE Liste geschrieben (Build bricht NIE ab).
// Optional (haben sinnvolle Vorgaben):
//   UMAMI_WEBSITE_ID (Vorgabe: die ID aus statistik.json)
//   UMAMI_API_URL    (Vorgabe: https://api.umami.is/v1)
//   UMAMI_EVENT      (Vorgabe: foto)   UMAMI_PROP (Vorgabe: bild)   UMAMI_SINCE (Vorgabe: 2024-01-01)
//
// ⚠️ Die genaue Umami-Cloud-API konnte offline nicht getestet werden. Das Skript ist fehlertolerant und
// LOGGT bei Problemen die Roh-Antwort — bei Bedarf das Cloudflare-Build-Log prüfen und den Aufruf anpassen.
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const API_KEY = process.env.UMAMI_API_KEY || '';
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || '4cef717c-7625-4587-b06f-c681996250ab';
const API_URL = (process.env.UMAMI_API_URL || 'https://api.umami.is/v1').replace(/\/+$/, '');
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

async function main() {
  if (!API_KEY) {
    console.log('[uploads-views] Kein UMAMI_API_KEY gesetzt -> leere Liste (kein Fehler). „Am meisten angesehen" bleibt leer.');
    return writeOut({});
  }
  const startAt = Date.parse(SINCE) || Date.UTC(2024, 0, 1);
  const endAt = Date.now();
  // Umami Cloud: Werte + Häufigkeit einer Event-Eigenschaft. eventName filtert auf das `foto`-Event.
  const url = `${API_URL}/websites/${WEBSITE_ID}/event-data/values?startAt=${startAt}&endAt=${endAt}&eventName=${encodeURIComponent(EVENT)}&propertyName=${encodeURIComponent(PROP)}`;
  try {
    const res = await fetch(url, { headers: { 'x-umami-api-key': API_KEY, accept: 'application/json' } });
    const text = await res.text();
    if (!res.ok) {
      console.warn(`[uploads-views] Umami HTTP ${res.status} für ${url}\n  Antwort: ${text.slice(0, 300)}`);
      return writeOut({});
    }
    let json;
    try { json = JSON.parse(text); } catch { console.warn('[uploads-views] Antwort ist kein JSON:', text.slice(0, 300)); return writeOut({}); }
    // Erwartet: [{ value: "<dateiname>", total: <n> }, …]. Robuster Fallback auf {value,count}/andere Felder.
    const arr = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : null);
    if (!arr) { console.warn('[uploads-views] Unerwartetes Format (kein Array). Roh:', JSON.stringify(json).slice(0, 300)); return writeOut({}); }
    const map = {};
    for (const row of arr) {
      const key = row && (row.value ?? row.x ?? row.bild);
      const n = row && (row.total ?? row.count ?? row.y ?? row.views);
      if (key != null && n != null) map[String(key)] = Number(n) || 0;
    }
    return writeOut(map);
  } catch (e) {
    console.warn('[uploads-views] Abruf fehlgeschlagen:', String(e?.message || e), '-> leere Liste.');
    return writeOut({});
  }
}

main();
