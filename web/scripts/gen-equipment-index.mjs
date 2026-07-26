// Erzeugt src/data/equipment-index.json = Liste der Ausrüstungs-Namen aus der equipment-Collection.
// Grund: Das Profil-Ausrüstungs-Feld (GearPickerField, Tina-Sidebar) braucht die Namen als
// datalist-Vorschläge, kann aber im gebündelten Feld kein Verzeichnis lesen. Läuft im Build vor
// `tinacms build`, damit das Feld die aktuellen Namen importiert. (Nur Vorschläge -> unkritisch,
// falls mal einen Build alt.)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const dir = 'src/data/equipment';
const names = [];
if (existsSync(dir)) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try { const n = JSON.parse(readFileSync(join(dir, f), 'utf8'))?.name; if (n) names.push(String(n).trim()); } catch {}
  }
}
names.sort((a, b) => a.localeCompare(b));
writeFileSync('src/data/equipment-index.json', JSON.stringify(names, null, 2) + '\n');
console.log(`[gen-equipment-index] ${names.length} Namen -> src/data/equipment-index.json`);
