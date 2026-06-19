# STATUS.md — Aktueller Projektstand

> **Stand: 2026-06-19** · Branch `main` · **Cutover vollzogen.** SEO/a11y: Charge 1 live, Charge 2 auf Branch.
> Die Astro+TinaCMS-Version ist **live** auf `main`. Die alte Single-File-`index.html`
> ist abgelöst. Diese Datei ist eine **Momentaufnahme** (wird bei jeder Session
> überschrieben, nie angehängt). Historie → `CHANGELOG.md`. Cutover-Lehren → `FAHRPLAN.md`.

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
  35 Seiten DE+EN) — beide env-gesteuert (Vorschau `Disallow: /`, Live `Allow`).

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

## 6. Offene Nacharbeiten (KEIN Cutover-Blocker — ruhige Politur an der Live-Seite)
> Cutover ist durch; nichts hiervon blockiert. Ergibt sich teils aus der echten Nutzung.
- **G1 · iOS safe-area-insets** — ⏸️ zurückgestellt: kein konkreter Mangel, `viewport-fit=cover` wäre risikoreich (s. MAENGEL).
- **G2 · Reisen-Timeline im Querformat (iPhone)** — ⏸️ zurückgestellt, aber diagnostiziert (Fix B: Mobil-Layout im Landscape erzwingen; Sperren geht auf iOS nicht).
- ~~G3 · iPad-Hochformat~~ — ✅ gestrichen (alles okay).
- **Hero-Ladezeit** — ✅ verbessert (`ccbad1d`): `fetchpriority`/`decoding` + `<head>`-Preload des Hero-Bilds.
- ~~K7 · Kontaktformular-A11y~~ — ✅ **erledigt** (`3c1a8a9`); David: Browser-Konsole nach Push gegenchecken.
- **EN-`<title>` auf der DE-Startseite** (K8) — ⏸️ **geparkt**: Wortlaut hängt an der offenen Namensentscheidung.
- **Reisen-Timeline-Folgephasen:** weiterer Feinschliff ergibt sich aus der Nutzung
  (Bug-/Wunsch-Sammlung) — wird bei Bedarf konkretisiert, kein Plan vorab.
- ~~Aufräumen: alte `index.html` & Pre-Cutover-Altlasten aus der Repo-Wurzel~~ — ✅ **erledigt** (`8ca1bee`):
  `index.html`, `admin/`, `build-indexes.js`, `content/`, Wurzel-`_headers`/`_redirects`, `prototype-astro/`,
  Wurzel-`package-lock.json` entfernt; `/uploads` unangetastet. Sicherung: Tag **`legacy-singlefile`** (= Stand `140eb59`).

**SEO & Barrierefreiheit (Chargen, reine Template-Ebene):**
- **Charge 1 — ✅ live** (PR #5): per-Seite `meta description` + Open Graph/Twitter + `canonical` + `hreflang` (BaseLayout);
  **h1-Semantik** (Hero + Reise-Titel = `h1`, Stationen `h2`); Security-Header `nosniff` + `Referrer-Policy` (`web/public/_headers`).
- **Charge 2 — ✅ auf `main`** (auf Davids Wunsch ohne Preview-Umweg per Fast-Forward; **kein Re-Index**; geht mit dem nächsten Push live):
  `og:image` automatisch aus dem Startseiten-Hero (`d72eae2`); **alt Klasse 1** aus vorhandenem Titel/Namen (`d2c9a83`);
  **Sammel-alt Klasse 3** für Galerie/Lightbox/Momentaufnahmen/Stationen (`f8a067d`). Hero + Lightbox-Platzhalter bleiben bewusst `alt=""`.
- **CSP `frame-ancestors 'self'`** — geplant als eigener Branch `csp-frame-ancestors` (Tina-Editor rahmt **same-origin**
  verifiziert; ersetzt das in Charge 1 weggelassene `X-Frame-Options`). Siehe MAENGEL **S1**.
- **alt pro-Bild für Bulk-Galerien (Klasse 2)** — bewusst **geparkt** (Objekt-Listen-Umbau + Custom-Upload-Rework +
  Daten-Migration + eigener Re-Index) → IDEEN.md.

## 7. Wo nachschauen
- **CHANGELOG.md** — chronologische Historie (nur ergänzen).
- **FAHRPLAN.md** — Cutover-Checkliste (abgeschlossen) + Lehren.
- **MAENGEL.md** — Befund-Liste (Blocker erledigt; offene Klein-/A11y-Punkte).
- **CAPABILITIES.md** — Capability-Lock je Funktion (Regressionsschutz).
- **IDEEN.md** — Ideen + „Nach dem Umbau" (Aufräumen/Stabilität/Datenschutz, jetzt aktiv).
- **ABNAHME.md** — Seite-an-Seite-Vergleichsprotokoll (abgeschlossen).
