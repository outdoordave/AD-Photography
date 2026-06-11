// PROTOTYP-DEMODATEN — Variante B (vertikale Timeline). NUR für die Vorschau
// unter /proto/reisen-timeline. KEIN echter Content, KEINE Tina-Collection (.ts wird
// von Tina nie gescannt). Reversibel: Datei löschen = Prototyp-Daten weg.
//
// HERKUNFT / LIVE-WAHRHEIT:
// - Basis = die längste reale Reise `src/data/trips/alaska2026.json` (10 Stops).
// - Namen, Koordinaten (GeoJSON-Point), Daten und Originaltexte sind 1:1 ECHT übernommen.
// - Klassifizierung Haupt/Zwischen aus Heuristik: Hauptstation = Titelbild ODER ≥1 weiteres
//   Foto ODER Text ≥ ~25 Wörter. Real erfüllt das NUR „San Francisco" (echtes Titelbild + 2 Fotos).
// - DEMO-FÜLLUNG (`source:'demo'`): Yosemite, Denali, Coldfoot wurden zu Hauptstationen
//   aufgewertet (Hero + Filmstreifen aus ECHTEN, vorhandenen /uploads-Bildern + verlängerter
//   Demo-Text). Lake Tahoe bekam EIN Demo-Thumbnail, um die schlanke Variante mit Bild zu zeigen.
//   Alles `source:'demo'` ist erfundene Anschauung, kein echter Reise-Inhalt.

export type TLStopKind = 'main' | 'intermediate';

export type TLStop = {
  kind: TLStopKind;
  name: string;
  lat: number;
  lon: number;
  title: string;
  date: string;
  // Erzähltext (DE). Bei Hauptstationen ggf. mehrere Absätze (durch \n\n getrennt).
  text: string;
  hero?: string;       // nur Hauptstation: großes Titelbild
  photos?: string[];   // nur Hauptstation: Filmstreifen (Lightbox-Gruppe)
  thumb?: string;      // nur Zwischenstopp: optional EIN kleines Thumbnail
  // Provenienz für ehrliche Vorschau: was am Stop ist echt, was Demo-Anschauung.
  source: 'real' | 'demo';
  note?: string;       // kurze Kennzeichnung für die Vorschau-Anzeige
};

export type TLTrip = {
  slug: string;
  title: string;
  meta: string;
  summary: string;
  stops: TLStop[];
};

// Reale Originaltexte aus alaska2026.json sind als solche belassen; Demo-Texte sind länger
// und klar als source:'demo' markiert.
export const ALASKA_TIMELINE_DEMO: TLTrip = {
  slug: 'alaska2026',
  title: 'Alaska 2026',
  meta: 'Oktober–November 2026 · kommende Reise · Kalifornien & Alaska',
  summary:
    'Unsere kommende große Reise: zuerst die liebgewonnenen Orte Kaliforniens wieder besuchen, dann hoch in den hohen Norden — Anchorage, Denali, Fairbanks bis hinauf nach Coldfoot am Polarkreis. Die Vorfreude ist riesig.',
  stops: [
    {
      kind: 'main',
      name: 'San Francisco',
      lat: 37.77,
      lon: -122.42,
      title: 'San Francisco',
      date: '23.–25. Okt',
      text: 'Der Start unserer Best-of-Runde: zwei Tage in San Francisco, bevor es die Küste hinunter geht.',
      hero: '/uploads/img_0206.jpg',
      photos: ['/uploads/img_5273.jpg', '/uploads/img_1418-2.jpg'],
      source: 'real',
      note: 'Echte Hauptstation (Titelbild + 2 Fotos aus den echten Daten).',
    },
    {
      kind: 'intermediate',
      name: 'Morro Bay',
      lat: 35.37,
      lon: -120.85,
      title: 'Morro Bay',
      date: '25.–26. Okt',
      text: 'Wieder die Ottern beim Spielen beobachten und ein Stück Highway 1 genießen.',
      source: 'real',
    },
    {
      kind: 'intermediate',
      name: 'Los Angeles',
      lat: 34.05,
      lon: -118.24,
      title: 'Los Angeles',
      date: '26.–28. Okt',
      text: 'Ein Wiedersehen mit der Stadt der Engel, bevor wir ins Yosemite-Hochland aufbrechen.',
      source: 'real',
    },
    {
      kind: 'main',
      name: 'Yosemite',
      lat: 37.87,
      lon: -119.54,
      title: 'Yosemite',
      date: '28.–30. Okt',
      text:
        'Zurück zu unserem Lieblings-Nationalpark, diesmal mit mehr Zeit.\n\n' +
        '[Demo-Text] Drei Tage im Tal: morgens Nebel über dem Merced River, mittags die Wände des El Capitan in der Sonne, abends das letzte Licht auf Half Dome. Wir wandern früh los, bevor die Aussichtspunkte voll werden, und lassen die Drohne nur dort steigen, wo es erlaubt ist.\n\n' +
        '[Demo-Text] Diesmal bleibt Zeit für die kleinen Dinge — ein Reh am Waldrand, das Knirschen der ersten Eiskristalle, ein Kaffee mit Blick ins weite Tal.',
      hero: '/uploads/img_5666.jpg',
      photos: ['/uploads/a7406420.jpg', '/uploads/dji_0136_edit.jpeg', '/uploads/img_4101.jpg'],
      source: 'demo',
      note: 'DEMO-Hauptstation: echtes Datum/Koordinate/erster Satz, aber Hero + Filmstreifen + verlängerter Text sind Demo-Anschauung.',
    },
    {
      kind: 'intermediate',
      name: 'Lake Tahoe',
      lat: 39.1,
      lon: -120.03,
      title: 'Lake Tahoe',
      date: '30. Okt – 01. Nov',
      text: 'Ein paar ruhige Tage am Bergsee, bevor der Flug in den hohen Norden geht.',
      thumb: '/uploads/IMG_6001.webp',
      source: 'demo',
      note: 'Echter Stop; das eine Thumbnail ist Demo (zeigt die schlanke Variante MIT Bild).',
    },
    {
      kind: 'intermediate',
      name: 'Anchorage',
      lat: 61.22,
      lon: -149.9,
      title: 'Anchorage',
      date: '01.–04. Nov',
      text: 'Ankunft in Alaska. Anchorage als Basislager für die großen Wildnis-Etappen.',
      source: 'real',
    },
    {
      kind: 'main',
      name: 'Denali',
      lat: 63.07,
      lon: -151.0,
      title: 'Denali',
      date: '04.–05. Nov',
      text:
        'Der höchste Berg Nordamerikas — Wildnis, Weite und hoffentlich klare Sicht.\n\n' +
        '[Demo-Text] Vom Parkeingang aus ist der Gipfel an klaren Tagen schon zu erahnen. Wir hoffen auf das seltene Fenster, in dem sich die Wolken lösen und der ganze Berg über der Tundra steht. Karibus ziehen in der Ferne, der erste Schnee liegt schon auf den Hängen.\n\n' +
        '[Demo-Text] Zwei Tage Geduld, warme Schichten und viel heißer Tee — und das Warten auf das eine Licht, das alles erklärt.',
      hero: '/uploads/IMG_5904.webp',
      photos: ['/uploads/IMG_6654-2.webp', '/uploads/IMG_6502-2.webp', '/uploads/IMG_6001.webp'],
      source: 'demo',
      note: 'DEMO-Hauptstation: echtes Datum/Koordinate/erster Satz, Hero + Filmstreifen + Zusatztext sind Demo.',
    },
    {
      kind: 'intermediate',
      name: 'Fairbanks',
      lat: 64.84,
      lon: -147.72,
      title: 'Fairbanks',
      date: '05.–06. & 09.–11. Nov',
      text: 'Tor zur Arktis und Basis für die Polarlichter.',
      source: 'real',
    },
    {
      kind: 'main',
      name: 'Coldfoot',
      lat: 67.25,
      lon: -150.18,
      title: 'Coldfoot',
      date: '07.–09. Nov',
      text:
        'Der nördlichste Punkt jenseits des Polarkreises am Dalton Highway — das große Ziel.\n\n' +
        '[Demo-Text] Der Dalton Highway ist rau, einsam und genau deshalb das Herzstück der Reise. Lastwagen, Schotter, kein Handynetz — und über allem die Chance auf das Polarlicht. Wir richten uns auf lange, kalte Nächte ein, die Kameras auf Stativen, die Augen am Himmel.\n\n' +
        '[Demo-Text] Wenn die grünen Bänder über den Bäumen tanzen, ist jede Stunde Kälte vergessen.',
      hero: '/uploads/img_6039.jpg',
      photos: ['/uploads/a7406523.jpg', '/uploads/a7406566.jpg', '/uploads/img_5916-3.jpg'],
      source: 'demo',
      note: 'DEMO-Hauptstation: echtes Datum/Koordinate/erster Satz, Hero + Filmstreifen + Zusatztext sind Demo.',
    },
    {
      kind: 'intermediate',
      name: 'Tok',
      lat: 63.34,
      lon: -142.99,
      title: 'Tok',
      date: '11.–13. Nov',
      text: 'Letzter Halt im Landesinneren auf dem Rückweg nach Anchorage.',
      source: 'real',
    },
  ],
};
