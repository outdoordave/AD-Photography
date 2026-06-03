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
| 3 | Lightbox + Filmstreifen (Snap, Gesten, Marker) | 🔴 | 2 | ⬜ offen |
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
