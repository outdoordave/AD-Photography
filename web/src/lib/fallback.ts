// Automatische Fallback-Titelbilder für Inhalte OHNE hochgeladenes Foto.
// 24 flache, moody-editoriale Motive liegen in web/public/uploads/fallbacks/<key>.webp
// (16:9, ~1920×1080). Der Matcher liest Titel/Meta/Text eines Inhalts und wählt das
// thematisch passende Motiv; ohne Treffer -> generisches 'landscape'.
//
// Bewusst KEIN Zufall (anders als paletteFromString): ein Alaska-Beitrag soll Tundra
// bekommen, kein gewürfeltes Wüsten-SVG. Die alten ILLUS-SVGs bleiben als Notnagel in
// den Komponenten, falls je eine Datei fehlt.

export const FALLBACK_SCENARIOS = [
  'mountain','snow','glacier','forest','hills','farmland','lake','river','wetland',
  'coast','ocean','beach','jungle','terraces','desert','canyon','savanna','volcano',
  'nightsky','city','aerial','landscape','aurora','tundra',
] as const;
export type FallbackScenario = (typeof FALLBACK_SCENARIOS)[number];

// Reihenfolge = Priorität: spezifischere Motive zuerst prüfen, generische zuletzt.
// Schlüsselwörter DE+EN (diakritika-frei, klein) + einige eindeutige Ortsnamen.
const KEYWORDS: Array<[FallbackScenario, string[]]> = [
  ['aurora',   ['aurora','polarlicht','nordlicht','northern lights']],
  ['glacier',  ['glacier','gletscher','iceberg','eisberg','packeis']],
  ['volcano',  ['volcano','vulkan','lava','krater','crater','vulkanisch']],
  ['canyon',   ['canyon','schlucht','gorge','red rock','utah','arches','zion','antelope','bryce','moab']],
  ['desert',   ['desert','wuste','wueste','dune','duene','sahara','mojave','death valley','sanddune']],
  ['savanna',  ['savanna','savanne','safari','serengeti','acacia','akazie','kruger','steppe']],
  ['terraces', ['terrace','terrasse','reisfeld','rice terrace','reisterrasse']],
  ['jungle',   ['jungle','dschungel','rainforest','regenwald','tropen','tropical rainforest']],
  ['beach',    ['beach','strand','palme','palm','florida','hawaii','caribbean','karibik','bahamas','tropical']],
  ['snow',     ['snow','schnee','winter','frost','ski','verschneit','schneesturm']],
  ['tundra',   ['tundra','arctic','arktis','arctic circle','polarkreis','alaska','denali','coldfoot','fairbanks','anchorage']],
  ['mountain', ['mountain','berg','gebirge','gipfel','alpen','alps','peak','summit','rockies','rocky','sierra','dolomit']],
  ['hills',    ['hill','hugel','huegel','rolling hills','tennessee','appalach','toscana','tuscany','highland']],
  ['forest',   ['forest','wald','forst','woods','baumkron','redwood','sequoia','tannen','kiefer','yellowstone','geysir','geyser']],
  ['farmland', ['farmland','farm','feld','field','vineyard','weinberg','acker','countryside','landwirtschaft']],
  ['wetland',  ['wetland','marsh','sumpf','moor','everglade','schilf','reed','feuchtgebiet']],
  ['river',    ['river','fluss','wasserfall','waterfall','creek','bach','rapids','stromschnelle']],
  ['lake',     ['lake','see','teich','lagune','lagoon']],
  ['coast',    ['coast','kuste','kueste','westkuste','kliff','klippe','cliff','westcoast','west coast','big sur','fjord','buchten']],
  ['ocean',    ['ocean','ozean','meer','sea','atlantik','atlantic','pazifik','pacific','hochsee']],
  ['city',     ['city','stadt','skyline','urban','downtown','metropole','vegas','francisco','york','tokyo','tokio']],
  ['aerial',   ['aerial','drohne','drone','luftaufnahme','luftbild','vogelperspektive','birdseye','from above']],
  ['nightsky', ['night sky','nachthimmel','sternenhimmel','stars','sterne','milky way','milchstrasse','nacht']],
];

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // Diakritika weg (ä->a, é->e …)
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ein Keyword trifft, wenn es als ganzes Wort / Phrase im Text vorkommt (Wortgrenzen),
// damit z. B. "see" (Lake) NICHT in "Tennessee" anschlägt.
function hasWord(hay: string, kw: string): boolean {
  const k = norm(kw);
  if (!k) return false;
  const re = new RegExp('(^|\\s)' + k.replace(/\s+/g, '\\s+') + '($|\\s)');
  return re.test(hay);
}

// Wählt das passende Szenario aus beliebig vielen Textteilen (Titel, Route, Meta, Text …).
export function fallbackScenario(...parts: Array<string | null | undefined>): FallbackScenario {
  const hay = ' ' + norm(parts.filter(Boolean).join(' ')) + ' ';
  for (const [scenario, words] of KEYWORDS) {
    for (const w of words) if (hasWord(hay, w)) return scenario;
  }
  return 'landscape';
}

// Fertiger Bildpfad fürs Fallback-Motiv (immer vorhanden).
export function fallbackImage(...parts: Array<string | null | undefined>): string {
  return `/uploads/fallbacks/${fallbackScenario(...parts)}.webp`;
}
