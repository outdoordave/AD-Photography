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

## Live-Wahrheit zuerst (Pflicht vor jedem Neubau UND vor jeder Machbarkeits-Aussage)
> **Goldene Regel:** Bevor du für irgendeine Funktion/Sektion etwas neu baust
> **ODER** behauptest, etwas sei „nicht möglich" / „geht nicht" / „eine
> Einschränkung" — sieh ZUERST im echten Live-Code nach, wie es **tatsächlich**
> gelöst ist. Die Live-Seite ist die Wahrheit, nicht dein Allgemeinwissen.

1. **Zwingend zuerst die echte Live-Umsetzung analysieren** — sowohl **Funktion**
   als auch **Inhalt**: `index.html`, `content/`, `admin/config.yml`, Build-Skripte
   (`build-indexes.js`), der Cloudflare-Worker. Was kann die Live-Seite genau, wie
   ist es technisch gelöst, welche Felder/Daten gibt es?
2. **Nie aus Allgemeinwissen behaupten, etwas ginge nicht.** Wenn die Live-Seite
   es kann, **KANN es gehen** — finde heraus **WIE** sie es macht (inkl. wie das
   aktuelle CMS **Sveltia** es löst) und bilde genau das nach.
3. **Die Astro/Tina-Version muss exakt dieselben Funktionen und denselben Inhalt
   liefern wie Live.** Abweichungen nur mit ausdrücklicher Freigabe des Nutzers —
   und dann dokumentiert (in `CAPABILITIES.md`).
4. **Muss etwas in der neuen Architektur wirklich anders gelöst werden,** leg dem
   Nutzer die **belegte Live-Analyse vor (Code-Fundstellen)** und erkläre warum —
   statt es als „geht nicht" abzutun.

> **Mahnbeispiel (echter Fehler):** „WebP geht in Safari nicht" — behauptet aus
> Allgemeinwissen. Falsch: Die Live-Seite (Sveltia) macht WebP in Safari längst,
> über die **jSquash**-WASM-Bibliothek. Erst der Blick in Sveltias Lösung brachte
> die Wahrheit. **So ein Irrtum ist bei den 🔴-Brocken (Reisen, Alben, Karte,
> Lightbox) teuer — deshalb diese Regel.**

## Capability-Lock (Pflicht bei JEDER portierten/neu gebauten Funktion)
> **Oberste Umbau-Regel:** Beim schrittweisen Umbau (Single-File `index.html` →
> Astro + TinaCMS, Branch `astro-umbau`, `main` bleibt live) darf **KEINE
> bestehende Funktion verloren gehen oder sich für Besucher anders verhalten.**
> Die Website bleibt optisch **und** funktional identisch — nur der darunter
> liegende Code wird neu strukturiert.

Für **jede** Funktion, die portiert/neu gebaut wird — besonders die 🔴-Brocken
(Lightbox/Filmstreifen, MapLibre-Karte, Reise-Stationen, Galerie/Album-Diashow,
Hero-Umschalter, Wisch-/Trackpad-Gesten) — gilt verbindlich dieses Verfahren
(**Schritt 0 + A–D**). Ergebnisse werden in **`CAPABILITIES.md`** festgehalten
(eine Sektion pro Funktion, mit Datum):

0. **0 — Live-Wahrheit prüfen (Vorstufe, ZWINGEND vor A).** Gemäß der Regel
   „**Live-Wahrheit zuerst**" (s. o.): Die Extraktion muss aus dem **echten
   Live-Code** kommen — Funktion **und** Inhalt. Falls relevant, auch **wie das
   aktuelle CMS (Sveltia) es löst** (wie beim WebP-Fall: Sveltia nutzt jSquash).
   Keine Machbarkeits-Aussage und kein Bau, bevor die Live-Umsetzung verstanden
   ist. Belege (Code-Fundstellen) gehören in den `CAPABILITIES.md`-Eintrag.
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
