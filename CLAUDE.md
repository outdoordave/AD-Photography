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
- **CHANGELOG.md** — chronologische Historie aller Änderungen.
