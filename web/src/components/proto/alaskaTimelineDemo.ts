// PROTOTYP-DEMODATEN — Variante B (vertikale Timeline), DESKTOP-Mechanik-Test.
// NUR für die Vorschau /proto/reisen-timeline. KEIN echter Content, KEINE Tina-Collection
// (.ts wird von Tina nie gescannt). Reversibel: Datei löschen = Prototyp-Daten weg.
//
// HINWEIS (diese Runde): Inhalte sind FREI ERFUNDEN — es geht nur um Optik/Mechanik bei voller
// Füllung (15–20 Stopps), nicht um inhaltliche Richtigkeit. Bilder = vorhandene /uploads-Assets,
// frei zugeordnet. Route: Kalifornien-Küste (Fahrt) -> FLUG nach Alaska -> hoher Norden/Arktis (Fahrt).

export type TLStopKind = 'main' | 'intermediate';

export type TLStop = {
  kind: TLStopKind;
  name: string;            // kurz (Marker/Liste)
  lat: number;
  lon: number;
  title: string;
  date: string;
  text: string;            // Hauptstation: ggf. mehrere Absätze (\n\n)
  hero?: string;           // nur Hauptstation
  photos?: string[];       // nur Hauptstation (Filmstreifen -> Lightbox)
  thumb?: string;          // nur Zwischenstopp: optional EIN kleines Thumbnail
  arriveBy?: 'drive' | 'flight'; // wie dieser Stopp vom vorigen erreicht wird (1. Stopp: leer)
  stage?: string;          // wenn gesetzt: Etappen-Trenner mit diesem Titel VOR diesem Stopp
};

export type TLTrip = {
  slug: string;
  title: string;
  meta: string;
  summary: string;
  stops: TLStop[];
};

const U = '/uploads/';

export const ALASKA_TIMELINE_DEMO: TLTrip = {
  slug: 'alaska2026',
  title: 'Alaska 2026',
  meta: 'Oktober–November 2026 · große Tour · Kalifornien-Küste & hoher Norden',
  summary:
    'Erst die kalifornische Küste hinunter, dann mit dem Flieger hoch nach Alaska — Anchorage, Denali, Fairbanks und über den Dalton Highway bis zum Polarkreis. (Demo-Füllung zum Austesten der Timeline.)',
  stops: [
    // ───────────────────────── Etappe 1: Kalifornien-Küste (Fahrt) ─────────────────────────
    {
      stage: 'Kalifornien-Küste',
      kind: 'main',
      name: 'San Francisco',
      lat: 37.77, lon: -122.42,
      title: 'San Francisco',
      date: '23.–25. Okt',
      text:
        'Start der Reise unter der Golden Gate. Zwei Tage zum Ankommen, Kameras kalibrieren und die Stadt im Herbstlicht.\n\n' +
        'Früh hoch auf die Marin Headlands, der Nebel zieht durch die Brückentürme — und dann hinunter an die Küste.',
      hero: U + 'img_0206.jpg',
      photos: [U + 'img_5273.jpg', U + 'img_1418-2.jpg'],
    },
    {
      kind: 'intermediate',
      name: 'Half Moon Bay',
      lat: 37.46, lon: -122.43,
      title: 'Half Moon Bay',
      date: '25. Okt',
      text: 'Kurzer Stopp an den Klippen, Pelikane im Gleitflug über der Brandung.',
      arriveBy: 'drive',
    },
    {
      kind: 'intermediate',
      name: 'Santa Cruz',
      lat: 36.97, lon: -122.03,
      title: 'Santa Cruz',
      date: '25. Okt',
      text: 'Holzpier, Seelöwen und ein erster Kaffee am Highway 1.',
      thumb: U + 'IMG_6001.webp',
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Monterey',
      lat: 36.60, lon: -121.90,
      title: 'Monterey & Pacific Grove',
      date: '26.–27. Okt',
      text:
        'Die Bucht von Monterey: Ottern im Kelpwald, Reiher an der Cannery Row.\n\n' +
        'Am Abend das weiche Licht über Pacific Grove — der Klassiker, immer wieder schön.',
      hero: U + 'img_5666.jpg',
      photos: [U + 'a7406420.jpg', U + 'dji_0136_edit.jpeg'],
      arriveBy: 'drive',
    },
    {
      kind: 'intermediate',
      name: 'Big Sur',
      lat: 36.27, lon: -121.81,
      title: 'Big Sur',
      date: '27. Okt',
      text: 'Bixby Bridge, steile Klippen, die Drohne bleibt heute im Rucksack (Schutzgebiet).',
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Morro Bay',
      lat: 35.37, lon: -120.85,
      title: 'Morro Bay',
      date: '27.–28. Okt',
      text:
        'Der Morro Rock im Gegenlicht, Ottern beim Spielen — unser Lieblingsabschnitt der Küste.\n\n' +
        'Ein ruhiger Hafen, Fischerboote, und morgens Nebel, der langsam aufreißt.',
      hero: U + 'IMG_5936.webp',
      photos: [U + 'img_4101.jpg', U + 'img_6039.jpg'],
      arriveBy: 'drive',
    },
    {
      kind: 'intermediate',
      name: 'Santa Barbara',
      lat: 34.42, lon: -119.70,
      title: 'Santa Barbara',
      date: '28. Okt',
      text: 'Palmen, weiße Fassaden, kurzer Halt vor der Großstadt.',
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Los Angeles',
      lat: 34.05, lon: -118.24,
      title: 'Los Angeles',
      date: '28.–30. Okt',
      text:
        'Das Ende des Küsten-Abschnitts. Zwei Tage Stadt, Freunde wiedersehen — und packen für den hohen Norden.\n\n' +
        'Von hier geht es per Flug nach Anchorage; die Strecke übers Meer fahren wir natürlich nicht.',
      hero: U + 'IMG_6001.webp',
      photos: [U + 'a7406523.jpg', U + 'a7406566.jpg'],
      arriveBy: 'drive',
    },
    // ───────────────────────── Etappe 2: Hoher Norden (Flug, dann Fahrt) ─────────────────────────
    {
      stage: 'Hoher Norden',
      kind: 'main',
      name: 'Anchorage',
      lat: 61.22, lon: -149.90,
      title: 'Anchorage',
      date: '31. Okt – 02. Nov',
      text:
        'Gelandet in Alaska. Anchorage als Basislager: Allrad mieten, Vorräte, warme Schichten.\n\n' +
        'Erster Blick auf die schneebedeckten Chugach Mountains direkt hinter der Stadt.',
      hero: U + 'IMG_5904.webp',
      photos: [U + 'IMG_6654-2.webp', U + 'IMG_6502-2.webp'],
      arriveBy: 'flight',
    },
    {
      kind: 'intermediate',
      name: 'Talkeetna',
      lat: 62.32, lon: -150.12,
      title: 'Talkeetna',
      date: '02. Nov',
      text: 'Kleines Holzhütten-Dorf, von hier starten die Denali-Flüge. Heißer Kaffee, kalte Luft.',
      thumb: U + 'img_5916-3.jpg',
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Denali',
      lat: 63.50, lon: -149.00,
      title: 'Denali National Park',
      date: '03.–04. Nov',
      text:
        'Der höchste Berg Nordamerikas. Wir warten auf das seltene Fenster, in dem die Wolken aufreißen.\n\n' +
        'Karibus in der Ferne, erster Pulverschnee, und abends vielleicht das erste Polarlicht.',
      hero: U + 'img_5916-3.jpg',
      photos: [U + 'img_6039.jpg', U + 'dji_0136_edit.jpeg'],
      arriveBy: 'drive',
    },
    {
      kind: 'intermediate',
      name: 'Nenana',
      lat: 64.56, lon: -149.10,
      title: 'Nenana',
      date: '04. Nov',
      text: 'Tankstopp am Fluss, die Sonne steht schon tief um die Mittagszeit.',
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Fairbanks',
      lat: 64.84, lon: -147.72,
      title: 'Fairbanks',
      date: '04.–06. Nov',
      text:
        'Tor zur Arktis und beste Basis für die Nordlichter. Nachts raus aus der Stadt, Stative auf, warten.\n\n' +
        'Tagsüber letzte Vorbereitungen für die Fahrt den Dalton Highway hinauf.',
      hero: U + 'a7406420.jpg',
      photos: [U + 'img_5273.jpg', U + 'IMG_6001.webp'],
      arriveBy: 'drive',
    },
    // ───────────────────────── Etappe 3: Arktis & Polarkreis (Fahrt, Dalton Hwy) ─────────────────────────
    {
      stage: 'Arktis & Polarkreis',
      kind: 'intermediate',
      name: 'Joy',
      lat: 65.50, lon: -147.60,
      title: 'Joy / Wildwood',
      date: '07. Nov',
      text: 'Letzte feste Straße, dann beginnt der Schotter. Ab hier kein Handynetz mehr.',
      arriveBy: 'drive',
    },
    {
      kind: 'intermediate',
      name: 'Yukon Crossing',
      lat: 65.88, lon: -149.72,
      title: 'Yukon River Crossing',
      date: '07. Nov',
      text: 'Die lange Holzbrücke über den zugefrorenen Yukon — Trucker, Eis, Weite.',
      thumb: U + 'img_4101.jpg',
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Arctic Circle',
      lat: 66.56, lon: -150.17,
      title: 'Polarkreis-Schild',
      date: '08. Nov',
      text:
        'Das berühmte Schild am Polarkreis — Beweisfoto im eisigen Wind.\n\n' +
        'Ab hier ist die Sonne nur noch ein kurzer Gruß am Horizont.',
      hero: U + 'dji_0136_edit.jpeg',
      photos: [U + 'img_4101.jpg', U + 'a7406566.jpg'],
      arriveBy: 'drive',
    },
    {
      kind: 'main',
      name: 'Coldfoot',
      lat: 67.25, lon: -150.18,
      title: 'Coldfoot',
      date: '08.–09. Nov',
      text:
        'Der nördlichste Punkt der Reise. Eine Truckstop-Siedlung mitten in der Wildnis — das große Ziel.\n\n' +
        'Wenn die grünen Bänder über den Bäumen tanzen, ist jede Stunde Kälte vergessen.',
      hero: U + 'img_6039.jpg',
      photos: [U + 'a7406523.jpg', U + 'img_5916-3.jpg'],
      arriveBy: 'drive',
    },
    {
      kind: 'intermediate',
      name: 'Wiseman',
      lat: 67.41, lon: -150.11,
      title: 'Wiseman',
      date: '09. Nov',
      text: 'Winziges historisches Dorf, Wendepunkt. Von hier den langen Weg zurück nach Süden.',
      arriveBy: 'drive',
    },
  ],
};
