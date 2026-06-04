# STATUS.md — Aktueller Projektstand

> **Stand: 2026-06-04** · letzter Commit `793bd10` (Branch `astro-umbau`) ·
> Diese Datei wird bei jeder Session **überschrieben** (Momentaufnahme, nie
> veraltet). Historie → `CHANGELOG.md`.
>
> ⚙️ **Aktiver Umbau:** Branch `astro-umbau` (Stufe 1 = Stories auf Astro+Tina,
> in `web/`). `main` bleibt unangetastet/live. Verbindlich beim Umbau:
> **Capability-Lock** + Vorstufe **„Live-Wahrheit zuerst"** (erst echten
> Live-Code prüfen, nie aus Allgemeinwissen „geht nicht" behaupten) — beides in
> `CLAUDE.md`; je eine Funktion in `CAPABILITIES.md`.
>
> 📍 **Gerade:** Deploy/Backend steht (Tina Cloud Free, live auf
> `https://aandd-photography-astro.pages.dev`, `main` unberührt). Portiert:
> **Stories ✅, Gear ✅, Über uns ✅, Kontakt ✅** (abgenommen), **Reisen ✅** (gebaut,
> editierbar, Live-Vorschau; „passt erstmal"), **Galerie/Alben ✅ abgenommen**. **Startseite
> in Arbeit** (4 Etappen): **1 Nav-Shell ✅ gebaut** (Header/Menü/Footer/DE-EN/Burger in
> BaseLayout); **2 Hero ✅ gebaut** (Bild/Slideshow/Video, Logo, Headline, CTAs, Rip-Kante;
> `/` ist jetzt der Hero, Stories-Liste → `/stories`); **3 Home-Teaser ← als Nächstes**
> (Momentaufnahmen/Neueste/Entdecken + Highlights-CMS), 4 Intro/Social. Offen separat:
> Kontaktformular-Senden (W5), Reisen-Vorschau-Feinschliff.

---

## 1. Architektur (Ist-Zustand)
- **Single-File-Frontend:** `index.html`, **~4338 Zeilen** — alles inline:
  - **CSS:** ~883 Zeilen (1 `<style>`-Block, Design-System per `:root`-Tokens)
  - **JS:** ~3097 Zeilen (2 `<script>`-Blöcke, ~123 Funktionen)
  - **HTML-Markup:** ~358 Zeilen
  - **Keine** ausgelagerten lokalen `.js`/`.css`, kein Bundler.
- **Externe Abhängigkeiten (Versionen):**
  | Abhängigkeit | Version | Quelle |
  |---|---|---|
  | MapLibre GL | **5.21.0** | unpkg (JS + CSS) |
  | Sveltia CMS | **0.164.2** (gepinnt) | unpkg, in `/admin` |
  | Google Fonts | Fraunces + Mulish | fonts.googleapis.com |
  | OAuth-Backend | — | eigener Cloudflare-Worker |
- **Build:** `build-indexes.js` (Node-Standard, kein npm) erzeugt beim Cloudflare-Deploy
  `content/albums-index.json`, `content/trips-index.json`, `content/stories-index.json`
  (werden **nicht** committet).
- **Hosting:** Cloudflare Pages, `_headers` steuert Caching (`/content/*` no-store,
  `/index.html` no-cache, `/uploads/*` 1 h public).

## 2. Inhalts-Struktur (`content/`)
- **Alben** `albums/*.json`: `name_de, date, note_de, photos[] (flaches String-Array),
  linked_trip, pin{highlight,highlight_order}, english{enabled,name_en,note_en}`
- **Reisen** `trips/*.json`: `title_de, date, meta_de, summary_de, upcoming, stops[],
  english{…}`. **Stop:** `location (GeoJSON-Point-String), name, title_de, text_de,
  date_de, photo, photos[] (String-Array), video, youtube_url, lat, lon, *_en`
- **Stories** `stories/*.md`: **Frontmatter** (`title_de, category_de, date, cover,
  excerpt_de, body_de?, youtube_url, has_english, *_en`) + Markdown-Body.
  ⚠️ Body uneinheitlich gespeichert (mal `body_de` im Frontmatter, mal Markdown-Body).
- **Gear** `gear.json`: `items[]{name, brand, category, link}`
- **Settings/Texte:** `home.json`, `home-texts.json`, `home-intro.json`,
  `appearance-settings.json`, `gallery-settings.json`, `stories-settings.json`,
  `trips-settings.json`, `about.json`, `contact.json`, `text-*.json`
- **Bilder:** `/uploads/` im Repo, per absolutem Pfad referenziert. Sveltia konvertiert
  Uploads automatisch zu **WebP @2400px @Q85** (Alt-Bestand teils noch große JPGs).

## 3. Funktions-Inventur (Kopplung: 🔴 hoch · 🟡 mittel · 🟢 niedrig)
**Portfolio/Galerie**
- 🟡 Galerie mit Alben + 3 Sortiermodi (Alben/Neueste/A–Z) — `renderGallery`, `setGalleryMode`
- 🔴 Album aus-/einklappen + Auto-Diashow mit Pfeilen — `makeAlbumSlideshow`, `scrollToCell`
- 🟡 Portfolio dynamisch aus Alben — `rebuildPortfolioFromAlbums`

**Lightbox (Herzstück)**
- 🔴 Einzelbild + blätterbare Galerie — `openLightbox`, `openLightboxGallery`
- 🔴 Filmstreifen unten, zentrierter Marker, Snap, Wheel/Trackpad/Touch — `buildFilmstrip`,
  `lbCenterStrip`, `lbScrollToIndex` (mühsam debuggt — empfindlich!)
- 🔴 Blätter-Pfeile, Umlauf-Option, Expand-Symbol-Affordanz

**Reisen**
- 🔴 Stationen als horizontale Snap-Bahn + IntersectionObserver — `renderStops`, `buildStopHTML`
- 🔴🔴 **MapLibre-Karte**: Marker, `flyTo`, 5 Stile, custom Projektionen
  (`projectUSA`/`projectAlaska`), Sprach-Labels — `wwDrawTrip`, `wwSetMapLanguage`
- 🟡 Reise-Tabs (zentrierend, mobil scrollbar), Reise-Portfolio/„Reisefazit", verknüpftes Album
- 🟡 Station: Titelbild, weitere Bilder, **Video-Loop**, **YouTube-Embed**

**Stories** — 🟡 Liste + Reader, eigener Markdown-Parser (`mdToHtml`), Cover, YouTube-Embed,
Bilder als Lightbox-Gruppe, DE/EN — `renderStory`, `buildStory`

**Startseite** — 🟡 Hero-Umschalter Bild/Slideshow/Video (`renderHero`), „Aktuell"
(`renderLatest`), „Entdecken" (`renderDiscover`), „Momentaufnahmen"/zufällige Highlights
(`renderRandomMoments`), Intro-Block, Social-Links

**Equipment** — 🟢 Gear-Liste nach Kategorien + Links — `renderGear`

**Querschnitt**
- 🔴 DE/EN-Zweisprachigkeit überall (`pickEN`/`pickField`/`applyLang`)
- 🔴 **In-Page-Admin-Overlay**: Edit-Stifte auf der Live-Seite → springen in CMS-Felder,
  Admin-Karten-Stil-Vorschau, Login/Logout — `wwInjectToolbars`, `wwEnterAdmin`,
  `wwApplyAdminMode`, `wwAdminMapPanel` (~69 Kopplungsstellen)
- 🟡 Logo-Steuerung (Nav/Hero/Footer aus CMS, `applyBranding`), Sichtbarkeits-Schalter
- 🔴 Wisch-/Trackpad-/Wheel-Gesten (Lightbox + Stationen, nativer Scroll-Snap)
- 🟡 Kontaktformular (`handleSend`)

## 4. Bekannte Eigenheiten / Fallen
- **`gallery-settings.json` alle drei `false` → Fallback „Alben".** Mindestens ein
  Sortiermodus sollte an sein.
- **Sveltia-Version gepinnt (0.164.2).** Nicht blind hochziehen ohne Test.
- **Sveltia komprimiert NUR Raster-Bilder (→WebP) + SVG — KEINE Videos.** Videos müssen
  vor dem Upload lokal komprimiert werden (QuickTime/HandBrake/CapCut) oder via YouTube.
- **`registerPreviewTemplate` ist in Sveltia noch NICHT implementiert** → die im
  `admin/index.html` vorbereiteten Story/Equipment-Preview-Templates sind **inaktiv**;
  sie leuchten automatisch auf, sobald Sveltia das Feature liefert. Aktuell: keine echte
  Live-Vorschau im CMS.
- **`.pages.dev` ohne eigene Domain** → Cloudflare Image Transformations / `srcset` nicht
  nutzbar (blockiert die saubere responsive-Bild-Lösung).
- **Cloudflare-Cache:** nach Deploy Hard-Reload (Strg/Cmd+F5); `_headers` regelt TTLs.
- **MapLibre/OpenFreeMap:** Kartenstile (liberty/positron/bright/fiord/dark) von OpenFreeMap;
  custom Projektionen für USA/Alaska im Code.
- **Mobile Trip-Tabs:** brauchten `justify-content:flex-start` (sonst erster Tab im
  Scroll-Container unerreichbar) — nicht versehentlich auf `center` zurückdrehen.
- **`<img>` kann kein `::after`** → Expand-Symbol braucht `.zoom-hint`-Span-Wrap.
- **Lokaler `origin/main`-Stand kann veralten** (David pusht via GitHub Desktop) →
  Push-Status im Zweifel per `curl` gegen die Live-Seite prüfen, nicht blind `git rev-list`.

## 5. Offene Punkte / Restposten
- **Umbau Stufe 1 (Stories → Astro+Tina) in `web/`:** Schritte 0–5 **erledigt &
  freigegeben** — Grundgerüst, Design-System, Inhalte migriert (Option A:
  `body_de/body_en` im Frontmatter), Liste + Reader (1:1-`mdToHtml`-Port,
  Mountains-Illustration), Tina lokal angebunden (Live-Vorschau, kleine
  React-Insel). DE/EN vom Nutzer geprüft. Stories-Sektion in `CAPABILITIES.md`
  als „Schritt 4 freigegeben" dokumentiert.
- **Eigenes Tina-Galerie-Feld** (`web/tina/fields/BulkPhotoField.tsx`): Mehrfach-
  Upload (Datei-Button / Drag-Ablage / ganzer Ordner), Auto-Verkleinern auf
  Breite ≤2400px @Q85 (exakt wie `admin/config.yml`), dnd-kit-Sortierung.
  **WebP via jSquash (WASM, WASM vom CDN/unpkg) → WebP auf JEDEM Browser inkl.
  Safari** (wie Sveltia); Fallback: natives canvas-WebP → JPEG (nie PNG). Im
  Editor verifiziert (Selbsttest „jSquash bereit"); **Safari-Praxistest durch
  Nutzer bestanden** (Fotos landen als `.webp`).
- **🔴-Brocken als isolierte Prototypen abgenommen** (alle vom Nutzer freigegeben):
  - **MapLibre-Karten-Insel + Stationen-Snap-Bahn** (`web/src/components/TripMapProto.tsx`),
    Test `/proto-karte` — Karte + Wischen auf Safari geprüft (Prüfpunkt „Karten-/
    Wisch-Timing identisch" in `CAPABILITIES.md`).
  - **Tina-Ortssuche-Feld (Nominatim)** (`web/tina/fields/LocationSearchField.tsx`) —
    speichert GeoJSON-Point-String wie Sveltias `widget:map`; vom Nutzer getestet.
  - **Lightbox + Filmstreifen** (`web/src/components/Lightbox.tsx`, Test `/proto-lightbox`)
    — Capability-Lock A–D, Safari-Abnahme „wie das Original". 29-Punkt-Soll-Liste
    in `CAPABILITIES.md` ✅.
- **Schritt 6 (Deploy/Backend) — ✅ STEHT (erster grüner Deploy):**
  **Vorschau live:** `https://aandd-photography-astro.pages.dev` (eigenes Pages-
  Projekt, Branch `astro-umbau`; `main`/Live-Seite unberührt). Build grün:
  `tinacms build` → `astro build` (11 Seiten), 63 Dateien deployed.
  - **Backend:** Tina Cloud **Free** (David + Alexandra = 2/2 Nutzer), repo-basierte
    Medien (nicht unter 100-MB-Cap) → dauerhaft gratis. Free-Limits in `SETUP-TinaCloud.md`.
  - **Cloudflare Pages** `aandd-photography-astro`: Root `web`, Build `npm run build`,
    Output `dist`, **Build-Variablen (Plaintext, Build-Topf!):** `TINA_CLIENT_ID`,
    `TINA_TOKEN` (geheim), `TINA_BRANCH`, `NODE_VERSION=22`.
  - **config.ts:** clientId/branch fest verdrahtet (öffentlich) — Cloudflare-`tinacms
    build` läuft als **pkg-Binary**, die Custom-Env beim Config-Laden nicht zuverlässig
    sieht; Token bleibt geheim aus `TINA_TOKEN`. (`0a34462`)
  - **`tina/tina-lock.json` committet** (Tina Cloud liest daraus das Schema). (`56cd720`)
  - **Tina Cloud Configuration:** „Path To Tina Folder = **web**" (Monorepo-Unterordner),
    Branch `astro-umbau` aktiv **indexiert** (grüner Haken). „separate content repo" = AUS.
  - **Offen (Nutzer-Test):** `/admin`-Login live — dafür die **Pages-URL noch in Tina
    Cloud „Site URLs" ergänzen**; dann Edit-Test + iPad-Test (Alexandra).
  ⚠️ Stolperfallen dokumentiert: Build-Variablen müssen in den **Build**-Topf (nicht
  Runtime/Bindings); Branch muss in Tina Cloud **indexiert** sein, sonst „Branch not
  on TinaCloud"; bei Unterordner zwingend „Path To Tina Folder".
- **Bestätigte Bau-Reihenfolge (nach Schritt 6):** Stories ✅ → Gear ✅ → Über uns ✅
  → Kontakt ✅ → Reisen ✅ → Galerie/Alben ✅ (abgenommen) → **Startseite (in Arbeit):
  1 Nav-Shell ✅ → 2 Hero ✅ → 3 Home-Teaser ← als Nächstes → 4 Intro/Social** → Cutover → Audit.
- **Startseite Etappe 2 (Hero) — gebaut (`793bd10`):** `HomeHero.astro` (Bild/Slideshow/Video-
  Umschalter, Logo, Headline DE/EN, 2 CTAs, Scroll-Pfeil, Rip-SVG). `index.astro`/`en/index.astro`
  = Startseite; Stories-Liste → `/stories`(+`/en`). `home-settings.json` + Tina „🏠 Startseite".
  Capability-Lock D: H1–H8 ✅. **Offen:** Abnahme + optionale Profi-Politur (Nutzer-Wahl).
- **Startseite Etappe 1 (Nav-Shell) — gebaut (`6a0a717`):** `SiteNav.astro` + `SiteFooter.astro`
  in `BaseLayout` (Slot in `<main>`): Sticky Header (Logo→Home, 7 Links, aktiver markiert,
  Stories-Link nur bei `show_stories`), DE/EN-Umschalter → gleiche Seite in `/en` (echte Routen),
  Burger (mobil). Footer (Logo + Links + Copyright + Admin→`/admin`). `appearance-settings.json`
  + Tina „🎨 Darstellung". CSS 1:1. Capability-Lock D: N1–N10 ✅. **Offen:** Abnahme.
- **Galerie/Alben (Stufe 6) — gebaut (`450e8cf`):**
  - **Seiten** `/portfolio` (+`/en`) + Album-Unterseite `/portfolio/<slug>` (+`/en`).
    `GalleryContent.tsx`: Modus-Leiste (Alben/Neueste/A–Z, Sichtbarkeit aus Einstellungen),
    Album-Karten mit Auto-Diashow (Snap/Autoplay 4 s/Pfeile/Klick→Lightbox), Flach-Modi,
    Kacheln (Platzhalter + Hover-Name). `AlbumContent.tsx`: Kicker/Name/Notiz + Kachel-Grid.
    `lib/albums.ts` (paletteFromString, sortAlbums = build-indexes.js, linkedAlbumsByTrip).
  - **CMS:** „🖼️ Alben" (Name/Notiz DE/EN, Datum, `linked_trip`, `pin{highlight,order}`,
    Fotos Auto-WebP) + „🖼️ Galerie – Einstellungen" (Texte + 3 Modus-Schalter). Router →
    `/portfolio/<slug>` (Live-Vorschau). Daten: 2 Alben migriert + `gallery-settings.json`.
  - **A15 Reise→Album-Link** verdrahtet: `linked_trip === Reise` → „Mehr Fotos im Album" →
    `/portfolio/<slug>` (⚠️ Album-Unterseite statt ganze Galerie wie Live — bewusst).
  - **Capability-Lock D:** A1–A17 ✅ (A3 Modus-Live-Switch + A15 Ziel ⚠️ dokumentiert).
    **Vom Nutzer abgenommen („PASST!", 2026-06-04).**
  - **Offen:** Highlights/Momentaufnahmen/Neueste/Entdecken = Startseite (Analyse in
    `CAPABILITIES.md` vorab erledigt).
- **Reisen (Stufe 5) — gebaut, editierbar, mit Live-Vorschau:**
  - **Besucher-Seite** `/trips` + `/en/trips` (`TripsContent.tsx`): Tabs, Karte (MapLibre,
    Marker/flyTo/fitBounds/Sprach-Labels), Stationen-Snap-Bahn + Pfeile, volle Stations-
    Karten (Titelbild/Text/Fotos→Lightbox/Video/YouTube), Stop-Liste, „Reisefazit". 5a vom
    Nutzer abgenommen.
  - **CMS:** EIN Hauptmenü „🧭 Reisen" (jede Reise editier-/anlegbar) + „🧭 Reisen –
    Einstellungen". Editieren bestätigt (Nutzer legte Test-Station „Anchorage" an).
  - **Live-Vorschau (`e2048c9`, `96a3e67`, `99be405`):** `/trips` zieht Daten via `useTina`
    (`reisenConnection`); `data-tina-field` auf Tabs/Meta/Summary/Stationen/Galerie
    (Klick→Feld, Text live). Karte zeichnet Marker bei Orts-/Titel-Edit live neu
    (Signatur-Guard, kein Sprung bei Fliesstext).
    **Richtige Reise:** Router → **Pfad-Route `/trips/<slug>`** (`src/pages/trips/[slug].astro`),
    Tab aus `initialSlug` — Query-Strings ignoriert Tina, daher Pfad. **Station folgt Scroll:**
    `.trip-slide` trägt das **Item**-`data-tina-field` → Scrollen öffnet die **ganze Station**
    (alle Felder) im Formular (debounced). Editor-Sync nur im Vorschau-Iframe; Live-Seite
    (`/trips`) unverändert, Tab 0, kein Sync.
  - **Bekannt / Hosting (kein Bug):** Frisch hochgeladene Bilder erscheinen **online**
    erst nach Save+Deploy (repo-basierte Git-Medien + statisches Hosting); **lokal**
    (`npm run dev`) sofort. Text/Karte überall live.
  - **Feinschliff für später (gemerkt):** Stations-Durchscrollen/Snap im schmalen
    Vorschau-Iframe noch geradeziehen. Optional (Nutzer-Entscheid offen): Stationen als
    Inline-Dropdown statt Tina-Standard-Unterpanel (großer Eigenbau).
  - **Capability-Lock D:** Besucher-Seite 5a abgenommen; Gesamt-Abnahme (Seite-an-Seite)
    steht noch aus, Nutzer aktuell „passt erstmal".
- **Kontakt (Stufe 4) gebaut** (`2980036`): `/contact` + `/en/contact`, `ContactContent.tsx`,
  `socialIcons.ts` (10 Kanal-Icons), Formular als **Vorschau** (kein echter Versand, 1:1).
  EIN Tina-Eintrag „✉️ Kontakt" (Englisch-Schalter, Kanal-Dropdown). Capability-Lock D:
  12/12 ✅. **Offen separat:** echtes Formular-Senden (Dienst + Datenschutz, „W5").
- **Über uns (Stufe 3) gebaut** (`323b5b3`): `/about` + `/en/about`, `AboutContent.tsx`
  (Live-Vorschau, verschachteltes `tinaField`), `about.json`, About-CSS 1:1. **EIN**
  Tina-Eintrag „📄 Über uns" (Namen editierbar). **Neues `SinglePhotoField`** (Einzelfoto
  Auto-WebP); WebP-Logik in `webpEncode.ts` ausgelagert (von BulkPhotoField mitgenutzt).
  Capability-Lock D: 12/12 ✅. **Offen:** Seite-an-Seite-Abnahme.
- **🧭 Leitprinzip CMS-Struktur (Nutzer-Vorgabe 2026-06-03, verbindlich):** Beim
  Portieren **jeder** Sektion die in Sveltia getrennten Collections (Seitentext +
  Inhalt + Settings) zu **EINEM** Tina-Menüpunkt je Sektion zusammenfassen — **keine**
  Vielzahl fast gleich benannter Reiter. Wo sinnvoll: Tina-Live-Vorschau (`useTina` +
  `tinaField` + Router) wie bei Stories/Gear. **Vorbild: Gear** (`146d120`). Gilt für
  Über uns, Kontakt, Reisen, Galerie, Startseite usw.
- **Gear (Stufe 2) gebaut** (`efb565e`, dann `146d120`): `/gear` + `/en/gear`,
  `src/lib/gear.ts`, `.gear-*`-CSS 1:1. Capability-Lock D: 21/21 ✅. **Nachgerüstet
  (`146d120`):** beide CMS-Einträge zu **einem** „🎒 Equipment" (`gear.json`:
  kicker/title/intro + items) zusammengelegt + **Tina-Live-Vorschau wie Stories**
  (`GearContent.tsx`, `useTina`/`tinaField`, Router → `/gear`). **Offen:** Seite-an-
  Seite-Abnahme durch Nutzer.
- **Planungs-/Analyse-Dokumente im Repo:** `BAUPLAN-Gesamt.md` (Alben/Lightbox-Analyse
  + Gesamtplan), `ANALYSE-Reisen.md` (MapLibre/Stationen/Nominatim; projectUSA/Alaska/
  ensureXY = toter Legacy-Code), `IDEEN.md` (C1–C7 CMS, W1–W6 Website, „Nach dem Umbau"
  inkl. Datenschutz), `ENTSCHEIDUNG-Deploy.md` (3 Deploy-Optionen), `SETUP-TinaCloud.md`
  (verifizierte Free-Limits + Setup-Plan).
- **Capability-Lock + „Live-Wahrheit zuerst"** sind Pflicht bei jeder Funktion
  (s. `CLAUDE.md`/`CAPABILITIES.md`); „fertig" entscheidet der Nutzer.
- **Bild-Auslieferung im Deploy — zwei Fixes:**
  1. **Dateien in den Build:** `web/scripts/copy-uploads.mjs` (im `build`-Script) kopiert das
     Wurzel-`/uploads` nach `web/public/uploads` (auf Cloudflare; lokal Symlink). Bilder landen
     in `web/dist`.
  2. **Pfad-Rewrite:** Tina Cloud schreibt `image`-Feld-Werte beim Build auf `https://assets.tina.io/
     <projectId>/<datei>` um (Query-getriebene Inseln: Galerie/Alben/Reisen/Über-uns) → 404.
     `normalizePath` biegt diese URLs wieder auf `/uploads/<datei>`. Hero/Logo betroffen NICHT
     (statischer JSON-Import). Lokal unverändert.
  ⚠️ **2 echte fehlende Dateien** (nicht im Git): `IMG_5534.webp` (CMS-Test, lokal uncommittet) +
  `IMG_5618.webp` (Story Utah, fehlt ganz) → bleiben „?" bis hochgeladen/entfernt.
- **Stray-Datei:** leere `package-lock.json` im Root (versehentlich, untracked) —
  David löscht sie bei Gelegenheit; landet in keinem Commit.
- **Noch nicht gepusht (lokal):** mehrere Commits seit dem letzten Push — David pusht
  gebündelt. Vor Abschluss prüfen: `git log origin/main..HEAD`.
- **Noch zu testen (live):** `d1aee01` (Video/YouTube in Station+Story), `bb4734c`
  (Querformat-Lightbox).
- **Bild-Altlasten:** ~12 große Legacy-JPGs in `/uploads/` (vor der Auto-WebP-Umstellung
  hochgeladen) → David lädt sie im CMS neu hoch (wird dann auto-WebP). 2 verwaiste bereits
  entfernt (`ed69c63`).
- **Stories-Galerie:** Stories haben kein Mehrbild-Array (nur Cover + Bilder im Text) —
  optionales `multiple:true`-Galeriefeld wäre konsistent mit Alben/Stationen (offen).
- **Vertagt:** `srcset`/responsive Bilder (erst mit eigener Domain via Cloudflare
  Image Transformations sinnvoll); Safe-Area/`viewport-fit=cover`; iPad-Portrait-Breakpoint.

## 6. Strategische Entscheidung (laufend)
**Evaluierung eines Umbaus** auf **Astro + ein CMS mit Live-Vorschau & Drag-&-Drop.**
- **Favorit: TinaCMS** (bleibt git-basiert/kostenlos, Inhalte als Markdown im Repo,
  Live-Update + Drag-&-Drop für Text/Bilder). **Alternative: Sanity** (mächtiger
  Presentation-Modus/Page-Building, aber gehostete DB + Vendor-Lock-in).
- **Plan: gestufter Umbau, beginnend mit Stories.** Prototyp vom Nutzer abgenommen →
  **Stufe 1 wird produktiv gebaut** (in `web/`, Bauplan Schritt 0–6); aktuell nach
  Schritt 5 (Tina). Offen vor Schritt 6: jSquash-WebP im Galerie-Feld.
- **Capability-Lock + „Live-Wahrheit zuerst" verankert** (`CLAUDE.md` +
  `CAPABILITIES.md`): Schritt 0 (echte Live-Umsetzung prüfen, inkl. Sveltia-Lösung)
  + A–D (Extrahieren → Bestätigen → Bauen → Abhaken) sichern „keine Funktion verlieren".
- **Offene Foto-Frage geklärt:** Bulk-Upload + WebP sind mit Tina machbar (eigenes
  Feld gebaut); WebP-auf-Safari via jSquash wie bei Sveltia. Kosten: 0 € (lokal/
  git-basiert; Tina-Cloud-Bezahltarife werden gemieden).
- **Erkenntnis:** Der große Aufwand liegt **nicht** im CMS, sondern im Neubau der
  🔴-Funktionen (MapLibre-Karte, Lightbox/Filmstreifen) — die profitieren von keiner
  Live-Vorschau und sind das eigentliche Risiko für „keine Funktion verlieren".
- **Harte Bedingung:** Kein Funktionsverlust gegenüber der heutigen Live-Seite.
