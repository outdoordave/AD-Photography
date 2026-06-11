// PROTOTYP-DEMODATEN — Variante B (vertikale Timeline), DESKTOP-Feinschliff.
// NUR für die Vorschau /proto/reisen-timeline. KEIN echter Content, KEINE Tina-Collection
// (.ts wird von Tina nie gescannt). Reversibel: Datei löschen = Prototyp-Daten weg.
//
// HINWEIS (diese Runde): Inhalte frei erfunden — es geht um Optik/Mechanik, nicht um Richtigkeit.
// Route mit ZWEI echten Flugetappen (je Abflug- + Ankunftspunkt):
//   Frankfurt (FRA) --Flug--> San Francisco --Auto--> Kalifornien-Küste --> LAX
//   --Flug--> Anchorage (ANC) --Auto--> hoher Norden / Arktis.
// Bilder = vorhandene /uploads-Assets, frei zugeordnet.

export type TLStopKind = 'main' | 'intermediate';

export type TLStop = {
  kind: TLStopKind;
  name: string;
  lat: number;
  lon: number;
  title: string;
  date: string;
  text: string;
  hero?: string;
  photos?: string[];
  thumb?: string;
  arriveBy?: 'drive' | 'flight'; // wie dieser Stopp vom vorigen erreicht wird (1. Stopp: leer)
  stage?: string;                // wenn gesetzt: Etappen-Trenner mit diesem Titel VOR diesem Stopp
};

export type TLTrip = { slug: string; title: string; meta: string; summary: string; stops: TLStop[] };

const U = '/uploads/';

export const ALASKA_TIMELINE_DEMO: TLTrip = {
  slug: 'alaska2026',
  title: 'Alaska 2026',
  meta: 'Okt–Nov 2026 · Frankfurt → Kalifornien → Alaska',
  summary:
    'Von Frankfurt nach San Francisco, die kalifornische Küste hinunter, dann ab Los Angeles hoch nach Alaska — bis zum Polarkreis. (Demo zum Austesten der Timeline.)',
  stops: [
    // ── Start & Anflug ──
    {
      stage: 'Start & Anflug', kind: 'main',
      name: 'Frankfurt', lat: 50.04, lon: 8.57,
      title: 'Frankfurt (FRA)', date: '22. Okt',
      text:
        'Abflug in Deutschland. Koffer voll Kameras, Vorfreude im Gepäck.\n\n' +
        'Der lange Flug über Grönland und Kanada hinweg — Fensterplatz, Kamera griffbereit.',
      hero: U + 'img_5273.jpg', photos: [U + 'img_1418-2.jpg', U + 'img_0206.jpg'],
    },
    {
      stage: 'Kalifornien-Küste', kind: 'main',
      name: 'San Francisco', lat: 37.77, lon: -122.42,
      title: 'San Francisco (SFO)', date: '22.–24. Okt', arriveBy: 'flight',
      text:
        'Gelandet unter der Golden Gate. Zwei Tage Ankommen, Jetlag vertreiben, die Stadt im Herbstlicht.\n\n' +
        'Morgens hoch auf die Marin Headlands, der Nebel zieht durch die Brückentürme.',
      hero: U + 'img_0206.jpg', photos: [U + 'img_5273.jpg', U + 'img_1418-2.jpg'],
    },
    {
      kind: 'intermediate', name: 'Half Moon Bay', lat: 37.46, lon: -122.43,
      title: 'Half Moon Bay', date: '24. Okt', arriveBy: 'drive',
      text: 'Kurzer Stopp an den Klippen, Pelikane im Gleitflug über der Brandung.',
    },
    {
      kind: 'intermediate', name: 'Santa Cruz', lat: 36.97, lon: -122.03,
      title: 'Santa Cruz', date: '24. Okt', arriveBy: 'drive',
      text: 'Holzpier, Seelöwen und ein erster Kaffee am Highway 1.', thumb: U + 'IMG_6001.webp',
    },
    {
      kind: 'main', name: 'Monterey', lat: 36.60, lon: -121.90,
      title: 'Monterey & Pacific Grove', date: '25.–26. Okt', arriveBy: 'drive',
      text:
        'Die Bucht von Monterey: Ottern im Kelpwald, Reiher an der Cannery Row.\n\n' +
        'Am Abend weiches Licht über Pacific Grove — der Klassiker, immer wieder schön.',
      hero: U + 'img_5666.jpg', photos: [U + 'a7406420.jpg', U + 'dji_0136_edit.jpeg'],
    },
    {
      kind: 'intermediate', name: 'Big Sur', lat: 36.27, lon: -121.81,
      title: 'Big Sur', date: '26. Okt', arriveBy: 'drive',
      text: 'Bixby Bridge, steile Klippen, die Drohne bleibt im Rucksack (Schutzgebiet).',
    },
    {
      kind: 'main', name: 'Morro Bay', lat: 35.37, lon: -120.85,
      title: 'Morro Bay', date: '26.–27. Okt', arriveBy: 'drive',
      text:
        'Der Morro Rock im Gegenlicht, Ottern beim Spielen — unser Lieblingsabschnitt der Küste.\n\n' +
        'Ein ruhiger Hafen, Fischerboote, morgens Nebel, der langsam aufreißt.',
      hero: U + 'IMG_5936.webp', photos: [U + 'img_4101.jpg', U + 'img_6039.jpg'],
    },
    {
      kind: 'intermediate', name: 'Santa Barbara', lat: 34.42, lon: -119.70,
      title: 'Santa Barbara', date: '27. Okt', arriveBy: 'drive',
      text: 'Palmen, weiße Fassaden, kurzer Halt vor der Großstadt.',
    },
    {
      kind: 'main', name: 'Los Angeles', lat: 34.05, lon: -118.24,
      title: 'Los Angeles', date: '27.–29. Okt', arriveBy: 'drive',
      text:
        'Das Ende des Küsten-Abschnitts. Zwei Tage Stadt, Freunde wiedersehen — und packen für den hohen Norden.\n\n' +
        'Dann zum Flughafen: der zweite große Flug steht an.',
      hero: U + 'IMG_6001.webp', photos: [U + 'a7406523.jpg', U + 'a7406566.jpg'],
    },
    {
      kind: 'intermediate', name: 'LAX', lat: 33.94, lon: -118.41,
      title: 'Los Angeles (LAX)', date: '29. Okt', arriveBy: 'drive',
      text: 'Abflug Richtung Norden. Mietwagen zurück, Gepäck aufgeben, ab in den Flieger.',
    },
    // ── Hoher Norden ──
    {
      stage: 'Hoher Norden', kind: 'main',
      name: 'Anchorage', lat: 61.22, lon: -149.90,
      title: 'Anchorage (ANC)', date: '29.–31. Okt', arriveBy: 'flight',
      text:
        'Gelandet in Alaska. Anchorage als Basislager: Allrad mieten, Vorräte, warme Schichten.\n\n' +
        'Erster Blick auf die schneebedeckten Chugach Mountains direkt hinter der Stadt.',
      hero: U + 'IMG_5904.webp', photos: [U + 'IMG_6654-2.webp', U + 'IMG_6502-2.webp'],
    },
    {
      kind: 'intermediate', name: 'Talkeetna', lat: 62.32, lon: -150.12,
      title: 'Talkeetna', date: '31. Okt', arriveBy: 'drive',
      text: 'Kleines Holzhütten-Dorf, von hier starten die Denali-Flüge. Heißer Kaffee, kalte Luft.',
      thumb: U + 'img_5916-3.jpg',
    },
    {
      kind: 'main', name: 'Denali', lat: 63.50, lon: -149.00,
      title: 'Denali National Park', date: '01.–02. Nov', arriveBy: 'drive',
      text:
        'Der höchste Berg Nordamerikas. Wir warten auf das seltene Fenster, in dem die Wolken aufreißen.\n\n' +
        'Karibus in der Ferne, erster Pulverschnee, abends vielleicht das erste Polarlicht.',
      hero: U + 'img_5916-3.jpg', photos: [U + 'img_6039.jpg', U + 'dji_0136_edit.jpeg'],
    },
    {
      kind: 'intermediate', name: 'Nenana', lat: 64.56, lon: -149.10,
      title: 'Nenana', date: '02. Nov', arriveBy: 'drive',
      text: 'Tankstopp am Fluss, die Sonne steht schon tief um die Mittagszeit.',
    },
    {
      kind: 'main', name: 'Fairbanks', lat: 64.84, lon: -147.72,
      title: 'Fairbanks', date: '02.–04. Nov', arriveBy: 'drive',
      text:
        'Tor zur Arktis und beste Basis für die Nordlichter. Nachts raus aus der Stadt, Stative auf, warten.\n\n' +
        'Tagsüber letzte Vorbereitungen für die Fahrt den Dalton Highway hinauf.',
      hero: U + 'a7406420.jpg', photos: [U + 'img_5273.jpg', U + 'IMG_6001.webp'],
    },
    {
      stage: 'Arktis & Polarkreis', kind: 'intermediate',
      name: 'Yukon Crossing', lat: 65.88, lon: -149.72,
      title: 'Yukon River Crossing', date: '05. Nov', arriveBy: 'drive',
      text: 'Die lange Holzbrücke über den zugefrorenen Yukon — Trucker, Eis, Weite.',
      thumb: U + 'img_4101.jpg',
    },
    {
      kind: 'main', name: 'Arctic Circle', lat: 66.56, lon: -150.17,
      title: 'Polarkreis-Schild', date: '05. Nov', arriveBy: 'drive',
      text:
        'Das berühmte Schild am Polarkreis — Beweisfoto im eisigen Wind.\n\n' +
        'Ab hier ist die Sonne nur noch ein kurzer Gruß am Horizont.',
      hero: U + 'dji_0136_edit.jpeg', photos: [U + 'img_4101.jpg', U + 'a7406566.jpg'],
    },
    {
      kind: 'main', name: 'Coldfoot', lat: 67.25, lon: -150.18,
      title: 'Coldfoot', date: '05.–06. Nov', arriveBy: 'drive',
      text:
        'Der nördlichste Punkt der Reise. Eine Truckstop-Siedlung mitten in der Wildnis — das große Ziel.\n\n' +
        'Wenn die grünen Bänder über den Bäumen tanzen, ist jede Stunde Kälte vergessen.',
      hero: U + 'img_6039.jpg', photos: [U + 'a7406523.jpg', U + 'img_5916-3.jpg'],
    },
  ],
};
