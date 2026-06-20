# STATUS.md — Aktueller Projektstand

> **Stand: 2026-06-20** · Branch `main` · ✅ **STABILER ABSCHLUSS-STAND — bewusster Pausenpunkt.**
> Seite **live** auf `main`, Cutover durch. SEO-Grundlage steht (Sitemap, JSON-LD, Google Search
> Console: Property bestätigt + **Sitemap erfolgreich gelesen**), Datenschutz **vollständig**
> (inkl. Web3Forms), Performance ok, Barrierefreiheit-Basics (alt-Texte) drin, Security-Header +
> CSP `frame-ancestors` gesetzt. **Keine offenen Pflicht-Punkte.** Alles Übrige ist **geparkt/Kür**
> (§6, „bei Bedarf/Lust"). Die Seite wird jetzt **genutzt** (Inhalte pflegen, teilen) statt weitergebaut.
> Die alte Single-File-`index.html` ist abgelöst. Diese Datei ist eine **Momentaufnahme** (wird bei
> jeder Session überschrieben, nie angehängt). Historie → `CHANGELOG.md`. Cutover-Lehren → `FAHRPLAN.md`.
>
> ⏳ **Nach dem Meilenstein dazugekommen (20.06., committet, noch nicht live):** Equipment-Kategorien
> **direkt im Equipment-Formular** editierbar (Inline-Liste `categories` + Custom-Dropdown je Gerät) +
> Über-uns-Profile-Hover-**Schalter auf der „Über uns"-Seite** (`person_hover`). **Offen für David:
> Push + Tina-Cloud-Re-Index** (Schema-Änderung), danach im CMS gegentesten.

---

## 1. Architektur (Ist-Zustand, live)
- **Frontend:** **Astro** (statisch, SSG) + **React-Inseln** (`client:load`) für interaktive
  Teile (Lightbox, Karte, Galerie, Reisen-Timeline, CMS-Live-Vorschau). Quellcode in **`web/`**.
- **CMS:** **TinaCMS** (Tina Cloud, GitHub-Backend) unter `/admin`. Schema in `web/tina/`.
  Tina Cloud indexiert den Branch `main`.
- **Deploy:** **Cloudflare Pages**, Projekt **`aandd-photography`**, baut von **`main`** →
  `https://aandd-photography.pages.dev`. Root `web`, Build `npm run build`, Output `dist`.
  Build-Env (Plaintext): `TINA_CLIENT_ID`, `TINA_TOKEN` (geheim, **main-berechtigt**),
  `TINA_BRANCH=main`, `NODE_VERSION=22`.
- **Vorschau:** ⏸️ **stillgelegt (17.06.2026)** — das Projekt **`aandd-photography-astro`** (baute von
  `astro-umbau`, noindex) ist **von GitHub getrennt**, kein Auto-Build mehr. Branch `astro-umbau` bleibt im Repo.
  *(Merke fürs Live-Projekt: `PUBLIC_PREVIEW_NOINDEX` gehört ausschließlich in die Vorschau — die Live-Seite bekommt diese Variable **niemals**.)*
- **Build-Pipeline** (`web/package.json`): `copy-uploads.mjs` (zieht Wurzel-`/uploads` in den
  Build — **tragend**) → `gen-uploads-manifest.mjs` → `tinacms build -c "astro build"` →
  `optimize-uploads.mjs` (Sharp, optimiert `dist/uploads`, Repo-Originale bleiben).
- **Karte:** MapLibre GL (selbst gebündelt), Kartenstile von **OpenFreeMap**.
- **Fonts:** lokal (Fontsource Variable) — Fraunces + Mulish, **kein Google**.
- **SEO:** `404.astro` (echtes HTTP-404), `robots.txt`-Endpoint + Sitemap (`@astrojs/sitemap`,
  **38 Seiten DE+EN, `/statistik` ausgeschlossen** — beide noindex) — env-gesteuert (Vorschau `Disallow: /`,
  Live `Allow`). Pro Seite: title/description/OG/Twitter/canonical/hreflang (BaseLayout).
  **JSON-LD** (`@graph`): WebSite + Organization „Wide & Wild" global, `Article` auf Story-Detailseiten.
  **Google Search Console:** URL-Präfix-Property bestätigt (Meta-Tag im Head), `sitemap-index.xml`
  eingereicht und **erfolgreich gelesen**. (Indexierung/Ranking dauern naturgemäß Tage–Wochen.)

## 2. Inhalts-Struktur
- **Settings/Texte:** JSON in `web/src/data/` (`home-*.json`, `appearance-settings.json`,
  `gallery-settings.json`, `trips-settings.json`, `about.json`, `contact.json`,
  `datenschutz.json`, `impressum.json`, `statistik.json`, …).
- **Stories:** Markdown in `web/src/content/` (Frontmatter + Body, DE/EN-Felder).
- **Bilder:** **`/uploads/`** in der Repo-Wurzel (tragend, s. o.). Tina speichert Originale 1:1;
  Verkleinern/WebP via eigenes Bulk-/Crop-Feld (jSquash) bzw. Build-Sharp-Schritt.

## 3. Funktions-Inventur — alle portiert ✅ (live)
- **Startseite:** Hero (Bild/Slideshow/Video), Intro + Social-Row, Momentaufnahmen
  (Lightbox), Aktuell, Entdecken.
- **Portfolio/Alben:** Galerie + Album-Unterseiten, Auto-Diashow, 3 Sortiermodi, Lightbox.
- **Reisen:** `/trips` (Übersicht) + `/trips/<slug>` (vertikale Timeline mit MapLibre-Karte,
  Stationen, Fokus-Dimming, Fortschrittslinie, Video/YouTube, verknüpftes Album).
  **Reisen-Design-System zentral** (`reisen_settings.design` + Regler-Editor, s. §4).
- **Stories:** Liste + Reader (Markdown, Cover, YouTube, Album-Einbettung), an-/abschaltbar.
- **Equipment, Über uns, Kontakt:** portiert; Kontaktformular **sendet echt** (Web3Forms).
  Equipment-**Kategorien direkt im Equipment-Formular editierbar** (Inline-Liste `categories` mit `key`;
  Geräte-Dropdown = Custom-Feld `GearCategoryField`, liest die Liste via react-final-form).
  Über-uns-Profile-**Hover** per Schalter **auf der „Über uns"-Seite** (`person_hover`, an/aus).
- **Querschnitt:** DE/EN überall, Lightbox/Filmstreifen, 5 Kartenstile live, Statistik (Umami,
  cookielos), CMS-Live-Vorschau + Admin-Leiste, Sichtbarkeits-Schalter (🎨 Darstellung).

## 4. Reisen-Design-System (zentral, fertig)
- **Eine** Design-Auswahl für **alle** Reisen: `web/src/data/trips-settings.json` →
  `design` (none/soft/strong/luftig) + `designs`-Objekt (Tuning je Vorlage).
- **Single source of truth:** `web/src/lib/tripDesigns.ts` (Character fest je Vorlage,
  Tuning regelbar; `designToVars`/`tripDesignsCss`/`mergeTuning`/`resolveTripDesign`).
- **Regler-Editor** `web/tina/fields/TripDesignsEditor.tsx` (`ui.component` auf `designs`):
  5 Slider (Dimmung, Luft, Titelgröße, Inaktiv-Größe, Foto-Schatten) + scrollbare
  Live-Vorschau mit Spotlight (Lese-Anker `*0.58`). Editor-Änderungen wirken erst nach
  Push + Cloudflare-`/admin`-Rebuild + Hard-Reload.

## 5. Bekannte Eigenheiten / Fallen (weiter gültig)
- ⚠️ **„Build grün" fängt KEINE Laufzeitfehler** (TDZ/Shadowing in einer React-Insel crasht
  erst im Browser). Interaktive Inseln (Lightbox/Karte/Scroll) im echten Browser gegentesten.
- ⚠️ **`tina-lock.json` nach JEDER `tina/config`-Änderung neu erzeugen** (`npx tinacms dev
  --no-server`, deterministisch; `tinacms build --local` aktualisiert sie NICHT) und committen,
  sonst bricht der Cloudflare-Build ab. **Strukturelle** Schema-Änderungen → **Tina-Cloud-Re-Index**
  (Label-/UI-only ändert den Lock, braucht aber keinen Re-Index).
- ⚠️ **`TINA_TOKEN` ist branch-gebunden** — ein Token nur für `astro-umbau` führt beim
  `main`-Build zu **403**. Der Live-Build braucht einen **main-berechtigten** Token. (Cutover-Lehre.)
- **Lokaler Build:** `./node_modules/.bin/astro build` aus `web/` (mit `npx tinacms dev` für
  GraphQL). **Nicht** `npx astro build`, **nicht** `npm run build` ohne Cloud-Token.
- **`/admin`-Editor** lebt im Admin-Bundle → Editor-Änderungen erst nach Push + Rebuild sichtbar.
  Das CMS-`/admin` lädt die Site-`global.css` **nicht** (Custom-Field-Vorschauen brauchen Literal-Farben).
- **Sichtbarkeits-Schalter** (Stories/Kontakt, 🎨 Darstellung): ist ein Bereich aus, ist er ganz weg
  (Nav/Footer gefiltert + Direktaufruf-Guard leitet auf Startseite). Falle: solange aus, leitet auch
  die CMS-Vorschau um → zum Bearbeiten kurz anschalten.
- **Bilder online erst nach Save+Deploy** (repo-basierte Git-Medien); lokal sofort.
- **Cloudflare-Cache:** nach Deploy Hard-Reload (Strg/Cmd+F5).

## 6. Abschluss-Bilanz & geparkte Kür (KEINE offenen Pflicht-Punkte)
> Stabiler Abschluss-Stand. Nichts hier unten ist eine Pflicht oder blockiert etwas —
> es ist „bei Bedarf/Lust". Vieles ergibt sich erst aus der echten Nutzung.

**✅ Erledigt (das Fundament steht):**
- **Cutover** Single-File → Astro+Tina, live auf `main`; Repo-Wurzel aufgeräumt (Tag `legacy-singlefile` = `140eb59`).
- **SEO-Grundlage:** Sitemap (`@astrojs/sitemap`, 38 Seiten, `/statistik` ausgeschlossen), per-Seite
  Meta/OG/Twitter/canonical/hreflang, **h1-Semantik**, **JSON-LD** (WebSite+Organization+Article),
  **Google Search Console** bestätigt + Sitemap erfolgreich gelesen.
- **Datenschutz vollständig:** Cloudflare, Umami, YouTube, OpenStreetMap/OpenFreeMap, **Web3Forms** (`ef62a44`); Impressum aktuell (§ 5 DDG).
- **Security:** `nosniff` + `Referrer-Policy` + CSP `frame-ancestors 'self'` (`web/public/_headers`).
- **Performance:** Hero-LCP via `fetchpriority`/`decoding` + `<head>`-Preload (`ccbad1d`).
- **Barrierefreiheit-Basics:** alt-Texte Klasse 1 + Sammel-alt Klasse 3; Kontaktformular-A11y (`3c1a8a9`).
- ~~G3 iPad-Hochformat~~ ✅ gestrichen (alles okay).

**🅿️ Geparkt / Kür (bei Bedarf/Lust — keine offene Aufgabe):**
- **Eigene Domain statt `pages.dev`** — **größter Hebel** (SEO-Vertrauen, Marke). Hängt an der
  **Namensentscheidung** und löst zugleich **K8** (EN-`<title>` auf der DE-Startseite).
- **G1 · iOS safe-area-insets** — kein konkreter Mangel; `viewport-fit=cover` wäre risikoreich (MAENGEL).
- **G2 · Reisen-Timeline im Querformat (iPhone)** — diagnostiziert (Fix B: Mobil-Layout im Landscape erzwingen; iOS-Sperre nicht möglich).
- **alt pro-Bild für Bulk-Galerien (Klasse 2)** — Objekt-Listen-Umbau + Custom-Upload-Rework + Daten-Migration + **eigener Re-Index** → IDEEN.md (W4).
- **`datePublished` mit Zeitzone** (JSON-LD) — löst 2 gelbe (optionale) Rich-Results-Hinweise; nur sinnvoll für Stories mit vollem Tagesdatum.
- **K3 · Dateiname mit Leerzeichen** (`Logo Website.webp`) — funktioniert (URL-escaped), kosmetisch.
- **K6 · Video-Workflow** — bei Bedarf konkretisieren.
- **Kontakt-Empfängeradresse final prüfen** — Web3Forms-Key/Zieladresse gegenchecken.
- **Reisen-Timeline-Folgephasen / sonstiger Feinschliff** — ergibt sich aus der Nutzung (Bug-/Wunsch-Sammlung), kein Plan vorab.

## 7. Wo nachschauen
- **CHANGELOG.md** — chronologische Historie (nur ergänzen).
- **FAHRPLAN.md** — Cutover-Checkliste (abgeschlossen) + Lehren.
- **MAENGEL.md** — Befund-Liste (Blocker erledigt; offene Klein-/A11y-Punkte).
- **CAPABILITIES.md** — Capability-Lock je Funktion (Regressionsschutz).
- **IDEEN.md** — Ideen + „Nach dem Umbau" (Aufräumen/Stabilität/Datenschutz, jetzt aktiv).
- **ABNAHME.md** — Seite-an-Seite-Vergleichsprotokoll (abgeschlossen).
