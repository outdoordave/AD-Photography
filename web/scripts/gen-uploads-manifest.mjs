// Erzeugt public/uploads-manifest.json: Liste aller Bild-Dateien, die der CMS-Picker
// „🖼️ Aus Mediathek" als Raster zum Wiederverwenden zeigt (ohne erneuten Upload).
// Läuft im Build UND wird einmal committet, damit der lokale Dev-Server (npm run dev)
// das Raster auch ohne Build hat.
//
// EINE Quelle: web/public/uploads — der einzige Bild-Ordner (Tinas Medien-Ziel,
// media.tina: mediaRoot 'uploads' + publicFolder 'public'; von Astro als /uploads/
// ausgeliefert). Die frühere Repo-Wurzel /uploads ist aufgelöst (alles hierher gezogen).
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const dir = resolve('public', 'uploads');

const files = existsSync(dir) ? readdirSync(dir).filter((f) => IMG.test(f)) : [];
const list = files.sort((a, b) => a.localeCompare(b)).map((f) => '/uploads/' + f);
const outDir = resolve('public');
const out = resolve(outDir, 'uploads-manifest.json');
mkdirSync(outDir, { recursive: true });
writeFileSync(out, JSON.stringify(list));
console.log('[uploads-manifest]', list.length, 'Bilder ->', out);
