// EINMAL-MIGRATION: verbliebene Roh-JPEG/JPG-Dateien im Repo (public/uploads, inkl. Unterordner) zu WebP
// wandeln — 1:1 wie ein CMS-Upload (WebP @Q85, Breite <= 2400) inkl. Kamera-EXIF-Erhalt — und ALLE
// Referenzen in Inhalten (.json/.md/.mdx unter src/) von der .jpg/.jpeg- auf die .webp-Datei umschreiben.
//
// Sicherheitsnetz: die Original-JPEGs werden NICHT gelöscht (bleiben liegen, falls etwas schiefgeht).
// Idempotent: existiert die .webp schon, wird sie nicht neu erzeugt; nur noch offene .jpg-Referenzen werden
// umgeschrieben. Encode via sharp (Node); EXIF-Erhalt über dieselbe schlanke, GPS-sichere Re-Mux-Logik wie
// der Upload (slimExifTiff/muxExifIntoWebp aus lib/exifCamera.mjs).
//
// Aufruf (aus web/):  node scripts/migrate-jpeg-to-webp.mjs
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import sharp from 'sharp';
import { slimExifTiff, muxExifIntoWebp } from './lib/exifCamera.mjs';

const UP = 'public/uploads';
const MAX_WIDTH = 2400;
const Q = 85;

function walk(dir, test) {
  const out = [];
  (function rec(d) {
    for (const name of readdirSync(d)) {
      if (name.startsWith('.')) continue;
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) rec(p);
      else if (test(name)) out.push(p);
    }
  })(dir);
  return out;
}

// 1) JPEGs finden und konvertieren -------------------------------------------------------------------
const jpegs = walk(UP, (n) => /\.(jpe?g)$/i.test(n)).sort();
const converted = []; // { jpgRel, webpRel }
console.log(`Gefundene JPEG/JPG: ${jpegs.length}`);
for (const file of jpegs) {
  const webp = file.replace(/\.(jpe?g)$/i, '.webp');
  const jpgRel = '/uploads/' + relative(UP, file).split('\\').join('/');
  const webpRel = '/uploads/' + relative(UP, webp).split('\\').join('/');
  if (existsSync(webp)) { console.log(`  = ${jpgRel}  -> .webp existiert schon (übersprungen)`); converted.push({ jpgRel, webpRel }); continue; }
  const src = readFileSync(file);
  const enc = await sharp(src, { failOn: 'none' })
    .rotate() // EXIF-Orientierung anwenden, bevor sie verworfen wird
    .resize({ width: MAX_WIDTH, withoutEnlargement: true }) // nur Breite begrenzen, wie die App
    .webp({ quality: Q })
    .toBuffer({ resolveWithObject: true });
  const slim = slimExifTiff(new Uint8Array(src)); // Kamera-EXIF aus dem Original (GPS-sicher, ohne Orientierung)
  const outBuf = slim ? Buffer.from(muxExifIntoWebp(new Uint8Array(enc.data), slim, enc.info.width, enc.info.height)) : enc.data;
  writeFileSync(webp, outBuf);
  converted.push({ jpgRel, webpRel });
  console.log(`  + ${jpgRel}  ->  ${webpRel}  (${(outBuf.length / 1024).toFixed(0)} KB${slim ? ', EXIF erhalten' : ', kein EXIF'})`);
}

// 2) Referenzen umschreiben (.jpg/.jpeg -> .webp) ----------------------------------------------------
const contentFiles = walk('src', (n) => /\.(json|md|mdx)$/.test(n));
let filesChanged = 0, refsChanged = 0;
const changedList = [];
for (const f of contentFiles) {
  const orig = readFileSync(f, 'utf8');
  let txt = orig;
  for (const { jpgRel, webpRel } of converted) {
    if (txt.includes(jpgRel)) { const n = txt.split(jpgRel).length - 1; txt = txt.split(jpgRel).join(webpRel); refsChanged += n; }
  }
  if (txt !== orig) { writeFileSync(f, txt); filesChanged++; changedList.push(f); }
}

console.log(`\nKonvertiert/vorhanden: ${converted.length} WebP · Referenzen umgeschrieben: ${refsChanged} in ${filesChanged} Dateien`);
if (changedList.length) console.log('Geänderte Inhalte:\n  ' + changedList.join('\n  '));
console.log('\nOriginale bleiben liegen (Sicherheitsnetz). Manifest/Meta via `npm run` bzw. gen-uploads-manifest neu erzeugen.');
