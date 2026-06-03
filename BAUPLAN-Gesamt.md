# BAUPLAN-Gesamt — restlicher Umbau (Astro + TinaCMS)

> **NUR Planung + Analyse. NICHTS gebaut.** Reihenfolge entscheidet David.
> Stand: 2026-06-02. Quelle: echter `index.html`-Code („Live-Wahrheit zuerst").
> Code-Fundstellen in Klammern (Zeilen `index.html`).

## Wo wir stehen (erledigt / abgesichert)
- **Stories (Stufe 1):** Liste + Reader (1:1-`mdToHtml`), Mountains-Illustration,
  Tina lokal (Live-Vorschau), eigenes Foto-Upload-Feld (Bulk + WebP via jSquash,
  auch Safari). Schritt 4 vom Nutzer freigegeben, Schritt 5 (Tina) erledigt.
  **Offen:** Lightbox für Story-Bilder (bewusst vertagt), Deploy (Schritt 6).
- **Prototypen abgenommen:** MapLibre-Karte + Stationen-Wischen (`/proto-karte`),
  Tina-Ortssuche/Nominatim (`proto_ort`). → die zwei 🔴-Reisen-Brocken sind entrisikt.
- **Noch nicht analysiert war:** Galerie/Alben + Lightbox → **TEIL 1** unten.

---

# TEIL 1 — Galerie/Alben + Lightbox (Live-Analyse)

## 1.1 Galerie / Alben
**Drei Sortiermodi** (`setGalleryMode` 1831; Einstellungen `gallery-settings.json`:
`show_album`/`show_chronological`/`show_alphabetical` — ⚠️ aktuell **alle false →
Fallback „Album-Modus"**, bekannte Falle):
- **Album-Modus:** 2 Alben nebeneinander; jedes Album startet **zugeklappt**.
- **Neueste / A–Z:** flache Sortierungen.

**Album zugeklappt = Auto-Diashow** (`makeAlbumSlideshow` 1851): horizontale
**native Scroll-Snap-Bahn** (`.album-track`/`.album-cell`) + **Autoplay** (4 s,
am Ende instant zurück), **stoppt bei bewusster Interaktion** (`pointerdown`,
horizontales `wheel`), **Pfeile**, **Klick (kein Wisch) → Lightbox** beim aktuellen
Bild. `scrollToCell` via `offsetLeft`-`scrollTo` (wie Stationen → kein Safari-Quirk).

**Album aufgeklappt = Grid** aller Fotos (`buildAlbumBody` 1925). Auf-/Zuklappen
**in-place** (`setAlbumOpen` 1941) mit **Höhen-Crossfade-Animation**, die
**`prefers-reduced-motion` bereits respektiert** (W2 teils schon da!).

**Datenstruktur `albums/*.json`:** `name_de, date, note_de, photos[]`
(**flaches String-Array** `/uploads/...`), `linked_trip`, `pin{highlight,
highlight_order}`, `english{enabled, name_en, note_en}`. (Portfolio wird aus
Alben aufgebaut: `rebuildPortfolioFromAlbums` 1732.)

## 1.2 Lightbox + Filmstreifen — der heikelste Teil
Aufbau: **zwei gekoppelte Scroll-Snap-Bahnen** — Hauptbild-Bahn (`#lbTrack`,
`.lb-slide`) **und** Filmstreifen (`#lbFilmstrip`, `.lb-thumb`).

**Hauptbahn:** native Scroll-Snap (Touch/Trackpad vom Browser), `lbScrollToIndex`
via `offsetLeft`-`scrollTo` (2306). **IntersectionObserver** (Schwelle 0.6,
`observeLbSlides` 2278) → mittiges Bild = aktiv → Caption + Thumb markieren.

**Zwei-Wege-Kopplung (das „mühsam debuggte"):**
- **Hauptbahn treibt Streifen:** `setLbCurrent` → `lbCenterStrip` zentriert den
  aktiven Thumb (2214).
- **Streifen treibt Hauptbild:** `scroll`-Handler am Streifen → `lbFilmstripCenterIndex`
  → Hauptbild instant nachziehen (3775).
- **Anti-Rückkopplung:** `lbStripActive`-Flag (`lbStripUser`, 180 ms Idle) — solange
  der Nutzer den Streifen scrollt, **pausiert** das Auto-Zentrieren der Hauptbahn,
  sonst schaukeln sich beide auf (2250, 2300).

**⚠️ Safari/WebKit-`scrollLeft`-Eigenheit — HIER ja, bei den Stationen NICHT:**
- `lbCenterStrip` (2214): `scroll-snap-type: x mandatory` zieht einen
  **programmatischen `scrollLeft` sofort auf die alte Snap-Grenze zurück**. Lösung:
  Snap kurz **aus** (`scrollSnapType='none'`), `scrollLeft` setzen, im nächsten
  `requestAnimationFrame` **wieder an**.
- **Maus-Wheel** am Streifen (3751): klassische Maus liefert nur `deltaY` → auf
  horizontalen `scrollLeft` mappen, dabei **Snap für die Bewegung aus, nach 140 ms
  Stille wieder an** (entprellt). Trackpad-`deltaX` dagegen **nativ** lassen
  (Momentum + Snap).
- **Flex-Spacer-Fix:** der Streifen war wegen des WebKit-End-Padding-`scrollWidth`-
  Bugs erst nach einem Flex-Spacer-Kniff nativ scrollbar (3746).

→ Warum die **Stationen** das NICHT hatten: nur **eine** Bahn, **kein** programmatisch
zentrierter zweiter Streifen, nur `scrollTo`(smooth) statt direktem `scrollLeft`.

**Weitere Lightbox-Fähigkeiten:** Einzelbild- vs. Galerie-Modus (`openLightbox`
2341 / `openLightboxGallery` 2172), Pfeile + Tastatur (←/→/Esc, 3794), **Umlauf-
Option** (`gallery_loop`, Default an, `lbStep` 2314), Caption „Album · X / Y",
Schließen per Klick-auf-Rand/Esc, Thumb-Klick springt, Expand-Affordanz.

## 1.3 Ehrliche Einschätzung: ist die Lightbox der schwierigste Teil?
**Ja — interaktionslogisch der heikelste Teil des Projekts.** Nicht wegen Größe,
sondern wegen der **sensiblen Zwei-Wege-Snap-Kopplung + der Safari/Snap/`scrollLeft`-
Tänze**, die nur mühsam stabil wurden. Die **Karte** sieht mit 🔴🔴 gefährlicher
aus, ist aber „MapLibre verdrahten + Daten füttern" (Prototyp bewies es). Die
Lightbox ist **filigraner** und cross-browser empfindlicher.

**Wichtig (cross-cutting):** Die Lightbox wird **überall** benutzt — Story-Bilder,
Stationsbilder, Reise-Galerie, Album-Bilder. Sie ist also eine **gemeinsame
Komponente**, die Stories (vertagt) und Reisen erst „vollständig" macht.

**Was ich ZUERST als Lightbox-Prototyp testen würde** (vor dem Alben-Vollausbau):
eine isolierte Lightbox-Insel mit (a) Doppel-Snap-Bahn Hauptbild+Streifen, (b)
Zwei-Wege-Kopplung + Anti-Rückkopplung, (c) `lbCenterStrip`-Snap-Trick, (d)
Maus-Wheel-Entprellung — und **auf Safari** gegen die Live-Lightbox gegentesten.
Das ist der einzige verbliebene echte Unbekannte.

**Risiken:** Safari-Snap-Verhalten an Astro/Insel-Grenzen; die Zwei-Wege-Kopplung
ohne Aufschaukeln; der Flex-Spacer/`scrollWidth`-Bug; Umlauf-Logik.

---

# TEIL 2 — Gesamt-Bauplan (leicht → schwer)

> Pro Sektion: **Aufwand** (S/M/L), **Risiko**, **IDEEN-Punkte**, **Capability-Lock-
> Prüfpunkte**. Querschnitt C6 (einheitliche Bausteine) + C5 (ein Foto-Feld) gelten
> überall.

### A · Equipment / Gear — Aufwand S · Risiko 🟢
- **Was:** Gear-Liste nach Kategorien + Links (`renderGear`). Reines Daten-Rendern.
- **IDEEN:** C6, C7 (Labels/Hints), DE/EN-Muster.
- **Capability-Lock:** trivial (Liste, Kategorien, Links, DE/EN). Idealer Aufwärm-
  Schritt, um die Build-/Deploy-Pipeline an etwas Einfachem zu validieren.

### B · Über uns — Aufwand S–M · Risiko 🟢
- **Was:** `about.json` (Personen-Fotos + Texte), Layout.
- **IDEEN:** C5 (Personen-Fotos übers Foto-Feld), W4 (Alt-Texte), C6/C7.
- **Capability-Lock:** Layout 1:1, DE/EN, Bilder (lazy).

### C · Kontakt (inkl. W5 echtes Versenden) — Aufwand M · Risiko 🟡
- **Was:** Formular (`handleSend` 3662 — heute **nur Vorschau, kein Versand**).
- **IDEEN:** **W5** (echter Versand via Gratis-Dienst, z. B. Formspree/Cloudflare),
  C7 (Labels), Datenschutz-Hinweis (s. IDEEN 4.4: wohin gehen die Daten?).
- **Capability-Lock:** Felder/Validierung wie live **+ neue** Versand-Funktion
  (additiv). Spam-Schutz bedenken.

### D · Reisen (Vollausbau, mit C1–C7) — Aufwand L · Risiko 🟡 (entrisikt)
- **Was:** Karte + Stationen-Bahn (Prototyp bewiesen) **+** voller Inhalt:
  alle 5 Stile + `map_style`-Setting, Stations-Titelbild/weitere Bilder/Video/
  YouTube, Reise-Galerie („Reisefazit"), Stop-Button-Liste, verknüpftes Album
  (`linked_trip`), Reise-Tabs, DE/EN je Station+Reise.
- **IDEEN:** **C1** (Felder gruppieren — Datenstruktur von Anfang an!), **C2** (Live-
  Vorschau der Stations-Kästchen), **C3** (Ortssuche-Feld — Prototyp vorhanden),
  **C4** (EN einklappen), **C5** (Foto-Feld), C6/C7. Karten-Höhe **W6** (B) optional.
- **Capability-Lock-Prüfpunkte:** Karten-/Wisch-**Timing** identisch (vorgemerkt),
  5 Stile + `flyTo`/`fitBounds`/Popups, Sprach-Labels, Stations-Snap + Observer-
  Entkopplung, Video/YouTube, Reise-Galerie, verknüpftes Album, DE/EN-Fallbacks
  (`pickStopCoord`, flach vs. `english{}`). **Toter Legacy-Code NICHT portieren.**

### E · Galerie/Alben + Lightbox — Aufwand L (größter Brocken) · Risiko 🔴🔴
- **Empfehlung: vorab Lightbox-Prototyp** (s. TEIL 1.3), auf Safari abnehmen.
- **Was:** Album-Karten, 3 Sortiermodi, Auf-/Zuklappen-Crossfade, Auto-Diashow,
  **Lightbox+Filmstreifen** (Doppel-Bahn, Zwei-Wege-Kopplung, Safari-Snap-Tänze,
  Umlauf). **Cross-cutting:** schaltet auch Story-/Stations-/Reise-Bilder-Lightbox frei.
- **IDEEN:** C5 (Foto-Feld für Alben-Bilder, Bulk+WebP), W2 (reduced-motion — beim
  Aufklappen schon da), W4, C6/C7.
- **Capability-Lock-Prüfpunkte (umfangreich):** Öffnen/Schließen, Einzelbild vs.
  Galerie, Filmstreifen-Zentrierung, Snap, Wheel/Trackpad/Touch, Pfeile, Umlauf,
  Tastatur, Caption, Anti-Rückkopplung, **Safari-`scrollLeft`/Snap-Verhalten**,
  Expand-Affordanz, Diashow-Autoplay + Stop-on-Interaktion, In-Place-Aufklappen.

### F · Startseite (Hero/Aktuell/Entdecken/Momentaufnahmen/Intro) — Aufwand M–L · Risiko 🟡
- **Abhängigkeit:** „Aktuell/Entdecken/Momentaufnahmen" **aggregieren** Stories +
  Alben + Reisen → **erst bauen, wenn diese Sektionen stehen** (sonst leere Pools).
- **Was:** Hero-Umschalter (Bild/Slideshow/Video, `renderHero` 3084), `renderLatest`,
  `renderDiscover` (Zufallsmix), `renderRandomMoments`, Intro, Social-Links.
- **IDEEN:** C5 (Hero-Slideshow übers Foto-Feld), W2 (Hero-Crossfade/bob), C6/C7.
- **Capability-Lock:** 3 Hero-Modi, Zufalls-Pools, Crossfade-Timing.

### G · Finaler Umschalt-Schritt (Branch → main) — Aufwand M · Risiko 🟡
- **Voraussetzung:** alle Sektionen gebaut **und** vom Nutzer Seite-an-Seite
  freigegeben; **Deploy-/Backend-Entscheidung** getroffen (Tina Cloud Free /
  self-hosted / nur lokal editieren — `tinacms build` braucht Backend).
- **Was:** Cloudflare-Build von `node build-indexes.js` (alte `index.html`) auf
  **`web/` (Astro-Build)** umstellen; `/uploads`-Auslieferung produktiv lösen
  (srcset-Pipeline **W3**); alte `index.html` als Rollback behalten, dann ablösen.
- **Capability-Lock:** Gesamt-Seite-an-Seite-Abnahme; Hard-Reload-Test; `curl`-Check.

### H · „Nach dem Umbau"-Punkte — NACH dem Cutover
- Inventur (toter Legacy-Code raus), Deploy-Build-/Seiten-Check, `/uploads`-Backup,
  **Datenschutz-Audit** (CDNs/Fonts selbst hosten, Impressum/Datenschutz, Webbkoll/
  CookieYes, eRecht24/Fachanwalt) — Details in `IDEEN.md` Abschnitt 4. Aus dem
  **dann aktuellen** Code (echter Befund).

---

# Empfehlung: Baureihenfolge + Größenordnung

**Empfohlene Reihenfolge (Begründung):**
1. **Schritt 6 / Deploy-Entscheidung zuerst klären** (Tina-Backend + Stories online)
   — entrisikt die Auslieferung an etwas Fertigem, bevor mehr gebaut wird.
2. **Gear → Über uns → Kontakt(W5)** — kleine, sichere Aufwärm-Sektionen; bauen
   Routine + validieren die Pipeline.
3. **Lightbox-Prototyp** (der letzte echte Unbekannte) → danach die **Lightbox als
   gemeinsame Komponente** — schaltet zugleich Story-/Reise-Bilder frei.
4. **Reisen-Vollausbau** (Prototypen vorhanden, C1–C7).
5. **Galerie/Alben** (nutzt die fertige Lightbox).
6. **Startseite** (aggregiert alles → zuletzt).
7. **Finaler Umschalt-Schritt (Cutover)**.
8. **„Nach dem Umbau"-Audit**.

> Alternative, falls du lieber Wow-Effekt früh willst: Reisen direkt nach den
> Aufwärm-Sektionen (Karte ist sichtbar beeindruckend) und Lightbox/Alben ans Ende.
> Nachteil: Story-/Stationsbilder bleiben dann länger ohne Lightbox.

**Grobe Größenordnung (relativ, keine Stunden-Versprechen):**
- **Klein (je 1 fokussierter Bau-Block):** Gear, Über uns, Kontakt.
- **Mittel:** Startseite, Lightbox-Prototyp, Deploy/Cutover.
- **Groß (je mehrere Blöcke):** Reisen-Vollausbau, **Galerie/Alben+Lightbox**
  (der größte/heikelste Einzel-Brocken).
- **Gesamt:** der Löwenanteil steckt in **Reisen** und **Alben+Lightbox**; der Rest
  ist überschaubar. Risiko konzentriert sich fast vollständig auf die **Lightbox** —
  deshalb der Prototyp-Schritt davor.

**Kosten:** weiterhin **0 €** (alles gratis/git-basiert; Tina-Cloud-Bezahltarife meiden).

> Entscheidung über die konkrete Reihenfolge trifft **David**. Dieser Plan baut nichts.
