// Holt bei jedem Build die TikTok-Vorschaubilder für Journal-Einträge über den ÖFFENTLICHEN
// TikTok-oEmbed-Endpunkt (kein Token) und hostet sie LOKAL (public/uploads/social/tiktok-<id>.webp,
// per sharp -> WebP), statt zur Laufzeit zu TikToks CDN zu hotlinken. Die Journal-Seite leitet den
// lokalen Pfad allein aus der Video-ID der URL ab (s. resolveSocial in src/lib/journal.ts).
//
// Nur wenn nötig: manuell gesetztes social.thumbnail -> nichts tun; Datei schon vorhanden -> skip.
// ROBUST: jeder Fehler (TikTok nicht erreichbar, kein Bild) wird nur geloggt — der Build läuft
// ohne Vorschaubild weiter und bricht NIE ab. Läuft im Build VOR `astro build` (public -> dist).
import { readdirSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const JOURNAL = resolve('src', 'content', 'journal');
const OUT = resolve('public', 'uploads', 'social');
const UA = 'Mozilla/5.0 (compatible; WideWildBuild/1.0)';

function tiktokId(url) {
  const m = String(url || '').match(/\/video\/(\d+)/);
  return m ? m[1] : '';
}

async function oembedThumb(url) {
  const r = await fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(url), { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('oEmbed HTTP ' + r.status);
  const j = await r.json();
  if (!j || !j.thumbnail_url) throw new Error('kein thumbnail_url');
  return j.thumbnail_url;
}

async function run() {
  if (!existsSync(JOURNAL)) { console.log('[social-thumbs] kein Journal-Ordner -> übersprungen.'); return; }
  const files = readdirSync(JOURNAL).filter((f) => f.endsWith('.md'));
  let done = 0, skip = 0, fail = 0;
  for (const f of files) {
    let s;
    try { s = matter(readFileSync(join(JOURNAL, f), 'utf8')).data?.social; } catch (e) { continue; }
    if (!s || s.platform !== 'tiktok' || !s.url) continue;
    if (s.thumbnail) { skip++; continue; }               // manuelles Bild gesetzt
    const id = tiktokId(s.url);
    if (!id) { console.warn('[social-thumbs] keine Video-ID in', s.url); continue; }
    const outPath = join(OUT, 'tiktok-' + id + '.webp');
    if (existsSync(outPath)) { skip++; continue; }        // schon vorhanden
    try {
      const thumbUrl = await oembedThumb(s.url);
      const img = await fetch(thumbUrl, { headers: { 'User-Agent': UA } });
      if (!img.ok) throw new Error('Bild HTTP ' + img.status);
      const buf = Buffer.from(await img.arrayBuffer());
      if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
      const webp = await sharp(buf).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      await writeFile(outPath, webp);
      done++;
      console.log('[social-thumbs] geholt: tiktok-' + id + '.webp');
    } catch (e) {
      fail++;
      console.warn('[social-thumbs] TikTok-Vorschau fehlgeschlagen für', s.url, '-', e.message, '(Build läuft ohne Bild weiter)');
    }
  }
  console.log(`[social-thumbs] fertig: ${done} geholt, ${skip} übersprungen, ${fail} fehlgeschlagen.`);
}

run().catch((e) => console.warn('[social-thumbs] unerwartet:', e && e.message));
