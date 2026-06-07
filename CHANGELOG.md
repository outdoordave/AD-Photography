# CHANGELOG — AD-Photography

Chronologische Historie aller Änderungen. **Nur ergänzen** (neueste oben).
Den aktuellen Gesamtstand zeigt `STATUS.md`.

**Format für neue Einträge:**
```
## YYYY-MM-DD HH:MM — <Kurztitel>
- was geändert
- betroffene Dateien
- Commit: <hash> (mehrere mit Komma)
```

> Hinweis: Die Einträge unterhalb wurden **rückwirkend rekonstruiert** — Datum/
> Uhrzeit stammen aus `git log` (echte Commit-Zeitstempel), die Kurzbeschreibungen
> aus den Commit-Messages. Verwandte Commits sind gruppiert.

---

## 2026-06-06 — Kontaktformular versendet echt (W5, Web3Forms) + Datenschutz-Häkchen
- Auf Nutzer-Wunsch W5 umgesetzt: die Kontaktbox sendet jetzt wirklich. `ContactContent.onSend`
  macht einen POST an `api.web3forms.com/submit` mit dem Access-Key aus dem CMS
  (`form_access_key`) → Mail landet im hinterlegten Postfach (Test: `davidbastisch@web.de`).
  Key `408e…` in `contact.json` gesetzt (öffentlicher Web3Forms-Key, kein Geheimnis). **Ohne
  Key** bleibt das Formular „Vorschau" (sendet nichts) → bricht nichts, falls Key fehlt.
- **Datenschutz:** Pflicht-Häkchen vor dem Senden (`form_consent_de/en`), sonst Absenden geblockt.
  **Spam:** verstecktes Honeypot-Feld. **UX:** Button-Lade-Zustand (deaktiviert + „Senden …"),
  Fehlermeldung (`form_error_de/en`) bei Misserfolg; Vorschau-Hinweis (`form_note`) nur noch
  sichtbar, solange kein Key gesetzt ist.
- Neue CMS-Felder in der Kontakt-Collection (Key/Consent/Fehler) + CSS (`.form-consent`,
  `.form-error`, `:disabled`). Im gerenderten `/contact` verifiziert: Häkchen da, Key da,
  web3forms im Bundle, Vorschau-Hinweis-Element weg. Build grün (29 Seiten).
- ⚠️ **Schema geändert → `tina-lock` neu erzeugt** (`dev --no-server`, deterministisch, 2× gleicher
  Hash `da2f425…`) → nach Push **Tina-Cloud-Re-index + Rebuild nötig.** Echtes Senden erst auf der
  deployten Seite testbar. Spätere Eigenlösung (Cloudflare-Function + Resend) als W5b in IDEEN.md
  vorgemerkt. Commit: `671a742`

## 2026-06-06 — Stories: Direktaufruf-Sperre (gleiche Lücke wie Kontakt)
- Dieselbe Lücke wie bei Kontakt, jetzt für Stories geschlossen: `show_stories` blendete nur
  Nav-/Footer-Link aus; `/stories`, `/en/stories` **und die Einzelbeiträge** `/stories/<slug>`
  (DE+EN) waren per Direkt-URL weiter erreichbar.
- **Fix:** Build-Zeit-Guard in allen vier Seiten (`stories/index.astro`, `en/stories/index.astro`,
  `stories/[slug].astro`, `en/stories/[slug].astro`): bei `show_stories !== true`
  `Astro.redirect` auf die Startseite (DE → `/`, EN → `/en/`). Logik = wie Nav/Footer (sichtbar
  NUR bei `show_stories === true`, Standard aus).
- Reiner Seiten-Code → **tina-lock unverändert, kein Re-index.** Build grün (29 Seiten); im dist
  verifiziert: alle vier Varianten = Meta-Refresh-Weiterleitung (+ `robots: noindex`), kein
  `page-story`. Commit: `3fe9e01`

## 2026-06-06 — Kontakt komplett ausblendbar: Direktaufruf-Sperre
- **Befund (Ist-Zustand geprüft):** Der Schalter `show_contact` (🎨 Darstellung →
  „Kontakt zeigen?", aus Teil 2D) blendet **Nav- + Footer-Link** sauber aus (BaseLayout →
  SiteNav/SiteFooter, Filter `!i.contactOnly || showContact`). **Lücke:** die Seiten
  `/contact` + `/en/contact` rendern beim **Direktaufruf** trotzdem (kein Guard) — wie
  Stories. Der Schalter-Text sagt das selbst („Nav-Link + Footer-Link").
- **Fix:** Build-Zeit-Guard in beiden `contact.astro`: bei `show_contact === false`
  `Astro.redirect` auf die Startseite (DE → `/`, EN → `/en/`). Logik = wie Nav/Footer
  (aus = `false`, fehlend = sichtbar). `output: 'static'` → Astro baut eine Meta-Refresh-
  Weiterleitung; das Kontaktformular wird nicht mehr ausgeliefert.
- **Hinweis:** Solange aus, leitet auch die CMS-Live-Vorschau der Kontakt-Seite auf „/" um
  (gleicher statischer Build). Zum Bearbeiten Schalter kurz an + bauen.
- Reiner Seiten-Code → **tina-lock unverändert, kein Re-index.** Build grün (29 Seiten);
  `dist/contact` = 248 B Refresh→`/`, `dist/en/contact` = Refresh→`/en/`, kein `page-contact`/
  `<form>` mehr. W5 (echter Versand + danach wieder einblenden) in `IDEEN.md` aktualisiert.
  Commit: `1c76a73`

## 2026-06-06 — Portfolio: Alben-Überschrift „freigestellt" (Schlagschatten)
- Auf Nutzer-Wunsch: Die Alben-Überschrift (`.gallery-group-title`, z. B. „USA 2023 → 5") wirkt
  jetzt **freigestellt/schwebend** durch einen Buchstaben-Schlagschatten (`text-shadow`, **nicht**
  box-shadow — der wirkt nur auf Kästchen).
- Neue Variable `--ww-text-shadow` (default `none` / *soft* / *strong*) analog zu `--ww-shadow`,
  an die bestehende Darstellungs-Stufe **gekoppelt** (CMS: keine/ausgewogen/kräftig) — kein Extra-Schalter.
  Das Badge `.album-go-count` per `text-shadow:none` ausgenommen (Pill bleibt clean), der Pfeil schwebt mit.
- Datei: `web/src/styles/global.css`. Reiner Code → tina-lock unverändert, **kein Re-index.**
  Build grün (29 Seiten); alle drei Stufen im gebauten CSS verifiziert. Commit: `155178a`

## 2026-06-06 — Bild-Zuschnitt auf CSS-Zuschnitt umgestellt (kein eingebranntes Bild)
- Auf Nutzer-Wunsch (nach „ewig"-Warten + „?" bei jedem Crop): Zuschnitt brennt **kein neues Bild**
  mehr ein. `CropPhotoField` → „Übernehmen" speichert **nur das crop-Rechteck** `{x,y,w,h}` (sofort,
  kein Upload, keine neue Datei). Upload des Originals bleibt Auto-WebP @2400px.
- Neuer Helfer `photoFrame(v)` in `lib/trips` → `{ src=Original, style=CSS-Positionierung }`; die
  Besucherseite schneidet das **Original per CSS** auf das Rechteck zu (Frame-Seitenverhältnis = cropRatio:
  Person 4/3, Station 16/10 = `--ar-media`). `AboutContent` (Personen) + `TripsContent`/`viewStops`
  (Stationen) nutzen es. Bestehende Crops rendern via Original+crop (alte `-crop-*.webp` = Waisen).
- **Folge:** nie wieder „?"/Deploy-Warten beim Zuschnitt, keine Extra-Dateien, keine Doppel-Kompression.
  Fotos bleiben WebP (das Original). Reiner Code → tina-lock unverändert, **kein Re-index.** Build grün
  (29 Seiten); CSS-Crop-Style im HTML verifiziert. Commit: `3505521`

## 2026-06-06 — Crop-Save-Fix + Riss-Übergang erweitert (Footer/Hero)
- **Crop speichern gefixt** (`6b25569`): CropPhotoField erzeugte immer `<base>-crop.webp` → Git-Medien
  überschreiben nicht → „File already exists" beim erneuten Zuschneiden. Jetzt eindeutiger Zeitstempel-
  Suffix (`<base>-crop-<ts>.webp`). (Alte Crop-Dateien bleiben als Waisen in /uploads.)
  - **Hinweis „?" auf der Live-Seite:** Git-Medien-Verzögerung — das zugeschnittene Bild wird ins
    Repo committet, aber erst nach dem nächsten Cloudflare-Build ausgeliefert (wie jeder frische Upload).
    Kein Pfad-Bug. Alternative ohne neue Datei (CSS-Zuschnitt aufs Original) bei Bedarf später.
- **Riss-Übergang** (`fbd6013`): `PaperRip` (geflippte Creme-Kante) zusätzlich am **Footer jeder Seite**
  (helle Seite reißt in den dunklen Footer) und an der **oberen Hero-Kante**. Globale Klasse
  `.band-rip.band-rip-top`, eindeutige SVG-Filter-IDs je Instanz. Reiner Code/CSS → kein Re-index.
  Build grün (29 Seiten).

## 2026-06-06 — TEIL 10: CMS-Orientierung „Du bist hier"-Banner (Sammel-Auftrag 1–10 komplett)
- Neue Info-Komponente `SectionBanner`: oben in jeder Sektion ein Klartext-Banner „📍 Du bist hier:
  📖 Stories – Beitrag" o. ä. Reines Info-Feld (kein Eingabefeld, ruft nie onChange) → **schreibt
  nichts in die Daten**, nur ein Schema-Feld fürs Rendern. Per Skript in alle 12 Collections als
  erstes Feld eingefügt (Label je Collection). Ergänzt Tinas native Breadcrumb + aktiven Menüpunkt.
- ⚠️ Schema (12× `ww_here`) → tina-lock neu (deterministisch) → **Re-index + Rebuild.** Build grün
  (29 Seiten); „Du bist hier" + 📍 im Admin-Bundle verifiziert. Commit: `42d90fb`
- **Damit ist der Sammel-Auftrag TEIL 1–10 vollständig.**

## 2026-06-06 — Fix TEIL 8: leere GraphQL-Abfrage („Unexpected <EOF>")
- Bug aus `afa1b80`: TripsContent rief eine 2. `useTina` mit `query:''` auf, wenn keine Settings-Props
  da waren (Detail-Route `/trips/<slug>`, die das CMS beim Öffnen einer Reise nutzt) → leere GraphQL-
  Abfrage → CMS-Fehler „Syntax Error: Unexpected <EOF>". Fix: Settings-`useTina` jetzt in eigener
  Kind-Komponente `<MapStyleWatcher>`, die NUR mit echtem Query gerendert wird (bedingtes Rendern statt
  bedingtem Hook); Live-Stil als State, sonst statischer Build-Prop. Kein Schema-Touch. Commit: `3ac99e3`

## 2026-06-06 — TEIL 8: Kartenstil-Sofortvorschau im CMS
- `TripsContent` liest den Kartenstil jetzt **live** aus `reisen_settings` (2. useTina, durchgereicht
  von `trips.astro` DE/EN). Bei Stilwechsel im CMS wird die bestehende Karte per `map.setStyle()`
  umgestylt (statt neu gebaut) → sofortige Vorschau. DOM-Marker überleben `setStyle`; danach nur
  `setMapLanguage` auf `styledata` neu. Fallback auf Build-Prop → statische Besucher-Seite unverändert.
- Reiner Komponenten-/Astro-Code → **tina-lock unverändert, KEIN Re-index.** Build grün (29 Seiten).
  Commit: `afa1b80`

## 2026-06-06 — Fix Build: tina-lock nach TEIL 7 neu generiert (war stale)
- Cloudflare-Builds brachen ab („local schema doesn't match remote", auch nach Re-index 11:39).
  Ursache: Das committete `tina-lock.json` war nach der TEIL-7-Änderung **nicht regeneriert**.
  Die Story-EN-Felder bekamen eigene `ui`-Komponenten (`excerpt_en`: `'textarea'` → custom;
  `title_en`/`category_en`: Komponente ergänzt) — **das ändert das Lock-Schema** (`ui.component`
  schlägt sich im Lock nieder, anders als angenommen). Lock via `tinacms dev --no-server` neu
  erzeugt (deterministisch, 2× gleicher Hash). Commit `010145a`.
- **Lehre (wichtig):** Lock NACH **jeder** `tina/config`-Änderung neu erzeugen — auch bei reinen
  `ui.component`-Änderungen. Nicht nur bei neuen Feldern/Typen.

## 2026-06-06 — TEIL 7: EN-Felder im CMS dezent in Erdtönen abheben
- `EnglishOnlyField`/`-TextField`: linker Akzentstreifen (`#b08a5e`) + zarte warme Tönung (`#f6efe1`)
  + 🌐-Label → englische Felder auf einen Blick von den deutschen unterscheidbar. Greift bei allen
  Collections mit EnglishOnlyField (Einstellungen, Equipment, Über uns, Kontakt, Alben, Startseite, Reisen).
- Story-Beiträge (eigener `has_english` statt Sprach-Schalter): neue Variante `EnglishStyledField`/
  `-TextField` (immer sichtbar + gleiche Markierung) auf Title/Category/Excerpt (EN). Body (EN) = Rich-Editor, unverändert.
- Rein kosmetisch → **tina-lock unverändert, KEIN Re-index.** Build grün (29 Seiten). Commit: `4f46ea3`

## 2026-06-06 — CMS: fehlendes Emoji vor „Stories"-Collection ergänzt
- Story-Collection-Label `Stories` → `📖 Stories` (Einstellungen hatte das 📖 schon, die Beiträge-
  Collection nicht). Reines Label → **kein Re-index**, tina-lock unverändert.

## 2026-06-06 13:13 — Gear: ganze Liste vs. Gruppe + Stationsfenster-Rahmen am Wrap (Clipping-Fix)
- **Gear-Reichweite:** neue CMS-Einstellung **`gear_scope`** (whole | groups) — EIN Block um die ganze
  Liste ODER je Kategorie ein Block. CSS scope-fähig (card + notes je Reichweite). **Field-Notes als
  EIN ganzer Zettel** (whole): ein Kraftpapier-Block um die ganze Liste, eine Rand-Linie, Häkchen je
  Eintrag. Standard auf Nutzer-Wunsch: `gear_style=notes` + `gear_scope=whole`.
- **Stationsfenster (äußerer Rahmen):** Ursache des „unfertigen" Rahmens war, dass `.trip-detail-wrap`
  (`overflow:hidden`) den Schatten der inneren `.trip-detail` **abschnitt**. Rahmen+Schatten daher auf
  den **Wrap** gelegt (eigener Schatten wird nicht geclippt) → sieht jetzt aus wie die anderen Boxen und
  hängt weiter am globalen Schalter (`--ww-ring/--ww-shadow`). Eigener Inset-Versuch wieder entfernt.
- ⚠️ Schema-Feld `gear_scope` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten).
- Commit: `c34ade0`
- **Klarstellung (online-Stand):** `origin/astro-umbau` war bei `c5241f9` — die große Überarbeitung +
  Feedback-Runde 1 (bis `edb4234`) waren bereits online. Frühere „Deploy ist veraltet"-Annahme war falsch
  (per `curl` korrigiert). Das Stationsfenster-Frame-im-Frame war der echte Live-Stand, nicht veraltet.

## 2026-06-06 12:49 — Stationsfenster = eine Karte + Gear-Listen-Stile (CMS-Option)
- **Stationsfenster (Reisen):** kein Rahmen-im-Rahmen mehr — das innere Stationsfoto (`.trip-detail .ph`)
  aus der Schatten-Liste genommen; nur das äußere Panel (`.trip-detail`) ist gerahmt+erhaben, das Foto
  darin schlicht. Wie Story-Card (Vorbild). (`40faf3a`)
- **Gear-Seite:** neuer CMS-Stil **`gear_style`** (plain | card | notes), Standard **card**.
  - **card:** jede Kategorie eine ruhige erhabene Karte · **notes:** Field-Notes/Notizzettel
    (Kraftpapier-Ton, Rand-Linie, Häkchen je Eintrag) · **plain:** bisheriger schlichter Listenstil.
  - Eigener Schatten (unabhängig vom globalen Rahmen-Schalter), CMS-Vorschau-Feld `GearStyleField`
    (Mini-Vorschau je Stil). `GearContent` setzt `.gear-list gear-style-<stil>`. (`40faf3a`)
- ⚠️ Schema-Feld `gear_style` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten).

## 2026-06-06 12:42 — Fix: Kontakt-Textfeld wächst wieder mit + Insta-Handle a3.flow
- **Kontakt-Nachrichtenfeld:** Auto-Wachstum (1:1-Port von `wwGrowMsg`/Live) in `ContactContent` —
  wächst mit dem Inhalt bis 300px, dann interner Scroll. War in der Astro-Version verloren.
- **Instagram-Handle** `a3_flow` → **`a3.flow`** in `home-settings.json` (Intro) + `contact.json`
  (Label + URL). Hinweis: `a3.flow` war nie im Repo (alte Live-Daten + neue trugen immer `a3_flow`)
  → nichts „zurückgerutscht", sondern erstmals korrekt gespeichert.
- Build grün. Commit: `d2eff59`

## 2026-06-06 11:53 — TEIL 6 Feedback-Runde: alle Kästchen + einheitliche Hover + Über-uns-Riss
- Weiteres Nutzer-Feedback (Story-Card = Vorbild für Hover/Rahmen):
  - **Entdecken-Kacheln** (`.teaser`): Rahmen+Schatten + Hover-Erhebung (vorher ohne).
  - **Instagram-/Social-Buttons** (`.insta-link`): Rahmen+Schatten (hell + dunkle Variante) + Hover.
  - **Momentaufnahmen/Portfolio-Kacheln-Hover** an Vorbild-Schatten angeglichen.
  - **Stations-Pills unten** (`.trip-stoplist button`) sehen jetzt aus wie die Reise-Tabs (Rahmen aus
    Stufe + Hover-Erhebung + aktiv).
  - **Stationsfenster** (`.trip-detail`): Alt-Rahmen raus, Rahmen+Schatten aus der Stufe.
  - **Hero-CTAs:** einheitliche Hover-Animation (auch der ghost-Button hebt sich gleich an).
  - **Portfolio-Album-Hover** als CMS-Schalter **`album_hover`** (Standard an; nur geschlossene Alben).
  - **Über uns:** neue `PaperRip`-Komponente (Hero-Riss 1:1, eindeutige Filter-IDs) — dunkle
    Profil-Box bekommt oben + unten die gerissene Papierkante (wie der Hero-Übergang).
- ⚠️ Schema-Feld `album_hover` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten);
  body-Klassen (strong/controls/album-hover), alle 7 CSS-Regeln + Über-uns-Risse verifiziert.
- Commit: `edb4234`
- **Hinweis:** Merge-Konflikt in `appearance-settings.json` aufgelöst (CMS-Wahl `image_frame: strong`
  behalten + `frame_controls` ergänzt; Tina-Commit `8677cbe`).

## 2026-06-06 10:45 — TEIL 6 überarbeitet: einheitliches Box-System (alle Kästchen) + CMS-Vorschau
- Nutzer-Feedback: nicht alle Felder hatten Rahmen/Schatten, Rahmendicken ungleich, dunkle
  Bereiche, Hover-Signal + CMS-Vorschau gewünscht. Umgesetzt:
  - **Einheitliches, stufengesteuertes System** (global.css am Datei-Ende → überschreibt Alt-Rahmen):
    EINE Quelle → **gleiche Rahmendicke pro Stufe** (0/1px/2px) + warmer Schatten. Variablen
    `--ww-ring/--ww-shadow` (hell) + `--ww-ring-d/--ww-shadow-d` (dunkel: helle Linie + weicher
    dunkler Schatten, für Über-uns/Hero/Footer).
  - **Reichweite jetzt ALLE Kästchen:** Aktuell-/Stories-Karten, Portfolio-/Album-/Moments-/
    Entdecken-Kacheln, Album-Diashow, Story-Album-Kacheln, Stations-/Beitragsbilder, **Reise-Tabs**,
    **Karten-Container** (`.map-box`), **Personen-Karten** (dunkle Variante).
  - **Hover-Erhebung** (Klick-Signal) auf Reise-Tabs + Kacheln.
  - **Buttons/CTAs + Kontakt-Eingabefelder** hinter neuem CMS-Schalter **`frame_controls`** (Standard
    an); **Hero-CTAs mit durchsichtigem Schatten** (Hero-Bild scheint durch).
  - Dekorative Alt-Rahmen (`.story-card/.person/.trip-tabs`) entfernt → Rahmen kommt einzig aus der
    Stufe (keine ungleichen Dicken mehr).
  - **CMS-Vorschau (iOS-Stil):** `image_frame` nutzt `ImageFrameField` — pro Stufe eine Mini-Vorschau
    (Foto-Kachel + Button) mit echten Rahmen/Schatten-Werten, klickbar.
- ⚠️ Schema-Feld `frame_controls` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten);
  body-Klassen + alle CSS-Regeln (hell/dunkel/gate/hero/tabs/hover) verifiziert.
- Commit: `5c0cb50`

## 2026-06-06 10:06 — TEIL 6: Bild-Rahmen & Schatten (3-Stufen-CMS-Einstellung, global)
- Neue Darstellungs-Option **„Bild-Rahmen & Schatten"** (`darstellung.image_frame`:
  `none|soft|strong`), **Standard `soft` (ausgewogen)** — bewusste Abweichung von der Live-Seite
  (flach), nach dem Muster „Standard an, im CMS abschaltbar".
  - **Keine:** flach (wie Live) · **Ausgewogen:** zarte warme Linie + weicher Schatten ·
    **Kräftig:** deutliche Linie + tiefer Schatten.
- `BaseLayout` setzt `<body class="ww-frame-*">` aus dem Setting; `global.css` definiert je Stufe
  die warm getönte Variable `--ww-frame` (Inset-Ring als Rahmen ohne Layout-Sprung + Schlagschatten).
- Angewendet auf die gerundeten Foto-Wrapper: Story-/Latest-Cards, Portfolio-/Album-/Moments-Kacheln,
  Album-Diashow, Story-Album-Lightbox-Kacheln, Personen- + Stations-Fotos, Beitragsbilder.
  **Hero/Lightbox/Karte bewusst ausgenommen** (nicht in der Selektor-Liste).
- ⚠️ Schema-Feld → **tina-lock neu → Re-index + Rebuild nötig.** Offline-Build grün (29 Seiten);
  body-Klasse, beide Stufen-Variablen + Selektor-Liste (ohne Hero/Lightbox) im CSS verifiziert.
- Commit: `77bf13f`

## 2026-06-06 09:47 — TEIL 5: Karten-Scroll-Zoom als CMS-Schalter (Standard AN)
- Neuer Schalter **„Karte: Mit Mausrad zoomen"** in den Reisen-Einstellungen
  (`reisen_settings.map_scroll_zoom`), **Standard AN** — bewusste Abweichung von der Live-Seite
  (die Scroll-Zoom aus hat), auf Nutzer-Wunsch („Standard ein, im CMS abschaltbar").
  - **AN:** `cooperativeGestures:false` + `scrollZoom.enable()` → Mausrad zoomt die Karte direkt
    (am Handy bewegt 1 Finger die Karte).
  - **AUS:** `cooperativeGestures:true` + `scrollZoom.disable()` → Mausrad scrollt die Seite, am
    Handy 2 Finger für die Karte — exakt das bisherige/Live-Verhalten.
- `TripsContent` bekommt `scrollZoom`-Prop (aus `trips-settings.json`, Default `true`); `trips.astro`
  + `en/trips.astro` verdrahtet. (Der Prototyp `TripMapProto.tsx` bleibt unverändert.)
- ⚠️ Schema-Feld → **tina-lock neu → Re-index + Rebuild nötig.** Offline-Build grün (29 Seiten);
  enable/disable/cooperativeGestures + Default (`!== false`) im Bundle verifiziert.
- Commit: `2879c11`

## 2026-06-05 21:30 — Stories-Feedback: Album-Vorschau live, Mediathek, Inline-Lightbox
- Drei Punkte aus dem Nutzer-Test der Album-Funktion:
  1. **Album-Block in Live-Vorschau:** war nur beim Seitenbau aufgelöst → im Editor nur roher
     `[[album]]`-Marker sichtbar. Auflösung jetzt **direkt in der Insel** aus den useTina-Daten
     (`linked_album` ist im Tina-Fragment mit name/photos/_sys expandiert) → Block erscheint
     **sofort** in der Vorschau an der Marker-Stelle. `storyAlbum.ts` + `album`-Prop der
     Astro-Seiten entfernt (überflüssig).
  2. **Mediathek (wie Sveltia):** neuer Knopf „🖼️ Aus Mediathek wählen" in StoryBodyField →
     Raster ALLER vorhandenen `/uploads`-Bilder (build-generiertes `public/uploads-manifest.json`,
     `scripts/gen-uploads-manifest.mjs` im build-Script) → Klick fügt `![](pfad)` ein, **kein
     erneuter Upload**.
  3. **Inline-Bilder im Beitrag** öffnen jetzt als blätterbare Gruppe die bestehende **Lightbox**
     (1:1 wie Live `index.html` ~2883: alle `.reader-body img`). Album-Kacheln ausgenommen.
- **Kein Schema-Feld geändert → tina-lock unverändert, KEINE zusätzliche Re-index** (über die
  bereits offene vom Vor-Commit hinaus). Offline-Build grün (29 Seiten, Manifest 22 Bilder);
  Album-Positivfall verifiziert (Zitat → Album-Block → Absatz danach), Test zurückgesetzt.
- Commit: `1cc96fc`

## 2026-06-05 20:55 — Stories: Album verknüpfen + frei im Text als Lightbox einbetten
- **Neues Feature** (über Live hinaus, mit Nutzer-Freigabe; Live-Stories haben KEINE Galerie —
  nur Titelbild + Markdown-Fließtext mit Inline-`![](…)`). Ziel: 1–2 Bilder direkt im Text +
  ein bestehendes Album an frei wählbarer Stelle als Lightbox einbetten, **ohne Doppel-Upload**.
- **`StoryBodyField.tsx`** (neu): eigener Haupttext-Editor, laientauglich. Zwei Knöpfe über dem
  Textfeld — „📷 Bild einfügen" (Auto-WebP-Upload via jSquash an die Cursor-Stelle, kein
  Media-Manager/kein „?") + „📸 Album hier einfügen" (setzt `[[album]]`-Platzhalter an Cursor).
  Gespeichert bleibt **normales Markdown** → mdToHtml-Port unverändert (Capability-Lock-sicher).
- **Schema:** Story `body_de`/`body_en` auf StoryBodyField; neues **`linked_album`** (Tina-
  `reference` auf Sammlung `alben`, Dropdown); altes Story-**`gallery`**-Mehrfach-Upload-Feld
  **entfernt** (war der Doppel-Upload). Fotos kommen aus dem Album selbst.
- **`StoryAlbumBlock.tsx`** (neu): Vorschau-Kacheln (erste 4 + „+N") → öffnet die bestehende
  `Lightbox` mit allen Album-Fotos. **`StoryReaderContent`** teilt den Body am `[[album]]`-Marker
  und rendert den Block dort (ohne Marker, aber mit Album → ans Ende). **`storyAlbum.ts`** (neu)
  löst die Referenz robust auf; Astro DE/EN übergeben `album`. CSS für den Block im Reader-Stil.
- ⚠️ **Schema-Änderung → tina-lock + Codegen neu → Tina-Cloud-Re-index + Cloudflare-Rebuild nötig.**
  Offline-Build grün (29 Seiten); positiv getestet (Block an Marker-Stelle, 4 Kacheln + „+4",
  Album-Link, kein Marker-Leak, kein Block ohne Album), Test-Verknüpfung zurückgesetzt.
- Commit: `053ffeb`

## 2026-06-05 — TEIL D Slice 2/3 + Crop-Feld als String (Stationen, Fixes)
- **Slice 2:** CropPhotoField auf **Reise-Stations-Titelbild** (cropRatio 16:10); trip-JSONs +
  lib/trips (`photoDisplay`/`photoFull`) migriert. Commits `46eca37`, `25b363b`.
- **Crop-Feld Objekt → String** (`15bec1e`): Tina rendert Objekt-Felder als navigierbare Gruppe →
  beim Reinklicken erschienen rohe Unterfelder (Original/Anzeige/Crop) mit „?". Wert jetzt
  String (JSON-Blob oder reiner /uploads-Pfad) → Editor rendert **immer inline**, kein „?".
  Person- + Stations-Foto umgestellt; Daten + lib/trips angepasst.
- **Story-Titelbild** auf SinglePhotoField (`2cd1852`) — umgeht den Media-Manager („?").

## 2026-06-05 — TEIL D Slice 1: Zuschnitt-Foto-Feld (CropPhotoField)
- Option D (freies Zuschneiden, Original behalten), 1. Slice: `CropPhotoField.tsx` — gerahmtes
  Einzelbild mit Zoom + Verschieben (touch: Ziehen=pan, Pinch/Regler=zoom; WYSIWYG-Rahmen).
  „Übernehmen" brennt die Anzeige-WebP via jSquash. Wert = Objekt `{original, display, crop}`
  (Original bleibt für Lightbox/Neu-Zuschnitt; `display` = eingebrannter Zuschnitt → Besucher
  1:1 auf jedem Gerät). Ratio aus `field.cropRatio` (Default 4/3).
- Angewandt auf **Über-uns-Personen-Foto** (image→object, cropRatio 4/3); about.json migriert;
  AboutContent liest `display||original`. `.person .ph` = 4/3 ohne Mobile-Override → 1:1.
- ⚠️ Schema-Änderung → tina-lock neu → **Re-index + Rebuild**. Build grün. **Pilot — iPad-Test,
  dann Ausrollung auf Stationen/Hero/Stories.** Commit `e3564b3`.

## 2026-06-05 — Startseite live-editierbar + Equipment-Klickfix
- **Equipment:** `data-tina-field` saß auf der ganzen Ausrüstungs-Liste → Klick fokussierte das
  `items`-Feld (wirkte wie „+ hinzufügen"). Jetzt pro `gear-row` (`tinaField(it)` → `gear.items.N`),
  wie bei den Stationen → Klick öffnet genau diesen Eintrag. (`committed`)
- **Startseite live:** war als einzige „form-only". Neue useTina-Inseln `HomeHeroLive`,
  `HomeIntroLive`, `HomeSectionHead` (1:1-Port von HomeHero/HomeIntro.astro — gleiche Klassen/
  Markup/Effekte, Diashow per useEffect, Rip-SVG) + `data-tina-field` auf Headline/CTAs/Intro/
  Sektion-Köpfe. `index.astro` (+en) holen `client.queries.startseite`; startseite bekommt
  `ui.router: () => '/'`. Alte HomeHero/HomeIntro.astro entfernt. tina-lock unverändert (kein
  zusätzlicher Re-index). Build grün, HTML 1:1 DE+EN. (`a9f9303`)

## 2026-06-05 — Rollout: zweisprachige Felder flach (ganze Seite)
- Pilot-Ansatz (flache `*_de/*_en` statt `object{de,en}`) auf ALLE Inhalte ausgerollt: Reisen
  (Meta, Zusammenfassung, Stationen Titel/Datum/Text, Galerie-Caption), Über uns (Kopf, Personen
  Rolle/Bio/Gear, „Warum die USA?"), Kontakt (Kopf, Direkt-Block, Standort, Formular-Labels),
  Equipment (Kopf + neuer Sprach-Schalter), Startseite (Hero-Headline/CTAs, Intro, Sektion-
  Überschriften), Album-Notiz.
- Werkzeuge: `scripts/flatten-bilingual.mjs` (Daten, 166 Felder/11 Dateien, nested + Listen),
  `scripts/flatten-config.mjs` (30 einzeilige Schema-Felder); About/Equipment von Hand.
- Render: neuer Helfer `bi(obj,base,lang)` (lib/trips + lib/albums) + `tf()` je Insel →
  `data-tina-field` zeigt auf das Feld der aktiven Sprache (kein DE/EN-Untermenü mehr).
  Angepasst: TripsContent, AboutContent, ContactContent, GearContent, AlbumContent,
  GalleryContent, HomeHero, index/en-index, lib/home, lib/trips, Page-Titles, trips/[slug]
  (war seit Pilot leer → gefixt). EN-Felder via EnglishOnlyField (bei „Nur Deutsch" aus).
- ⚠️ Schema-Änderung → tina-lock neu → **Tina-Cloud-Re-index + Cloudflare-Rebuild nötig.**
  Offline-Build grün (29 Seiten); HTML DE+EN geprüft. **Wartet auf Live-Abnahme.**
- Commit: cd8383c

## 2026-06-05 — Fixes aus der Live-Prüfung: EN-Ausblenden, „?"-Thumbnails, Reise-Wechsel
- **EN-Felder bei „Nur Deutsch" ausblenden** (`ff0aa52`): die letzten immer-sichtbaren plain-EN-
  Felder „Album-Name (Englisch)" + „Reise-Titel (Englisch)" an `EnglishOnlyField` gehängt →
  verschwinden bei „Nur Deutsch". Nur UI, kein Re-index.
- **„?"-Thumbnails in den Foto-Feldern** (`186c35e`): Bearbeiten-Vorschau zeigte „?", weil Tina
  Cloud den /uploads-Pfad fürs Anzeigen auf `assets.tina.io/<id>/…` umschreibt (404, repo-basierte
  Bilder). Neuer Helfer `tina/fields/mediaPath.ts` (`toLocalMedia`) biegt nur für die ANZEIGE auf
  `/uploads/` zurück; in SinglePhotoField + BulkPhotoField (Kacheln + Drag-Overlay). Website war nie
  betroffen (nutzt normalizePath). Nur UI, kein Re-index.
- **Reise-Wechsel in der Live-Vorschau** (`c7324e1`): Tina fängt `click` auf data-tina-field per
  Capture + stopPropagation ab → der Reise-Tab-`onClick` feuerte nicht, Stationen blieben gleich.
  Tina fängt aber nur `click`, nicht `mousedown` → Tab-Wechsel im Editor zusätzlich per
  `onMouseDown` (nur inEditorRef; öffentliche Seite unverändert). Tinas paralleler Klick wählt das
  Reise-Titel-Feld → Formular folgt der Reise. Nur Insel, kein Re-index.

## 2026-06-05 — Teil B-Pilot: zweisprachige Settings-Felder flach (kein Klick-Untermenü)
- Problem (Live-Wahrheit): Klick in der Vorschau auf ein Objekt-Feld {de,en} öffnet bei Tina
  zwangsläufig ein Unterformular (`getActiveField` navigiert in die Gruppe). Lösung (Option 1):
  zweisprachige Felder flach machen → Klick springt direkt ins Freitextfeld.
- **Pilot** auf den drei „… – Einstellungen" (Portfolio/Stories/Reisen): kicker/title/intro je
  object{de,en} → flache Strings `kicker_de/kicker_en` usw. Neues Feld `EnglishOnlyField`/
  `EnglishOnlyTextField` (blendet sich bei „Nur Deutsch" komplett aus). Daten migriert,
  `SettingsHeader.tsx` + Seiten-`<title>` (DE+EN) auf flache Keys; data-tina-field → Feld der
  aktiven Sprache.
- **Schema-Änderung → tina-lock neu** (`npx tinacms dev --no-server`). **Braucht Tina-Cloud-
  Re-index + Cloudflare-Rebuild.** Offline-Build grün; SSR-HTML DE & EN ok.
- Dateien: `web/tina/fields/EnglishOnlyField.tsx` (neu), `web/tina/config.ts`, `tina-lock.json`,
  `web/src/data/{gallery,stories,trips}-settings.json`, `SettingsHeader.tsx`, 6 Settings-Seiten.
- Commit: 8850f59 — **Pilot, wartet auf Live-Abnahme** bevor Ausrollung auf Reisen/Über uns/
  Kontakt/Equipment/Startseite.

## 2026-06-05 — Teil 9: CMS-Benennung „Portfolio"
- Labels an Website-Nav angeglichen: „🖼️ Alben" → „🖼️ Portfolio Alben", „🖼️ Galerie –
  Einstellungen" → „🖼️ Portfolio". Nur Labels → tina-lock unverändert, kein Re-index.
- Commit: 79d4956

## 2026-06-05 — Teil 3B (richtig): Live-Vorschau für Galerie-/Stories-/Reisen-Einstellungen
- Statt nur Router: die Kopf-Blöcke (Kicker/Titel/Intro) dieser drei Settings-Seiten sind jetzt
  eine **useTina-Insel** (`SettingsHeader.tsx`, generisch via `docKey`-Prop, `t()` repliziert
  `tl()`-Fallback EN→DE). Dadurch registriert die Seite ein Tina-Formular → Bearbeiten +
  Live-Vorschau (Klick-zum-Feld via `data-tina-field`, Sofort-Update beim Tippen). Erst danach
  Router wieder gesetzt: galerie_settings→/portfolio, stories_settings→/stories,
  reisen_settings→/trips.
- Verdrahtet auf `/portfolio`, `/stories`, `/trips` **und** den `/en/`-Pendants (lang-Prop).
  Astro rendert die Insel vor → Besucher sehen identisches HTML (in dist verifiziert: Kopf-Text
  + data-tina-field, DE & EN).
- **Startseite/Highlights/Darstellung bleiben bewusst form-only OHNE Router** (Zielseite `/` ist
  Astro-Komposition Hero/Teaser/Toggles; echte Live-Vorschau = halber Homepage-React-Umbau).
- Dateien: `web/src/components/SettingsHeader.tsx` (neu), `web/src/pages/{portfolio,trips}.astro`,
  `web/src/pages/stories/index.astro`, `web/src/pages/en/{portfolio,trips}.astro`,
  `web/src/pages/en/stories/index.astro`, `web/tina/config.ts`. tina-lock unverändert → kein
  Re-index. Build grün (29 Seiten).
- Commit: 1acab68

## 2026-06-05 — Fix: Teil-3B-Router zurückgerollt (Settings-Editoren waren leer)
- Ursache: ein `ui.router` schaltet eine Collection in Tinas Visual-Editing-Modus; die
  Seitenleiste zeigt dann nur Formulare, die die Ziel-Seite per `useTina` registriert. Die
  Einstellungs-Seiten rendern statisch → kein useTina-Formular → „Looks like there's nothing
  to edit on this page", Bearbeiten-Formular verschwindet (Darstellung u. a.).
- Die sechs Settings-Router aus `2cb01d9` entfernt → Editoren wieder normal. Inhalts-Router
  (Gear/About/Kontakt/Alben/Reisen/Stories) unberührt. 3A („Zur Website") bleibt.
- Echtes 3B braucht useTina-Verdrahtung der Settings-Dokumente (separat). `tina-lock`
  unverändert, kein Re-index. Build grün (29 Seiten).
- Commit: fda8a94

## 2026-06-05 — Sammel-Auftrag Teil 3B + 3A: CMS-Vorschau überall + Zurück-Navigation
- **3B (Vorschau-Fenster auf jeder CMS-Seite):** allen Einstellungs-Collections (Startseite,
  Galerie-/Stories-/Reisen-Einstellungen, Highlights, Darstellung) einen `ui.router` auf die
  passende Live-Seite gegeben (→ `/`, `/portfolio`, `/stories`, `/trips`). Vorher hatten nur die
  Inhalts-Collections eine Vorschau. Router = reine UI-Funktionen → **kein** Schema-Eingriff,
  `tina-lock.json` unverändert, **kein** Tina-Cloud-Re-index nötig.
- **3A (Zurück-Navigation):** (a) edit→Übersicht via Tinas nativer Breadcrumb; (b) CMS→Website
  neuer Seitenleisten-Menüpunkt „Zur Website" (Kategorie „Site") — ScreenPlugin
  (`tina/screens/BackToSiteScreen.tsx`) per `cmsCallback`+`cms.plugins.add` registriert
  (createScreen ist nicht öffentlich exportiert → Objekt `__type:'screen'` selbst gebaut),
  leitet sofort nach „/" weiter (Fallback-Link inkl. „neuer Tab").
- Dateien: `web/tina/config.ts`, `web/tina/screens/BackToSiteScreen.tsx` (neu). Offline-Build
  grün (29 Seiten). (B) in `IDEEN.md` §5 dokumentiert.
- Commit: 2cb01d9 (3B), 5276b22 (3A)

## 2026-06-05 — Sammel-Auftrag Teil 3C: Admin-Leiste auf der Website (B)
- `SiteAdminBar.astro` (Vorbild Sveltia `.ww-admin-bar`): fixe Leiste oben (Erdtöne/dunkel),
  „Als Admin angemeldet · CMS öffnen · Abmelden". Erscheint **nur**, wenn (1) Schalter
  „🎨 Darstellung → Admin-Leiste" an **und** (2) im Tina-CMS angemeldet (localStorage-Token-
  Erkennung, gleiche Origin). **Standard AUS.** Abmelden löscht Tina-Token + Reload.
- `show_admin_bar` in `appearance-settings` + Darstellung; BaseLayout rendert die Bar nur bei
  Schalter an; CSS schiebt Header/Body bei aktiver Bar nach unten. `tina-lock` regeneriert.
- (B) in `IDEEN.md` §5 dokumentiert. Lokaler Build grün (29 Seiten); Default-aus + Toggle-an verifiziert.

## 2026-06-04 — Sammel-Auftrag Teil 2-Folge: ABNAHME-Punkte A–D
- **A:** Fehlendes `IMG_5618.webp` raus — die Test-Galerie der Story „Utah-Drohne-Kevin" ganz
  entfernt (`gallery: []`), da das Live-Original keine Galerie hat (2 von 3 Bildern fehlten).
- **B:** Test-Station „Anchorage" (`ANC`) + untracked `IMG_5534.webp` (auch in Station-1-Fotos)
  aus `alaska2026.json` entfernt.
- **C:** **Stories-Seitentitel ins CMS** (Einheitlichkeit) — `stories-settings.json` + Tina
  „📖 Stories – Einstellungen" (Kicker/Titel/Einleitung DE/EN); `/stories`(+`/en`) liest sie
  (vorher fest verdrahtet).
- **D:** **Kontakt-Seite an-/abschaltbar** wie Stories — `show_contact` in 🎨 Darstellung;
  Kontakt-Link in Nav + Footer gated (Standard an). Formular-Versand (W5) bleibt später.
- `ABNAHME.md` entsprechend abgehakt. Lokaler Build grün (29 Seiten), keine Leftover.

## 2026-06-04 — Sammel-Auftrag Teil 1: Alaska-Titel 1:1 wie Live
- **Befund (Live-Wahrheit):** Live hängt KEIN Tab-Suffix an (`buildTripTabs` nimmt den Titel
  wörtlich); „· bald ✦" steht dort im Titel-**Text** (CMS). `upcoming` steuert live nur
  Aktuell/Entdecken. Unsere Astro-Seite hatte eine **(B)-Abweichung** (auto-Suffix in
  `TripsContent`) → zusammen mit „· soon" im migrierten Titel ergab das „Alaska 2026 · soon · bald ✦".
- **Fix (Nutzer wählte Option a = 1:1 Live):** Auto-Suffix-Zeile in `TripsContent.tsx` entfernt
  (Tab zeigt exakt den CMS-Titel); Alaska-Titel auf saubere Basis „Alaska 2026" gesetzt
  (Zusatz tippt der Nutzer selbst im CMS). `upcoming`-Flag bleibt (nur Aktuell/Entdecken, wie Live).
  Lokaler Voll-Build grün (29 Seiten); Tab = „Alaska 2026" DE+EN verifiziert.

## 2026-06-04 — CMS aufgeräumt (Test-Reste, Reihenfolge, Anzeigenamen)
- **A (`cec1ee1`):** Test-Reste raus — `proto_ort`-Collection, `album-proto.json`/`trip-proto.json`,
  `src/content/proto/`, Seiten `proto-karte`/`proto-lightbox`/`stilprobe`.
- **B (`ed66655`):** Collections in **Nav-Reihenfolge** (links→rechts = oben→unten): Startseite →
  Alben → Galerie-Einstellungen → Stories → Reisen → Reisen-Einstellungen → Equipment → Über uns →
  Kontakt → Highlights → Darstellung.
- **C (`eb663e8`):** **Anzeigenamen** in der CMS-Liste — Reise-`title` & Album-`name` von
  `{de,en}`-Objekt auf **String** (DE, `isTitle`/`required`) + `*_en` umgestellt → Tina zeigt jetzt
  den echten Reise-/Album-Namen als Label (Dateiname klein darunter) statt überall „🧭 Reisen"/
  Dateiname. Daten migriert (5 Reisen + 2 Alben); Helfer `albName()`/`tripTitle()`; alle Lese-Stellen
  umgestellt. `astro build` grün (29 Seiten, 3 Test-Seiten entfernt).
- ⚠️ **Schema geändert** → nach dem Push **astro-umbau auf Tina Cloud neu indexieren** (Re-Index).

## 2026-06-04 — Startseite Etappe 4: Social-Links (Startseite komplett)
- **`8ea67c2`:** Social-Links im Intro-Block (1:1 aus `renderHeroSocial`): `insta-row` mit
  Alexandra/David (`@a3_flow`/`@davidbastisch`). `socialUrl()` in `socialIcons.ts`. CMS:
  Social-Liste (Plattform + Username) im „🏠 Startseite"-Intro. CSS 1:1. `astro build` grün.
- **Startseite damit vollständig** (Hero + Intro + Momentaufnahmen + Aktuell + Entdecken + Social).
  Alle großen Sektionen portiert → als Nächstes **Cutover/Audit**. `index.html` unberührt.
- **Social-Platzierung (`75ffe57`):** Insta-Links jetzt wahlweise in **Intro / Hero / Footer**,
  je per CMS-Schalter („🏠 Startseite → Social-Links anzeigen — wo?"). Standard: nur Intro (wie Live).

## 2026-06-04 — Startseite Etappe 3: Home-Teaser + Intro (+ Bilder-Fixes)
- **Bilder online (zwei Fixes):** `copy-uploads.mjs` im Build (Wurzel-`/uploads` → `web/dist`)
  + `normalizePath` biegt Tina-Cloud-URLs (`assets.tina.io/<id>/<datei>`) zurück auf `/uploads/<datei>`
  (Query-getriebene Inseln zeigten sonst `?`). 2 echt fehlende Dateien bleiben (IMG_5534/IMG_5618).
- **Etappe 3 (`2b369bb`, Capability-Lock T1–T7):** `lib/home.ts` (buildMoments/Latest/Discover am
  Build aus Alben/Reisen/Stories + Highlights). `HomeIntro.astro` (Zwischenüberschrift + ✦ + Text),
  `HomeMoments.tsx` (bis 6, Klick → Lightbox, mischt beim Laden), `HomeLatest.astro` (Top-3 nach
  Datum), `HomeDiscover.tsx` (3 Teaser, mischt beim Laden). `index.astro`/`en` zeigen alle Sektionen.
  CMS: „⭐ Highlights" (`highlights.json`) + Intro/Sektion-Texte ins „🏠 Startseite". Teaser-CSS 1:1.
- **Zufall = Client-Shuffle** (lebendig, vom Nutzer gewünscht). `astro build` grün (32 Seiten).
- **Offen:** Abnahme; **Etappe 4 (Intro-Social-Row + Footer-Feinschliff)**. `index.html` unberührt.

## 2026-06-04 — Startseite Etappe 2: Hero + Deploy-Fix (Uploads)
- **Deploy-Fix (`<vor Hero>`):** `web/scripts/copy-uploads.mjs` im `build`-Script kopiert das
  Wurzel-`/uploads` nach `web/public/uploads` → Bilder landen im Astro-`dist` und werden auf
  Cloudflare ausgeliefert (vorher 404, weil der lokale Symlink gitignored ist). Lokal bleibt
  der Symlink.
- **Hero (`793bd10`, Capability-Lock H1–H8):** `HomeHero.astro` 1:1 aus `renderHero`/`.hero`:
  Medien-Umschalter (Einzelbild / Diashow 5 s Überblenden / Video autoplay+muted+playsinline +
  Poster), Hero-Logo (nur bei `show_hero_logo`), Headline (DE/EN), 2 CTAs (Portfolio + Stories-
  ghost nur bei `show_stories`), Scroll-Pfeil (bob), Rip-SVG, fadeUp-Animationen. `index.astro`
  + `en/index.astro` = echte Startseite; Stories-Liste → `/stories` (+`/en`). `home-settings.json`
  + Tina „🏠 Startseite" (Medien + Hero-Texte). CSS 1:1 in `global.css`. `astro build` grün (32 Seiten).
- **Profi-Politur (Nutzer „alles, aber CMS-schaltbar"):** 4 Schalter unter „🏠 Startseite →
  Politur" (Standard an, abschaltbar → 1:1): Ken-Burns-Zoom, stärkerer Verlauf, edle Fraunces-
  Headline, animierter Scroll-Cue; `prefers-reduced-motion` respektiert. Dokumentierte, gewünschte
  Abweichung vom Live-Stand.
- **Offen:** Abnahme; Etappe 3 Home-Teaser, Etappe 4 Intro/Social.

## 2026-06-04 — Startseite Etappe 1: Nav-Shell (Header/Footer/DE-EN)
- **Capability-Lock 0/A/B (`<dieser>`):** N1–N10 aus Live-`<header>/<footer>` extrahiert +
  eingefroren. Nutzer-Entscheid: Stories **ausgeblendet** (`show_stories=false`, CMS-schaltbar),
  Footer-Admin-Link **→ `/admin`**. Startseite wird in 4 Etappen gebaut (Nav-Shell → Hero →
  Teaser → Intro/Social).
- **Bau (`6a0a717`):** `SiteNav.astro` + `SiteFooter.astro` in `BaseLayout` (Slot jetzt in
  `<main>`). Sticky Header (Logo→Home, 7 Links, aktiver markiert), **DE/EN-Umschalter** →
  gleiche Seite in `/en` (echte Routen statt Live-`applyLang`-JS), Burger-Slide-in (mobil).
  Footer (Logo + 7 Links + Copyright + Admin→`/admin`). `appearance-settings.json` migriert
  (logo/show_hero_logo/show_discover/show_stories) + Tina „🎨 Darstellung". Nav/Footer-CSS 1:1.
- **In-Page-Edit-Stifte bewusst NICHT portiert** (Tina-Visual-Editing ersetzt sie).
- **Capability-Lock D:** N1–N10 ✅ (aktiv/DE-EN/Stories-versteckt im HTML verifiziert).
  `astro build` grün (30 Seiten). `/` zeigt noch die Stories-Liste (Home-Inhalt folgt Etappe 2/3).
- **Offen:** Abnahme; Hero/Teaser/Intro+Social. `index.html` unberührt.

## 2026-06-04 — Galerie/Alben portiert (Stufe 6, 🔴 letzter großer Brocken)
- **Capability-Lock 0/A/B (`9c1e178`, `4418426`):** Soll-Liste **A1–A17** aus echtem Live-Code
  extrahiert + eingefroren; URL **`/portfolio`**; Home-Teaser (Momentaufnahmen/Neueste/Entdecken)
  bewusst der **Startseite** zugeordnet (vorab analysiert, in `CAPABILITIES.md` festgehalten).
- **Daten/CMS (`a689726`):** 2 Alben → `src/data/albums` ({de,en}, `photos` flach),
  `gallery-settings.json`. `lib/albums.ts` (paletteFromString 6 Paletten, albumPhotos, sortAlbums
  = build-indexes.js-Logik, linkedAlbumsByTrip). Tina: Collections **🖼️ Alben** + **🖼️ Galerie –
  Einstellungen** (je ein Menüpunkt). `tina-lock.json` aktualisiert.
- **Bau (`450e8cf`):** `GalleryContent.tsx` (useTina/albenConnection): Modus-Leiste +
  Sichtbarkeit, Album-Karten mit **Auto-Diashow** (Snap-Bahn, Autoplay 4 s, ‹/›-Pfeile,
  Klick→Lightbox), **Flach-Modi** (Neueste/A–Z), Kacheln (Platzhalter + Hover-Name), Lightbox.
  `AlbumContent.tsx` (Album-Unterseite). Seiten `/portfolio` (+`/en`) + `/portfolio/<slug>`
  (+`/en`), Router → Live-Vorschau. Galerie/Album-CSS 1:1 in `global.css` (toter In-Place-Toggle
  weggelassen). **A15** Reise→Album-Link → `/portfolio/<slug>` (⚠️ statt ganze Galerie wie Live —
  passt zum Link-Text, bewusste Verbesserung).
- **Capability-Lock D:** A1–A17 ✅ (A3/A15 ⚠️ dokumentiert). `astro build` grün (**30 Seiten**).
- **Offen:** Seite-an-Seite-Abnahme durch Nutzer; Startseiten-Teaser (Momentaufnahmen/Neueste/
  Entdecken) + Highlights-CMS = nächste Sektion. `index.html` unberührt.

## 2026-06-04 — Reisen: Live-Vorschau (Visual Editing) + Karte live
- **Router bei Reisen wieder aktiv** (vorher entfernt, weil ohne `useTina` „nothing
  to edit"): `reisen`-Collection → `/trips?trip=<slug>`. `tina/config.ts`. Commit folgt unten.
- **`/trips` + `/en/trips` auf `reisenConnection`** (Tina-Client) statt `import.meta.glob`
  umgestellt → Daten kommen live über `useTina`. `TripsContent.tsx`: leitet Reisen aus der
  Connection ab (sortiert), Tab-Vorauswahl per `?trip=` (im Effect → kein Hydration-Mismatch),
  `data-tina-field` auf Tabs/Meta/Summary/Stationen (Titel/Datum/Text/Foto)/Galerie →
  Klick auf der Seite springt zum Feld + Live-Update beim Tippen. Commit `e2048c9`.
- **Karte live:** zweiter Effekt zeichnet Marker neu, sobald sich karten-relevante
  Stop-Daten ändern (Ortssuche/Titel/Datum/Name, per Signatur erkannt) — ohne Bahn/aktive
  Station/Viewport zurückzusetzen. Commit `96a3e67`.
- **Tab- & Station-Sync (`87f4be5`, ersetzt durch `99be405`):** Erst über `?trip=`-Query +
  Polling — verworfen, weil **Tina Query-Strings im Router ignoriert** (Vorschau hing auf
  Tab 0). **Finale Lösung (`99be405`):** echte **Pfad-Route `/trips/<slug>`**
  (`src/pages/trips/[slug].astro`, `getStaticPaths` über `reisenConnection`); Router der
  `reisen`-Collection → `/trips/<slug>`. Tab kommt aus `initialSlug`-Prop (Hydration-sicher)
  → die im CMS gewählte Reise wird zuverlässig angezeigt. **Station-Sync:** `.trip-slide`
  trägt jetzt das **Item**-`data-tina-field` → Scrollen öffnet die **GANZE Station**
  (Titel/Datum/Text/Bilder), nicht nur das Titel-Unterfeld; debounced 200 ms, nur im
  Vorschau-Iframe. Öffentliche `/trips` unverändert (Tab 0, kein Sync).
- **Bekannt/Hosting (kein Code-Bug):** Frisch hochgeladene Bilder erscheinen in der
  **Online**-Vorschau erst nach Save+Deploy (repo-basierte Git-Medien, statisches Hosting);
  **lokal** (`npm run dev`) sofort sichtbar. Text/Karte sind überall live.
- **Gemerkt für später (Feinschliff):** Stations-Durchscrollen/Snap im schmalen
  Vorschau-Iframe muss noch geradegezogen werden.
- Inhaltliche CMS-Test-Edits des Nutzers (`alaska2026.json`: Foto + Station „Anchorage";
  `contact.json`) bewusst NICHT in diese Commits genommen — gehören dem Nutzer.
- `index.html` unberührt.

## 2026-06-04 — Reisen portiert (Stufe 5, 🔴🔴 größter Brocken)
- **5a (Gerüst, Besucher-Teil vom Nutzer abgenommen):** 5 Reisen migriert
  (`content/trips` → `web/src/data/trips`, sauberes `{de,en}`-Schema). `TripsContent.tsx`
  (Insel aus abgenommenem Prototyp ausgebaut): Reise-Tabs, Reise-Kopf, **MapLibre-Karte**
  (Marker/flyTo/fitBounds/Sprach-Labels/5-Stil-fähig), **Stationen-Snap-Bahn** + Observer +
  Pfeile (entkoppelt), volle Stations-Karten (Titelbild/Text/Fotos→**Lightbox**/Video/YouTube),
  Stop-Liste, „Reisefazit". `lib/trips.ts`. Seiten `/trips` + `/en/trips`. CSS 1:1 + Mobile.
  Commit `5796989`.
- **Fix:** Lightbox-CSS war nur in `proto-lightbox.astro` → auf `/trips` kein Overlay sichtbar,
  aber Body-Scroll gesperrt. Block **1:1 nach `global.css`** verschoben (global für Reisen/
  Galerie/Stories). Commit `d474bd4`.
- **5b (Tina-Anbindung):** Collection „🧭 Reisen" (jede Reise editierbar/anlegbar): order,
  Bilingual-Felder + Englisch-Schalter, `stops[]` mit **Ortssuche-Feld (Nominatim)** +
  Auto-WebP-Upload (Titelbild + weitere Fotos) + Video/YouTube, „Reisefazit"-Galerie. +
  „🧭 Reisen – Einstellungen" (Seitentexte + Karten-Stil-Select). Router → `/trips`. Commit `4dbf7b5`.
- **Offen:** verknüpftes Album (greift ab Galerie); ggf. In-Editor-Live-Vorschau später.
  `index.html` unberührt.

## 2026-06-04 — Kontakt 1:1 portiert (Stufe 4, konsolidiert + Live-Vorschau)
- Sektion 4 gebaut: `/contact` + `/en/contact` (`#page-contact`), `ContactContent.tsx`
  (`useTina` + `tinaField`). Kanal-Liste mit **Auto-Icon** (`socialIcons.ts`, 10 Typen)
  + Standort-Zeile. **Formular = Vorschau** (prüft Felder → Alert, Erfolgs-Meldung,
  leert; versendet nichts — 1:1 wie Live).
- CSS `contact-grid`/`form-field`/`form-success`/`.btn.dark` 1:1; Mobile 1-spaltig.
- **EIN** Tina-Eintrag „✉️ Kontakt" (Englisch-Schalter, auto-Felder, Kanal-Typ-Dropdown),
  Router → `/contact`. Capability-Lock D: 12/12 ✅. Lokal verifiziert. `index.html` unberührt.
- **Offen / eigener Schritt:** echtes Formular-Versenden (Dienst + Datenschutz, „W5").
- Commit: `2980036`

## 2026-06-04 — Über uns CMS: auto-wachsende Felder + globaler Englisch-Schalter
- Felder wachsen mit dem Text (auto-resize); Klapp-Konstrukt entfernt (behebt zu
  kleine Felder + nicht-scrollbares „Nirvana"). Neuer Apple-Schalter oben
  (`EnglishToggle`/`englishStore`): Standard NUR Deutsch; an → englische Felder
  global. Reiner Editor-Schalter (schreibt nichts in den Inhalt). Besucher-Seite
  1:1. Commit: `f948196`

## 2026-06-04 — Über uns CMS: DE/EN-Felder als inline aufklappbare Dropdowns
- Auf Nutzer-Wunsch: DE/EN-Felder klappen jetzt **inline auf** (Dropdown) statt eine
  Tina-**Unterseite** zu öffnen. Neues `BilingualField`/`BilingualTextField`
  (`ui.component` am object-Feld) — angewandt auf kicker/title/intro + persons.role/
  bio/gear. „why" flach zu `why_title`/`why_text` (je inline). Personen-Panel
  (Unterseite pro Person) bleibt wie gewünscht. **Besucher-Seite 1:1 unverändert.**
- Commit: `92b842a`

## 2026-06-04 — Über uns: Personen als aufklappbare Tina-Liste (Editier-Komfort)
- Auf Nutzer-Wunsch: Person 1/2 von zwei Einzel-Objekten zu **einer Liste „Personen"**
  zusammengefasst → im Tina-Editor **zwei zuklappbare Einträge** (Name als Titel) statt
  vieler Unterpunkte. **Besucher-Seite 1:1 unverändert** (Eintrag 1=links/desert,
  2=rechts/coast). `about.json` persons-Array; `AboutContent` liest `about.persons[idx]`.
- Commit: `d224cf4`

## 2026-06-04 — Über uns 1:1 portiert (Stufe 3, konsolidiert + Live-Vorschau)
- Sektion 3 gebaut: `/about` + `/en/about` (Wrapper `#page-about`), `AboutContent.tsx`
  (React-Insel, `useTina` + `tinaField` — auch verschachtelt `person1.name`).
- Daten `src/data/about.json` (verschachtelt: Kopf + 2 Personen + „Warum die USA?").
- CSS `.about-band`/`.person`/`.divider-orn`/`.home-intro` 1:1 in `global.css`,
  Mobile 1-spaltig; Foto-Fallback-Illustration (desert/coast) mit Original-Farben.
- **EIN** Tina-Eintrag „📄 Über uns" (Leitprinzip): Kopf, je Person Name (jetzt
  editierbar)/Rolle/Bio/Gear-Zeile/Foto, „Warum die USA?"; Router → `/about`.
- **Neues `SinglePhotoField`** (Einzelfoto, Auto-WebP); WebP-Logik in geteiltes
  `webpEncode.ts` ausgelagert → `BulkPhotoField` nutzt sie identisch weiter.
- Capability-Lock D: 12/12 ✅ (1× ⚠️ Foto-Fallback ohne Namens-Overlay, da Fotos da).
  Lokal verifiziert (`npm run dev`). `index.html` unberührt. Commit: `323b5b3`.

## 2026-06-03 — Gear: zwei CMS-Einträge zusammengelegt + Live-Vorschau
- Auf Nutzer-Wunsch: die zwei Gear-Menüpunkte (Liste + Seitentext) zu **einem**
  Eintrag „🎒 Equipment" zusammengeführt (`gear.json` enthält jetzt kicker/title/
  intro + items); `gear-text.json` + `GearList.astro` entfernt.
- **Tina-Live-Vorschau wie Stories**: `GearContent.tsx` (React-Insel, `useTina` +
  `tinaField`), Seiten holen Daten über den Tina-Client, Router → `/gear`.
- Lokal verifiziert (`npm run dev`): `/gear` + `/en/gear` rendern 1:1 mit
  `data-tina-field`. `tina-lock.json` neu generiert. `index.html` unberührt.
- Commit: `146d120`

## 2026-06-03 — Gear/Equipment 1:1 portiert (Stufe 2, Capability-Lock C+D)
- **Sektion 2 der Bau-Reihenfolge gebaut** (nach Stories). Live-Analyse (Schritt 0+A)
  → Nutzer bestätigt (B) → 1:1 nachgebaut (C) → Abhak-Vergleich (D): **21/21 ✅**,
  1× ⚠️ (Runtime-Fetch-Fallback entfällt — Astro backt Daten statisch ein).
- Neu: `src/data/gear.json` + `gear-text.json`, `src/lib/gear.ts` (`GEAR_CATS`/
  `groupGear`/`safeUrl`), `src/components/GearList.astro`, Seiten `/gear` + `/en/gear`;
  `.gear-*`-CSS 1:1 in `global.css`.
- Tina: Collections `gear` (**Kategorie = Dropdown**, 7 feste Werte, Hilfetexte C6/C7) +
  `gear_text` (DE/EN); `tina-lock.json` neu generiert (lokaler Modus).
- Lokal verifiziert: `/en/gear` rendert 1:1 (Reihenfolge, Link-vs-kein-Link, Escaping).
- `index.html` unberührt. Commit: `efb565e`. **Offen:** Nutzer-Abnahme (Seite-an-Seite).

## 2026-06-03 — Astro+Tina LIVE: erster grüner Deploy auf Cloudflare (Schritt 6 ✅)
- **Vorschau online:** `https://aandd-photography-astro.pages.dev` (eigenes Pages-
  Projekt, Branch `astro-umbau`; `main`/Live-Seite unberührt). Build grün:
  `tinacms build` → `astro build` (11 Seiten, Stories DE/EN), 63 Dateien deployed.
- **Cloudflare-Build-Hürden gelöst (langer Debug):**
  - `tinacms build` läuft auf Cloudflare als **pkg-Binary**, die Custom-Env beim
    Config-Laden nicht zuverlässig sieht → **clientId/branch fest verdrahtet**
    (öffentlich, kein Secret), Token weiter nur aus `TINA_TOKEN`. (`0a34462`)
  - **Build-Variablen** gehören in Cloudflare in den **Build**-Topf (nicht Runtime/
    Bindings), Typ **Plaintext**; `NODE_VERSION=22`.
  - **`tina/tina-lock.json` committet** (war gitignored) — Tina Cloud liest daraus
    das Schema. (`56cd720`) + Whitespace-Touch zum Re-Index. (`d3a8b2c`)
  - **Tina Cloud: „Path To Tina Folder = web"** (Monorepo-Unterordner) + Branch
    `astro-umbau` aktiv **indexiert** (grüner Haken) — sonst „Branch not on TinaCloud".
- Offen (Nutzer): `/admin`-Login live testen (Site-URL der Pages-Domain in Tina
  Cloud ergänzen), Edit-Test, iPad-Test (Alexandra).
- Commits: `0a34462`, `56cd720`, `d3a8b2c` (+ Sammel-Push `cac8b48` mit Inhalten/
  Uploads vom Nutzer)

## 2026-06-03 — Tina-Cloud-Anbindung via ENV vorbereitet (Schritt 6, Teil A)
- Vorab geprüft: Tina-Cloud-Free-Limits offiziell (tina.io/pricing + Repo-Media-Doku)
  → 2 Nutzer, unbegrenzte Dokumente, repo-basierte Bilder fallen NICHT unter das
  100-MB-Asset-Cap → dauerhaft gratis für 2 Personen. Dokumentiert in `SETUP-TinaCloud.md`.
- `web/tina/config.ts`: clientId/token/branch jetzt aus `process.env`
  (`TINA_CLIENT_ID`/`TINA_TOKEN`/`TINA_BRANCH`); ohne gesetzte Werte automatischer
  Rückfall in den lokalen Modus (Mac-dev bleibt nutzbar).
- `web/.env.example`: Vorlage nur mit Variablen-NAMEN (keine Werte).
- `web/.gitignore`: `.env`/`.env.*` gesperrt (nur `.env.example` getrackt) → keine
  Secrets im Repo. Konto/Tokens/Deploy macht David selbst.
- Betroffen: `web/tina/config.ts`, `web/.env.example`, `web/.gitignore`
- Commit: `06ba334` (SETUP-Doku vorab: `93a9a27`)

## 2026-06-02 22:40 — WebP auf jedem Browser via jSquash (Foto-Upload-Feld)
- Nach der neuen Regel zuerst Live-Wahrheit geprüft: Sveltia macht WebP auf Safari
  via **jSquash**; `admin/config.yml` = webp/Q85/Breite 2400. 1:1 nachgebaut.
- jSquash (@jsquash/webp) als primärer Encoder → WebP in jedem Browser inkl. Safari.
  WASM per `locateFile` vom CDN (unpkg) geladen (im Tina-Bundle 404te sie). Fallback:
  natives canvas-WebP → JPEG. Mount-Selbsttest; im Editor verifiziert.
- Betroffen: `web/tina/fields/BulkPhotoField.tsx`, `web/package.json` (+@jsquash/webp)
- Commit: `ebea477`

## 2026-06-02 22:10 — Regel „Live-Wahrheit zuerst" verankert (nur Doku)
- Neue verbindliche Regel: vor jedem Neubau UND vor jeder Machbarkeits-Aussage
  zuerst die echte Live-Umsetzung prüfen (Funktion + Inhalt; inkl. wie Sveltia es
  löst); nie aus Allgemeinwissen „geht nicht" behaupten. Anlass: falsche Behauptung
  „WebP geht in Safari nicht" (Sveltia macht es längst via jSquash).
- Verankert: eigener Abschnitt in `CLAUDE.md` + als Vorstufe **Schritt 0** im
  Capability-Lock (vor A). Kurzverweise in `CAPABILITIES.md` + `STATUS.md`.
- Betroffen: `CLAUDE.md`, `CAPABILITIES.md` (`3df0065`); `STATUS.md`, `CHANGELOG.md`
  (dieser Doku-Commit)

## 2026-06-02 20:00–22:00 — Stufe-1 Foto-Upload-Feld (Bulk + WebP/JPEG, dnd-kit)
- Eigenes Tina-Galerie-Feld `web/tina/fields/BulkPhotoField.tsx`: Mehrfach-Upload
  (Button / Drag-Ablage / ganzer Ordner), Auto-Verkleinern auf 2400px, Konvertierung
  (WebP, sonst JPEG-Fallback — Safari kann kein natives canvas-WebP), git-basiert
  nach `/uploads` (directory:'' aus Store-Quellcode verifiziert), apple-like
  Sortierung via @dnd-kit. WebP-Reduktion empirisch verifiziert (−91 %).
- Offen/freigegeben: jSquash (WASM) für WebP auf jedem Browser (wie Sveltia).
- Betroffen: `web/tina/**`, `web/package.json` (+@dnd-kit), `web/src/styles/global.css`
- Commits: `abdde39`, `e3eb729`, `511d300`, `e682811`

## 2026-06-02 19:30–20:00 — Stufe-1 Schritte 1–5: Stories auf Astro + TinaCMS
- **Schritt 1:** Astro-Grundgerüst in `web/` (Astro 4 + React, i18n DE=/ EN=/en/).
- **Schritt 2:** Design-System aus `index.html` 1:1 nach `web/src/styles/global.css`.
- **Schritt 3:** 3 Stories migriert (Option A: `body_de/body_en` im Frontmatter);
  utah aufgeräumt (Test-Text raus, langer Body als Haupttext).
- **Schritt 4:** Content-Collection + Liste/Reader, 1:1-`mdToHtml`-Port, Mountains-
  Illustration (ILLUS byte-identisch); vom Nutzer freigegeben (Design + DE/EN).
- **Schritt 5:** TinaCMS lokal angebunden (Live-Vorschau, kleine React-Insel,
  `gallery`-Feld). CAPABILITIES.md: Stories-Sektion + Schritt-4-Freigabe.
- Betroffen: `web/**` (neu), `CAPABILITIES.md`
- Commits: `b12c9f2`, `609b0df`, `17267e9`, `4da438a`, `3591a51`, `4558c39`,
  `d31f650`, `75a7e2f`

## 2026-06-02 19:23 — Capability-Lock-Verfahren verankert + Umbau-Branch gestartet
- Branch `astro-umbau` von `main` angelegt (Stufe-1-Umbau: Stories auf Astro+Tina;
  `main` bleibt unangetastet/live). Schritt 0 des Bauplans (Branch + Bestandsaufnahme,
  3 Stories, Feld-Inkonsistenzen erfasst) — kein Code, nur Branch + Analyse.
- Verbindliches **Capability-Lock**-Verfahren (4 Schritte: Extrahieren → Bestätigen →
  Bauen → Abhak-Vergleich) in `CLAUDE.md` verankert; `CAPABILITIES.md` neu angelegt
  (Kopf, Status-Legende, Funktions-Warteschlange, Sektions-Vorlage). Noch keine
  Funktion extrahiert.
- Betroffen: `CLAUDE.md`, `CAPABILITIES.md` (neu)
- Commit: `cfd7a69`  (Branch `astro-umbau`, nicht `main`)

## 2026-06-02 16:29 — Astro + TinaCMS Stories-Prototyp (isoliert)
- Eigenständiger Evaluierungs-Prototyp (Astro + React + TinaCMS lokal), **nur** Stories,
  zum Erleben von Live-Vorschau + Drag-&-Drop. Berührt die Live-Seite nicht.
- Betroffen: `prototype-astro/**` (neu)
- Commit: `9fbd78a`

## 2026-06-01 21:02–21:06 — CMS-Vereinfachung (Minimalismus) + Multi-Bild-Upload
- Foto-Listen auf `multiple:true`-Image-Widget (mehrere Bilder auf einmal/Drag&Drop);
  Karten-Feld der Station nach unten + Label/Hint gekürzt; Video-Hint präzisiert;
  `album_hint`-Pseudofeld entfernt, wortreiche Hints/Descriptions gekürzt.
- Betroffen: `admin/config.yml`
- Commit: `de2d591`, `63210d2`, `3bd5585`, `7236fb7`

## 2026-06-01 20:44–20:50 — Performance: Lazy-Loading + Bild-Cleanup
- `loading="lazy"` für restliche Below-the-fold-Bilder (Story-Body, Footer-Logo,
  About-Foto); 2 verwaiste Legacy-Monster-JPGs entfernt (~13,8 MB).
- Betroffen: `index.html`, `uploads/img_6111.jpg` + `uploads/a7406508.jpg` (gelöscht)
- Commit: `9091619`, `ed69c63`

## 2026-06-01 20:06–20:28 — Video + YouTube (Stationen & Stories) + Querformat-Lightbox
- CMS-Felder `video` + `youtube_url` für Stops/Stories; Frontend: Video-Loop +
  YouTube-Embed (nocookie); `@media (orientation:landscape)`-Layout für die Lightbox.
- Betroffen: `admin/config.yml`, `index.html`
- Commit: `ff3a9da`, `d1aee01`, `bb4734c`

## 2026-06-01 19:57 — Base64-Logos entfernt (~720 KB)
- Drei inline Base64-PNG-Logos durch transparenten Platzhalter ersetzt; Logo kommt zur
  Laufzeit aus dem CMS (`applyBranding`). `index.html` 1.0M → ~303K.
- Betroffen: `index.html`
- Commit: `f91fd33`

## 2026-06-01 19:31–19:44 — Mobile Reise-Tabs: Zentrierung, Scrollbar, Cleanup
- Aktiven Tab zuverlässig zentrieren (iOS), `justify-content:flex-start` (erster Tab
  erreichbar), smooth Scroll beim Klick, Scrollbar-Kontrast; toten `attachSwipe` entfernt.
- Betroffen: `index.html`
- Commit: `4f46f5b`, `dd643da`, `f839700`, `6c04bcc`

## 2026-05-31 20:38–23:24 — Lightbox-Filmstreifen (Desktop), Expand-Symbol, Marker
- Filmstreifen auf Desktop scrollbar (Flex-Spacer statt Padding), flüssiges Wandern wie
  iPhone-Mediathek, Trackpad nativ + entprellt; Lightbox-Marker mobil zentriert;
  Expand-Symbol auf Stations-/Galerie-/Album-Bildern; Lupen-Cursor → Hand;
  CMS „Zur Website"-Action-Button.
- Betroffen: `index.html`, `admin/index.html`
- Commit: `6781467`, `2ec6c95`, `cd98d25`, `9fa58ad`, `82e952f`, `7aa5ac8`, `42f34d6`,
  `e07ed35`, `e6c14a6`, `fb3468f`

> Zwischendrin liegen CMS-Inhalts-Saves von David (z. B. `7255ae4`, `59db11b`, `4b58f87`
> „Update Einstellungen/Reise") und Merge-Commits — keine Code-Änderungen, hier ausgelassen.
