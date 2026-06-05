// Erzeugt public/uploads-manifest.json: Liste aller Bild-Dateien im Repo-Wurzel-
// Ordner /uploads. Die CMS-Mediathek (StoryBodyField, Knopf „🖼️ Aus Mediathek
// wählen") zeigt daraus ein Raster vorhandener Bilder zum Einfügen im Text — ohne
// erneuten Upload (wie Sveltias Medienbibliothek). Läuft im Build UND wird einmal
// committet, damit der lokale Dev-Server (npm run dev) das Raster auch ohne Build hat.
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve('..', 'uploads');
const outDir = resolve('public');
const out = resolve(outDir, 'uploads-manifest.json');
const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;

let files = [];
if (existsSync(src)) {
  files = readdirSync(src).filter((f) => IMG.test(f)).sort((a, b) => a.localeCompare(b));
}
const list = files.map((f) => '/uploads/' + f);
mkdirSync(outDir, { recursive: true });
writeFileSync(out, JSON.stringify(list));
console.log('[uploads-manifest]', list.length, 'Bilder ->', out);
