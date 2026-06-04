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
