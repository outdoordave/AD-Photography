# CLAUDE.md — Projekt-Regeln (bei jeder Session zuerst lesen)

## Projekt in Kürze
**AD-Photography** („Wide & Wild") — Foto-/Reise-Website von Alexandra & David.
- **Repo:** `outdoordave/AD-Photography` (Live-Branch `main`)
- **Cutover vollzogen (16.06.2026):** Die Single-File-`index.html` ist **abgelöst**; live ist
  jetzt die **Astro+Tina-Version** auf `main`. (Details/Lehren → `FAHRPLAN.md`.)
- **Stack:** **Astro + React-Inseln** (`client:load`), Quellcode in **`web/`**, statisch
  gebaut (SSG). *(Die alte `index.html` im Repo-Wurzel wird nicht mehr gebaut — Aufräumen
  separat, s. `IDEEN.md` §4.1.)*
- **CMS:** **TinaCMS** (Tina Cloud, GitHub-Backend) unter `/admin`. Schema in `web/tina/`.
  ⚠️ Strukturelle Schema-Änderungen brauchen einen **Tina-Cloud-Re-Index**; nach jeder
  `tina/config`-Änderung `tina-lock.json` per `npx tinacms dev --no-server` neu erzeugen.
- **Inhalte:** JSON in `web/src/data/`, Stories als Markdown in `web/src/content/`, Bilder
  **einheitlich** in **`web/public/uploads/`** (Tinas Medien-Ziel, von Astro als `/uploads/`
  ausgeliefert; getrackt). *(Früher lag der „tragende" Bestand in der Repo-Wurzel `/uploads` +
  `copy-uploads.mjs` — seit 26.06.2026 zusammengelegt, beides entfernt.)*
- **Deploy:** **Cloudflare Pages** (Projekt `aandd-photography`) baut von **`main`** →
  `https://aandd-photography.pages.dev`. Root `web`, Build **`npm run build`**, Output `dist`.
- **Karte:** MapLibre GL (selbst gebündelt), Kartenstile von **OpenFreeMap**.
- **Fonts:** **lokal** (Fontsource Variable) — Fraunces (Display) + Mulish (Body), **kein Google**.
- **Vorschau (stillgelegt seit 17.06.2026):** Das Cloudflare-Projekt `aandd-photography-astro`
  (baute von `astro-umbau`, noindex) ist **von GitHub getrennt** — kein Auto-Build mehr. Der Branch
  `astro-umbau` bleibt im Repo. Tests laufen jetzt lokal bzw. über Tinas CMS-Vorschau.

## Feste Arbeitsweise (verbindlich)
1. **Erst prüfen & besprechen, dann bauen.** Bei Unklarheiten **Rückfragen**, nicht raten.
   Read-only-Analyse vor jeder größeren Änderung.
2. **Isolierte Edits** per `str_replace`/Edit — **keine** unnötigen Voll-Datei-Rewrites
   (Ausnahme: `STATUS.md` wird bewusst überschrieben).
3. **Jeder Fix = eigener, klar benannter Commit.** **Diff vor jedem Commit zeigen.**
4. **Nach Code-Änderungen prüfen.** JS/TS-Syntax der React-Inseln gegenchecken
   (`esbuild`/`node --check` auf der betroffenen Datei). Nach `tina/config`-Änderungen:
   `tina-lock.json` neu erzeugen (`npx tinacms dev --no-server`) und Build lokal grün ziehen
   (`./node_modules/.bin/astro build` aus `web/`). ⚠️ „Build grün" fängt **keine Laufzeitfehler** —
   interaktive Inseln (Lightbox/Karte/Scroll) im echten Browser gegentesten.
5. **Push macht David selbst.** `git commit` ist erlaubt; **`git push` führt Claude NIE aus**
   (David pusht gebündelt, manuell — `main` ist jetzt die Live-Seite, also doppelt vorsichtig).
6. **Commit-Messages auf Deutsch**, sachlich, und enden mit:
   `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
7. **Cloudflare-Cache:** nach Deploy mit **Strg/Cmd+F5** (Hard Reload) testen; bei
   „ist das online?"-Zweifeln per `curl` gegen `aandd-photography.pages.dev` prüfen.

## Live-Wahrheit zuerst (Pflicht vor jedem Neubau UND vor jeder Machbarkeits-Aussage)
> **Goldene Regel:** Bevor du für irgendeine Funktion/Sektion etwas neu baust
> **ODER** behauptest, etwas sei „nicht möglich" / „geht nicht" / „eine
> Einschränkung" — sieh ZUERST im echten Live-Code nach, wie es **tatsächlich**
> gelöst ist. Die Live-Seite ist die Wahrheit, nicht dein Allgemeinwissen.

1. **Zwingend zuerst die echte Umsetzung im Live-Code analysieren** — Funktion **und**
   Inhalt: `web/src/` (Seiten/Komponenten/Inseln), `web/tina/` (Schema), `web/src/data/` +
   `web/src/content/` (Inhalte), Build-Skripte (`web/scripts/`, `web/package.json`). Was kann
   die Seite genau, wie ist es technisch gelöst, welche Felder/Daten gibt es?
2. **Nie aus Allgemeinwissen behaupten, etwas ginge nicht.** Wenn die Seite es kann (oder
   die abgelöste Single-File-Version in der **Git-Historie** es konnte), **KANN es gehen** —
   finde heraus **WIE** und bilde genau das nach.
3. **Die Astro/Tina-Version muss exakt dieselben Funktionen und denselben Inhalt
   liefern wie Live.** Abweichungen nur mit ausdrücklicher Freigabe des Nutzers —
   und dann dokumentiert (in `CAPABILITIES.md`).
4. **Muss etwas in der neuen Architektur wirklich anders gelöst werden,** leg dem
   Nutzer die **belegte Live-Analyse vor (Code-Fundstellen)** und erkläre warum —
   statt es als „geht nicht" abzutun.

> **Mahnbeispiel (echter Fehler):** „WebP geht in Safari nicht" — behauptet aus
> Allgemeinwissen. Falsch: Die damalige Live-Seite (Sveltia) machte WebP in Safari längst,
> über die **jSquash**-WASM-Bibliothek. Erst der Blick in deren Lösung brachte
> die Wahrheit. **So ein Irrtum ist bei den 🔴-Brocken (Reisen, Alben, Karte,
> Lightbox) teuer — deshalb diese Regel.**

## Capability-Lock (Pflicht bei JEDER portierten/neu gebauten Funktion)
> **Oberste Regel (galt für den Umbau, gilt weiter als Regressionsschutz):** Der Umbau
> Single-File `index.html` → Astro + TinaCMS ist **abgeschlossen** (Cutover 16.06.2026, `main` ist live).
> Es darf weiterhin **KEINE bestehende Funktion verloren gehen oder sich für Besucher
> anders verhalten.** Bei Änderungen bleibt die Website optisch **und** funktional identisch,
> sofern nicht ausdrücklich anders freigegeben.

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
   Funktion **vollständig** lesen (Alt-Verhalten: Single-File-Version in der Git-Historie)
   und eine **nummerierte,
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
   Checkliste vorlegen. Eine Funktion gilt **erst dann als „fertig"**, wenn der Nutzer
   nach eigenem **Vergleich** (bisheriges Verhalten vs. Änderung) zustimmt. **Nicht Claude
   entscheidet „fertig", sondern der Nutzer.**

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
