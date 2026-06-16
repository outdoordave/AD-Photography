# STATUS.md — Aktueller Projektstand

> **Stand: 2026-06-15** · letzter Commit `74ebfff` (Branch `astro-umbau`) ·
> **Reisen-Design ZENTRAL + Editor-Fix (`a469eb5`+`74ebfff`) [Re-Index]:** Regler-Editor einspaltig
> (lief vorher aus dem CMS-Panel), Live-Vorschau jetzt sichtbar. Design ist nun **zentral** (`reisen_settings.design`
> „Design für alle Reisen") statt pro Reise — einheitlicher Stil; per-Reise-Feld entfernt. tina-lock `98e456f`.
> **EIN Re-Index** (zentrale Umstellung, strukturell). Verifiziert: alle Reisen einheitlich `strong`. **Offen:**
> separate 5-Stationen-Scroll-Vorschau im CMS (Nutzer-Wunsch „gern auch") — Vorgehen noch abzustimmen.
> **Reisen-Design-System FERTIG gebaut [Re-Index nötig]:** Schritt 3 = Design-Werte in `reisen_settings`
> zusammengeführt (`designs`-Objekt, eine CMS-Seite; `reisen_designs`/`trip-designs.json` raus — `1eaf588`,
> Schema) + **Regler-Editor** `TripDesignsEditor` (Slider + Live-Vorschau im Feld, `ui.component` — `2ce04bd`)
> + verwaiste `TripsContent.tsx` gelöscht (`f76c5fb`). tina-lock final `5af5c89`. **EIN Tina-Cloud-Re-Index**
> (für 3a strukturell) nötig — deckt alles ab. Build grün, strong byte-gleich. **Nach Re-Index: Editor im CMS
> gegenprüfen** (Slider laden/speichern, Vorschau). Offen danach: nur noch Live-Abnahme + ggf. Faktor-Tuning.
> **Reisen-Detail höhenadaptive Aktivierung (`53c3f71`):** kurze Stationen schalten früher um (Lead je Block:
> `lead = max(0, READ − h)·LEAD_FACTOR`, lange Stationen unverändert). Faktoren `READ_FRACTION 0.5`/`LEAD_FACTOR
> 0.55` (intern, zum Nachjustieren). Kein Schema, kein Re-Index. **Offen zum Bau-Abschluss:** Schritt 3
> (Regler-Editor `ui.component`) — optional zusammen mit „Designs in Reisen-Einstellungen zusammenführen"
> (Schema → Re-Index); danach Cleanup (verwaiste `TripsContent.tsx`).
> **CMS-Klarheit (`a813355`, KEIN Re-Index):** `reisen_designs` ohne `/trips`-Router (war Kollision mit
> `reisen_settings` → „Seite bearbeiten" zeigte Einstellungen). Designs-Collection nun über die **CMS-Seitenleiste**
> öffnen („🎨 Reisen – Designs"). Globale `image_frame`-Beschreibung korrigiert (Reisen abgekapselt). tina-lock
> `1c67497` (nur Text, keine Struktur → kein Re-Index, nur Push). **Schritt 3 (Regler-Editor) weiter offen.**
> **Reisen-Design-Schritt 2 (`db0e2fd`+`78c46b7`) [SCHEMA → RE-INDEX nötig]:** zentrale Design-Werte
> `src/data/trip-designs.json` + Collection `reisen_designs` (Tuning je Design); `lib/tripDesigns.ts` trennt
> Character/Tuning + `mergeTuning`/`photoShadowCss`; `[slug].astro` baut `<style>` daraus. Pro-Reise-Dropdown
> `design` (none/soft/strong/luftig, Default strong = byte-gleich). tina-lock: 2a `c36aac6`, 2b `0a923a3`
> (je 2× deterministisch). **NACH Push: Tina-Cloud-Re-Index** (sonst „schema doesn't match"). Build grün,
> strong byte-gleich, andere Seiten unberührt, spotlight_strength-Regler für Reisen vom per-Design-Wert abgelöst.
> **STOPP vor Schritt 3** (Regler-Editor, `ui.component`, KEIN weiterer Re-Index) bis Nutzer gepusht + re-indexiert hat.
> **Reisen-Detail Fortschritts-Füllung gefixt (`d807bc8`):** `--fill` jetzt an den **aktiven Punkt** gekoppelt
> (statt feste Anker-Linie) → beim Laden **garantiert 0** auf jeder Fensterhöhe (keine ⅓-Vorfüllung mehr),
> wächst stationsweise weich (transition height 450ms). Verifiziert vh 797 + 1200. **Offen (je einzeln):**
> Punkt 2 (höhenadaptive Aktivierung, Diff liegt bereit) + **Reise-Design-Schritt 2** (CMS-Dropdown zum
> Umschalten none/soft/strong/luftig pro Reise — Schema-Änderung → Re-Index; aktuell sind ALLE Reisen
> fest auf `strong`).
> **Reisen-Detail Kopf schrumpft beim Scrollen (`e3ab787`):** Weg A — nur die schlanke Titelleiste
> (`.tl-head` = Meta+Titel) sticky; Zusammenfassung in nicht-klebendem `.tl-intro` (Grid-Zeile 2), scrollt
> natürlich unter die deckende Titelleiste weg. Titelleiste ~61px → Lesen ~19 % (statt ~32 %). Weiche
> Kopf-Unterkante nur beim Scrollen (`.is-scrolled`, sy>8) → Summary-Anfang am Load nicht ausgewaschen.
> **Safari-sicher** (reines sticky, kein Scroll-API, kein Sprung). Load-Zustand unverändert (~40 %). Build grün.
> **Echter Scroll bitte live prüfen** (Tool blockiert programmatischen Scroll).
> **Reisen-Detail Vorspann gestrafft (`48495dd`):** Punkt 1 war **kein** Linien-Bug — die Füllung startet korrekt
> am ersten Punkt; der erste Stations-Punkt saß nur auf ~44 % Bildschirmhöhe (Kopf drückt). Tot-Luft gekürzt
> → erster Punkt **44 %→39 %** (vh 797). Kein Inhalt entfernt. Luftig + Trim stimmig. **Offen (je einzeln):**
> B (Füll-Vorderkante an aktiven Punkt koppeln) + Punkt 2 (höhenadaptive Aktivierung, smart, kein Regler) —
> Punkt-2-Diff liegt zum Drübersehen bereit (nicht committet).
> **Reisen-Design Schritt 1 / Entkopplung (`eef7e19`):** Vorbereitung pro-Reise-Designs, **rein additiv, kein
> Schema, kein Re-Index, byte-gleich.** Neue geteilte Quelle `web/src/lib/tripDesigns.ts` (4 Vorlagen
> none/soft/strong/luftig + `designToVars`/`tripDesignsCss`/`resolveTripDesign`). Stationskarte liest reise-eigene
> Tokens `--ww-trip-*` (ring/shadow/card-bg/photo-shadow/gap/title/dim/scale) mit **Fallback** auf die globalen.
> `[slug].astro` (DE+EN) emittiert die 4 Design-Blöcke als gescopten `<style>` aus der Quelle + setzt
> `data-trip-design` auf `.tl-proto` (Schritt 1: immer `strong`, kein CMS-Feld). Karte (`.map-box`) bleibt auf den
> globalen Tokens. **Capability-Lock bewiesen:** `global.css` unberührt, keine andere Seite geändert; aktive Karte
> live computed = heutige Strong-Werte. **Nächste Schritte (einzeln):** 2 = Schema/Dropdown (Re-Index!), 3 = zentrale
> Regler mit Live-Vorschau. **STOPP nach Schritt 1 — Nutzer prüft & gibt Schritt 2 frei.**
> **Reisen-Detail (`31070ea`):** Ecke **Station|Kopf|Karte** smooth gemacht (war „hakelig"). Schicht-Layout wie
> vom Nutzer beschrieben: Kopf-Deckfläche `.tl-head::before` läuft als durchgehende Ebene **bis unter die Karte**
> (`width: calc(36px + 420px)`); Map mit `z-index:5` darüber → Map-Schatten bleibt **über** der Deckfläche. Die
> weiche Kopf-Unterkante `.tl-head::after` reicht jetzt über Textspalte **und** Lücke bis zur Karten-Kante
> (`right:-36px`) → Deckrand läuft an der Ecke durchgehend weich aus statt auf eine harte Kante zu treffen.
> Höhe unverändert (`min(28px,3.4vh)`<4vh → erste Station nicht ausgewaschen). Live verifiziert (lokaler Tina-Build
> + astro preview): scrollY=0 voller CMS-Rahmen; Mid-Transition (Denali aktiv, Anchorage taucht weich unter) ohne
> harten Übergang; Map-Schatten über der Deckfläche. **Finaler Seite-an-Seite-Check durch Nutzer steht noch aus.**
> **Reisen-Detail (`00db05b`):** „rechts lugt der Rahmen neben der Überschrift raus" gelöst — der Kopf deckt die
> 36px-Spalten-Lücke rechts mit ab (`.tl-head::before`, z4) → Stations-Ring/Schatten-Überstand (~28px) verschwindet
> auf Kopfhöhe auch rechts; `.tl-map z-index:5` schützt den Map-Schatten. Mobil aus. Stationen/CMS-Rahmen unverändert.
> **Reisen-Detail (`32afdfc`/`ba54e70`/`3099bfb`):** Aktive Karten-Rahmen = **exaktes CMS-Design** (`--ww-ring`/
> `--ww-shadow`, weicher Rahmen + großes head::after/Abstand zurückgebaut). Der „rechts durchfliegen"-Effekt liegt
> am **Kopf** (verifiziert: Kopf deckt auf seiner Höhe voll ab, auch rechts; Inhalt nur darunter sichtbar) → kurze
> **weiche Kopf-Unterkante** `.tl-head::after` (`min(28px,3.4vh)`, < 4vh → wäscht ruhende erste Station NICHT aus,
> live verifiziert). Mobil aus. **Kein Reveal-Flackern** beim Laden. Scroll-Durchlauf bitte live prüfen.
> **Reisen-Detail (`124151c`/`6ae8eaa`):** Rahmen + Untertauch-Übergang gefixt. Aktive Karte z-index 3 (über
> Fades z2, unter Kopf z4) → **voller, sauberer Rahmen**. **Weiche Kopf-Unterkante** (`.tl-head::after`, volle
> Spaltenbreite, 64px) → beim Hochscrollen verblasst die Kartenoberkante **auf allen Kanten** (auch rechts)
> gleichmäßig statt hart. `padding-top: 84px` hält die ruhende erste Station unter dieser weichen Kante (sauber).
> Erste Station live verifiziert. *(Scroll-Position-Screenshots im Vorschau-Tool = leer = Tool-Artefakt; Übergang
> bitte live prüfen.)*
> **Reisen-Detail (`9288e1a`/`1ed2fa2`):** Kopf-`::before` (23837a2) **zurückgenommen** (schnitt Karten-Schatten
> ab / zu große Box) — per **Live-Vorschau** verifiziert, dass der Kopf hochscrollende Titelbilder voll überdeckt
> (kein Durchschimmern). **Weicheres Timeline-Ende:** Trailing-Leerraum 42vh→30vh → letzte Station bleibt lesbar,
> weicher Papierriss-Footer schließt direkt an (kein „schwebender" harter Cut mehr).
> **CMS-Vorschau (`35c6948`):** Button **„↩ Zum Reisemenü"** (statt „+ Station/sortieren") führt ins
> Reise-**Hauptformular** (`tinaField title`, oberste Ebene) — vorher öffnete `stops` die verschachtelte Liste.
> **Reisen-Timeline (`eacf5b1`):** weicherer Auslauf am Ende — Bottom-Fade 56→120px + mehrstufiger Verlauf
> (kein harter Cut bei der letzten Station).
> **Reisen-Detail (`23837a2`/`d556387`/`96e595f`):** sticky Kopf deckt jetzt rechts neben dem Text ab (kein
> durchscheinendes Titelbild beim Hochscrollen, `::before`-Fläche). „+ Station/sortieren" springt korrekt zur
> Stationen-Liste der ausgewählten Reise (`stops`). Karte hat Abstand zur Nav (`--ww-map-gap` 16px).
> **Karte (`9696f44`):** Flug-Rauszoom erst an der Flug-**Ankunft** (nicht schon am Abflug-Stop) → die
> Abflugstation (z. B. Lake Tahoe) bleibt herangezoomt; rausgezoomt wird erst beim Flug dorthin. Kein Re-Index.
> **CMS-Vorschau (`b3f7dec`/`9a1d9ef`):** **Stationsleiste fix (sticky) unter der Karte** (nur im Tina-Iframe):
> Chip = Station direkt bearbeiten (`data-tina-field`/`open` + Vorschau-Scroll), „+ Station / sortieren" springt
> in 1 Klick zum Editieren. Scrollt nicht mehr weg. Besucher/Live unberührt. Belegt: Vorschau→Editor kann nur
> `open` (fokussieren), keine Add/Move/Delete.
> **CMS 2-in-1 (`24592bb`):** Separates „Stationen schnell verwalten"-Feld entfernt → die **native** Stationen-
> Liste zeigt die Anreise **diskret pro Zeile** (✈️/🚗 + Name) + **Emojis in der Anreise-Auswahl**. `tina-lock`
> neu `7e1ce5c6` (deterministisch). **⚠️ Schema-Änderung → Re-Index nötig.**
> *(Hinweis: der zwischenzeitliche separate „Stationen-Manager"-Feld-Ansatz `af5da8c`/`StopsManager.tsx` wurde
> in `24592bb` wieder entfernt — ersetzt durch die 2-in-1-Liste oben. Historie siehe CHANGELOG.)*
> **Karte (`df5097e`):** Kein **Auto/Flugzeug-Geflacker** mehr an den Stops (Symbol nach Ankunftsart `legFlight[idx]`).
> **Karte (`1368443`):** Kurven-Haken behoben — **zentripetale** Catmull-Rom. `arriveBy` = manuelles Pro-Station-Feld.
> **Karte (`5407d74`):** **Sanfte Kurven** (Catmull-Rom durch die Stops, `curveLeg`; Auto folgt der Kurve)
> statt Geraden; **Apple-like** Optik (Schein + heller Rand + schlanke, leicht durchsichtige Linie);
> **Fluganimation** zoomt erst voll heraus, dann fliegt das Flugzeug langsam & sanft (Verzögerung, easeSine).
> **Karte (`0807cb5`):** Routenlinie **wächst progressiv mit der Reise** (Station↔Station synchron zum
> Fahrzeug, schrumpft beim Zurückscrollen) statt vorab als Balken. `buildPath`/`drawDoneUpTo`.
> **Fix (`64951a2`):** Im CMS klappte die **Site-Nav** im schmalen Vorschau-Iframe (<860px) zum Burger
> → jetzt waagerecht gehalten via `html.ww-cms-preview` (nur im Iframe gesetzt). **Live/Besucher 1:1.**
> **Fix (`28356fe`):** Routenlinie verschwand im CMS-Vorschau-Iframe / nach Live-Kartenstil-Wechsel
> (`setStyle` löscht Layer; Marker überleben als DOM, Linie nicht) → „Auto fuhr ohne Linie". `drawRoute`
> jetzt selbst-heilend beim nächsten `idle`; Stilwechsel-Effekt nutzt `idle`. Alle drei: kein Schema-Change.
> **CMS-Nachschärfung:** „Aus Mediathek wählen" in allen Foto-Feldern (vorhandene `/uploads`-WebPs wählen statt
> doppelt hochladen; gemeinsamer MediaPicker). Neues Stop-Feld **`arriveBy`** (Fahrt/Flug) → Auto vs. Flugzeug
> pro Station steuerbar (aktiviert den Flug-Bogen/-Zoom). `tina-lock` neu → **Re-Index nötig**. ·
> **Fix:** aktive Station bei kurzen Stationen (kein Titelbild / 2-Zeiler) korrigiert — Scroll-Spy „letzter Block
> über dem Anker" + Lese-Anker im oberen Drittel (vorher startete der Fokus zu spät). ·
> **🧭 REISEN-UMBAU LIVE (Variante B, capability-locked):** Der Timeline-Prototyp ist in die ECHTE Reisen-Seite
> portiert. **`/trips` = Übersicht** (Karte pro Reise) → **`/trips/<slug>` = vertikale Timeline** (`TripTimeline.tsx`):
> Fokus-Dimming (aktive = gerahmte Karte), mitlaufende Karte + station-treues Fahrzeug (Silhouette wählbar:
> Expedition/Pickup/Jeep), Fortschrittslinie, Reveals, Mobile — **plus** alle Alt-Fähigkeiten (useTina + data-tina-field
> + Editor-Sync, DE/EN, 5 Karten-Stile live, scrollZoom, CSS-Crop-Hero, Filmstreifen→Lightbox, Video/YouTube,
> verknüpftes Album, Reisefazit-Galerie). Reise-Tabs entfallen. Tina-Schema backward-kompatibel erweitert
> (`kind`/`vehicle`/`vehicle_custom_svg` + 4 globale Regler in `reisen_settings`, Defaults eingefroren).
> `tina-lock` neu (deterministisch). Offline-Build grün (42 Seiten). Flug/Etappen = ruhender Code (kein Schema-Feld).
> **⚠️ Offen David:** Push → **Tina-Cloud-Re-Index** → live testen; danach Cleanup der verwaisten `TripsContent.tsx`. ·
> **Proto** (`/proto/reisen-timeline`) bleibt als Spielwiese bestehen. ·
> **Mobile-Variante gebaut (< 768px; iPad/Desktop ≥768px unverändert):** Breakpoint über **Breite** (nicht Touch);
> gestapelt mit schlanker sticky Nav-Zeile (großer Kopf **kollabiert** hinein) + sticky **Mini-Karte** (progressive
> Route/Fahrzeug/flyTo), ein Scroll-Kontext; Dimming schwächer (≥0.40); Filmstreifen → Swipe-Galerie. **Reveal-Dauer
> jetzt auf dem Proto-Regler** (0–900ms); Dim-Fade-Default eingefroren auf **800 ms**. ·
> **Proto-Nachschärfung:** Karte wieder sichtbar (Grid-`min-width:0`-Fix); **Dim-Timing block-basiert**
> (große Stationen bleiben aktiv solange Großteil sichtbar; kurze erst wenn dran); **fluffigeres** Ein/Ausblenden
> (`DIM_FADE_MS=650`); **On-page „Proto-Regler"** unten links (Snapping-Toggle + Spotlight + Übergang, live ohne Rebuild). ·
> **Proto-Scroll-Gefühl (apple-like):** **Auto-Snapping AUS** per `SNAP_ENABLED=false` (frei scrollbar,
> Position wird nie gekapert); **Fokus-Dimming** als Kernverhalten (aktive Station voll, andere gedimmt+kleiner,
> wandert weich mit; `SPOTLIGHT_STRENGTH=70`→gedimmt 0.30, `DIM_SCALE=0.975`); dezente **Reveals**
> (`REVEAL_SHIFT/-DUR`); **Fahrzeug prominenter** (`VEHICLE_SIZE=42`). Justier-Konstanten oben gruppiert,
> mit CMS-Wording (später globale Felder „Stationen einrasten" + „Spotlight-Stärke"). ·
> **Proto-Korrekturen (Vorrunde):** Kopf klebt bündig unter der Nav (keine Stationen mehr dazwischen),
> Fade bündig direkt unter der Überschrift (keine Lücke); **JS-Snapping fluffig** (eigener easeInOut-Tween,
> unterbrechbar; statt CSS/native — Safari-robust); Fortschrittsbalken **gleitet** (kein Schnippen);
> **Fahrzeug gleitet station-treu** (Flugzeug steht in FRA statt auf halbem Weg, langsames Easing, reduced-motion=still). ·
> **NEU (Prototyp, isoliert, DESKTOP):** Reisen-Redesign „Variante B / vertikale Timeline" unter
> **`/proto/reisen-timeline`** (noindex, aus Sitemap) — diese Runde apple-like Feinschliff:
> **EIN Scroll-Kontext** (kein innerer Container; Kopf+Karte `sticky`, Overlay-Fade statt mask) → behebt
> überscrollten Kopf + Hängenbleiben; **proximity-Snapping auf dem Dokument** mit gemeinsamem Anker
> (aktive Station = Balken-Ende = Snap, gemessene Punkt-Mitte); **Karte folgt** (flyTo/IO); **2 echte
> Flugetappen** (Frankfurt→SF, LAX→Anchorage) mit Flughäfen, **gekrümmte gestrichelte Flugbögen** +
> **Flug-Zoom** (fitBounds raus/rein), **Flugzeug** fliegt die Kurve; **saubere Ford-Expedition-Silhouette**;
> Etappen-Trenner; **18 Demo-Stopps** (frei erfunden); Karte gedeckelt (≤62vh). Echte Reisen-Seite `/trips`
> + Tina-Schema + Content **unverändert**. Analyse in `CAPABILITIES.md`.
> **Offen:** Browser-/Safari-Test (Sandbox blockt Server → David lokal/online: sticky, Overlay-Fade,
> scroll-snap proximity, IO, Flug-Zoom/Bogen), **mobiles Verhalten** (separat), dann Entscheidung echter
> Umbau (Stop-Typ-Feld `kind`, backward-kompatibel: ohne `kind` = Hauptstation; fahrendes Auto final → Alexandra). ·
> **Doku-Update nach `3010df0`:** ·
> **Vorschau-noindex AKTIV:** `PUBLIC_PREVIEW_NOINDEX=true` ist im **Vorschau**-Projekt gesetzt (greift ab nächstem Build:
> `<meta robots noindex>` + `robots.txt`→`Disallow: /`). ⚠️ **Live-Projekt bekommt diese Var NIEMALS** (Cutover-Merkposten, sonst Live aus Google). ·
> **Kontaktformular-Versand (Web3Forms) real getestet → Mail kommt an ✅.** ·
> **K5 abgeschlossen:** 4 verwaiste Upload-Testbilder (~27 MB) mit Freigabe entfernt; 18 Uploads bleiben
> (alle referenziert). ·
> **K4 abgeschlossen:** Album-Notiz „Firsts" EN gefüllt; voller EN-Scan → keine weiteren echten Lücken
> (utah-Story `has_english:false` = absichtlich DE auf EN). ·
> **P3 abgeschlossen:** `robots.txt` (Endpoint, env-gesteuert wie noindex: Vorschau→`Disallow: /`,
> Live→`Allow`+Sitemap) + **Sitemap** (`@astrojs/sitemap@3.2.1`, Astro-4-kompatibel; 35 Seiten DE+EN);
> `site=https://aandd-photography.pages.dev` (per Env `SITE_URL` überschreibbar). Kein `tina/config` → kein Re-Index. ·
> **UX (B):** Footer-Logo klickbar → Startseite (sprachrichtig) · globaler „Nach oben"-Button (BaseLayout,
> erscheint nach Scrollen, smooth + reduced-motion, unten rechts safe-area, kollisionsfrei z1090). ·
> **Fix:** Safari-Repaint-Geist der Stationsreihe beim Reise-Wechsel behoben (React-`key`=Reise-Slug an
> alle reise-spezifischen Blöcke; Karte bleibt montiert). Allgemein + zukunftssicher. ·
> **Fix:** Reise-Tabs/Stations-Pillen brechen bei 641–860px um statt abzuschneiden (Scroll/Fade/Pfeile nur noch ≤640px; behebt auch Hover-Aufpoppen). ·
> **Neu:** P1 Bild-Performance ✅ · K2 Insta zentral aus Kontakt ✅ · K4 EN-Rechtstexte ✅ · P2 utah-Bild→/uploads ✅ ·
> P3 (404 + Vorschau-noindex + robots.txt + Sitemap) **vollständig ✅**. ·
> ⚠️ **Offen – braucht David (vor Cutover):** (1) **Push** der offenen Commits. (2) **Safari/iPad-Konsolen-Check**
> (Laufzeitfehler). (3) **iPad-Test mit Alexandra** (CMS-Bedienung + Besucher-Ansicht). (4) **Tina-Cloud-Re-Index**
> nach K2 (Schema-Änderung, falls noch nicht erfolgt). (5) Dann **Cutover** (FAHRPLAN Phase 3). ·
> ✅ **Erledigt:** Vorschau-noindex-Var gesetzt · Test-Mail (Web3Forms) bestätigt · Rechtstexte DE+EN · P1/P2/P3/K2/K4/K5. ·
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
> BaseLayout); **2 Hero ✅**, **3 Home-Teaser ✅**, **4 Social-Row ✅** → **Startseite vollständig**.
> **Alle großen Sektionen portiert.** **Live-Check/Audit erledigt (2026-06-08) → Befunde in `MAENGEL.md`**
> (Fonts wirklich lokal/0× Google live bestätigt; 0 kaputte Bilder; Guards ok). **Vor Cutover zwingend:
> echte Rechtstexte + Geräte-Smoke-Test (Safari/iPad).** Offen separat: Bild-Performance (MAENGEL P1 — Roh-JPGs),
> Reisen-Vorschau-Feinschliff. (Kontaktformular-Senden W5 ✅ erledigt.)

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
  | Schriften | Fraunces + Mulish | **Astro: LOKAL (Fontsource, Variable) — kein Google.** Alte `index.html`: noch fonts.googleapis.com |
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
- ✅ Kontaktformular (`onSend`) — sendet echt via Web3Forms (W5, `671a742`); Datenschutz-Häkchen + Honeypot

## 4. Bekannte Eigenheiten / Fallen
- ⚠️ **Offline-Build-grün fängt KEINE Laufzeitfehler** (z. B. Variablen-Shadowing/TDZ in einer
  React-Insel). Beispiel diese Session: ein lokales `const track` überschattete die importierte
  `track()`-Analytics-Funktion → ReferenceError beim Lightbox-Mount → ganze Galerie-Insel stürzte ab
  („Foto verschwindet/leere Seite"). Build war trotzdem grün. **Lehre:** Interaktive Insel-Änderungen
  (Klick/Lightbox/Scroll) möglichst im echten Browser gegentesten; aufpassen mit Namen, die einen
  Import überschatten. (Die lokale Vorschau ist in der Assistent-Sandbox blockiert.)
- **Mobile Scroll-Reihen (Reise-Tabs/Stations-Pills):** scrollen nur ≤640px (Desktop/iPad brechen um).
  Fade + Pfeile (`:has(.ww-edge-*)`) als „geht-weiter"-Indikator, Scrollbalken sichtbar+dezent,
  Snap-align center, aktiver Tab/Station wird per JS in die Mitte gescrollt (`centerInRow`).
  Pfeile vertikal — **SVG-Chevron + gemessene Pillen-Mitte** (`41d4be7`, Endlösung): Text-Glyphe `‹/›`
  (Font-Versatz) ersetzt durch geometrisch zentrierten SVG (`Chev`-Komponente, symmetrisch um viewBox-Mitte).
  JS misst die Pillen-Mitte je Reihe (`getBoundingClientRect`) → `--ww-arrow-y` auf `.ww-scroller`; CSS pinnt
  per `top:var(--ww-arrow-y)/translateY(-50%)`. ⇒ Chevron-Mitte == Pillen-Mitte, deterministisch, beide Reihen,
  selbstkorrigierend (Scroll/Resize/Tab/Fonts). Box 30×40 = Tap-Ziel. `.stop-arrow` (Station vor/zurück) unverändert.
  Politur (`5a6ca03`): Chevron filigraner (16px/stroke 2); Rand-Fade von mask-image → **Opacity-Overlay**
  (`.ww-scroller::before/::after`, Farbe `--c-bg`) + Pfeil-Transition 320ms → weiches Ein-/Ausblenden statt instant.
- **Portfolio-Album:** Diashow-Foto + Album-Unterseiten-Kacheln öffnen die Lightbox per `onClick`;
  Lightbox schließt per Tipp neben das Foto (Hintergrund, 350ms-Sperre gegen Sofort-Schließen).
- **Sichtbarkeits-Schalter + Direktaufruf-Sperre** (🎨 Darstellung): Stand committet —
  **Kontakt sichtbar** (`show_contact=true`), **Stories ausgeblendet** (`show_stories=false`).
  Ist ein Bereich aus, ist er **komplett** weg: Nav-/Footer-Link gefiltert **und** Direktaufruf
  leitet per Build-Zeit-Guard auf die Startseite um (DE → `/`, EN → `/en/`). Betrifft
  `/contact`+`/en/contact` sowie `/stories`, `/en/stories` **und alle Einzelbeiträge**
  `/stories/<slug>`. **Logik-Unterschied:** Kontakt sichtbar außer `show_contact===false`
  (Standard an), Stories sichtbar NUR bei `show_stories===true` (Standard aus). **Falle:** solange
  aus, leitet auch die **CMS-Vorschau** des Bereichs um → zum Bearbeiten Schalter kurz an + bauen.
- **Kontaktformular sendet echt** (W5 ✅, `671a742`): Web3Forms-POST, Key im CMS (`form_access_key`,
  Test → `davidbastisch@web.de`); ohne Key = Vorschau. Datenschutz-Pflicht-Häkchen + Honeypot.
  Echtes Senden erst auf der deployten Seite testbar.
- **Statistik/Auswertung** (`a78259a` + `b66e15c` + `b3f2be0`): versteckte Seite `/statistik`
  (noindex, unverlinkt) + CMS-Collection `📊 Statistik`. **Dienst = Umami (aktiv, cookielos)** —
  Snippet in `statistik.json`, `enabled=true`; BaseLayout lädt es site-weit. **Events:** `foto`
  (Lightbox-Öffnen, zentral) + `reise` (Tab-Wechsel) via `lib/track.ts`. Seitenaufrufe decken
  Story-/Reise-/Album-**Seiten** ab. **Offen:** Umami-„Share"-URL ins CMS-Feld `dashboard_url`
  → dann Auswertung eingebettet auf `/statistik` (sonst nur im Umami-Dashboard sichtbar).
  **Zugang:** Link „📊 Statistik" in Nav + Admin-Leiste erscheint **nur für eingeloggte Admins**
  (clientseitige Token-Erkennung, `fe92a6f`); Besucher sehen weder Link noch (via noindex/unverlinkt) die Seite.
- **Logout** (`ca20d23`): Abmelden (Banner **und** neuer CMS-Menüpunkt „Abmelden" / Kategorie Site)
  löscht Tina-Tokens (local+session) und geht sauber auf `/` (Top-Fenster) — kein Tina-Fehler mehr.
  Tinas eingebauten Logout möglichst nicht nutzen (der wirft den Fehler).
- **Datenschutz- + Impressum-Seite** (`c6aab1e`): CMS-Collections `datenschutz`/`impressum`
  (`/datenschutz`, `/impressum`, DE/EN), Footer-Links, Häkchen verlinkt die Datenschutzerklärung.
  ⚠️ **Nur Platzhalter-Text** — echten Rechtstext (Generator/anwaltlich) + Web3Forms/Cloudflare als
  Auftragsverarbeiter muss der Nutzer noch einsetzen, bevor die Seite öffentlich live geht.
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
- ⚠️ **`tina-lock.json` nach JEDER `tina/config`-Änderung neu generieren** und committen —
  **sonst bricht der Cloudflare-Build ab** mit „local schema doesn't match remote". **Wichtig:**
  `tinacms build --local` aktualisiert die `tina-lock` **NICHT**; nur **`npx tinacms dev --no-server`**
  regeneriert sie (deterministisch). Danach: pushen → Tina Cloud **re-indexiert** aus der neuen
  `tina-lock` → Build grün. **Auch `ui.component`-Änderungen schlagen sich im Lock nieder** (z. B.
  `'textarea'` → eigener Komponent), nicht nur neue Felder/Typen — also IMMER neu erzeugen, sicherheitshalber
  vor dem Push einmal `dev --no-server` + `git status web/tina/tina-lock.json` prüfen.
  (Reine Daten-/CSS-/Astro-Code-Änderungen ohne `tina/config`-Touch brauchen das nicht.)

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
  1 Nav-Shell ✅ → 2 Hero ✅ → 3 Home-Teaser ✅ → 4 Social-Row ✅** → **Audit ✅ (Befunde in `MAENGEL.md`)
  → Cutover** (zwingend davor: echte Rechtstexte + Geräte-Smoke-Test Safari/iPad).
- **Startseite Etappe 4 (Social-Row) — gebaut (`8ea67c2`):** `insta-row` im Intro (Alexandra/David),
  `socialUrl()` in `socialIcons.ts`, CMS-Social-Liste im „🏠 Startseite". **Startseite vollständig.**
- **Startseite Etappe 3 (Home-Teaser) — gebaut (`2b369bb`):** `lib/home.ts` + `HomeIntro.astro`,
  `HomeMoments.tsx` (Lightbox), `HomeLatest.astro`, `HomeDiscover.tsx`; alle Sektionen auf `/`(+`/en`).
  CMS „⭐ Highlights" + Intro/Sektion-Texte im „🏠 Startseite". Zufall = Client-Shuffle. D: T1–T7 ✅.
  **Offen:** Abnahme. (Social-Row Etappe 4.)
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
- **Stories — Album-Einbettung + Laien-Text-Editor (NEU, `053ffeb`, über Live hinaus, freigegeben):**
  Live-Stories haben KEINE Galerie (nur Cover + Markdown-Text). Statt Zuschnitt (passt für Stories
  nicht) auf Nutzer-Wunsch: eigener Haupttext-Editor `StoryBodyField` mit zwei Knöpfen — „📷 Bild
  einfügen" (Auto-WebP-Upload an Cursor, kein „?") + „📸 Album hier einfügen" (setzt `[[album]]`).
  Neues Dropdown `linked_album` (Tina-`reference` auf `alben`); `StoryReaderContent` rendert an der
  Marker-Stelle `StoryAlbumBlock` (Vorschau-Kacheln + bestehende Lightbox) — **kein Doppel-Upload**
  (Fotos aus dem Album). `storyAlbum.ts` löst die Referenz auf. Altes Story-`gallery`-Feld entfernt.
  Speicherformat bleibt Markdown (mdToHtml 1:1). ⚠️ Schema → **Re-index + Rebuild nötig**. Build
  grün (29 Seiten), positiv getestet. **Offen:** Nutzer-Abnahme (iPad: Knöpfe/Upload/Lightbox).
  - **Feedback-Runde (`1cc96fc`):** (1) Album-Block jetzt **in der Live-Vorschau** sichtbar
    (Auflösung in der Insel aus useTina-Daten statt beim Seitenbau; `storyAlbum.ts` entfernt).
    (2) **Mediathek-Raster** „🖼️ Aus Mediathek wählen" (alle vorhandenen `/uploads`-Bilder aus
    `public/uploads-manifest.json`, `gen-uploads-manifest.mjs` im build) → einfügen ohne
    Doppel-Upload. (3) **Inline-Bilder im Beitrag** öffnen die Lightbox als Gruppe (1:1 wie Live).
    Kein Schema-Feld geändert → tina-lock unverändert.
- **Vertagt:** `srcset`/responsive Bilder (erst mit eigener Domain via Cloudflare
  Image Transformations sinnvoll); Safe-Area/`viewport-fit=cover`; iPad-Portrait-Breakpoint.

### Sammel-Auftrag (Teile 1–10) — Fortschritt
- **1 Alaska „· soon"** ✅ (Auto-Suffix entfernt) · **2 ABNAHME.md** ✅ + Folge-Punkte A–D ✅
- **3C Admin-Leiste** ✅ (`SiteAdminBar.astro`, Schalter Darstellung, Standard AUS)
- **3B Live-Vorschau für Settings-Seiten** ✅ **richtig** (`1acab68`; Zwischenschritt `fda8a94`
  Rollback): Kopf-Blöcke von Galerie-/Stories-/Reisen-Einstellungen sind jetzt useTina-Inseln
  (`SettingsHeader.tsx`) → Bearbeiten + Live-Vorschau, Router auf /portfolio /stories /trips
  (+ /en/). Startseite/Highlights/Darstellung bewusst form-only OHNE Router (Zielseite `/` ist
  Astro-Komposition; Live-Vorschau dort = halber Homepage-React-Umbau, separat). Kein Re-index.
  - **Lehre/Falle:** `ui.router` ⇒ Tina-Visual-Editing ⇒ Seitenleiste zeigt nur Formulare, die
    die Zielseite per `useTina` registriert. Router nur auf Collections setzen, deren Zielseite
    das Dokument useTina-bindet — sonst „Looks like there's nothing to edit on this page".
- **3A Zurück-Navigation** ✅ (a) edit→Übersicht via Tina-Breadcrumb; (b) „Zur Website"-
  Seitenleisten-Menüpunkt via `cmsCallback`+ScreenPlugin (`tina/screens/BackToSiteScreen.tsx`).
  Commit `5276b22`.
- **9 CMS-Benennung „Portfolio"** ✅ (`79d4956`): „Alben"→„Portfolio Alben", „Galerie –
  Einstellungen"→„Portfolio". Nur Labels, kein Re-index.
- **Zusatz B — Klick-Untermenü (Pilot)** (`8850f59`): Tina öffnet beim Klick auf Objekt-Felder
  {de,en} immer ein Unterformular. Fix (Nutzer-Wahl Option 1): zweisprachige Felder flach machen.
  **Pilot** auf 3 Settings-Seiten (flache `*_de/*_en`, neues `EnglishOnlyField`). ⚠️ Schema →
  **Re-index nötig**. **Wartet auf Live-Abnahme**, dann Ausrollung (Reisen/Über uns/Kontakt/
  Equipment/Startseite). Caveat: Listen-Felder (Stationen etc.) bleiben verschachtelt (Tina).
- **3A „Zur Website"**: deployt, im ☰-Menü (Rubrik „Site"); Zurück-zur-Übersicht = Brotkrümel.
- **4 Bild-Kontrolle → Option D (Zuschnitt) gebaut:** `CropPhotoField` (Zoom/Pan im Rahmen, touch,
  Auto-WebP-Einbrennen, Original behalten). Angewandt: **Personen-Foto** (4:3) + **Reise-Stations-
  Titelbild** (16:10). Wert ist **String** (JSON-Blob oder /uploads-Pfad) → Editor rendert immer
  inline, kein „?" (Fix `15bec1e`). **Hero/Portfolio bewusst ausgeschlossen** (Vollbild bzw. frisch
  aus Lightroom). **Stories: kein Zuschnitt** — stattdessen das Album-Einbettungs-Feature (s. o.).
  ⚠️ Schema → Re-index. **Offen:** iPad-Abnahme der Crop-Felder.
- **5 Karten-Scroll-Zoom-Schalter ✅ (`2879c11`):** CMS-Schalter „Karte: Mit Mausrad zoomen"
  (`reisen_settings.map_scroll_zoom`). **Standard AN** (Mausrad/1-Finger zoomt; Abweichung von Live,
  auf Nutzer-Wunsch — Muster ab jetzt: Features Standard AN, im CMS abschaltbar). AUS = Live-Verhalten.
  ⚠️ Schema → Re-index. **Offen:** Abnahme.
- **6 Rahmen+Schatten ✅ (`77bf13f`, überarbeitet `5c0cb50`):** 3-Stufen-Option `image_frame`
  (none/soft/strong, Standard soft) als **einheitliches Box-System** über `<body class=ww-frame-*>`.
  Eine Quelle (`--ww-ring/--ww-shadow` hell, `-d` dunkel) → **gleiche Rahmendicke pro Stufe** (0/1/2px),
  warm getönt. Gilt für ALLE Kästchen: Karten, Kacheln, Fotos, Reise-Tabs, Karten-Container,
  Personen-Karten (dunkle Variante); Hover-Erhebung auf Tabs/Kacheln. Buttons/Eingabefelder hinter
  Schalter `frame_controls` (Standard an, Hero-CTAs durchsichtiger Schatten). CMS-Vorschau im iOS-Stil
  (`ImageFrameField`, Mini-Vorschau je Stufe). Hero-Bild/Lightbox bleiben vollflächig. ⚠️ Schema → Re-index.
  - **Feedback-Runde (`edb4234`):** Reichweite erweitert auf Entdecken-Kacheln (`.teaser`),
    Insta-/Social-Buttons (`.insta-link`, hell+dunkel), Stations-Pills (`.trip-stoplist` = wie
    Reise-Tabs) und das Stationsfenster (`.trip-detail`). Hover an Story-Card-Vorbild angeglichen;
    Hero-CTA-Hover vereinheitlicht (ghost hebt sich jetzt gleich). Neuer Schalter **`album_hover`**
    (Standard an) für Album-Hover-Erhebung. **Über uns:** `PaperRip`-Komponente — dunkle Profil-Box
    bekommt oben+unten die gerissene Papierkante (wie Hero). ⚠️ Schema → Re-index. **Offen:** Abnahme.
  - **Runde 2 (`d2eff59`, `40faf3a`):** Stationsfenster jetzt **eine** saubere Karte (kein Rahmen-im-
    Rahmen — Foto innen schlicht). **Gear-Listen-Stil** als CMS-Option **`gear_style`** (plain/card/notes,
    Standard card; eigener Schatten, CMS-Vorschau `GearStyleField`). **Kontakt-Textfeld** wächst wieder
    mit (Auto-Grow-Port von `wwGrowMsg`). **Insta-Handle** überall `a3.flow` (war nie im Repo). ⚠️ Schema → Re-index.
  - **Runde 3 (`c34ade0`):** Gear-**Reichweite** `gear_scope` (whole/groups) — Field-Notes als EIN ganzer
    Zettel möglich (Standard notes+whole). Stationsfenster-Rahmen: Schatten auf den `.trip-detail-wrap`
    gelegt (war von dessen `overflow:hidden` abgeschnitten → wirkte „unfertig"), hängt weiter am
    globalen Schalter. ⚠️ Schema → Re-index.
- **7 EN-Felder abheben ✅ (`4f46ea3`):** EnglishOnlyField/-TextField dezent in Erdtönen
  (linker Akzentstreifen + warme Tönung + 🌐-Label); Story-Beiträge via neue immer-sichtbare
  Variante `EnglishStyledField`. Rein kosmetisch → kein Re-index. **Offen:** Abnahme.
- **8 Kartenstil-Sofortvorschau ✅ (`afa1b80`):** TripsContent liest `map_style` live aus
  `reisen_settings` (2. useTina); `map.setStyle()` bei Wechsel (Marker bleiben, Sprach-Labels neu).
  Statische Seite unverändert. Kein Re-index. **Offen:** Abnahme.
- **10 CMS-Orientierung ✅ (`42d90fb`):** „Du bist hier"-Banner (SectionBanner) oben in jeder Sektion, reines Info-Feld (keine Daten). ⚠️ Schema → Re-index. **Sammel-Auftrag 1–10 komplett.**

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
