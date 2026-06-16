# CAPABILITIES.md — Fähigkeiten-Verträge je Funktion (Capability-Lock)

Dieses Dokument sichert beim Umbau (Single-File `index.html` → Astro + TinaCMS,
Branch `astro-umbau`) die **oberste Regel**:

> **KEINE bestehende Funktion darf verloren gehen oder sich für Besucher anders
> verhalten.** Die Website bleibt optisch **und** funktional identisch — nur der
> darunterliegende Code wird neu strukturiert.

> **Vorstufe „Live-Wahrheit zuerst" (Schritt 0, ZWINGEND):** Erst die echte
> Live-Umsetzung analysieren (Funktion **und** Inhalt; falls relevant auch wie
> Sveltia es löst), nie aus Allgemeinwissen „geht nicht" behaupten. Vollständige
> Regel → `CLAUDE.md`, Abschnitt „Live-Wahrheit zuerst".

Pro Funktion gibt es **eine Sektion** (mit Datum), die das in `CLAUDE.md`
verankerte Verfahren (**Schritt 0 + A–D**) dokumentiert:

- **0 — Live-Wahrheit:** belegte Analyse der Live-Umsetzung (Code-Fundstellen),
  inkl. CMS-Lösung (Sveltia), falls relevant — **vor** A.
- **A — Extrahieren:** nummerierte, vollständige Fähigkeiten-Liste aus dem
  echten `index.html`-Code (Detail-Ebene, feiner als die Inventur in `STATUS.md`).
- **B — Bestätigt:** Datum, an dem der Nutzer die Liste als **eingefrorene
  Soll-Vorgabe** bestätigt hat (vor dem Bauen).
- **C — Gebaut:** kurzer Hinweis, wo/wie in Astro nachgebaut.
- **D — Abhak-Vergleich:** jede Zeile der Liste mit Status, nach dem Neubau.

**Status-Legende (Schritt D):**
- ✅ **identisch** — Verhalten 1:1 wie auf `main`.
- ⚠️ **leicht abweichend** — funktioniert, weicht aber im Detail ab (Beschreibung Pflicht).
- ❌ **fehlt noch** — noch nicht (vollständig) nachgebaut.
- ⬜ **offen** — noch nicht gebaut/geprüft (Standard, solange Schritt C/D aussteht).

**„Fertig portiert" entscheidet der Nutzer**, nicht Claude — erst nach eigenem
Seite-an-Seite-Vergleich (alt auf `main` vs. neu auf Branch-Vorschau).

---

## Funktions-Warteschlange (zu portieren)

Reihenfolge/Status des Umbaus. Eine Funktion bekommt ihre Detail-Sektion erst,
wenn sie konkret drankommt (Schritt A). Grobe Risiko-Einschätzung aus `STATUS.md`.

| # | Funktion | Risiko | Stufe | Capability-Lock-Status |
|---|---|---|---|---|
| 1 | Stories (Liste + Reader, DE/EN, YouTube) | 🟡 | 1 | ✅ Schritt 4 freigegeben (2026-06-02) — Sektion unten. Tina-Anbindung (Schritt 5) folgt. |
| 2 | Galerie / Alben (3 Sortiermodi, Auto-Diashow) | 🟡/🔴 | 2 | ⬜ offen |
| 3 | Lightbox + Filmstreifen (Snap, Gesten, Marker) | 🔴 | 2 | 🧪✅ **Prototyp auf Safari abgenommen (2026-06-02)** — „wie das Original". Sektion unten. Vollausbau offen. |
| 4 | Reise-Stationen (Snap-Bahn + IntersectionObserver) | 🔴 | 3 | 🧪 Prototyp ok (`/proto-karte`); Vollausbau offen |
| 5 | MapLibre-Karte (Stile, flyTo, Sprach-Labels) | 🔴🔴 | 3 | 🧪 Prototyp ok (`/proto-karte`); Vollausbau offen. **Befund: `projectUSA/Alaska/ensureXY` sind toter Legacy-Code (s. `ANALYSE-Reisen.md`) — nicht portieren.** |

> **Vorgemerkte Prüfpunkte für den Reisen-Capability-Lock (Schritt A/D später):**
> - **Karten-/Wisch-Timing identisch zur Live-Seite** (flyTo-Dauer 600ms, Snap-Gefühl,
>   Flick-Verhalten) — vom Nutzer beim Prototyp grob ok befunden, aber als eigener
>   Abhak-Punkt für die Feinjustierung im Vollausbau (Animations-Timing/Geschwindigkeit).
> - Vollständige Stile (5), `map_style`-Setting, Galerie, Stationsbilder/Video/YouTube,
>   DE/EN, Stop-Button-Liste, 8s-Stil-Fallback, Marker-Popup-Details.
| 6 | Hero-Umschalter (Bild/Slideshow/Video) | 🟡 | 3 | ⬜ offen |
| 7 | Startseite-Blöcke (Aktuell/Entdecken/Momentaufnahmen/Intro) | 🟡 | 3 | ⬜ offen |
| 8 | Equipment (Gear-Liste) | 🟢 | 3 | ⬜ offen |
| 9 | Wisch-/Trackpad-/Wheel-Gesten (querschnitt) | 🔴 | 2/3 | ⬜ offen |
| 10 | DE/EN-Zweisprachigkeit (querschnitt) | 🔴 | je Funktion | ⬜ offen |
| 11 | In-Page-Admin-Overlay (ggf. durch Tina ersetzt) | 🔴 | offen | ⬜ offen |

> Diese Tabelle ist die Übersicht. Sobald eine Funktion drankommt, wird ihre
> Detail-Sektion unten nach der Vorlage angelegt.

---

## Vorlage für eine Funktions-Sektion (kopieren, wenn eine Funktion drankommt)

```
## <Funktionsname>
_Stand A (extrahiert): YYYY-MM-DD · B (bestätigt): — · D (verglichen): —_

### A — Soll-Fähigkeiten (aus index.html, eingefroren nach Bestätigung)
1. <Verhalten 1, präzise>
2. <Verhalten 2>
3. ...

### B — Nutzer-Bestätigung
- [ ] Liste vom Nutzer als vollständig bestätigt am: ____  (dann eingefroren)

### C — Neubau (Astro)
- Wo umgesetzt: <Dateien/Komponenten>
- Hinweise: <z. B. React-Insel nötig, weil …>

### D — Abhak-Vergleich (nach Neubau)
| # | Fähigkeit | Status | Anmerkung |
|---|---|---|---|
| 1 | <Verhalten 1> | ⬜ | |
| 2 | <Verhalten 2> | ⬜ | |

- [ ] Nutzer hat Seite-an-Seite verglichen und „fertig portiert" bestätigt am: ____
```

---

## Stories (Liste + Reader, DE/EN)
_Stand A (extrahiert): 2026-06-02 · B (Design/Mountains bestätigt): 2026-06-02 · D (verglichen): Build fertig, Gesamt-Freigabe ausstehend (Nutzer prüft DE/EN)_

Quelle im echten Code: `renderStories` (2566), `renderStory` (2847),
`buildStory` (2513), `mdToHtml` (2434), `wwYouTubeEmbed` (3495),
`wwMediaBox`/`phAttrs` (1604/1583), `ILLUS` (1264), `pickEN`/`pickHasEN` (1541/1551).
Neubau: `web/src/` (lib/stories.ts, lib/illus.ts, components/StoryCard.astro,
components/PhPlaceholder.astro, pages/index.astro, pages/en/index.astro,
pages/stories/[slug].astro, pages/en/stories/[slug].astro, styles/global.css).

### A — Soll-Fähigkeiten (eingefroren)
**Liste**
1. Stories als Karten in 3-Spalten-Grid (`.stories-grid`), mobil 1 Spalte.
2. Reihenfolge **neueste zuerst** (Datum absteigend, wie `build-indexes.js`).
3. Karte zeigt: Medienbox (Cover-Foto **oder** `mountains`-Illustrations-Platzhalter),
   Kategorie (`.meta`), Titel (`h3`), Anriss (`.excerpt`), Read-Label
   („Weiterlesen"/„Read more") mit `→`.
4. Ganze Karte klickbar → öffnet die Story.
5. Hover: Karte hebt an + Schatten; Read-Pfeil wandert.

**Reader**
6. Hero: Cover als `<img class="reader-cover-img">` wenn `cover` gesetzt, sonst
   Platzhalter mit `mountains`-Illustration (Verlaufs-Himmel, Sonne mit Strahlen,
   Berge, gepunktete Linie).
7. Hero-Verlaufs-Überblendung nach unten (`reader-hero::before`).
8. Hero-Inner: Kategorie (`.meta`) + Titel (`h1`).
9. Body aus Markdown via `mdToHtml`, Sonderfälle **identisch**:
   (a) Pullquote aus `>`-Block · (b) `#`/`##`→`h2`, `###`→`h3` · (c) Listen `-`/`*`
   und `1.` · (d) Bilder `![]()`→`<img loading="lazy">` + Pfad-Normalisierung ·
   (e) Inline `**fett**`/`*kursiv*`/`~~~~`/`[Link]`(target=_blank,rel=noopener) ·
   (f) Raw-HTML-Block unverändert · (g) Dropcap auf 1. Absatz (CSS first-letter).
10. Optionaler YouTube-Embed am Body-Ende (nocookie, 16:9), nur bei gültiger ID.
11. Vor/Zurück-Navigation (`.reader-nav`) mit Titel der Nachbar-Story; Ränder disabled.
12. Body-Bilder als klickbare Lightbox-Gruppe (Blättern/Wischen).

**Querschnitt**
13. DE/EN: bei `has_english` EN-Felder, sonst Fallback auf DE; Datum lokalisiert;
    Read-/Nav-Labels sprachabhängig.
14. In-Page-Admin: Edit-Stifte/Toolbar auf Karten + Reader → Sprung ins CMS.

### B — Nutzer-Bestätigung
- [x] Design-System + `mountains`-Illustration vom Nutzer als deckungsgleich
      bestätigt (2026-06-02).
- [ ] **Gesamt-Freigabe** Schritt 4: ausstehend — Nutzer prüft noch die **DE/EN-
      Umschaltung** an einer zweisprachigen Story (englischer Text, nicht nur Layout).

### C — Neubau (Astro)
- Reines Astro (Build-Zeit-Rendering), **keine** React-Insel (kommt minimal in
  Schritt 5 für Tina). Helfer als 1:1-TS-Port (`lib/stories.ts`), ILLUS byte-identisch
  (`lib/illus.ts`).

### D — Abhak-Vergleich (alt auf `main` vs. neu auf Branch)
| # | Fähigkeit | Status | Anmerkung |
|---|---|---|---|
| 1 | 3-Spalten-Grid / mobil 1 Spalte | ✅ | CSS aus index.html übernommen |
| 2 | Neueste zuerst | ✅ | Datum absteigend, geprüft (utah→yellowstone→yosemite) |
| 3 | Karte: Medienbox/meta/title/excerpt/read | ✅ | Markup wie `renderStories` |
| 4 | Karte klickbar | ✅ | als `<a>` (statt JS-Klick) |
| 5 | Hover anheben/Schatten/Pfeil | ✅ | |
| 6 | Hero Cover/Platzhalter (mountains) | ✅ | nachgezogen, deckungsgleich bestätigt |
| 7 | Hero-Verlaufs-Überblendung | ✅ | |
| 8 | Hero meta + h1 | ✅ | |
| 9 | `mdToHtml`-Sonderfälle (a–g) | ✅ | 1:1-Port; Pullquote/Dropcap im Build verifiziert |
| 10 | YouTube-Embed | ✅ | Code identisch (aktuell hat keine Story eine URL) |
| 11 | Vor/Zurück-Navigation | ⚠️ | funktional + optisch identisch, aber echte `<a>`-Links statt JS-Buttons (CSS-Selektor auf `a` erweitert) |
| 12 | Body-Bilder-Lightbox | ❌ | **bewusst nicht in Stufe 1** — Lightbox folgt in Stufe 2; Bilder zeigen nur `cursor: zoom-in`. (Die 3 Stories haben keine Inline-Bilder.) |
| 13 | DE/EN-Umschaltung | ✅ | Nutzer hat EN-Story geprüft (Titel/Kategorie/Dropcap/Pullquote/Body vollständig), 2026-06-02 |
| 14 | In-Page-Admin-Stifte | ❌ | **bewusst nicht portiert** — wird in Schritt 5 durch Tina ersetzt |

**Zusätzliche Abweichungen (benannt, nicht verschwiegen):**
- Listen-Header-Texte (Kicker/H1/Intro) sind faithful **hartkodiert**; live kommen
  sie aus CMS-Settings (`pagetitles.*`) — spätere Settings-Anbindung offen.
- Uploads lokal via gitignored Symlink `web/public/uploads`; produktive
  Auslieferung wird in Schritt 6 entschieden.

- [x] Nutzer hat Seite-an-Seite verglichen und **„Schritt 4 freigegeben"**
      bestätigt am: 2026-06-02 (Design, Mountains-Illustration, DE/EN-Umschaltung).

---

## Lightbox + Filmstreifen (gemeinsame Komponente)
_Stand A (extrahiert): 2026-06-02 · B (bestätigt): — · D (verglichen): Prototyp gebaut, Nutzer-Abnahme (bes. Safari) ausstehend_

Quelle im echten Code: HTML-Markup (1233), CSS (375–495), JS: `openLightbox` (2341),
`openLightboxGallery` (2172), `buildLbTrack` (2257), `buildFilmstrip` (2190),
`observeLbSlides` (2278), `setLbCurrent` (2295), `lbCenterStrip` (2214),
`lbScrollToIndex` (2306), `lbStep` (2314), `lbFilmstripCenterIndex` (2235),
`lbStripUser` (2250), Wheel-/Touch-/Key-Verdrahtung (3731–3800).
Neubau (Prototyp): `web/src/components/Lightbox.tsx` + `web/src/pages/proto-lightbox.astro`.

### A — Soll-Fähigkeiten (eingefroren nach Bestätigung)
**Öffnen / Schließen / Modi**
1. Öffnen als Vollbild-Overlay (fixed, inset 0, BG `rgba(20,17,12,.94)`, `body` scroll gesperrt).
2. Schließen: ✕-Button, Klick auf den dunklen Rand (`target===lightbox`), **Esc**.
3. Zwei Modi: **Einzelbild** (`openLightbox`: Foto/Illustration/URL) vs. **Galerie**
   (`openLightboxGallery`: Liste + Start-Index + Albumname). Galerie toggelt `lb-gallery`
   (Bahn an, Einzel-`.ph` aus, Full-Bleed).

**Hauptbild-Bahn (`lb-track`)**
4. Eine **Snap-Slide je Bild** (`flex 0 0 100%`, `scroll-snap-align: center`, **kein
   `scroll-snap-stop`** → flüssiges Doppelwischen, kräftiger Flick darf mehrere weiter).
5. Native horizontale **Scroll-Snap-Bahn** (`x mandatory`, `overscroll-behavior-x: contain`,
   Scrollbar aus, Höhe **78dvh**, `gap: 28px` nur zwischen Bildern, Bilder `object-fit: contain`).
6. Beim Öffnen **instant** zur Start-Slide, **dann** Observer verbinden.
7. **IntersectionObserver** (root=track, Schwelle 0.6) → mittiges Bild = aktiv → `setLbCurrent`.
8. `lbScrollToIndex` via `offsetLeft`-`scrollTo` (gap-sicher): **smooth** bei Pfeil/Thumb-Klick,
   **instant** beim Öffnen.

**Filmstreifen (`lb-filmstrip`)**
9. Ein **Thumb je Bild** (64px, `background cover`, `scroll-snap-align: center`,
   **`scroll-snap-stop: always`**).
10. Streifen **fixed unten, um 34px + safe-area angehoben** (aus der iOS-Gesten-Zone),
    native Snap-Bahn (`x mandatory`, `touch-action: pan-x`, `overscroll contain`).
11. **Flex-Spacer-Zentrierung** (`::before/::after { flex: 0 0 calc(50% - 40px) }`) statt
    seitlichem Padding — wegen **WebKit-`scrollWidth`-Bug** (Safari lässt End-Padding bei
    Flex-Scroll-Containern weg → sonst auf Desktop unscrollbar). Erstes/letztes Thumb mittig erreichbar.
12. **Feste Mitte-Markierung** (`lb-strip-marker::before`: ortsfester Akzent-Rahmen 68px in
    der Streifen-Mitte; `box-shadow` dunkelt **nur den Streifen** ab, nicht das Hauptbild;
    `pointer-events: none`). Thumbs laufen durch den Marker → was mittig steht, ist aktiv
    (kein wanderndes aktives Thumb).
13. **Thumb-Klick** → `lbScrollToIndex(idx, true)` (Hauptbild springt smooth).
14. Aktiver Thumb markiert (`lbMarkThumb`).

**Zwei-Wege-Kopplung + Anti-Rückkopplung (Kernstück)**
15. **Hauptbahn treibt Streifen:** `setLbCurrent` → `lbCenterStrip(idx)`.
16. **`lbCenterStrip` Snap-off/on-Trick:** `x mandatory` zieht einen programmatischen
    `scrollLeft` sofort auf die alte Snap-Grenze zurück → Snap kurz **aus**
    (`scrollSnapType='none'`), `scrollLeft` setzen, im nächsten **`requestAnimationFrame`**
    wieder **an** → Thumb zentriert + eingerastet.
17. **Streifen treibt Hauptbild:** `scroll`-Handler → `lbFilmstripCenterIndex` → Hauptbild
    **instant** nachziehen.
18. **Anti-Rückkopplung:** `lbStripUser()` setzt `lbStripActive=true` (180ms Idle) bei echter
    Streifen-Geste; solange aktiv **pausiert** `lbCenterStrip` (`if !lbStripActive`) → kein
    Aufschaukeln Hauptbahn↔Streifen.

**Wheel / Trackpad / Touch am Streifen**
19. **Entprellter Wheel-Handler:** Trackpad-Horizontal (`deltaX≠0`) → **nativ** lassen
    (Momentum+Snap), nur `lbStripUser`. Klassische Maus (nur `deltaY`) → auf horizontalen
    `scrollLeft` mappen, **Snap für die Bewegung aus, nach 140ms Stille wieder an**
    (`preventDefault` bei `deltaY`).
20. Touch-Drag am Streifen (`touchmove` → `lbStripUser`); `scroll`-Handler hält `lbStripActive`
    während des Momentums.

**Pfeile / Tastatur / Umlauf**
21. Blätter-Pfeile (Glas-Kreis mit Blur, `top: 39dvh` = Bildmitte), nur Galerie-Modus mit
    >1 Bild sichtbar (`lb-hidden` toggle).
22. `lbStep(dir)`: aktuelle Slide per `offsetLeft`, ±1, `scrollTo` smooth.
23. **Umlauf-Option** (`gallery_loop`, Default **an**): über die Enden wrappen (modulo); sonst
    klemmen. Bei Umlauf beide Pfeile durchgehend sichtbar.
24. **Tastatur:** ←/→ blättern, **Esc** schließt — nur wenn offen + Galerie-Modus.

**Caption / Responsive / Detail**
25. Caption **„Album · X / Y"** (`lbSetCaption`), folgt dem aktiven Index.
26. **Mobile ≤640px:** Thumbs 50px, Marker 70px/54px-Loch, Spacer `50%-33px`, Pfeile 44px.
27. **Querformat-Handy** (`landscape` + `max-height:500px`): Bild/Track 52dvh, Pfeile `top:26dvh`,
    kleinere Thumbs/Reserve.
28. `dvh` statt `vh` überall (folgt der Safari-URL-Leiste).
29. Expand-Affordanz (`zoom-hint::after`) an den Auslöse-Bildern signalisiert „Klick öffnet groß"
    (gehört zur Bildquelle, nicht zur Lightbox selbst).

### B — Nutzer-Bestätigung
- [ ] Liste als vollständig bestätigt am: ____ (dann eingefroren). *David darf fehlende Punkte ergänzen.*

### C — Neubau (Astro/React-Insel)
- Wiederverwendbare Komponente `Lightbox.tsx` (später für Stories/Stationen/Reisen/Alben).
  Prototyp-Seite `proto-lightbox` mit echtem Album (`content/albums/2024-erste-fotos.json`, 8 Fotos).
  CSS 1:1 aus `index.html`.

### D — Abhak-Vergleich (nach Neubau) — Prototyp (Chromium-Test; Safari = Nutzer)
| # | Fähigkeit | Status | Anmerkung |
|---|---|---|---|
| 1–3 | Öffnen/Schließen/Modi (Galerie) | ✅ | Overlay, ✕/Rand/Esc, Galerie-Modus geprüft |
| 4–8 | Hauptbild-Bahn (Snap, Observer, scrollToIndex) | ✅ | Start-Index, Snap-Slides, Observer aktiv |
| 9–14 | Filmstreifen + Flex-Spacer + Marker | ✅ | Marker zentriert, aktiver Thumb mittig, Spacer macht 1. Thumb mittig (scrollLeft 0) |
| 15–18 | Zwei-Wege-Kopplung + Anti-Rückkopplung + Snap-Trick | ✅ | Hauptbahn→Streifen **und** Streifen→Hauptbild verifiziert; `scrollSnapType` korrekt restauriert; kein Aufschaukeln |
| 19–20 | Wheel (entprellt) / Touch am Streifen | ⚠️ | Maus-Wheel→Hauptbild verifiziert; **echtes Trackpad/Touch nur am Gerät** (Nutzer) |
| 21–22 | Pfeile + `lbStep` | ✅ | schrittweise 0→1→2 verifiziert |
| 23 | Umlauf (`gallery_loop`) | ⏳ | Code portiert; Wrap an den Enden noch nicht explizit gegengetestet (Nutzer) |
| 24 | Tastatur ←/→/Esc | ✅ | verdrahtet/geprüft |
| 25 | Caption „Album · X / Y" | ✅ | folgt Index |
| 26–28 | Responsive + `dvh` | ⏳ | CSS 1:1 übernommen; **Mobile/Querformat/Safari-URL-Leiste = Nutzer-Test** |
| 29 | Expand-Affordanz | ⬜ | gehört zur Bildquelle, nicht zur Lightbox-Insel (separat) |

**Safari-Abnahme (2026-06-02):** Nutzer hat den Prototyp auf **Safari** Seite-an-Seite
getestet — **Filmstreifen-Wischen/Einrasten/zentrierter Marker „einwandfrei, wie das
Original"**. Damit sind die ⚠️/⏳-Punkte (echtes Touch/Trackpad, Safari-`scrollLeft`/
Snap, `dvh`/Querformat) **bestätigt**. (Umlauf-Wrap im Vollausbau noch final mitprüfen.)

- [x] Nutzer hat Seite-an-Seite verglichen (**bes. Filmstreifen-Wischen auf Safari**) und
      **„Prototyp bestanden"** bestätigt am: **2026-06-02** — „wie das Original".

---

# Gear / Equipment (Stufe 2) — Capability-Lock

**Schritt 0 (Live-Wahrheit):** Quelle = echter Code: `index.html` (`GEAR_CATS`,
`buildGearFromItems`, `loadGear`, `renderGear`, CSS Z. 701–721), `content/gear.json`,
`content/text-gear.json`, `admin/config.yml` (equipment + gear_text).
**Schritt B:** Liste vom Nutzer bestätigt am **2026-06-03** („Liste passt, nichts vermisst");
Entscheidung: `category` als **Dropdown** (7 feste Werte) statt Freitext.

## Eingefrorene Soll-Liste (21 Punkte) + Abhak-Vergleich (Schritt D, 2026-06-03)

| # | Fähigkeit | Status | Notiz (neue Umsetzung) |
|---|---|---|---|
| 1 | Datenquelle flache Item-Liste (name/brand/category/link) | ✅ | `src/data/gear.json` (1:1 migriert) |
| 2 | 7 feste Kategorien mit DE/EN-Label | ✅ | `src/lib/gear.ts` `GEAR_CATS` 1:1 |
| 3 | Kategorie-Reihenfolge = Anzeige (nicht alphabetisch) | ✅ | HTML verifiziert: Cameras→…→Cooking |
| 4 | Leere Kategorien ausgeblendet | ✅ | `groupGear` filtert `length>0` |
| 5 | Items in gear.json-Reihenfolge | ✅ | keine Sortierung |
| 6 | Unbekannte/fehlende category fällt raus | ✅ | exakter Filter — **+ Dropdown verhindert Tippfehler** |
| 7 | Liste max-width 620px, zentriert | ✅ | CSS 1:1 in `global.css` |
| 8 | `<h3>` Akzent/UPPERCASE/letter-spacing/Unterstrich | ✅ | CSS 1:1 |
| 9 | Name links, Marke rechts (rechtsbündig) | ✅ | verifiziert |
| 10 | Letzte Zeile pro Kategorie: keine Trennlinie | ✅ | `:last-child` 1:1 |
| 11 | Name mit Link → `<a>` neuer Tab/`rel=noopener` + „↗" | ✅ | HTML + CSS `::after` verifiziert |
| 12 | Name ohne Link → schlichter `<span>`, kein Pfeil | ✅ | iPhone (leerer Link) verifiziert |
| 13 | Marke immer sichtbar (nowrap) | ✅ | CSS 1:1 |
| 14 | Mobile <620px: Zeile umbricht, Marke eigene Zeile | ✅ | Media-Query 1:1 |
| 15 | Kicker/Titel/Intro aus `gear-text.json` (DE/EN) | ✅ | `src/data/gear-text.json` + Seiten |
| 16 | Sinnvolle Defaults | ✅ | 1:1 aus `text-gear.json` migriert |
| 17 | DE/EN-Umschaltung (Labels + Kopf-Texte) | ✅ | `/gear` (DE) + `/en/gear` (EN), `lang`-Prop |
| 18 | Sicherheit: HTML-Escape + nur http(s)-Links | ✅ | Astro-Auto-Escape (`&quot;`/`&amp;`) + `safeUrl()` |
| 19 | Fallback wenn gear.json nicht ladbar | ⚠️ | **Anders/entfällt:** Astro backt Daten beim Build statisch ein → kein Runtime-Fetch, kein Fehlerfall. Sichtbares Ergebnis identisch (Daten immer da). |
| 20 | CMS: Gear-Liste (name/brand/category/link) | ✅ | Tina-Collection `gear` (Kategorie = Dropdown) |
| 21 | CMS: Seitentext kicker/title/intro DE/EN | ✅ | Tina-Collection `gear_text` |

**Bewusst NICHT 1:1 (Architektur, mit Nutzer abgestimmt):**
- In-Page-Admin-Overlay (Edit-Stifte, „+ Neuer Eintrag") → ersetzt durch Tina-Editor.

**Nachgerüstet auf Nutzer-Wunsch (2026-06-03):**
- **Ein** CMS-Menüpunkt „🎒 Equipment" (Texte + Liste in `gear.json`) statt zwei.
- **Tina-Live-Vorschau wie Stories**: `GearContent.tsx` (React-Insel, `useTina` +
  `tinaField`/Klick-ins-Feld), Seiten holen Daten über den Tina-Client, Router → `/gear`.
  (Der frühere ⚠️-Punkt „keine Live-Vorschau" ist damit erledigt.) Besucher-Ergebnis
  unverändert (Capability-A-konform). Commit `146d120`.

**CMS-Ideen mitgenommen:** C6/C7 (einheitliche Hilfetexte/Hints an allen Feldern:
Name „z. B. Sony A7 IV", Link „Volle URL (https://…)…", Kategorie-Beschreibung).
C5 (Foto-Feld) **nicht relevant** — Gear hat keine Bilder.

- [x] Nutzer hat Gear Seite-an-Seite (Live vs. `…-astro.pages.dev/gear`) verglichen und
      **abgenommen am 2026-06-04** („passt, next!") — inkl. zusammengelegtem CMS-Eintrag
      + Live-Vorschau. **Gear gilt als fertig portiert.** ✅

---

# Über uns (Stufe 3) — Capability-Lock

**Schritt 0 (Live-Wahrheit):** echter Code — `index.html` (#page-about, .about-band,
.person/.role/.bio/.gear, .home-intro/.divider-orn, Personen-Foto-Injektion),
`content/about.json`, `admin/config.yml` (ueber_uns).
**Schritt B:** Liste vom Nutzer bestätigt **2026-06-04** („alles. a b und c") +
Entscheidungen: (a) Namen **editierbar**, (b) Foto = **Auto-WebP-Upload**, (c) Route **/about**.

## Soll-Liste + Abhak-Vergleich (Schritt D, 2026-06-04)

| # | Fähigkeit | Status | Notiz |
|---|---|---|---|
| 1 | Seitenkopf Kicker/Titel/Einleitung (DE/EN) | ✅ | `about.json` + AboutContent |
| 2 | Dunkler `about-band`, 2-Spalten-Grid | ✅ | `#page-about .about-band` 1:1 |
| 3 | Zwei Personen-Karten, feste Reihenfolge | ✅ | person1/person2 |
| 4 | „Warum die USA?"-Block (home-intro, h2 + ✦ + Text) | ✅ | `divider-orn` 1:1 |
| 5 | Foto: hochgeladen → Bild; sonst Illustration | ✅ | desert/coast + Original-Farben; Bild via `ww-person-img` |
| 6 | Name (war fest verdrahtet) | ✅ | jetzt **editierbar** (Entscheidung a), Default = Originalnamen |
| 7 | Rolle (uppercase/Akzent), Bio, Gear-Zeile | ✅ | Typo/Farben 1:1 |
| 8 | Gear-Zeile = freier Text, NICHT mit Equipment verknüpft | ✅ | 1:1 (eigenständig pflegbar) |
| 9 | Styles Personen-Karten 1:1 (dunkel, Rahmen, Padding) | ✅ | `global.css` |
| 10 | Mobile <860px → 1 Spalte | ✅ | Media-Query 1:1 |
| 11 | DE/EN-Umschaltung aller Texte | ✅ | `/about` + `/en/about` |
| 12 | Datenquelle `about.json` (alle DE/EN + 2 Fotos) | ✅ | verschachtelt migriert |

**Konsolidiert + Live-Vorschau (Leitprinzip):**
- **EIN** Tina-Eintrag „📄 Über uns" (Kopf + je Person Name/Rolle/Bio/Gear/Foto + „Warum die USA?").
- **Live-Vorschau** (AboutContent.tsx, `useTina` + `tinaField` — auch verschachtelt
  `person1.name`), Router → `/about`.
- **Personen-Foto = neues `SinglePhotoField`** (Auto-WebP, Q85, ≤2400px). WebP-Logik
  in `webpEncode.ts` ausgelagert → BulkPhotoField nutzt sie identisch weiter.

**⚠️ kleiner Hinweis:** Foto-Fallback zeigt die Illustration (wie Live `has-illus`),
ohne Namens-Overlay. Da beide Personen Fotos haben, aktuell nicht sichtbar.

- [x] Nutzer hat Über uns **abgenommen am 2026-06-04** („passt für mich!"). Inkl. CMS-
      Verfeinerungen: EIN konsolidierter Eintrag, Personen als aufklappbare Liste,
      DE/EN-Felder inline (auto-wachsend), globaler Apple-Englisch-Schalter (Standard
      nur Deutsch). Besucher-Seite 1:1. **Feinschliff (Optik Editor) später vorgemerkt.**
      **Über uns gilt als fertig portiert.** ✅

---

# Kontakt (Stufe 4) — Capability-Lock

**Schritt 0 (Live-Wahrheit):** echter Code — `index.html` (#page-contact, contact-grid,
`renderContactChannels`, `wwSocialIcon`, `handleSend`, Form-CSS), `content/contact.json`,
`admin/config.yml` (kontakt + channels-Select).
**Schritt B:** Liste bestätigt **2026-06-04** („a und b und c"): (a) Formular **als Vorschau
1:1** (echtes Senden = separater Schritt mit Datenschutz-Blick), (b) konsolidiert + Englisch-
Schalter + auto-Felder + Kanal-Typ-Dropdown, (c) Route `/contact`.

## Soll-Liste + Abhak-Vergleich (Schritt D, 2026-06-04)

| # | Fähigkeit | Status | Notiz |
|---|---|---|---|
| 1 | Seitenkopf Kicker/Titel/Intro (DE/EN) | ✅ | `contact.json` + ContactContent |
| 2 | 2-Spalten-Grid, mobil <860px → 1 Spalte | ✅ | `.contact-grid` 1:1 |
| 3 | Links: „Schreib uns direkt" (Titel+Text) + Kanal-Liste | ✅ | |
| 4 | Rechts: Kontaktformular | ✅ | |
| 5 | Kanal: Auto-Icon nach Typ + Label; mit URL → Link, sonst Text | ✅ | `socialIcons.ts` |
| 6 | 10 Kanal-Typen mit eigenem SVG-Icon | ✅ | email/instagram/…/web 1:1 |
| 7 | Standort-Zeile am Ende (Web-Icon + location) | ✅ | |
| 8 | Form-Felder Name/E-Mail/Nachricht (Labels DE/EN) | ✅ | |
| 9 | Senden: alle Felder gefüllt? sonst Alert; sonst Erfolg + leeren | ✅ | React-State, 1:1-Verhalten |
| 10 | Formular = Vorschau, versendet NICHTS | ✅ | 1:1 (echtes Senden später, Entscheidung a) |
| 11 | Styles 1:1 (Felder, Fokus-Rand, Erfolgs-Box grün, `.btn.dark`) | ✅ | `global.css` |
| 12 | DE/EN-Umschaltung; Quelle `contact.json` | ✅ | `/contact` + `/en/contact` |

**Konsolidiert (Leitprinzip):** EIN Tina-Eintrag „✉️ Kontakt" (Englisch-Schalter,
auto-wachsende Felder, Kanal-Typ als Dropdown, Live-Vorschau, Router → `/contact`).
**Offen / eigener Schritt:** echtes Formular-Versenden (Dienst + Datenschutz) — „W5", später.

- [x] Nutzer hat Kontakt **abgenommen am 2026-06-04** („passt!"). CMS-Edit verifiziert
      (Nutzer hat über Tina einen 3. Kanal ergänzt). **Kontakt gilt als fertig portiert.** ✅
      (Echtes Formular-Senden „W5" bleibt offen — eigener Schritt.)

---

# Reisen (Stufe 5, 🔴🔴 größter Brocken) — Capability-Lock

**Schritt 0 (Live-Wahrheit):** vollständige Analyse in **`ANALYSE-Reisen.md`** (Karte,
Stationen, Ortssuche, Datenstruktur) + echter Code `index.html` (renderTrip, wwDrawTrip,
wwActivateStop, wwMapStyleUrl, wwSetMapLanguage, renderStops, buildStopHTML, buildTrip,
pickStopCoord, gallery_block), `content/trips/*.json` (5 Reisen), `admin/config.yml` (trips).
**Prototypen abgenommen:** MapLibre-Insel + Stationen-Wischen (`TripMapProto.tsx`, Safari ok),
Nominatim-Ortssuche (`LocationSearchField.tsx`).
**Schritt B:** Liste bestätigt **2026-06-04** („sollte erstmal passen"). Entscheidungen:
(a) Reisen-Collection (je Reise 1 Eintrag) + „Reisen-Einstellungen" (Texte + map_style),
(b) Album-Link jetzt technisch, aktiv ab Galerie, (c) WebP-Upload + Englisch-Schalter +
Live-Vorschau, (d) Route `/trips` + `/en/trips`.

## Eingefrorene Soll-Liste (18 Punkte)
A1 Seitenkopf (DE/EN) · A2 Reise-Tabs (aktiv, mobil scrollbar) · A3 Reise-Kopf (Titel/Datum/
Meta/Summary + „bald ✦" bei upcoming) · B4 MapLibre-Insel · B5 Marker (aktiv/Popup/Klick) ·
B6 fitBounds + flyTo · B7 5 Stile (map_style) · B8 Sprach-Labels · B9 scrollZoom-aus/
cooperativeGestures/8s-Fallback · C10 Snap-Bahn + Observer + Pfeile (entkoppelt) · C11 Stop-
Liste · D12 Stations-Karte (Station X/Y, Titel, Datum, Titelbild, Text) · D13 weitere Fotos →
**Lightbox** (Gruppe „stop") · D14 Video-Loop + YouTube · E15 verknüpftes Album (linked_trip) ·
E16 „Reisefazit"-Galerie (gallery_block, Captions DE/EN) · F17 Daten trips/*.json (DE/EN, GeoJSON-
Point, pickStopCoord-Fallbacks) · F18 Ortssuche-Feld (Nominatim).
**Bewusst NICHT portiert:** toter Legacy-Code projectUSA/Alaska/ensureXY (s. ANALYSE-Reisen.md).

(Schritt C/D folgen beim Bau.)
- [ ] Nutzer hat Reisen Seite-an-Seite (Live vs. `…-astro.pages.dev/trips`) verglichen und abgenommen.

---

# Galerie / Alben (Stufe 6, 🔴 letzter großer Brocken) — Capability-Lock

## Schritt 0 — Live-Wahrheit (Code-Fundstellen, `index.html`)
- `renderGallery` (1995), Modus-Schalter `setGalleryMode` (1831), Modus-Sichtbarkeit
  `applyGalleryModes` (3919), Markup `#galleryModes`/`#galleryGrid` (1041–1046).
- Album-Aufbau `buildAlbumFromData` (1651), Palette `paletteFromString` (1715),
  flaches Portfolio `rebuildPortfolioFromAlbums` (1732), Laden `loadAlbums`/`loadHighlights` (1780/1760).
- Album-Karte: `makeAlbumSlideshow` (1851, inkl. `scrollToCell` 1876, Autoplay 4 s, Pfeile),
  `buildAlbumBody` (1925), Kachel `makeGalleryTile` (2084).
- Album-Unterseite `openAlbum`/`renderAlbum` (2903/2904).
- Reise→Album-Link im Reise-Summary (3226–3255, `.trip-album-link`).
- Daten: `content/albums/*.json` (`name_de/en, note_de/en, date, photos[]` flach,
  Alt-Format `{image,highlight}` toleriert, `linked_trip, pin{highlight,highlight_order},
  english{enabled,name_en,note_en}, highlight_photos[]`); Sortierung aus `albums-index.json`
  (`build-indexes.js`: angepinnte zuerst, dann Datum absteigend); Modi aus `gallery-settings.json`.
- **Toter Code (NICHT portieren):** In-Place-Aufklappen `setAlbumOpen`/`.album-toggle`
  (1941/CSS 311) wird **nirgends aufgerufen** — Album-Karten sind immer Diashow, Klick→Unterseite.
- **Außerhalb dieser Sektion (= Startseite, später):** `highlights.json`/`G_HIGHLIGHTS`,
  „Momentaufnahmen" (`renderRandomMoments`), „Neueste" (`renderLatest`), „Entdecken" (`renderDiscover`).

## A — Soll-Fähigkeiten (eingefroren nach Bestätigung)
A1 **Galerie-Seite** (`/gallery`?) mit Seitenkopf (Kicker/Titel/Einleitung, DE/EN) + Modus-Leiste.
A2 **Modus-Leiste** 3 Knöpfe: Alben / Neueste / A–Z (DE) bzw. Albums / Newest / A–Z (EN), aktiver markiert.
A3 **Modus-Sichtbarkeit** aus `gallery-settings`: Knopf aus → versteckt; bei ≤1 aktivem Modus ganze
   Leiste weg; abgeschalteter Aktiv-Modus → auf ersten sichtbaren wechseln; alles aus → Fallback „Alben".
A4 **Album-Modus**: 2-Spalten-Grid von Album-Karten (mobil 1 Spalte).
A5 **Album-Karte**: Titel + `→`-Pfeil + Foto-Anzahl-Badge + Notiz (falls vorhanden).
A6 **Auto-Diashow** in der Karte: horizontale Snap-Bahn der Fotos, **Autoplay alle 4 s**
   (am Ende instant zurück auf 0), **‹/›-Pfeile**, Autoplay stoppt bei bewusster Interaktion
   (pointerdown / horizontales Wheel); nur bei >1 Foto.
A7 **Klick (kein Wisch) auf die Diashow → Lightbox** der Album-Fotos ab dem aktuell zentrierten Bild.
A8 **Klick auf Album-Titel → Album-Unterseite** (Pfeil ist der Hinweis; Enter/Leertaste ebenso).
A9 **Flach-Modi** (Neueste/A–Z): alle Fotos aller Alben als ein Kachel-Grid;
   Neueste = nach Album-Datum absteigend (dann Album-Reihenfolge); A–Z = nach Album-Name (dann Index).
A10 **Kachel** (`makeGalleryTile`): Platzhalter-Palette (stabil aus Pfad) + echtes Bild,
    Albumname als dezenter **Hover-Streifen** unten.
A11 **Kachel-Klick → Lightbox-Galerie** des jeweiligen Albums, Start beim geklickten Foto, mit Albumname.
A12 **Album-Unterseite** (`/gallery/<slug>`?): Kicker „Album" + Name + Notiz + flaches Kachel-Grid;
    Kachel-Klick → Lightbox wie A11.
A13 **Album-Sortierung** in der Galerie: angepinnte (`pin.highlight`) zuerst nach `highlight_order`,
    dann nach Datum absteigend (entspricht `build-indexes.js`/Reisen-Logik).
A14 **DE/EN**: Name/Notiz je `english.enabled` (EN-Fallback auf DE); Labels (Album/Modi/„Mehr Fotos…").
A15 **Reise→Album-Link**: im Reisen-Summary „Mehr Fotos im Album → [Name]" wenn ein Album
    `linked_trip === Reise-Slug`; Klick → zur Galerie. (Greift damit der schon gebauten Reisen-Seite.)
A16 **Lightbox**: nutzt die bereits abgenommene `Lightbox.tsx` (Gruppe = Album).
A17 **Daten/CMS**: Alben als Tina-Collection „🖼️ Alben" (je Album: Name/Notiz DE/EN via Englisch-
    Schalter, Datum, Foto-Liste Auto-WebP, `linked_trip`-Auswahl, Anheften+Reihenfolge) +
    EIN „🖼️ Galerie – Einstellungen" (Seitentexte + 3 Modus-Schalter). **Ein Menüpunkt je Belang** (Leitprinzip).
**Bewusst NICHT portiert:** toter In-Place-Toggle (A8 ersetzt ihn); Highlights/Momentaufnahmen/
Neueste/Entdecken = Startseiten-Sektion (separat, später).

## B — Nutzer-Bestätigung (2026-06-04)
- [x] **Eingefroren: A1–A17.** Scope-Frage „Home-Features?" → Nutzer „ist dir überlassen" →
  Entscheidung: **Galerie/Alben jetzt komplett**; die album-/highlight-getriebenen
  **Startseiten-Teaser** (Momentaufnahmen/Neueste/Entdecken) kommen als **nächste Sektion
  „Startseite"** (dort sind Stories/Reisen/Alben fertig + Home-Rahmen existiert).
- [x] **URL-Pfad: `/portfolio` + `/portfolio/<slug>`** (Nutzer „überlassen", intern heißt es
  schon `portfolio`). EN: `/en/portfolio`(+`/<slug>`).

## Vorgezogene Analyse — Startseiten-Teaser (für die Sektion „Startseite", NICHT hier bauen)
Aus Live-Code extrahiert (Schritt 0/A vorab erledigt, damit nichts verloren geht):
- **Momentaufnahmen** `renderRandomMoments` (2129), `#randomBox`: Highlight-Fotos (`portfolio`-
  Fotos mit `.highlight`) in Album-Reihenfolge; **kein Highlight → Zufalls-Mix** aller Fotos;
  **max. 6**; Kachel = MediaBox + Albumname-Label; Klick → `wwOpenImage(photo, shownGroup, name)`
  (Lightbox-Gruppe der gezeigten Momente). Highlight-Quelle: zentrale `highlights.json`
  (`G_HIGHLIGHTS`) **ODER** Alt-Per-Foto-Flag, ver-ODER-t.
- **Neueste / „Frisch aus dem Westen"** `renderLatest` (2655), `#latestGrid`: mischt **Stories**
  (nur wenn `show_stories`), **Reisen** (keine `upcoming`, nur mit Titel), **Alben** (mit Datum);
  Sortierung Datum absteigend; **Top 3**; Karten mit Tag (Neuer Beitrag/Neue Reise/Neues Album);
  Klick → Story/Reise/Galerie.
- **Entdecken** `renderDiscover` (2591), `#discoverGrid`, schaltbar via `appearance-settings`
  (`show_discover`, Default an): mischt **Highlight-Fotos + Alben + vergangene Reisen**,
  Fisher-Yates, **3 Teaser** (cat + title); leer → statische HTML-Platzhalter bleiben.
- **Highlights-CMS:** `content/highlights.json` (`{images:[...]}`) → bei der Startseite als
  EIN „⭐ Highlights"-Menüpunkt bauen (Foto-Liste). pin.highlight am Album ≠ Foto-Highlight:
  `pin` steuert Galerie-Sortierung, `highlights.json` steuert die Home-Teaser.

## C — Neubau (Astro) — gebaut 2026-06-04
`lib/albums.ts`, Inseln `GalleryContent.tsx` + `AlbumContent.tsx`, Seiten `/portfolio`
(+`/en`) + `/portfolio/<slug>` (+`/en`), CSS 1:1 in `global.css`. Daten: 2 Alben migriert,
`gallery-settings.json`. `astro build` grün (30 Seiten).

## D — Abhak-Vergleich (nach Neubau)
- ✅ A1 Seitenkopf (Kicker/Titel/Intro, DE/EN aus `gallery-settings`).
- ✅ A2 Modus-Leiste (Alben/Neueste/A–Z, EN-Labels, aktiver markiert).
- ✅ A3 Modus-Sichtbarkeit (Knopf aus → weg; ≤1 → Leiste weg; alles aus → Fallback „Alben").
  ⚠️ Live-Umschalten der Modi im CMS wirkt erst nach Reload (Einstellungen kommen als
  statischer Import, nicht via useTina) — Besucher-Verhalten identisch.
- ✅ A4 Album-Modus 2 Spalten (mobil 1).
- ✅ A5 Album-Karte (Titel + → + Anzahl-Badge + Notiz).
- ✅ A6 Auto-Diashow (Snap-Bahn, Autoplay 4 s, am Ende instant zu 0, ‹/›-Pfeile, Stopp bei
  pointerdown/horizontalem Wheel, nur >1 Foto).
- ✅ A7 Klick (kein Wisch) auf Diashow → Lightbox ab aktuell zentriertem Bild.
- ✅ A8 Klick auf Album-Titel → Album-Unterseite (Pfeil-Affordanz; als `<a>` jetzt auch
  echter Link/Mittelklick). Toter In-Place-Toggle bewusst weggelassen.
- ✅ A9 Flach-Modi (Neueste = Datum absteigend; A–Z = Name; dann Foto-Index).
- ✅ A10 Kachel (Platzhalter-Palette + Bild + Hover-Streifen mit Albumname).
- ✅ A11 Kachel-Klick → Lightbox des Albums ab dem Bild.
- ✅ A12 Album-Unterseite (Kicker „Album" + Name + Notiz + Kachel-Grid → Lightbox).
- ✅ A13 Sortierung (angepinnt zuerst → highlight_order → Datum absteigend, = build-indexes.js).
- ✅ A14 DE/EN (Englisch-Schalter; Labels Album/Modi/„Mehr Fotos…").
- ⚠️ A15 Reise→Album-Link: vorhanden, zeigt aber jetzt auf **die Album-Unterseite**
  `/portfolio/<slug>` statt (wie Live) auf die ganze Galerie — passt zum Link-Text
  „Mehr Fotos im Album" und nutzt die neue Route. **Bewusste Verbesserung, dem Nutzer
  vorgelegt.**
- ✅ A16 Lightbox = abgenommene `Lightbox.tsx` (Gruppe = Album, `loop` an).
- ✅ A17 CMS „🖼️ Alben" + „🖼️ Galerie – Einstellungen" (je ein Menüpunkt, Leitprinzip).

- [x] **Abgenommen (Nutzer „PASST!", 2026-06-04).** A15-Ziel (Album-Unterseite) mit ok.

---

# Startseite (Stufe 7) — in 4 Etappen, je eigener Capability-Lock
Reihenfolge (Nutzer „du entscheidest"): **1 Nav-Shell → 2 Hero → 3 Home-Teaser → 4 Intro/Social.**

## Etappe 1: Nav-Shell — Schritt 0 (Live-Wahrheit)
- Markup: `<header><nav>` (919–937), `<footer>` (1215–1230). CSS: `header` sticky/blur (129–136),
  `.nav`/`.nav-links`/`.lang-toggle`/`.burger` (137–162), mobiles Slide-in `.nav-links` (846–848),
  `footer` (768). Logo `applyBranding` (3962, ein `logo` → Nav/Hero/Footer), Sprache
  `applyLang`/`setLang` (1469/1493). Daten `appearance-settings.json` (`logo, show_hero_logo,
  show_discover`). Stories-Sichtbarkeit `show_stories`.

## Etappe 1 — A: Soll-Fähigkeiten (eingefroren nach Bestätigung)
N1 **Sticky Header** (durchscheinend + Blur + untere Linie, über Inhalt; Höhe 88 px, mobil 72).
N2 **Logo** (CMS `appearance.logo`) links → **Home** (`/` bzw. `/en/`).
N3 **7 Nav-Links**: Start/Portfolio/Stories/Reisen/Equipment/Über uns/Kontakt (EN: Home/
   Portfolio/Stories/Trips/Gear/About/Contact) → `/`, `/portfolio`, `/stories`, `/trips`,
   `/gear`, `/about`, `/contact` (EN mit `/en`-Präfix).
N4 **Aktiver Link** hervorgehoben (Accent + Unterstrich) je aktueller Seite.
N5 **Stories-Link** nur sichtbar, wenn Stories aktiv sind (`show_stories`) — in Nav, Footer, Hero-CTA.
N6 **DE/EN-Umschalter** (Pille, aktiver = Accent) → **gleiche Seite in der anderen Sprache**
   (`/...` ↔ `/en/...`); ersetzt das Live-`applyLang` (dort ein JS-Umschalter, hier echte Routen).
N7 **Burger-Menü** (mobil): Slide-in-Panel von rechts (78 % / max 320 px), schließt bei Link-Klick.
N8 **Footer** (dunkel): Logo + 7 Footer-Links + „© 2026 Alexandra Apostel & David Bastisch ·
   Admin" (Admin → `/admin`) + „Travel & Outdoor Photography" (DE/EN).
N9 **Logo-Quelle/CMS:** `appearance-settings.json` migrieren + EIN Menüpunkt „🎨 Darstellung"
   (Logo-Upload + `show_hero_logo` + `show_discover`; Letztere greifen in Etappe 2/3).
N10 **In `BaseLayout`** → erscheint auf **allen** Seiten; ersetzt das aktuelle nav-lose Layout.
**Bewusst NICHT portiert:** In-Page-Admin-Overlay (Edit-Stifte, `wwEnterAdmin`) — Tina-Visual-
Editing ersetzt es vollständig.

## Etappe 1 — B: Nutzer-Bestätigung (2026-06-04)
- [x] **N1–N10 eingefroren** (Nutzer „Ja, einfrieren & bauen").
- [x] **Stories ausgeblendet** wie Live (`show_stories=false`, via CMS schaltbar).
- [x] **Footer-Admin-Link → `/admin`** (Tina).

## Etappe 1 — C: Neubau (Astro) — 2026-06-04
`SiteNav.astro` + `SiteFooter.astro` in `BaseLayout` (Slot jetzt in `<main>`),
`appearance-settings.json` migriert + Tina „🎨 Darstellung". CSS 1:1 in `global.css`.

## Etappe 1 — D: Abhak-Vergleich (nach Neubau)
- ✅ N1 Sticky Header (Blur + untere Linie, z über Inhalt).
- ✅ N2 Logo (CMS) → Home.
- ✅ N3 7 Links mit korrekten DE/EN-URLs (im HTML verifiziert).
- ✅ N4 aktiver Link (Accent + Unterstrich) — `/trips`→Reisen, `/portfolio`→Portfolio, `/`→Start.
- ✅ N5 Stories-Link nur bei `show_stories` (aktuell aus → versteckt, verifiziert).
- ✅ N6 DE/EN → gleiche Seite in anderer Sprache (`/trips` ↔ `/en/trips`, verifiziert).
- ✅ N7 Burger (mobil Slide-in von rechts, X-Animation, schließt bei Link-Klick).
- ✅ N8 Footer (Logo + 7 Links + Copyright + Admin → `/admin` + Untertitel).
- ✅ N9 `appearance-settings` + „🎨 Darstellung" (Logo + Schalter).
- ✅ N10 in `BaseLayout` → alle Seiten (`astro build` grün, 30 Seiten).
- ⚠️ Hinweis: `/` zeigt noch die Stories-Liste (echter Home-Inhalt folgt Etappe 2/3);
  aktiver „Start"-Link stimmt bereits.

- [ ] Nutzer hat Nav-Shell Seite-an-Seite verglichen und abgenommen.

## Etappe 2: Hero — Schritt 0 (Live-Wahrheit)
- `renderHero` (3084): Modi `image`/`random`(Slideshow 5 s Überblendung)/`video`
  (autoplay/loop/muted/playsinline + `video_poster`); kein Medium → Verlauf-Platzhalter.
- Markup `.hero` (943–966): `hero-media`, `hero-logo` (`wwHeroLogo`, versteckt via
  `ww-hide-hero-logo`/`show_hero_logo`), `hero-tag` (Headline), `hero-cta` (2 Buttons),
  `scroll-hint` (↓), `hero-rip` (Inline-SVG Trockenpinsel-Kante). CSS 181–220, Buttons 222–228.
- Daten: `home.json` (`mode/image/slideshow[]/video/video_poster`), Texte `home-texts.json`
  (`hero.headline/cta_portfolio/cta_stories`, DE/EN). Logo aus `appearance.logo`.

## Etappe 2 — A: Soll-Fähigkeiten (eingefroren nach Bestätigung)
H1 Vollflächiger Hero (min-height 90vh, mobil 80; dunkler Verlauf als Fallback + Overlay).
H2 **Medien-Umschalter** (CMS `mode`): **image** (Einzelbild), **random** (Slideshow,
   Überblenden alle 5 s), **video** (autoplay/loop/muted/playsinline + optional Poster);
   kein Medium → Verlauf-Platzhalter.
H3 **Hero-Logo** mittig (CMS-Logo), nur bei `show_hero_logo`; fadeUp + Drop-Shadow.
H4 **Headline** (`hero.headline`, DE/EN) + **2 CTAs**: „Portfolio ansehen" → `/portfolio`
   (primär), „Reiseberichte lesen" → `/stories` (ghost, **nur wenn Stories sichtbar**);
   gestaffelte fadeUp-Animation.
H5 **Scroll-Hinweis** (↓, bob-Animation).
H6 **„Rip"-SVG** (Trockenpinsel-Kante) am Unterrand in Seitenfarbe (`--c-bg`).
H7 **CMS „🏠 Startseite"** (ein Menüpunkt): `mode`/Bild/Slideshow/Video/Poster + Hero-Texte
   (Headline + CTA-Labels). Intro/Social kommen in Etappe 4 in dasselbe Dokument.
H8 **`index.astro` wird zur echten Startseite** (Hero); die bisherige Stories-Liste wandert
   nach `/stories` (+`/en/stories`), damit sie (wenn aktiviert) erreichbar bleibt.

## Etappe 2 — B: Nutzer-Bestätigung (2026-06-04)
- [x] **H1–H8 eingefroren** (Nutzer „1, einfrieren & bauen"). Video-Feld = Pfad + Hinweis.
- Nutzer fragte nach **Profi-Politur-Ideen** → kommen als optionales Menü NACH dem 1:1-Bau.

## Etappe 2 — C: Neubau (Astro) — 2026-06-04
`HomeHero.astro` (+ Slideshow-Skript + Rip-SVG), `home-settings.json` + Tina „🏠 Startseite",
`index.astro`/`en/index.astro` = Hero, Stories-Liste → `/stories`(+`/en`). CSS 1:1 in `global.css`.

## Etappe 2 — D: Abhak-Vergleich (nach Neubau)
- ✅ H1 Vollflächiger Hero (90vh, Verlauf + Overlay).
- ✅ H2 Medien-Umschalter (image/random-Slideshow 5 s/video + Poster; sonst Verlauf) — im HTML verifiziert (Einzelbild).
- ✅ H3 Hero-Logo mittig (nur bei `show_hero_logo`), fadeUp.
- ✅ H4 Headline (DE/EN) + CTAs (Portfolio; Stories-ghost nur bei `show_stories` → aktuell versteckt, verifiziert).
- ✅ H5 Scroll-Pfeil (bob). ✅ H6 Rip-SVG (Seitenfarbe). 
- ✅ H7 CMS „🏠 Startseite" (Medien + Hero-Texte).
- ✅ H8 `index.astro` = Hero; Stories-Liste → `/stories` (+`/en`, Cards verifiziert). `astro build` grün (32 Seiten).

- [ ] Nutzer hat Hero Seite-an-Seite verglichen und abgenommen.
- [x] **Profi-Politur gebaut** (Nutzer „alles umsetzen, aber im CMS an-/abwählbar"): 4 Schalter
  unter „🏠 Startseite → Politur" (Standard an): **Ken-Burns** (langsamer Bild-Zoom),
  **stärkerer Verlauf** (Text-Pop), **edle Headline** (Fraunces, größer), **Scroll-Cue**
  (animierter Hinweis). `prefers-reduced-motion` respektiert. Aus = 1:1-Live-Look.
  **Bewusste, dokumentierte Abweichung vom Live-Stand (vom Nutzer gewünscht).**

## Etappe 3: Home-Teaser + Intro — Schritt 0/A
Live-Markup Home (977–1029): Intro-Block (`home-intro`), Momentaufnahmen (`random-box`),
Aktuell (`latest-grid`), Entdecken (`teaser-grid`, `data-discover-only`). Render-Funktionen
`renderRandomMoments` (2129), `renderLatest` (2655), `renderDiscover` (2591). Texte
`home-texts.json` (`sections.*`) + `home-intro.json` (`subline/subtext`).

**A — Soll-Fähigkeiten (eingefroren nach Bestätigung):**
T1 **Intro-Block**: Subline (h2) + ✦ (`divider-orn`) + Subtext (DE/EN). [Social-Row → Etappe 4.]
T2 **Momentaufnahmen** (Kicker „Portfolio", Titel „Momentaufnahmen/Moments"): bis **6** Bilder —
   Highlight-Fotos (aus „⭐ Highlights") in Album-Reihenfolge, sonst Zufalls-Mix aller Album-Fotos;
   Klick → **Lightbox**-Gruppe der gezeigten (React-Insel).
T3 **Aktuell** (Kicker „Aktuell/Latest", Titel „Frisch aus dem Westen/Fresh from the West"):
   **Top 3** aus Stories (nur wenn `show_stories`) + Reisen (keine `upcoming`, mit Titel) +
   Alben (mit Datum), nach Datum absteigend; Karte = Tag (Neuer Beitrag/Neue Reise/Neues Album) +
   Titel + Meta; Klick → Story/Reise/Galerie.
T4 **Entdecken** (Kicker „Entdecken/Explore", Titel „Wonach uns gerade ist/What we're drawn to"):
   **3 Teaser** aus Highlight-Fotos + Alben + vergangenen Reisen; Klick → Inhalt. Nur wenn
   `show_discover`. (Leerer Pool → keine Sektion.)
T5 **Highlights-CMS „⭐ Highlights"** (`highlights.json`: Foto-Liste Auto-WebP) → speist T2 + T4.
T6 **Texte ins CMS „🏠 Startseite"** (Intro `subline/subtext` + Sektion-Kicker/Titel) — Leitprinzip.
T7 **CSS 1:1**: `.random-box`/`.item .label`, `.latest-grid`/`.latest-card`, `.teaser-grid`/`.teaser`/`.ov`.
⚠️ **Zufall:** Live mischt pro Aufruf (`Math.random`); Astro statisch → **deterministisch beim Build**
   (keine Pro-Aufruf-Mischung). Optional später Client-Shuffle.

**B — Nutzer-Bestätigung (2026-06-04):**
- [x] **T1–T7 eingefroren** (Nutzer „1, offen für Verbesserungen"). „⭐ Highlights" eigener Menüpunkt.
- [x] **Zufall: Client-Shuffle** („beim Laden neu mischen, lebendig").

**C — Neubau (Astro) — `2b369bb`:** `lib/home.ts`, `HomeIntro.astro`, `HomeMoments.tsx`,
`HomeLatest.astro`, `HomeDiscover.tsx`; `index.astro`/`en` zeigen alle Sektionen. `highlights.json`
+ Tina „⭐ Highlights"; Intro/Sektion-Texte ins „🏠 Startseite". Teaser-CSS 1:1.

**D — Abhak-Vergleich:**
- ✅ T1 Intro (Subline „Zwei Blickwinkel…" + ✦ + Text). [Social-Row → Etappe 4.]
- ✅ T2 Momentaufnahmen (bis 6 Highlight-/Zufalls-Fotos, Klick→Lightbox; mischt beim Laden).
- ✅ T3 Aktuell (Top 3 Story/Reise/Album nach Datum; Tag/Titel/Meta; im HTML verifiziert: 3 Karten).
- ✅ T4 Entdecken (3 Teaser Fotos/Alben/Reisen; mischt beim Laden; nur bei `show_discover`).
- ✅ T5 „⭐ Highlights"-CMS speist T2/T4. ✅ T6 Texte im „🏠 Startseite". ✅ T7 CSS 1:1.
- ⚠️ Entdecken-Foto-Klick: führt zu `/portfolio` (Live: Einzelbild-Lightbox) — bewusst vereinfacht.
- ⚠️ Zufall jetzt Client-Shuffle statt Build-deterministisch (vom Nutzer gewünscht).
- [ ] Nutzer hat Etappe 3 verglichen und abgenommen. `astro build` grün (32 Seiten).

## Etappe 4: Intro-Social-Row — gebaut (`8ea67c2`)
- **S1** Social-Links im Intro (1:1 aus `renderHeroSocial`): `insta-row` mit Alexandra/David
  (`@a3_flow`/`@davidbastisch`), Icon + Profil-URL. ✅ (im HTML verifiziert)
- **S2** `socialUrl()` in `socialIcons.ts` (instagram/tiktok/youtube/facebook/x). ✅
- **S3** CMS: Social-Liste (Plattform-Auswahl + Username) im „🏠 Startseite"-Intro. ✅
- **Damit ist die Startseite vollständig** (Hero + Intro + Momentaufnahmen + Aktuell + Entdecken
  + Social). Capability-Lock D: S1–S3 ✅. **Offen:** Gesamt-Abnahme der Startseite.
- [ ] Nutzer hat die komplette Startseite Seite-an-Seite verglichen und abgenommen.

---

# Stories: Album-Einbettung + Laien-Text-Editor (NEU, über Live hinaus) — 2026-06-05

> **Schritt 0 — Live-Wahrheit (belegt):** Live-Stories (`admin/config.yml` Collection
> `stories`, `index.html`) bestehen aus **Titelbild (`cover`) + Markdown-Fließtext
> (`body_de/_en`) + optional YouTube** — **KEIN Galerie-Feld**. Bilder „im Beitrag"
> stehen inline als `![](…)` im Text (mdToHtml). Die Reisen-„Reisefazit"-Galerie ist
> im CMS ausdrücklich als *„NICHT zugeschnitten"* markiert (frisches Portfolio).
> → Der frühere Wunsch „Galerie zuschneiden" war auf eine Galerie aufgebaut, die es
> nicht gibt. Mit Nutzer-Freigabe stattdessen dieses **neue** Feature gebaut.

**Nutzer-Wunsch (bestätigt):** 1–2 eigene Bilder direkt im Text + ein bestehendes
Album an **frei wählbarer Stelle** als Lightbox einbetten, **ohne Doppel-Upload**,
**laientauglich** (keine Markdown-/Token-Syntax tippen).

**C — Gebaut (Astro/Tina):**
1. `StoryBodyField.tsx` — Haupttext-Editor: normales Textfeld + zwei Knöpfe.
   „📷 Bild einfügen" lädt Auto-WebP (jSquash, kein Media-Manager) hoch und setzt
   `![](pfad)` an die **Cursor-Stelle**. „📸 Album hier einfügen" setzt `[[album]]`
   an die Cursor-Stelle. Speicherformat bleibt **Markdown** → mdToHtml unverändert.
2. `linked_album` (Tina-`reference` auf `alben`) — Dropdown wählt das Album.
3. `StoryReaderContent` teilt `body` am `[[album]]`-Marker → `StoryAlbumBlock`
   (Vorschau-Kacheln erste 4 + „+N") öffnet die bestehende `Lightbox` mit allen
   Album-Fotos. Ohne Marker, aber mit Album → Block ans Ende.
4. `storyAlbum.ts` löst die Referenz auf (Slug → `alben`-Query → name/photos/href);
   Astro DE/EN übergeben `album`. Altes Story-`gallery`-Feld entfernt.

**Capability-Lock (keine bestehende Funktion verändert):**
- ✅ Titelbild/Body/YouTube/DE-EN-Logik unverändert (mdToHtml 1:1).
- ✅ Album-Fotos kommen aus dem Album → kein Doppel-Upload.
- ✅ Lightbox = die bestehende gemeinsame Komponente (1:1).
- ⚠️ NEU gegenüber Live (additiv, mit Freigabe): Album-Block im Text + Knopf-Editor.

**D — Verifikation (Build):** Offline-Build grün (29 Seiten). Positiv-Test (Story
testweise verknüpft + `[[album]]`): Block sitzt an der Marker-Stelle, 4 Kacheln aus
Album „Firsts" (Bild 1–4 von 8) + „+4", Link `/portfolio/2024-erste-fotos`, kein
Marker-Leak im sichtbaren Text, kein Block ohne Album. Test-Verknüpfung zurückgesetzt.
Commit `053ffeb`. **Offen:** Re-index + Rebuild, dann Nutzer-Abnahme (iPad: Knöpfe +
Upload, Lightbox-Touch).

---

# Reisen-Redesign „Variante B — vertikale Timeline / Reise-Journal" (PROTOTYP) — 2026-06-11

> **Status: reine Vorschau/Prototyp, NICHT abgenommen, NICHT der echte Umbau.** Bestehende
> Reisen-Seite (`TripsContent.tsx`, Route `/trips`), Tina-Schema (`reisen`-Collection) und
> echter Content (`src/data/trips/*.json`) bleiben **unverändert**. Der Prototyp liegt isoliert
> unter `src/pages/proto/reisen-timeline.astro` + `src/components/proto/*` + eigener CSS-Datei.

## Schritt 0 — Live-Wahrheit (echte Code-Fundstellen, Branch astro-umbau)
Analysiert wurde der **echte** aktuelle Astro-Code (nicht index.html), da die Reisen bereits
portiert sind:
- **Seite/Insel:** `src/pages/trips.astro` (+ `src/pages/trips/[slug].astro`, `en/trips.astro`)
  rendert **eine** React-Insel `src/components/TripsContent.tsx` (`client:load`). Daten kommen
  per `client.queries.reisenConnection({first:100})` (SSR) → `useTina` in der Insel (Live-Vorschau).
  Album-Links via `linkedAlbumsByTrip`, Karten-Einstellungen via `reisen_settings`.
- **Datenmodell:** `src/lib/trips.ts` — `RawTrip`/`RawStop`, `viewStops()` normalisiert,
  `pickCoord()` liest `location` (GeoJSON-Point-String), `photoFrame()` (CSS-Crop), `bi()` (DE/EN-
  Fallback), `sortTrips()` (order, dann Datum).
- **Tina-Schema (`reisen`, `tina/config.ts:325`):** Reise = order, title(+_en), date, meta(_de/_en),
  summary(_de/_en), upcoming, **stops[]**, gallery[]. **Stop** = name(req), location(GeoJSON via
  `LocationSearchField`), title(_de/_en), date(_de/_en), text(_de/_en, textarea), photo(Crop 16:10),
  photos[](BulkPhoto), video, youtube. **→ Es gibt KEIN Typ-Feld (Haupt/Zwischen) pro Stop.**

## A — Extrahierte Capabilities der heutigen Reisen-Seite (Ist-Stand, einzufrieren für 1:1-Umbau)
1. **Reise-Tabs** (`.trip-tabs`): horizontal scrollbar, aktiver markiert, Rand-Fade + Chevron-Pfeile,
   Auto-Zentrierung des aktiven Tabs, Klick wechselt Reise (`setTripIdx`), Analytics `track('reise')`.
2. **Reise-Kopf** (`.trip-summary`): meta-Zeile + summary (DE/EN), optional Album-Link.
3. **MapLibre-Karte** (`.map-box`, in `.map-layout` 2-spaltig): 1× erzeugt, `style` aus
   `reisen_settings.map_style` (live umstylebar via `setStyle`), `NavigationControl`, scrollZoom per
   CMS-Schalter (`cooperativeGestures`), Sprach-Labels (`setMapLanguage`, coalesce name:de/latin/name).
4. **Marker** (`drawMarkers`): DOM-Marker je Stop mit Koordinate; aktiver = größer/anders gefärbt
   (#f0c9a8/Rand #a7672f vs. #a7672f/Rand creme); Popup (Titel+Datum); **Klick auf Marker →
   `scrollToStop`** (Karte treibt die Stationsauswahl).
5. **Kopplung Karte↔Station (HEUTE):** Die durchblätterbare Bahn `.trip-detail` (horizontaler
   Scroll-Snap, `flex 0 0 100%` je `.trip-slide`) ist via **IntersectionObserver** (root=Bahn,
   threshold 0.6/0.9) an `activateStop(idx)` gekoppelt → setzt `active`, `drawMarkers` (Highlight),
   **`map.flyTo({center, zoom:max(zoom,5), duration:600})`**, Editor-Sync. Pfeile `‹/›` (`stepStop`)
   und Stop-Pillen (`.trip-stoplist`) rufen `scrollToStop` → IO meldet → Karte folgt. **Trigger heute
   = horizontaler Scroll der Bahn**, nicht vertikaler Seiten-Scroll.
6. **Stations-Karte** (`.trip-slide`): „Station X/Y", Titel (h3), Datum, **Titelbild** (CSS-Crop 16:10,
   Klick → Lightbox), Text, **weitere Fotos** (`.ww-station-photos`, Klick → Lightbox-Gruppe),
   optional Video-Loop + YouTube-Embed.
7. **Stop-Liste** (`.trip-stoplist`): Pillen je Stop, aktive markiert, Klick → `scrollToStop`,
   Rand-Fade + Pfeile, Auto-Zentrierung.
8. **„Reisefazit"-Galerie** (`.story-gallery`): optionales Bildraster → Lightbox-Gruppe.
9. **Lightbox/Filmstreifen** (`src/components/Lightbox.tsx`): eigenständige, **ohne Umbau
   wiederverwendbare** Komponente. Props: `photos: {photo,caption?}[]`, `startIndex`, `loop`,
   `albumName?`, `onClose`. Eigener Filmstreifen, Wheel/Touch/Tastatur/IO, Body-Scroll-Lock.
10. **Sprache:** alle Texte DE/EN über `bi()`/`tl()` mit DE-Fallback; `lang` als Prop.

## Für den Prototyp getroffene Entscheidungen
- **Längste reale Reise = `alaska2026.json` (10 Stops)** — datengetrieben gewählt (Stop-Zählung:
  alaska 10, west 9, florida 9, birthday 7, robin 4).
- **Haupt/Zwischen-Heuristik (da Schema kein Typ-Feld hat):** *Hauptstation* = hat Titelbild ODER
  ≥1 weiteres Foto ODER Text ≥ ~25 Wörter; sonst *Zwischenstopp*. Auf die **echten** alaska-Daten
  angewandt: nur „San Francisco" ist Hauptstation (echtes Titelbild + 2 Fotos), die übrigen 9 sind
  Zwischenstopps (je 1 kurzer echter Satz, keine Bilder).
- **Demo-Füllung (klar gekennzeichnet, `_source:'demo-fill'` im Demo-Modul):** Da 1 Haupt / 9 Zwischen
  die volle Hauptstations-Klasse (Hero + Filmstreifen) kaum zeigt, wurden im **lokalen Demo-Modul**
  3 weitere Stops (Yosemite, Denali, Coldfoot) zu Hauptstationen aufgewertet — mit **echten,
  vorhandenen** `/uploads`-Bildern als Hero+Filmstreifen und verlängertem Demo-Text. Alle Namen,
  Daten, Koordinaten und Originaltexte bleiben aus den echten alaska-Daten. **Echt vs. Demo** ist
  pro Stop im Modul markiert.

## Offene Fragen vor dem echten Umbau (zu klären mit David)
- **Typ-Feld im echten Schema?** Vorschlag: neues Stop-Feld `kind` (Auswahl „Hauptstation/
  Zwischenstopp", Default **Hauptstation**). **Backward-kompatibel:** bestehende Stops ohne `kind`
  gelten automatisch als Hauptstation (kein Re-Index-Datenverlust). Schema-Änderung ⇒ `tina-lock`
  neu + Re-Index.
- Soll die heutige **horizontale** Bahn ersetzt oder als Option behalten werden?
- Karten-Verhalten mobil: nur Gesamtroute (Hero) oder doch pro Stop nachziehen?
- Filmstreifen-Klasse für Zwischenstopp: wirklich „kein Filmstreifen, max. 1 Thumbnail"?

(Schritt B/C/D des echten Umbaus folgen nach Freigabe — der Prototyp dient nur der Anschauung.)

---

# Reisen — Variante-B-Umbau in /trips — Schritt C/D (gebaut 2026-06-13)

**C — Neu gebaut** (Übersicht+Detail; Phasen 1–5, Commits `db7423f`,`1a459b6`,`63018b3`,`626dcdc`).
Struktur: `/trips` = Übersichts-Karten (ersetzt Reise-Tabs), `/trips/<slug>` = `TripTimeline.tsx`.

**D — Abhak-Vergleich gegen die eingefrorene 18-Punkte-Soll-Liste:**
- A1 Seitenkopf DE/EN (SettingsHeader): ✅ (auf der Übersicht).
- A2 Reise-Tabs: ⚠️ **bewusst ersetzt** durch Übersichts-Karten (David-Entscheid; löst Pillen-Überfüllung).
- A3 Reise-Kopf (Titel/Datum/Meta/Summary, „bald ✦"): ✅ (sticky Kopf der Detailseite; „bald" in der Meta-Zeile + Übersichts-Badge).
- B4 MapLibre-Insel: ✅ · B5 Marker (aktiv/Popup/Klick→Station): ✅ · B6 fitBounds+flyTo: ✅ ·
  B7 5 Stile + Live-Wechsel: ✅ (MapStyleWatcher) · B8 Sprach-Labels: ✅ · B9 scrollZoom-Schalter: ✅.
- C10 Stationen durchblättern: ⚠️ **ersetzt** (horizontale Snap-Bahn + Prev/Next-Pfeile → vertikale Timeline + Scroll; Navigation zusätzlich via Marker-Klick).
- C11 Stop-Pillen: ⚠️ **ersetzt** (Timeline-Blöcke + Marker-Klick; bewusst kein Schnell-Sprung, David-Entscheid).
- D12 Stations-Karte (Titel/Datum/Titelbild/Text): ✅ (Hauptstation = voller Block; CSS-Crop-Hero erhalten).
- D13 weitere Fotos → Lightbox: ✅ (Filmstreifen, Gruppe inkl. Cover) · D14 Video-Loop + YouTube: ✅.
- E15 verknüpftes Album: ✅ (Link im Kopf) · E16 „Reisefazit"-Galerie: ✅ (unter der Timeline → Lightbox).
- F17 Daten/DE-EN/GeoJSON: ✅ (viewStops/bi/pickCoord unverändert) · F18 Ortssuche Nominatim: ✅ (Schema unverändert).
- **Tina-Editing:** useTina-Live + data-tina-field (Kopf/Station/Felder/Galerie) + Editor-Scroll-Sync: ✅.
- **Neu (über Soll hinaus):** Fokus-Dimming, mitlaufende Karte + Fahrzeug, Fortschrittslinie, Reveals, Mobile-Stack,
  Stop-Typ `kind`, Fahrzeug-Auswahl, 4 globale Regler.
- **Bewusst NICHT enthalten** (kein Schema-Feld; Code ruht): Flugetappen-Bögen + Etappen-Trenner (waren Proto-Demo).

**Abnahme offen:** David vergleicht live (Übersicht + je eine Detailseite, Handy/iPad/Mac-Safari) und gibt frei;
erst dann gilt „fertig portiert" + Cleanup der verwaisten `TripsContent.tsx`. ⚠️/Ersetzungen sind benannt, nicht verschwiegen.
