// Einmalige Daten-Migration: zweisprachige Felder { de, en } -> flache Paare
// <name>_de / <name>_en. Unterstützt verschachtelte Pfade (hero.headline) und
// Listen-Segmente (stops[].title). Idempotent: bereits flache Felder bleiben.
//
// Lauf:  node scripts/flatten-bilingual.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'src', 'data');

// Welche Felder pro Datei/Glob flach gemacht werden:
const SPEC = [
  { file: 'home-settings.json', paths: [
    'hero.headline', 'hero.cta_portfolio', 'hero.cta_stories',
    'intro.subline', 'intro.subtext',
    'sections.gallery_kicker', 'sections.gallery_title',
    'sections.latest_kicker', 'sections.latest_title',
    'sections.discover_kicker', 'sections.discover_title',
  ] },
  { glob: 'albums', paths: ['note'] },
  { glob: 'trips', paths: ['meta', 'summary', 'stops[].title', 'stops[].date', 'stops[].text', 'gallery[].caption'] },
  { file: 'about.json', paths: ['kicker', 'title', 'intro', 'persons[].role', 'persons[].bio', 'persons[].gear', 'why_title', 'why_text'] },
  { file: 'contact.json', paths: ['kicker', 'title', 'intro', 'direct_title', 'direct_text', 'location', 'form_success', 'form_name', 'form_email', 'form_message', 'form_send', 'form_note'] },
  { file: 'gear.json', paths: ['kicker', 'title', 'intro'] },
];

const isBi = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('de' in v || 'en' in v);

// Wandelt obj[key] ({de,en}) -> obj[key_de], obj[key_en]; entfernt obj[key].
function flattenKey(obj, key) {
  const v = obj?.[key];
  if (!isBi(v)) return false;
  obj[key + '_de'] = typeof v.de === 'string' ? v.de : '';
  obj[key + '_en'] = typeof v.en === 'string' ? v.en : '';
  delete obj[key];
  return true;
}

// Pfad anwenden. Segmente: "a.b" (nested), "list[]" (jedes Listenelement).
function applyPath(root, path) {
  const parts = path.split('.');
  function walk(node, idx) {
    if (node == null) return 0;
    const seg = parts[idx];
    const last = idx === parts.length - 1;
    if (seg.endsWith('[]')) {
      const key = seg.slice(0, -2);
      const arr = node[key];
      if (!Array.isArray(arr)) return 0;
      let n = 0;
      for (const item of arr) n += walk(item, idx + 1) || 0;
      return n;
    }
    if (last) return flattenKey(node, seg) ? 1 : 0;
    return walk(node[seg], idx + 1);
  }
  // Wenn letztes Segment KEIN [] ist und Pfad nur 1 Teil: direkt am node.
  return walk(root, 0);
}

function migrateFile(absPath) {
  const raw = readFileSync(absPath, 'utf8');
  const json = JSON.parse(raw);
  return { json, raw };
}

let totalFields = 0, totalFiles = 0;
for (const entry of SPEC) {
  const files = entry.glob
    ? readdirSync(join(DATA, entry.glob)).filter((f) => f.endsWith('.json')).map((f) => join(DATA, entry.glob, f))
    : [join(DATA, entry.file)];
  for (const abs of files) {
    const { json } = migrateFile(abs);
    let changed = 0;
    for (const p of entry.paths) changed += applyPath(json, p);
    if (changed > 0) {
      writeFileSync(abs, JSON.stringify(json, null, 2) + '\n');
      totalFiles++;
      totalFields += changed;
      console.log(`  ${abs.replace(DATA + '/', '')}: ${changed} Felder flach`);
    }
  }
}
console.log(`\nFertig: ${totalFields} Felder in ${totalFiles} Dateien migriert.`);
