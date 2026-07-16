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
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import sharp from 'sharp';
import { slimExifTiff, muxExifIntoWebp } from './lib/exifCamera.mjs';

const dir = resolve('dist', 'uploads');
const MAX = 2400; // laengste Kante
const Q = 80;     // JPG/WebP-Qualitaet

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
    else if (exts.has(extname(name).toLowerCase())) out.push(p);
  }
}
const allFiles = [];
collect(dir, allFiles);

for (const file of allFiles) {
  const ext = extname(file).toLowerCase();
  try {
    const src = readFileSync(file);
    const before = src.length;
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
    }
  } catch (e) {
    console.warn('[optimize-uploads] uebersprungen (Fehler):', file, e?.message || e);
  }
}

console.log(`[optimize-uploads] ${count} Bilder verkleinert, ~${(savedBytes / 1048576).toFixed(1)} MB gespart.`);
