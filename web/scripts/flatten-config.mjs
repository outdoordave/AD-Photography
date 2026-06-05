// Einmalig: einzeilige zweisprachige Objekt-Felder in tina/config.ts ->
// zwei flache String-Felder (<name>_de + <name>_en mit EnglishOnly-Komponente).
// Mehrzeilige Felder (Über uns/Equipment) werden separat von Hand erledigt.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', 'tina', 'config.ts');
let src = readFileSync(FILE, 'utf8');

// Einzeiliges Muster:
// <ws>{ type: 'object', name: 'NAME', label: 'LABEL', ui: { component: BilingualField|BilingualTextField }, fields: [{ type: 'string', name: 'de', label: 'Deutsch' }, { type: 'string', name: 'en', label: 'Englisch' }] },
const re = /^([ \t]*)\{ type: 'object', name: '([a-z_]+)', label: '([^']*)', ui: \{ component: (BilingualField|BilingualTextField) \}, fields: \[\{ type: 'string', name: 'de', label: 'Deutsch' \}, \{ type: 'string', name: 'en', label: 'Englisch' \}\] \},$/gm;

let count = 0;
src = src.replace(re, (_m, ws, name, label, comp) => {
  count++;
  const multiline = comp === 'BilingualTextField';
  const deUi = multiline ? `, ui: { component: 'textarea' }` : '';
  const enComp = multiline ? 'EnglishOnlyTextField' : 'EnglishOnlyField';
  return (
    `${ws}{ type: 'string', name: '${name}_de', label: '${label}'${deUi} },\n` +
    `${ws}{ type: 'string', name: '${name}_en', label: '↳ English', ui: { component: ${enComp} } },`
  );
});

writeFileSync(FILE, src);
console.log(`Einzeilige Bilingual-Felder flach gemacht: ${count}`);
