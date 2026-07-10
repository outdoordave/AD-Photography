// Erzeugt public/uploads-manifest.json: Liste ALLER Bild-Dateien unter public/uploads —
// jetzt REKURSIV inkl. Unterordner (reisen/<slug>/…, alben/<slug>/…, journal/, stories/,
// site/…, allgemein/). Speist den „🖼️ Aus Mediathek"-Picker der Foto-Felder UND die neue
// Medien-Manager-Seite (die den Ordnerbaum aus den Pfaden ableitet).
// Läuft im Build UND wird einmal committet, damit der lokale Dev-Server (npm run dev) das
// Raster auch ohne Build hat.
//
// EINE Quelle: web/public/uploads (Tinas Medien-Ziel; media.tina: mediaRoot 'uploads' +
// publicFolder 'public'; von Astro als /uploads/ ausgeliefert). Ausgabeformat bleibt eine
// flache Liste von „/uploads/<pfad>"-Strings (nur eben jetzt mit Unterordner-Pfaden) — die
// bestehenden Picker funktionieren unverändert weiter.
import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, posix } from 'node:path';

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const root = resolve('public', 'uploads');

/** Alle Bild-Dateien unter `dir` einsammeln, rel = Pfad relativ zu public/uploads (mit /). */
function walk(dir, rel, out) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name.startsWith('.')) continue; // .DS_Store & Co. überspringen
    const abs = join(dir, name);
    let st;
    try { st = statSync(abs); } catch { continue; }
    const relPath = rel ? posix.join(rel, name) : name;
    if (st.isDirectory()) {
      walk(abs, relPath, out);
    } else if (IMG.test(name)) {
      out.push('/uploads/' + relPath);
    }
  }
}

const list = [];
if (existsSync(root)) walk(root, '', list);
list.sort((a, b) => a.localeCompare(b));

const outDir = resolve('public');
const out = resolve(outDir, 'uploads-manifest.json');
mkdirSync(outDir, { recursive: true });
writeFileSync(out, JSON.stringify(list));
console.log('[uploads-manifest]', list.length, 'Bilder (rekursiv) ->', out);
