# CAPABILITIES.md — Fähigkeiten-Verträge je Funktion (Capability-Lock)

Dieses Dokument sichert beim Umbau (Single-File `index.html` → Astro + TinaCMS,
Branch `astro-umbau`) die **oberste Regel**:

> **KEINE bestehende Funktion darf verloren gehen oder sich für Besucher anders
> verhalten.** Die Website bleibt optisch **und** funktional identisch — nur der
> darunterliegende Code wird neu strukturiert.

Pro Funktion gibt es **eine Sektion** (mit Datum), die das in `CLAUDE.md`
verankerte **4-Schritt-Verfahren** dokumentiert:

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
| 1 | Stories (Liste + Reader, DE/EN, YouTube) | 🟡 | 1 | ⬜ offen |
| 2 | Galerie / Alben (3 Sortiermodi, Auto-Diashow) | 🟡/🔴 | 2 | ⬜ offen |
| 3 | Lightbox + Filmstreifen (Snap, Gesten, Marker) | 🔴 | 2 | ⬜ offen |
| 4 | Reise-Stationen (Snap-Bahn + IntersectionObserver) | 🔴 | 3 | ⬜ offen |
| 5 | MapLibre-Karte (5 Stile, flyTo, USA/Alaska-Projektion, Sprach-Labels) | 🔴🔴 | 3 | ⬜ offen |
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

_Noch keine Funktion extrahiert — die erste Detail-Sektion entsteht, sobald die
jeweilige Funktion im Bauplan drankommt (Schritt A des Capability-Locks)._
