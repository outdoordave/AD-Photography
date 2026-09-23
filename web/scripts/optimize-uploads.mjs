// Optimiert die AUSGELIEFERTEN Bilder im Build-Output (web/dist/uploads) NACH `astro build`:
// skaliert auf max. 2400px (laengste Seite) herunter + re-komprimiert (JPG/WebP ~q80, PNG),
// dateinamenstreu (gleicher Pfad/Name -> CMS-Referenzen bleiben gueltig). Es wird nur
// geschrieben, wenn das Ergebnis kleiner ist (sonst Original behalten).
//
// WICHTIG: Es wird AUSSCHLIESSLICH dist/uploads angefasst (reiner Build-Output, nie committet).
// Die Repo-Originale (root/uploads UND web/public/uploads) bleiben UNANGETASTET -> kein
// Qualitaetsverlust ueber mehrere Builds (jeder Build startet von den Originalen).
// Spiegelt die Idee der alten Sveltia-Seite (WebP/Resize, q85/2400px) fuer ALLE Bilder,
// auch die als Roh-JPG ins Repo gelegten.
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, extname } from 'node:path';
import sharp from 'sharp';
import { slimExifTiff, muxExifIntoWebp } from './lib/exifCamera.mjs';

const dir = resolve('dist', 'uploads');
const MAX = 2400; // laengste Kante
const Q = 80;     // JPG/WebP-Qualitaet

// --- Ergebnis-Cache (Build-Beschleunigung) -----------------------------------------------
// Problem: bisher wurde bei JEDEM Build jedes Bild neu komprimiert, auch unveraenderte.
// Loesung: das FERTIGE Ergebnis unter einem Hash aus (Dateiinhalt + Parametern) ablegen und
// beim naechsten Build byte-identisch zurueckschreiben, statt neu zu encodieren.
// -> kein erneutes Encodieren = KEIN Generationsverlust, Ergebnis ist bitgleich.
// Liegt in node_modules/.cache, weil Cloudflare genau das zwischen Builds aufhebt.
// Aendert sich MAX/Q/CACHE_VERSION, aendert sich der Hash -> Cache wird automatisch ungueltig.
const CACHE_VERSION = 1;
const cacheDir = resolve('node_modules', '.cache', 'ww-optimize-uploads');
let cacheOk = true;
try { mkdirSync(cacheDir, { recursive: true }); } catch { cacheOk = false; }
const usedKeys = new Set();
let hits = 0;

const keyOf = (buf, ext) =>
  createHash('sha256').update(`v${CACHE_VERSION}|${MAX}|${Q}|${ext}|`).update(buf).digest('hex');
// Zwei Zustaende: <key>.bin = optimiertes Ergebnis, <key>.keep = Original war schon kleiner.
const binPath = (k) => join(cacheDir, k + '.bin');
const keepPath = (k) => join(cacheDir, k + '.keep');

// --- Groessen-Varianten fuer responsive Bilder (srcset) -----------------------------------
// Je Bild zusaetzlich schmalere Fassungen `<name>-<breite>w.<ext>` erzeugen, damit Besucher
// nicht immer die 2400px-Datei laden. Wird NIE hochskaliert: Varianten entstehen nur fuer
// Breiten, die kleiner als das Original sind — sonst gaebe es Unschaerfe statt Ersparnis.
// Die Leiter steht in scripts/lib/image-ladder.json und wird auch von gen-uploads-manifest
// und src/lib/img.ts gelesen -> eine einzige Quelle, kein Auseinanderlaufen.
const LADDER = JSON.parse(readFileSync(resolve('scripts', 'lib', 'image-ladder.json'), 'utf8'));
let vMade = 0, vHits = 0, skipped = 0;

async function makeVariants(file, src, ext, key) {
  let md = null;
  for (const w of LADDER.widths) {
    const vFile = file.replace(/\.([A-Za-z0-9]+)$/, `-${w}w.$1`);
    const vKey = key ? `${key}-${w}` : null;
    if (vKey) usedKeys.add(vKey);
    if (vKey && existsSync(binPath(vKey))) {
      try { writeFileSync(vFile, readFileSync(binPath(vKey))); vHits++; continue; } catch { /* neu bauen */ }
    }
    if (!md) { try { md = await sharp(src, { failOn: 'none' }).metadata(); } catch { md = {}; } }
    const realW = Math.min(md.width || 0, MAX);
    if (!realW || w >= realW) continue; // nie hochskalieren
    try {
      const pipe = sharp(src, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
      let out;
      if (ext === '.png') out = await pipe.png({ compressionLevel: 9 }).toBuffer();
      else if (ext === '.webp') out = await pipe.webp({ quality: Q }).toBuffer();
      else out = await pipe.jpeg({ quality: Q, mozjpeg: true }).toBuffer();
      writeFileSync(vFile, out);
      vMade++;
      if (vKey) { try { writeFileSync(binPath(vKey), out); } catch { /* Cache optional */ } }
    } catch { /* eine Variante darf fehlschlagen, srcset faellt dann auf src zurueck */ }
  }
}

if (!existsSync(dir)) {
  console.warn('[optimize-uploads] kein dist/uploads gefunden -> uebersprungen.');
  process.exit(0);
}

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp']);
let count = 0;
let savedBytes = 0;

// REKURSIV, damit auch Unterordner (reisen/<slug>/…, alben/<slug>/…, site/…, …) optimiert werden.
function collect(d, out) {
  for (const name of readdirSync(d)) {
    if (name.startsWith('.')) continue;
    const p = join(d, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) collect(p, out);
    // Erzeugte srcset-Varianten (…-640w.webp) NIE als Eingabe behandeln — sonst wuerden sie
    // erneut optimiert und es entstuenden Varianten-von-Varianten (…-640w-640w.webp).
    else if (exts.has(extname(name).toLowerCase()) && !/-\d+w\.[A-Za-z0-9]+$/.test(name)) out.push(p);
  }
}
const allFiles = [];
collect(dir, allFiles);

for (const file of allFiles) {
  const ext = extname(file).toLowerCase();
  try {
    const src = readFileSync(file);
    const before = src.length;

    // --- Schon fertig? Dann gar nicht erst anfassen. ------------------------------------
    // Jeder Upload ueber das CMS ist bereits WebP mit max. MAX px (toOptimized im Browser:
    // WebP q85, Breite <= 2400). Ein erneutes Encodieren im Build bringt kaum noch Bytes,
    // kostet aber bei JEDEM Build Zeit — und drueckt q85 auf q80, also unnoetig Qualitaet.
    // Deshalb: solche Dateien unveraendert durchreichen. Nur Alt-Bestand (Roh-JPG/PNG oder
    // uebergrosse Dateien) wird noch verarbeitet — eine feste, nicht wachsende Menge.
    // Varianten werden trotzdem erzeugt (weiter unten), die braucht auch ein fertiges Bild.
    let handled = false;
    if (ext === '.webp') {
      try {
        const md = await sharp(src, { failOn: 'none' }).metadata();
        if (md?.width && md?.height && md.width <= MAX && md.height <= MAX) {
          skipped++;
          handled = true;
        }
      } catch { /* nicht lesbar -> normal verarbeiten */ }
    }

    // --- Cache-Treffer? Dann fertiges Ergebnis zurueckschreiben, nicht neu encodieren. ---
    const key = cacheOk ? keyOf(src, ext) : null;
    if (!handled && key) {
      usedKeys.add(key);
      try {
        if (existsSync(keepPath(key))) { hits++; handled = true; }    // Original war schon kleiner
        else if (existsSync(binPath(key))) {
          const cached = readFileSync(binPath(key));
          writeFileSync(file, cached);
          savedBytes += before - cached.length;
          count++; hits++; handled = true;
        }
      } catch { /* Cache defekt -> normal weiterverarbeiten */ }
    }

    if (!handled) await optimizeMain(file, src, ext, before, key);
    await makeVariants(file, src, ext, key); // Varianten auch bei Cache-Treffer sicherstellen
  } catch (e) {
    console.warn('[optimize-uploads] uebersprungen (Fehler):', file, e?.message || e);
  }
}

async function optimizeMain(file, src, ext, before, key) {
    const pipe = sharp(src, { failOn: 'none' })
      .rotate() // EXIF-Orientierung anwenden (sonst koennte das Bild kippen)
      .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
    let out;
    if (ext === '.png') out = await pipe.png({ compressionLevel: 9 }).toBuffer();
    else if (ext === '.webp') {
      // sharp verwirft EXIF -> die schlanke, GPS-sichere Kamera-EXIF aus der Quelle wieder einmuxen,
      // damit die ausgelieferte WebP dieselbe Kamera/Brennweite trägt wie das Repo-Original.
      const enc = await pipe.webp({ quality: Q }).toBuffer({ resolveWithObject: true });
      const slim = slimExifTiff(new Uint8Array(src));
      out = slim ? Buffer.from(muxExifIntoWebp(new Uint8Array(enc.data), slim, enc.info.width, enc.info.height)) : enc.data;
    }
    else out = await pipe.jpeg({ quality: Q, mozjpeg: true }).toBuffer();
    if (out.length < before) {
      writeFileSync(file, out);
      savedBytes += before - out.length;
      count++;
      if (key) { try { writeFileSync(binPath(key), out); } catch { /* Cache optional */ } }
    } else if (key) {
      try { writeFileSync(keepPath(key), ''); } catch { /* Cache optional */ }
    }
}

// Cache begrenzen: NUR laengst unbenutzte Eintraege (>30 Tage) entfernen. Bewusst nicht
// "diesmal ungenutzt", denn ein untypischer Lauf (z. B. Skript zweimal ohne Neubau) wuerde
// sonst noch gueltige Eintraege wegraeumen und den naechsten Build wieder langsam machen.
if (cacheOk) {
  const MAX_AGE_MS = 30 * 24 * 3600 * 1000;
  const now = Date.now();
  try {
    for (const name of readdirSync(cacheDir)) {
      const f = join(cacheDir, name);
      const k = name.replace(/\.(bin|keep)$/, '');
      if (usedKeys.has(k)) continue;
      try { if (now - statSync(f).mtimeMs > MAX_AGE_MS) unlinkSync(f); } catch { /* egal */ }
    }
  } catch { /* Aufraeumen ist optional */ }
}

console.log(`[optimize-uploads] ${count} Bilder verkleinert, ~${(savedBytes / 1048576).toFixed(1)} MB gespart` +
  (cacheOk ? ` (${hits} aus Cache, ${allFiles.length - hits - skipped} neu berechnet)` : ' (ohne Cache)') +
  `; ${skipped} bereits optimiert (uebersprungen)` +
  `; ${vMade + vHits} srcset-Varianten (${vHits} aus Cache, ${vMade} neu).`);
