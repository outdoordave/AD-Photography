# CLAUDE.md — Projekt-Regeln (bei jeder Session zuerst lesen)

## Projekt in Kürze
**AD-Photography** („Wide & Wild") — Foto-/Reise-Website von Alexandra & David.
- **Repo:** `outdoordave/AD-Photography` (Branch `main`)
- **Stack:** Eine einzige `index.html` (~4338 Zeilen, HTML + CSS + JS **alles inline**),
  keine Build-Tools/Bundler fürs Frontend.
- **CMS:** Sveltia CMS **0.164.2** (gepinnt, via unpkg) unter `/admin`, GitHub-Backend
  über eigenen **Cloudflare-Worker** (OAuth: `aanddphotography-oauth.davidbastisch.workers.dev`).
- **Inhalte:** JSON + Markdown in `content/`, Bilder in `/uploads/` (im Repo).
- **Deploy:** **Cloudflare Pages** → `https://aandd-photography.pages.dev`.
  Build-Command: `node build-indexes.js` (erzeugt `*-index.json` beim Deploy).
- **Karte:** MapLibre GL **5.21.0** (unpkg), Kartenstile von **OpenFreeMap**.
- **Fonts:** Google Fonts — Fraunces (Display) + Mulish (Body).
- **Prototyp (isoliert):** `/prototype-astro/` — Astro+TinaCMS-Evaluierung, NUR Stories,
  berührt die Live-Seite nicht (Cloudflare baut weiter nur das Repo-Root).

## Feste Arbeitsweise (verbindlich)
1. **Erst prüfen & besprechen, dann bauen.** Bei Unklarheiten **Rückfragen**, nicht raten.
   Read-only-Analyse vor jeder größeren Änderung.
2. **Isolierte Edits** per `str_replace`/Edit — **keine** Voll-Datei-Rewrites von `index.html`.
3. **Jeder Fix = eigener, klar benannter Commit.** **Diff vor jedem Commit zeigen.**
4. **Nach JS-Änderungen Syntax prüfen.** Da das JS inline in `index.html` liegt:
   `<script>`-Blöcke extrahieren und gegen einen JS-Syntax-Check laufen lassen
   (`node --check` auf der extrahierten Datei bzw. `new Function(src)`/`jsc`).
   Nach YAML-Änderungen (`admin/config.yml`): YAML validieren.
5. **NIE zu `main` pushen.** `git commit` ist erlaubt, **`git push` macht David selbst**
   (gebündelt, manuell). Niemals `git push` ausführen.
6. **Commit-Messages auf Deutsch**, sachlich, und enden mit:
   `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
7. **Cloudflare-Cache:** nach Deploy mit **Strg/Cmd+F5** (Hard Reload) testen; bei
   „ist das online?"-Zweifeln per `curl` gegen `aandd-photography.pages.dev` prüfen.

## Capability-Lock (Pflicht bei JEDER portierten/neu gebauten Funktion)
> **Oberste Umbau-Regel:** Beim schrittweisen Umbau (Single-File `index.html` →
> Astro + TinaCMS, Branch `astro-umbau`, `main` bleibt live) darf **KEINE
> bestehende Funktion verloren gehen oder sich für Besucher anders verhalten.**
> Die Website bleibt optisch **und** funktional identisch — nur der darunter
> liegende Code wird neu strukturiert.

Für **jede** Funktion, die portiert/neu gebaut wird — besonders die 🔴-Brocken
(Lightbox/Filmstreifen, MapLibre-Karte, Reise-Stationen, Galerie/Album-Diashow,
Hero-Umschalter, Wisch-/Trackpad-Gesten) — gilt verbindlich dieses 4-Schritt-
Verfahren. Ergebnisse werden in **`CAPABILITIES.md`** festgehalten (eine Sektion
pro Funktion, mit Datum):

1. **A — Fähigkeiten extrahieren (VOR dem Neubau).** Den bestehenden Code der
   Funktion in `index.html` **vollständig** lesen und eine **nummerierte,
   vollständige** Fähigkeiten-Liste erstellen — jedes Verhalten einzeln, inkl.
   feiner Details (z. B. Lightbox: Öffnen/Schließen, Einzelbild vs. Galerie,
   Filmstreifen-Zentrierung, Snap, Wheel/Trackpad/Touch, Blätter-Pfeile,
   Umlauf-Option, Tastatur, Expand-Affordanz; Karte: 5 Stile, Marker, flyTo,
   USA/Alaska-Projektion, Sprach-Labels). Die in `STATUS.md` erfasste
   Funktions-Inventur als Ausgangspunkt nehmen und hier auf Detail-Ebene aus
   dem **echten Code** verfeinern. Eintrag in `CAPABILITIES.md`.
2. **B — Nutzer bestätigt.** Die Liste dem Nutzer **vor** dem Bauen vorlegen und
   fragen, ob sie vollständig ist. Erst nach Bestätigung weiterbauen. Die
   bestätigte Liste ist ab dann die **eingefrorene Soll-Vorgabe**.
3. **C — Neu bauen.** Funktion in Astro nachbauen mit dem Ziel: **jede Zeile**
   der Liste erfüllt. Verhalten **1:1**, nicht „ähnlich".
4. **D — Abhak-Vergleich (NACH dem Neubau).** Die eingefrorene Liste Punkt für
   Punkt durchgehen und in `CAPABILITIES.md` je Punkt dokumentieren:
   **✅ identisch / ⚠️ leicht abweichend** (mit Beschreibung) **/ ❌ fehlt noch**.
   Bei ⚠️/❌: **benennen, nicht verschweigen.** Dem Nutzer als Vergleichs-
   Checkliste vorlegen. Eine Funktion gilt **erst dann als „fertig portiert"**,
   wenn der Nutzer nach eigenem **Seite-an-Seite-Vergleich** (alt auf `main`
   vs. neu auf Branch-Vorschau) zustimmt. **Nicht Claude entscheidet „fertig",
   sondern der Nutzer.**

## VERBINDLICHE REGEL — am Ende JEDER Session mit Änderungen
> Wenn du in einer Session etwas geändert (committet) hast, **bevor du abschließt**:
> 1. **`CHANGELOG.md`** um einen neuen Eintrag ergänzen: **Datum + Uhrzeit**,
>    Stichworte zur Änderung, betroffene **Commit-Hashes** (Format s. Datei-Kopf).
> 2. **`STATUS.md`** so **überschreiben**, dass sie den **AKTUELLEN** Stand zeigt
>    (erledigt / offen / bekannte Eigenheiten). STATUS.md wird **ersetzt, nicht
>    angehängt** — sie darf **nie veralten**.
> CHANGELOG.md wird nur **ergänzt** (Historie), STATUS.md wird **überschrieben**
> (Momentaufnahme).

## Wo nachschauen
- **STATUS.md** — aktueller Stand: Architektur, Inhalte, Funktions-Inventur,
  bekannte Fallen, offene Punkte, strategische Entscheidung.
- **CAPABILITIES.md** — Capability-Lock-Listen je Funktion (Soll-Fähigkeiten +
  Abhak-Vergleich alt vs. neu). Pflicht-Dokument beim Umbau (s. o.).
- **CHANGELOG.md** — chronologische Historie aller Änderungen.
