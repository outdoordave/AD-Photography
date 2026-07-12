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
//
// ZUSÄTZLICH: public/uploads-meta.json = { "/uploads/<pfad>": { size, added } } für den Medien-
// Manager (Sortierung nach Größe/Datum). `size` = Dateigröße in Bytes. `added` = ISO-Datum des
// ERST-Commits der Datei (echtes Upload-Datum) via Git; Fallback = Dateisystem-mtime (z. B. bei
// noch nicht committeten Dateien oder Shallow-Clone). Der bestehende `uploads-manifest.json` bleibt
// UNVERÄNDERT (string[]) — die Foto-Picker funktionieren weiter; die Meta-Datei ist rein additiv.
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readPhotoInfo } from './lib/exifCamera.mjs';

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
const root = resolve('public', 'uploads');

// Erst-Commit-Datum (ISO) einer Datei aus der Git-Historie — echtes „hochgeladen am". Leerer String,
// wenn nicht ermittelbar (uncommitted / Shallow-Clone / kein Git); der Aufrufer nimmt dann die mtime.
function gitAddedISO(relFromCwd) {
  try {
    const out = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--follow', '--format=%aI', '-1', '--', relFromCwd],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return out || '';
  } catch { return ''; }
}

const list = [];
const meta = {};

/** Alle Bild-Dateien unter `dir` einsammeln, rel = Pfad relativ zu public/uploads (mit /). */
function walk(dir, rel) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (name.startsWith('.')) continue; // .DS_Store & Co. überspringen
    const abs = join(dir, name);
    let st;
    try { st = statSync(abs); } catch { continue; }
    const relPath = rel ? posix.join(rel, name) : name;
    if (st.isDirectory()) {
      walk(abs, relPath);
    } else if (IMG.test(name)) {
      const pub = '/uploads/' + relPath;
      list.push(pub);
      const added = gitAddedISO(posix.join('public/uploads', relPath)) || new Date(st.mtimeMs).toISOString();
      const entry = { size: st.size, added };
      // Kamera + Fotografen-Werte aus EXIF (JPG-APP1 ODER WebP-EXIF-Chunk); nur setzen, wenn vorhanden.
      try { const info = readPhotoInfo(readFileSync(abs)); if (info.camera) entry.camera = info.camera; if (info.exif) entry.exif = info.exif; } catch { /* egal */ }
      meta[pub] = entry;
    }
  }
}

if (existsSync(root)) walk(root, '');
list.sort((a, b) => a.localeCompare(b));

const outDir = resolve('public');
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, 'uploads-manifest.json');
writeFileSync(out, JSON.stringify(list));
const outMeta = resolve(outDir, 'uploads-meta.json');
writeFileSync(outMeta, JSON.stringify(meta));
console.log('[uploads-manifest]', list.length, 'Bilder (rekursiv) ->', out, '+ meta ->', outMeta);
