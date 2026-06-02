# STATUS.md — Aktueller Projektstand

> **Stand: 2026-06-02 19:23** · letzter Commit `cfd7a69` (Branch `astro-umbau`) ·
> Diese Datei wird bei jeder Session **überschrieben** (Momentaufnahme, nie
> veraltet). Historie → `CHANGELOG.md`.
>
> ⚙️ **Aktiver Umbau:** Branch `astro-umbau` (Stufe 1 = Stories auf Astro+Tina).
> `main` bleibt unangetastet/live. Verbindlich beim Umbau: **Capability-Lock**
> (s. `CLAUDE.md` + `CAPABILITIES.md`) — keine Funktion darf verloren gehen.

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
  | Google Fonts | Fraunces + Mulish | fonts.googleapis.com |
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
- 🟡 Kontaktformular (`handleSend`)

## 4. Bekannte Eigenheiten / Fallen
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

## 5. Offene Punkte / Restposten
- **Umbau Stufe 1 (Stories → Astro+Tina) läuft auf Branch `astro-umbau`:**
  Schritt 0 erledigt (Branch + Bestandsaufnahme). **Nächster Schritt: 1 — Astro-
  Grundgerüst** (wartet auf „weiter"). Bestandsaufnahme: 3 Stories, Body-Speicherung
  inkonsistent — DE-Body teils Markdown-Body/teils Frontmatter `body_de` (utah
  widersprüchlich), **EN-Body in Frontmatter `body_en`**; in Schritt 3/4 sauber
  vereinheitlichen (Markdown-Body hält nur eine Sprache → DE/EN-Strategie nötig).
- **Capability-Lock ist Pflicht** bei jeder portierten Funktion (s. `CAPABILITIES.md`);
  „fertig" entscheidet der Nutzer per Seite-an-Seite-Vergleich, nicht Claude.
- **Stray-Datei:** leere `package-lock.json` im Root (versehentlich, untracked) —
  David löscht sie bei Gelegenheit; landet in keinem Commit.
- **Noch nicht gepusht (lokal):** mehrere Commits seit dem letzten Push — David pusht
  gebündelt. Vor Abschluss prüfen: `git log origin/main..HEAD`.
- **Noch zu testen (live):** `d1aee01` (Video/YouTube in Station+Story), `bb4734c`
  (Querformat-Lightbox).
- **Bild-Altlasten:** ~12 große Legacy-JPGs in `/uploads/` (vor der Auto-WebP-Umstellung
  hochgeladen) → David lädt sie im CMS neu hoch (wird dann auto-WebP). 2 verwaiste bereits
  entfernt (`ed69c63`).
- **Stories-Galerie:** Stories haben kein Mehrbild-Array (nur Cover + Bilder im Text) —
  optionales `multiple:true`-Galeriefeld wäre konsistent mit Alben/Stationen (offen).
- **Vertagt:** `srcset`/responsive Bilder (erst mit eigener Domain via Cloudflare
  Image Transformations sinnvoll); Safe-Area/`viewport-fit=cover`; iPad-Portrait-Breakpoint.

## 6. Strategische Entscheidung (laufend)
**Evaluierung eines Umbaus** auf **Astro + ein CMS mit Live-Vorschau & Drag-&-Drop.**
- **Favorit: TinaCMS** (bleibt git-basiert/kostenlos, Inhalte als Markdown im Repo,
  Live-Update + Drag-&-Drop für Text/Bilder). **Alternative: Sanity** (mächtiger
  Presentation-Modus/Page-Building, aber gehostete DB + Vendor-Lock-in).
- **Plan: gestufter Umbau, beginnend mit Stories.** Prototyp (`/prototype-astro/`) vom
  Nutzer getestet & abgenommen → **Entscheidung: Stufe 1 produktiv bauen.** Läuft auf
  Branch `astro-umbau` nach festem Bauplan (Schritt 0–6); aktuell nach Schritt 0.
- **Capability-Lock verankert** (`CLAUDE.md` + `CAPABILITIES.md`): 4-Schritt-Verfahren
  (Extrahieren → Bestätigen → Bauen → Abhaken) sichert „keine Funktion verlieren".
- **Erkenntnis:** Der große Aufwand liegt **nicht** im CMS, sondern im Neubau der
  🔴-Funktionen (MapLibre-Karte, Lightbox/Filmstreifen) — die profitieren von keiner
  Live-Vorschau und sind das eigentliche Risiko für „keine Funktion verlieren".
- **Harte Bedingung:** Kein Funktionsverlust gegenüber der heutigen Live-Seite.
