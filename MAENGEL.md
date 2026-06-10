# MAENGEL.md — Befunde Live-Check Astro-Vorschau (abhakbar)

**Stand: 2026-06-08** · Quelle: technischer Live-Check der Vorschau
`https://aandd-photography-astro.pages.dev` (Stand `fd48c39`) + Quellcode-Analyse.
**Read-only-Audit — nichts geändert.** Fixes erst nach Davids Freigabe (jeder Fix = eigener Commit).

> **Legende:** 🔴 kritisch (Cutover-Blocker) · 🟡 sollte · ⚪ kosmetisch.
> **Methodik-Grenze:** Headless geprüft (HTTP/Assets/Quellcode). **Nicht** prüfbar war
> alles Interaktive (JS-Konsole, Lightbox, Karte, Hero-Umschalter, CMS-Schalter-Wirkung,
> Touch/Scroll) — muss David auf echtem Gerät (Safari/iPad) gegentesten (Liste unten).

---

## 🔴 Kritisch — zwingend vor Cutover

- [x] **R1 · Rechtstexte** — ✅ **DE gefüllt** (Datenschutz + Impressum, echte Angaben, live). Offen nur: `body_en` leer → EN fällt auf DE zurück (s. K4).
  - *Ursache:* `web/src/data/datenschutz.json` + `impressum.json` enthalten PLATZHALTER-Text
    (deutsche Felder mit `[eckigen Klammern]`); **`body_en` ist leer** → EN fällt auf den
    deutschen Platzhalter zurück.
  - *Fix:* Echte Angaben einsetzen (Generator e-recht24 / anwaltlich). Dienste sind bereits
    korrekt benannt (Cloudflare, OpenFreeMap, Web3Forms, Umami; Google Fonts entfällt jetzt).
  - *Cutover-Blocker:* **JA** (harter rechtlicher Blocker für Publikum).

- [ ] **R2 · Echter Geräte-Smoke-Test der Inseln fehlt** (Safari + iPad).
  - *Ursache:* Headless nicht testbar; „Build grün" fängt **keine** Laufzeitfehler
    (siehe Lightbox-Crash: build-grün, lief aber nicht).
  - *Fix:* Test-Checkliste unten durchgehen, v. a. JS-Konsole auf jeder Seite.
  - *Cutover-Blocker:* **JA** (Prozess-Pflicht vor Launch).

---

## 🟡 Sollte — stark empfohlen

- [x] **P1 · Bild-Performance** — ✅ **erledigt** (`7d1079c`): (d) Cache-Header (`_headers`, /uploads 7 Tage) + (e) Sharp-Build-Schritt (`scripts/optimize-uploads.mjs`, optimiert `dist/uploads`, Originale bleiben). Test: 132 MB → 11 MB (~92 %).
  <details><summary>(ursprünglicher Befund)</summary>8–13 MB Roh-JPGs, unoptimiert, kein Browser-Cache.</details>
  - *Ursache:* `/uploads/` enthält Roh-JPGs bis **13,2 MB** (`img_1418-2.jpg` 13,2 MB ·
    `img_4101.jpg` live als **12.762.456 Bytes** bestätigt · `a7406566.jpg` 12,6 MB · …).
    Keine Astro-Bildoptimierung (`<img src="/uploads/…">` direkt, **0× `/_astro`-WebP**),
    **kein Cloudflare Polish**, und `cache-control: max-age=0, must-revalidate` auf `/uploads/`
    → Bilder werden **bei jedem Aufruf neu geladen/validiert**. Format-Mix: 14 WebP / 14 JPG / 1 JPEG.
  - *Live-Wahrheit:* Die **alte Sveltia-Seite** komprimiert beim Upload **im Browser** zu
    **WebP, Qualität 85, max 2400 px** (`admin/config.yml` → `transformations: format: webp,
    quality: 85`). **ABER:** Die großen JPGs liegen **identisch auch im alten Repo-`/uploads`**
    (`img_4101.jpg` byte-gleich in `root/uploads` und `web/public/uploads`) → sie wurden
    offenbar **am Sveltia-Transform vorbei** direkt ins Repo gelegt. Das Problem besteht also
    auf **beiden** Seiten; die Astro/Tina-Version hat zusätzlich **kein** Upload-Transform mehr
    (Tina speichert die Originale 1:1).
  - *Fix:* siehe **Lösungsoptionen unten** (Empfehlung: Build-Schritt + Cache-Header).
  - *Cutover-Blocker:* **Nein, aber für eine Foto-Seite grenzwertig** — auf Mobil das
    auffälligste Qualitätsproblem.

- [x] **P2 · Tina-CDN-Bild im Story-Body** (`utah-drohne-kevin`) — ✅ **erledigt** (`6697937`): md-Bild auf `/uploads/DJI_0019_edit.webp` umgebogen. Kein tina.io-Laufzeitbild mehr.
  - *Ursache:* Inline-Markdown-Bild `![](https://assets.tina.io/.../DJI_0019_edit.webp)` in
    `web/src/content/stories/utah-drohne-kevin.md`. `normalizePath()` (`web/src/lib/stories.ts`)
    biegt nur **Bild-Felder** auf `/uploads/` zurück — **Markdown-Body nicht** → dieses eine Bild
    lädt von Tinas CDN (USA). **Datei liegt lokal vor:** `/uploads/DJI_0019_edit.webp` (282 KB).
  - *Fix:* (a) md auf `![](/uploads/DJI_0019_edit.webp)` ändern **oder** (b) Body-Render um eine
    `assets.tina.io → /uploads`-Ersetzung erweitern (deckt künftige Body-Bilder ab).
  - *Cutover-Blocker:* Nein (aber DSGVO-Konsistenz + Langlebigkeit).

- [x] **P3 · Soft-404 / SEO** — ✅ **vollständig**: **404.astro** (`e58d25e`, echtes HTTP-404) + ✅ **Vorschau-noindex env-gesteuert** (`146dd72`, `PUBLIC_PREVIEW_NOINDEX`) + ✅ **robots.txt + Sitemap** (`ce0ef12`, `@astrojs/sitemap@3.2.1`, 35 Seiten DE+EN; robots.txt als Endpoint mit derselben env-Logik: Vorschau→`Disallow: /`, Live→`Allow`+Sitemap). *(Befund war: unbekannte URLs → Startseite mit HTTP 200.)*
  - *Ursache:* Kein `404.astro`, kein `robots.txt`, **kein Sitemap** (`@astrojs/sitemap` fehlt;
    `/sitemap*.xml` liefert die Startseite). `/gibtsnicht`, `/robots.txt`, `/sitemap.xml` → 200 + Home.
    Zudem **kein `meta robots`** → Vorschau-Domain ist **indexierbar** (Duplicate-Content-Risiko
    beim späteren Launch).
  - *Fix:* `404.astro` ergänzen (Astro erzeugt `dist/404.html` → echtes 404); Sitemap-Integration;
    Vorschau-Domain auf `noindex`/robots-disallow.
  - *Cutover-Blocker:* Nein (kleine, saubere Eingriffe — idealerweise gleich mit).

---

## ⚪ Kosmetisch / Kleinigkeiten

- [ ] **K1 · `about.json` „display"-Feld hält noch eine `assets.tina.io`-URL.**
  - *Ursache:* About-Foto-Feld speichert `{"original":"/uploads/a7406523.jpg","display":"https://assets.tina.io/.../…"}`.
    Gerendert wird `/uploads` (normalizePath) → nur **Daten-Hygiene**, keine sichtbare Wirkung.
  - *Fix:* `display`-URL auf `/uploads/` zurückschreiben.
  - *Cutover-Blocker:* Nein.

- [x] **K2 · Instagram-Handles** — ✅ **erledigt** (`d5ffe73`): zentral aus der Kontaktseite (`contact.json`), Home leitet ab; `@david.bastisch` + `@shot.by.alx_`. ⚠️ Re-Index nach Push.
  - *Ursache:* Footer/Home zeigen `a3.flow` + `david.bastisch`; Kontaktseite zeigt
    `david.bastisch` + `shot.by.alx_`.
  - *Fix:* **Klärung durch David — welche Handles stimmen?** Dann angleichen.
  - *Cutover-Blocker:* Nein.

- [ ] **K3 · Dateiname mit Leerzeichen** (`Logo Website.webp`).
  - *Ursache:* Lädt korrekt (Browser kodiert zu `%20`, live HTTP 200 bestätigt), aber Leerzeichen
    in Dateinamen sind fragil.
  - *Fix:* optional zu `logo-website.webp` umbenennen + Referenzen anpassen.
  - *Cutover-Blocker:* Nein.

- [x] **K4 (teilw.) · EN-Inhaltslücken** — ✅ **Rechtstexte EN** gefüllt (`d7d52df`). Offen: Album-Excerpts/Beschreibungen fallen bei fehlender Übersetzung weiter auf Deutsch zurück (CMS-Pflege).
  - *Ursache:* Album-Excerpts/Beschreibungen + Rechtstexte fallen bei fehlender Übersetzung
    auf Deutsch zurück (z. B. EN-Portfolio „Erstes Album, mit einigen unserer Werke";
    Album `2026-usa-2023` hat `has_english:false`). **Kein Bug** — Inhalts-Vollständigkeit.
  - *Fix:* fehlende `*_en`-Felder im CMS nachpflegen.
  - *Cutover-Blocker:* Nein.

- [ ] **K5 · ~10 ungenutzte `/uploads`-Dateien.**
  - *Ursache:* 19 von 29 Dateien werden auf den geprüften Seiten referenziert; ~10 evtl. Altlasten.
  - *Fix:* nach Bestätigung aufräumen (vorsichtig — Lightbox/Album lädt evtl. dynamisch nach).
  - *Cutover-Blocker:* Nein.

- [ ] **K6 · Video-Clips: kein Auto-Workflow (offener Wunsch).** → Details in **IDEEN.md, Punkt „Video-Clips"**.
  - *Cutover-Blocker:* **Nein** (ausdrücklich kein Blocker).

---

## ✅ Geprüft & in Ordnung (kein Mangel)

- **Google Fonts wirklich weg:** deployte CSS 0× googleapis/gstatic, 11× lokale woff2, 7× „Fraunces Variable".
  (Erst-Abruf zeigte Google = **stale Edge-Cache** → mit Strg/Cmd+F5 testen.)
- **MapLibre selbst gehostet** (gebündelt); nur **Kartenkacheln** von `tiles.openfreemap.org` (dokumentiert).
- **Externe Hosts auf Besucherseiten:** `cloud.umami.is` (überall), `instagram.com` (nur Links),
  `tiles.openfreemap.org` (nur Karte), `api.web3forms.com` (nur Formular-Absenden), sonst nichts.
- **0 kaputte Bilder:** alle 19 referenzierten Bilder live HTTP 200 (case-sensitiv auf Cloudflare geprüft).
- **Keine hardcodierten Inhalte der „Alaska-Klasse"** in Komponenten — alles kommt aus dem CMS.
- **Sichtbarkeits-Guards korrekt:** Kontakt leitet bei `show_contact === false` um, Stories bei
  `show_stories !== true` (`web/src/pages/.../*.astro`). Aktuell stehen **beide auf `true`** (sichtbar).
- **Footer-Links** vorhanden & korrekt: `/impressum`, `/datenschutz`, Instagram (`rel="noopener"`).
- **Kontaktformular** ist auf Versand konfiguriert (Bundle postet an `api.web3forms.com/submit`;
  echte Testmail steht noch aus → R2).

---

## 📊 P1 — Bild-Performance: Lösungsoptionen (Aufwand / Wirkung / Risiko / git-Fit)

> Constraints: git-basiert, kostenlos, Upload direkt aus dem CMS (kein manuelles Vor-Konvertieren).
> Build-Pipeline (`web/package.json`): `copy-uploads.mjs → gen-uploads-manifest.mjs → tinacms build`
> → **sauberer Einstiegspunkt für einen Optimier-Schritt direkt nach `copy-uploads`.**

| Option | Aufwand | Wirkung | Risiko | git/kostenlos? |
|---|---|---|---|---|
| **(a) Astro-Bildoptimierung beim Build** (`astro:assets`/Sharp) | hoch | mittel | mittel | ja, aber Architektur sperrt |
| **(b) Cloudflare Polish / Image Resizing** | sehr gering (Toggle) | hoch | gering technisch | **❌ kostenpflichtig (Pro-Plan)** |
| **(c) WebP-Pipeline beim Upload (wie Sveltia)** | hoch | hoch | hoch | git ja, aber Tina bietet das nicht nativ |
| **(d) Cache-Header** (`public/_headers`) | trivial | mittel (nur Wiederbesuch) | sehr gering | ✅ |
| **(e) Build-Schritt mit Sharp** (eigener `optimize-uploads.mjs`) | mittel | hoch | gering | ✅ |

**Einschätzung je Option (ehrlich):**
- **(a)** Astros `<Image>`/`astro:assets` greift nur bei **statisch importierten** Bildern in `src/`.
  Unsere Bilder liegen in `public/uploads` und werden als **String-Pfad aus React-Inseln** referenziert
  → Astro-Optimierung passt **architektonisch schlecht**. Viel Umbau für mäßigen Gewinn.
- **(b)** Polish/Image-Resizing wären 1 Klick und sehr wirksam — **aber nicht im kostenlosen Tarif**.
  Verstößt gegen „kostenlos". **Raus.**
- **(c)** Sveltias Browser-WebP (jSquash) ließe sich in Tina **nicht ohne Weiteres** nachbauen
  (kein Konfig-Schalter; eigener Media-Store nötig). Hoher, fragiler Aufwand. **Nicht empfohlen.**
- **(d)** `public/_headers` mit `Cache-Control: public, max-age=31536000, immutable` für `/uploads/*`
  behebt das **Neu-Laden bei jedem Besuch** (großer Gewinn für Wiederbesuche), **nicht** aber die
  Erst-Ladegröße. Trivial, risikoarm, perfekt git-tauglich. **Sofort-Minimallösung.**
- **(e)** Eigenes `optimize-uploads.mjs` (Sharp) **im Build** nach `copy-uploads`: skaliert alles
  > 2400 px herunter und re-komprimiert (JPG → q82 **oder** → WebP), **dateinamenstreu in `dist`**
  (Repo-Originale bleiben unangetastet/durable). Spiegelt **genau Sveltias Absicht** (q85/2400 px),
  läuft kostenlos in Cloudflares Build, neue Handy-Uploads werden automatisch beim nächsten Build
  optimiert. 13-MB-JPGs fallen auf ~1–2 MB.

**Empfehlung für unseren Fall:** **(d) sofort** (Cache-Header, 5 Minuten, null Risiko) **+ (e) als
echte Lösung** (Build-Schritt mit Sharp, dateinamenstreu, Originale im Repo bleiben). (a)/(b)/(c)
nicht empfohlen (Architektur / Kosten / Aufwand). **Erst nach Davids Entscheidung bauen.**

---

## 🧪 Geräte-Test-Checkliste (David, Safari + iPad) — gehört zu R2

- JS-**Konsole** auf jeder Seite (wichtigster Punkt).
- **Lightbox:** Öffnen/Blättern/Filmstreifen/Snap, Wheel/Trackpad/Touch, Pfeile, Tastatur, Schließen bei Hintergrundklick.
- **Album-Diashow** (Autoplay + Tap-to-open), **Karte** (Stile, Marker, flyTo, Stationen-Zentrierung, USA/Alaska, Touch),
  **Hero-Umschalter** (Bild/Slideshow/Video, Ken Burns).
- **CMS-Schalter live:** `image_frame` (strong/soft/none), `frame_controls`, `album_hover`, Scroll-Zoom, `show_*`.
- **Mobile:** Scroll-Snap, Fade-Indikatoren, Burger-Menü.
- **Kontaktformular:** echte Testmail senden — kommt sie bei `davidbastisch@web.de` an?
- **Statistik:** zählt Umami, lädt das Dashboard-iframe?
