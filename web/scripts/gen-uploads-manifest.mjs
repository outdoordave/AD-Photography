// Erzeugt public/uploads-manifest.json: Liste aller Bild-Dateien, die der CMS-Picker
// „🖼️ Aus Mediathek" als Raster zum Wiederverwenden zeigt (ohne erneuten Upload).
// Läuft im Build UND wird einmal committet, damit der lokale Dev-Server (npm run dev)
// das Raster auch ohne Build hat.
//
// ZWEI Quellen, weil Bilder an zwei Stellen liegen können — beide werden auf der Seite
// unter derselben URL /uploads/<datei> ausgeliefert (also nach Dateiname mergen + dedupen):
//   (1) Repo-Wurzel /uploads   — kanonischer, „tragender" Bestand (copy-uploads.mjs zieht ihn in den Build).
//   (2) web/public/uploads     — DORTHIN committet TinaCMS frische CMS-Uploads
//                                (media.tina: mediaRoot 'uploads' + publicFolder 'public').
// Lokal ist (2) oft ein Symlink auf (1) -> beide liefern dieselben Namen, Dedupe greift.
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const sources = [resolve('..', 'uploads'), resolve('public', 'uploads')];

const names = new Set();
for (const dir of sources) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (IMG.test(f)) names.add(f);
  }
}

const list = [...names].sort((a, b) => a.localeCompare(b)).map((f) => '/uploads/' + f);
const outDir = resolve('public');
const out = resolve(outDir, 'uploads-manifest.json');
mkdirSync(outDir, { recursive: true });
writeFileSync(out, JSON.stringify(list));
console.log('[uploads-manifest]', list.length, 'Bilder ->', out);
