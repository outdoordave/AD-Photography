# IDEEN.md — Verbesserungs-Vorschläge (Abhak-Liste)

Gesammelte Ideen für den Umbau (Astro + TinaCMS). **Vorschläge, kein Automatismus.**

> **Standing Rule:** Es wird **NICHTS umgesetzt**, bis David den Punkt **im
> jeweiligen Bauschritt konkret freigibt** — auch „freigegeben" hier heißt nur
> „darf in den zugeordneten Schritt einfließen", nicht „jetzt bauen".
> Geschmack-Leitlinie: **einfach, übersichtlich, intuitiv, apple-like.**

**Typ:**
- **(A)** = Besucher sehen *exakt wie live*, nur sauberer im Code/Workflow. Capability-Lock unberührt.
- **(B)** = bewusste Abweichung gegenüber der Live-Seite (sichtbar oder im Verhalten).
- CMS-Editor-Ideen betreffen Besucher gar nicht (außerhalb des Besucher-Capability-Locks);
  Ausnahme markiert, wenn sich die **Daten-Form** ändert (Reader muss dann passen).

**Status:** `offen` · `freigegeben` (für den zugeordneten Schritt) · `umgesetzt`

---

## 1. CMS / Tina-Editor

### C1 · Stationsfelder gruppieren  — (A, Datenstruktur-Implikation)
- **Status:** freigegeben · **Zugeordnet:** Reisen-Bau — **von Anfang an mitdenken**
- **Was:** Felder einer Station in „Inhalt" / „📍 Ort" / „Medien" / „🌐 English" bündeln statt ~10 flacher Felder.
- **Warum besser:** übersichtlich, apple-like; eine Station erschlägt heute mit flacher Feldliste.
- **Aufwand:** niedrig · **Capability-Lock:** ändert die JSON-Verschachtelung → der neue Reader muss dazu passen (wird ohnehin neu gebaut).

### C2 · Live-Vorschau der Station beim Tippen — (B, reine Editor-Verbesserung)
- **Status:** freigegeben · **Zugeordnet:** Reisen-Bau
- **Was:** beim Bearbeiten einer Station aktualisiert sich die Reader-Vorschau live (wie bei Stories).
- **Warum besser:** Sveltia hat **keine** Live-Vorschau (`registerPreviewTemplate` dort inaktiv) — größter spürbarer Komfortgewinn.
- **Aufwand:** mittel (Teil des Insel-Baus) · **Capability-Lock:** Besucher unberührt.

### C3 · Ortssuche-Feld mit Mini-Karte — (A)
- **Status:** freigegeben · **Zugeordnet:** Reisen-Bau (ist zugleich der empfohlene Prototyp)
- **Was:** eigenes Tina-Feld: Ort tippen → Nominatim-Treffer → Punkt auf Mini-Karte justierbar; speichert GeoJSON-Point (kompatibel zu `pickStopCoord`).
- **Warum besser:** bildet Sveltias eingebautes `widget: map` 1:1 nach, mit klarer Trefferliste.
- **Aufwand:** mittel · **Capability-Lock:** gleiche Fähigkeit wie live.

### C4 · EN-Felder einklappen/ausblenden, wenn „Englisch aus" — (B, Editor-UX)
- **Status:** freigegeben · **Zugeordnet:** Reisen-Bau (Querschnitt, s. C6)
- **Was:** EN-Felder per Tina-Conditional ausblenden, solange `has_english` aus ist.
- **Warum besser:** weniger Rauschen bei einsprachigen Inhalten.
- **Aufwand:** niedrig · **Capability-Lock:** Besucher unberührt.

### C5 · Ein einheitliches Foto-Feld überall — (A)
- **Status:** freigegeben · **Zugeordnet:** Reisen-Bau — **von Anfang an mitdenken** (Wiederverwendung)
- **Was:** das bestehende Bulk-WebP-Feld (`web/tina/fields/BulkPhotoField.tsx`) für Cover, Stationsbilder, Reisegalerie, Hero-Slideshow nutzen.
- **Warum besser:** konsistente Upload-/Sortier-/WebP-Erfahrung in allen Sektionen statt mehrerer Widgets.
- **Aufwand:** niedrig (wiederverwenden) · **Capability-Lock:** Funktion gleich, nur einheitlich.

### C6 · Einheitliche Bausteine über alle Sektionen — (A, Querschnitt-Prinzip)
- **Status:** freigegeben · **Zugeordnet:** **Querschnitt** (Stories/Reisen/Alben) — als Prinzip in jedem Bau beachten
- **Was:** gleiches DE/EN-Muster, gleiches Foto-Feld, gleiche Datums-/Hilfetext-Konventionen überall.
- **Warum besser:** CMS „aus einem Guss", weniger Sonderfälle, leichter wartbar.
- **Aufwand:** mittel (einmalig) · **Capability-Lock:** strukturell, Besucher unberührt.

### C7 · Knappe, einheitliche Hilfetexte + sinnvolle Defaults — (A)
- **Status:** freigegeben · **Zugeordnet:** Reisen-Bau (und je Sektion)
- **Was:** Sveltias gute, knappe Hints übernehmen; Defaults wie `map_style=liberty`, festes Datumsformat.
- **Warum besser:** intuitiver, weniger Rückfragen.
- **Aufwand:** niedrig · **Capability-Lock:** Besucher unberührt.

---

## 2. Website selbst

### W1 · Performance durch die Architektur — (A, inhärent)
- **Status:** läuft automatisch mit dem Umbau · **Zugeordnet:** ergibt sich aus Astro (kein eigener Punkt)
- **Was:** Code-Splitting pro Route, Inseln nur wo nötig, kein 4338-Zeilen-Monolith.
- **Warum besser:** schnelleres Laden (v. a. mobil) — **ohne** sichtbare Änderung.
- **Aufwand:** inhärent · **Capability-Lock:** gleicher Look, bessere Auslieferung.

### W3 · Responsive Bilder (srcset) — (B, Perf)
- **Status:** offen (zugeordnet, **nicht** isoliert vorgezogen) · **Zugeordnet:** Bild-Pipeline → Reisen-/Alben-Bau bzw. Schritt 6
- **Was:** aus den schon erzeugten WebPs beim Build kleine Varianten + `srcset`.
- **Warum besser:** spürbar weniger Datenlast auf Handys; gibt's heute nicht.
- **Aufwand:** mittel · **Capability-Lock:** Look identisch, nur Auslieferung.

### W2 · `prefers-reduced-motion` respektieren — (B, additiv)
- **Status:** freigegeben (klein) · **Zugeordnet:** **beim jeweiligen Sektions-Bau mitnehmen** (Hero, Scroll-Pfeil, fadeUp)
- **Was:** Animationen bei „Bewegung reduzieren" abschalten/dämpfen.
- **Warum besser:** apple-typische Rücksicht; nimmt nichts weg.
- **Aufwand:** sehr niedrig · **Capability-Lock:** additiv.

### W4 · Alt-Texte — Klasse 1 + Sammel-alt ✅ (Charge 2); pro-Bild-alt geparkt
- **Status:** **Klasse 1** (Einzelbilder aus vorhandenem Titel/Namen) + **Klasse 3** (Sammel-alt
  „Foto aus Album {X}" für Galerie/Lightbox/Momentaufnahmen/Stationen) **umgesetzt in Charge 2**
  (Branch `charge2-alt-og`: `d2c9a83`, `f8a067d`). Hero (dekorativ) + Lightbox-Platzhalter bewusst `alt=""`.
- **Offen — eigenes späteres Projekt: pro-Bild-`alt` für Bulk-Galerien.** Erfordert Umbau der
  `type:'image', list:true`-Felder (Alben-`photos`, Highlights-`images`, Hero-`slideshow`, Stations-`photos`)
  auf **Objekt-Listen `{image, alt}`** + Rework der Custom-Upload-Komponenten (`BulkPhotoField`, Auto-WebP)
  + **Daten-Migration** bestehender String-Arrays + **eigener Tina-Re-Index**. Galerie/Lightbox sind
  🔴-Capability-Lock → sorgfältige Abnahme nötig.
- **Aufwand:** Klasse 1/3 niedrig (erledigt) · pro-Bild-alt **mittel–hoch** (Schema + Migration).

### W5 · Kontaktformular wirklich versenden — ✅ UMGESETZT (06.06.2026, Web3Forms)
- **Status:** ✅ umgesetzt (Commit `671a742`). Kontaktbox sendet echt: POST an
  `api.web3forms.com/submit` mit dem Access-Key aus dem CMS (`form_access_key`) → Mail landet im
  beim Key hinterlegten Postfach (aktuell Test: `davidbastisch@web.de`). Ohne Key bleibt es brav
  „Vorschau". Datenschutz-Pflicht-Häkchen + Honeypot-Spamschutz + Lade-/Fehler-Zustand drin.
- **Offen davor:** nach Push **Tina-Cloud-Re-index + Rebuild** (Schema-Felder neu); echtes
  Senden erst auf der deployten Seite testbar (lokal blockiert die statische Vorschau den fetch ggf.).
- **Datenschutz/Impressum (Gerüst steht, `c6aab1e`):** CMS-Seiten `/datenschutz` + `/impressum`
  (DE/EN) existieren, sind im Footer + am Kontakt-Häkchen verlinkt. ⚠️ **Noch Platzhalter-Text** →
  vor echtem Live-Gang durch geprüften Text ersetzen (Generator/anwaltlich) und **Web3Forms +
  Cloudflare als Auftragsverarbeiter** ausformulieren (USA-Übermittlung/Garantien). Bei Web3Forms
  prüfen, ob die Speicherung der Einsendungen im Dashboard nötig ist (sonst deaktivieren).

### W5b · Eigenlösung statt Web3Forms — Cloudflare-Function + E-Mail-API — (B, Upgrade) — gemerkt
- **Status:** offen, **auf Nutzer-Wunsch vorgemerkt** („merk dir mal 3"). Spätere, markeneigene
  Alternative zu Web3Forms: eine **Cloudflare Pages Function** (`/functions/contact`) nimmt das
  Formular entgegen und verschickt über eine E-Mail-API (z. B. **Resend**) — eigene Absender-Domain,
  keine Drittanbieter-Weiterleitung, volle Kontrolle.
- **Aufwand/Voraussetzungen:** Account bei der E-Mail-API + **geheimer** API-Key (echtes Secret →
  Cloudflare-Env, NICHT ins Repo), idealerweise eigene Domain (für verifizierten Absender;
  MailChannels-Gratisweg für Cloudflare ist seit 2024 weg). Mehr Setup als Web3Forms, dafür
  unabhängiger. **Erst angehen, wenn eigene Domain steht.**

### W5c · Statistik: Per-Inhalt-Events — ✅ UMGESETZT (07.06.2026, Umami, `b3f2be0`)
- **Status:** ✅ umgesetzt. Dienst = **Umami** (aktiv, `b66e15c`). Events: `foto` `{bild, album}`
  beim Lightbox-Öffnen (zentral → alle Foto-Ansichten); `reise` `{reise}` beim Reise-Tab-Wechsel.
  Helfer `lib/track.ts` (No-op wenn Umami aus). Seitenaufrufe decken Story/Reise/Album-Seiten ab.
- **Anzeige:** im Umami-Dashboard (Events). Sichtbar im Reiter „Events" bzw. eingebettet auf
  `/statistik`, sobald die Share-URL hinterlegt ist.
- **Optionaler Ausbau später:** weitere Events (Teaser-Klicks, Album-Diashow-Öffnen, Story-Karten)
  + ggf. eigene Auswerte-UI statt Embed. Cookielos bleibt erhalten.

### W6 · Karte höher/quadratischer im Reisen-Layout — (B, optische Abweichung)
- **Status:** offen · **Zugeordnet:** Reisen-Vollausbau (David entscheidet im Kontext)
- **Was:** die Reisen-Karte höher/quadratischer statt heute „1,5fr breit × 420px hoch".
- **Warum besser:** wirkte im Prototyp sehr breit/flach; mehr Höhe könnte angenehmer sein.
- **Aufwand:** sehr niedrig (CSS) · **Capability-Lock:** **bewusste Abweichung von Live** —
  daher (B); nicht vorab im Prototyp ändern, erst im echten Reisen-Layout im Kontext entscheiden.

### W7 · „Journal"-Reiter (aktuelles, neueste zuerst; mit Insta/Video/Foto-Karten) — (B, neue Sektion)
- **Status:** ✅ **umgesetzt (02.07.2026)** — `journal`-Collection + Seiten (DE/EN) + Startseiten-Teaser +
  Nav/Footer-Reiter + Schalter `show_journal` (komplett abschaltbar) + Standort-Karte (LocationSearchField/
  MapLibre) + interne Verknüpfungskarte (linked_content) + Social-Karte + TikTok-oEmbed-Build-Skript +
  Datenschutz-Absatz. Details/Commits → CHANGELOG (2026-07-02). ⚠️ Re-Index nötig. · **Idee von David (01.07.2026)**
- **Was:** Ein neuer Reiter **„Journal"** (o. ä.) — kurze, datierte Einträge wie ein Tagebuch/Blog,
  **automatisch „neueste zuerst"** sortiert. Pro Eintrag: Datum, kurzer Text, optional angehängte
  Medien — **Foto(s), Video (YouTube wie bisher), und ein Instagram-Beitrag als Karte**.
- **Umsetzung (Skizze, Tina-nah):** eigene Collection `journal` (Markdown/JSON pro Eintrag,
  Dateiname mit Datum → Sortierung neueste zuerst; gleiche Bausteine wie Stories: 📷 Foto / 📸 Album /
  YouTube). Reader-Seite `/journal` (+ `/en/journal`), Karten-Liste. Reiter in die Navigation.
  **Kein Schema-Bruch an Bestehendem**, aber **neue Collection = eigener Tina-Cloud-Re-Index**.
- **⚠️ Instagram-Realität (wichtig, keine Illusion):**
  - **„Ein Link, der IMMER automatisch den neuesten Beitrag zeigt" geht NICHT sauber** ohne
    Instagram **Graph API** (Business/Creator-Konto + Meta-App + Access-Token mit Refresh) **oder**
    ein **Fremd-Widget** (Elfsight/LightWidget/EmbedSocial = externes Tracking-Script). Beides passt
    schlecht zur **statischen, datensparsamen** Seite (Datenschutz/Consent) und ist wartungslastig.
  - **Was aber genau Davids Fall abdeckt:** beim **Erstellen** des Journal-Eintrags den **damals
    neuesten Beitrag** fest **anpinnen** — d. h. die **konkrete Beitrags-URL** (`instagram.com/p/…`)
    ins Feld setzen. Das ist statisch, stabil, kein Live-API nötig.
  - **Darstellung als Karte — zwei Wege:**
    (a) **Offizielles Insta-Embed** (`blockquote` + `embed.js`): reiche Karte, aber **lädt Instagrams
    Script** → braucht **Consent-Gate wie bei YouTube** + externe Requests.
    (b) **Eigene, datensparsame Karte (empfohlen):** beim Anlegen **Vorschaubild + Titel/Caption**
    einmal hinterlegen (manuell oder via **oEmbed** zum Erstellzeitpunkt) → **statische Karte**, die
    zu Instagram **verlinkt**. Schnell, kein Fremd-Script, kein Consent-Problem, passt zum Seiten-Ethos.
- **Aufwand:** mittel (neue Collection + Reader + Nav + Karten-Komponente) · **Capability-Lock:**
  neue Sektion = (B); nichts Bestehendes wird verändert.

---

## 3. Bewusst weggelassen (Stand jetzt)

- **Seitenübergänge / Astro View Transitions** — kollidieren leicht mit den Inseln
  (Karte/Lightbox); die Seite hat schon eine dezente `pageIn`-Animation. Aufwand/
  Risiko nicht wert. **Verworfen** (kann später neu bewertet werden).
- **Jede Design-Änderung** (Fraunces/Mulish, Erdtöne, Illustrationen, Dropcap,
  Pullquote, Lightbox-/Karten-/Wisch-Mechanik) — **Design bleibt 1:1.** „Anders"
  ist hier nicht „besser". 1:1 portieren, nicht neu erfinden.

---

## 4. Nach dem Umbau (geparkt — Status: alle Punkte `offen`)

> **Bewusst KEINE aktuellen Aufgaben.** Nur geparkt, damit sie nicht untergehen.
> Anzugehen, **wenn der Umbau steht** — dann aus dem **dann aktuellen Code**
> (echter Befund statt Vermutung). Nichts hiervon jetzt umsetzen.

### 4.1 Aufräumen / Ordnung
- **Status:** teilweise erledigt · **„Inventur nach dem Umzug"**
- ✅ **Pre-Cutover-Altlasten aus der Repo-Wurzel entfernt** (17.06.2026, `8ca1bee`): alte `index.html`,
  `admin/`, `build-indexes.js`, `content/`, Wurzel-`_headers`/`_redirects`, `prototype-astro/`, verwaistes
  `package-lock.json`. `/uploads` blieb (tragend). Sicherung: Tag `legacy-singlefile`. Damit ist auch der
  Legacy-Karten-Code (`projectUSA`/`projectAlaska`/… in der alten `index.html`) mit der Datei verschwunden.
- ✅ **Toten Prototyp-Code aus `web/` entfernt** (18.06.2026, `2108861`, ~1285 Zeilen): verwaiste
  Komponenten `ProtoGallery.tsx`/`TripMapProto.tsx` + die interne Vorschauroute `/proto/reisen-timeline`
  (`pages/proto/…`, `components/proto/…`, `styles/proto-timeline.css`).
- ✅ **`/uploads` ausgemistet** (18.06.2026, `59e21d5`): von 18 Bildern war genau eines verwaist
  (`IMG_6001.jpg`, 3,6 MB — Original ohne Referenz, genutzt wird die WebP-Variante) → entfernt. Rest sauber.
- **Offen:** tiefere Analyse (ungenutzte Funktionen/Exports in `lib/`, tote CSS-Klassen in `global.css`).
  *(Hinweis: `astro.config.mjs`-Sitemap-Filter `!…/proto/` ist jetzt inert, aber harmlos — bleibt als Schutz.)*

### 4.2 Stabilität
- **Status:** offen
- **Automatischer Check beim Deploy:** baut die Seite sauber, laden die wichtigsten
  Seiten (Start, eine Story, Reisen, Galerie)? → verhindert, dass ein kaputter
  Commit still live geht.
- **CAPABILITIES-Prüfpunkte dauerhaft festhalten** (s. `CAPABILITIES.md`), damit
  spätere Änderungen nicht unbemerkt eine Funktion brechen (z. B. „Karten-/Wisch-
  Timing", „mdToHtml-Sonderfälle").

### 4.3 Datensicherheit
- **Status:** offen
- Klären, ob ein **Backup der Bilder (`/uploads`) AUSSERHALB von GitHub** existiert
  (zweiter Ort: externe Platte/Cloud). Git hält die Historie, aber bei einem
  Foto-Projekt schadet ein zweites, unabhängiges Backup nicht.

### 4.4 Datenschutz — **PRÜFEN / mit Fachkundigem klären**
> ⚠️ **KEINE Rechtsberatung — nur Hinweise.** Standort Deutschland → DSGVO +
> Impressumspflicht. Im Zweifel Fachkundige hinzuziehen.

**Inhaltliche Punkte (prüfen):**
- **Externe CDNs, die Besucher-IPs an Dritte übertragen könnten:** Google Fonts
  (Fraunces/Mulish), MapLibre/unpkg, jSquash. Prüfen, ob man **Fonts und ggf. Libs
  SELBST hostet** (Astro kann Fonts lokal bündeln). *Google Fonts direkt von Google
  war in DE schon abmahngefährdet.*
- **Impressum + Datenschutzerklärung** vorhanden/aktuell? (in DE praktisch Pflicht
  für öffentliche Seiten).
- Wenn das **Kontaktformular (W5)** künftig echt Daten verschickt: datenschutz­konform
  gestalten (wohin gehen die Daten? Einwilligung nötig?).
- **Hinweis:** Die **Nominatim-Ortssuche** ist **nur im CMS** aktiv (betrifft Besucher
  nicht) → datenschutzrechtlich **unkritischer** als die öffentlich ladenden CDNs.

**Technische Selbstprüfung (kostenlos, kannst du selbst machen):**
- **Webbkoll** (`dataskydd.net/webbkoll`) — zeigt, welche externen Verbindungen/
  Dritt-Dienste die Seite aufbaut (Google Fonts, CDNs …) + grundlegende Datenschutz-Aspekte.
- **Cookie-/Tracker-Scanner** (z. B. **CookieYes**) — zeigt gesetzte Cookies und
  eingebundene Tracker.
- **Zweck:** schwarz auf weiß sehen, was die öffentliche Seite an Dritte überträgt,
  **bevor** man rechtlich prüft.

**Rechtliche Prüfung:**
- **Generatoren** für Impressum + Datenschutzerklärung wie **eRecht24**
  (`e-recht24.de`) — für kleine/private Seiten oft ausreichend, teils kostenlos.
- Für **Rechtssicherheit** (v. a. bei kommerzieller Absicht): **Fachanwalt für
  IT-/Medienrecht** oder spezialisierter Datenschutz-Dienstleister. Kein Online-Tool
  ersetzt das.

**Wichtiger Grundsatz (Klarstellung):**
- Die **Domain-Endung** (`.de` vs `.com` vs andere) ändert an den Pflichten
  **praktisch NICHTS.** Maßgeblich sind **Standort des Betreibers (Deutschland)** und
  **Publikum (EU)** → DSGVO + Impressumspflicht gelten **unabhängig von der Endung.**
  Eine `.com`-Domain umgeht deutsches Recht **NICHT.**
- Der **einzige** relevante Unterschied einer eigenen Domain (egal welche Endung)
  ggü. `.pages.dev` ist **TECHNISCH:** Zugang zu **Cloudflares Bild-Optimierung**
  (srcset/Handy-Bilder, **W3**) — das gehört zur **Bild-Pipeline**, nicht zum Datenschutz.

### 4.5 Empfehlung
- **Status:** offen
- Wenn der Umbau steht: einen gezielten **„Aufräumen + Stabilität + Datenschutz"-Audit**
  aus dem **dann aktuellen Code** machen (echter Befund statt Vermutung) — und die
  Datenschutz-Punkte mit Fachkundigem absichern.

---

## 5. (B)-Erweiterungen aus dem Sammel-Auftrag (über Live hinaus, beauftragt)
- **TEIL 3C — Admin-Leiste auf der Website ✅ gebaut** (`SiteAdminBar.astro`): erscheint nur, wenn
  man im Tina-CMS angemeldet ist (localStorage-Token, gleiche Origin) **und** der Schalter
  „🎨 Darstellung → Admin-Leiste" an ist (**Standard AUS**). Links: CMS öffnen, Abmelden.
  Vorbild: Sveltia-`.ww-admin-bar`.
- **TEIL 3B — Live-Vorschau für Settings-Seiten ✅ richtig gebaut** (`1acab68`): Der erste
  Versuch (nur `ui.router`) machte die Editoren leer (`fda8a94` zurückgerollt) — ein Router
  schaltet Tina in **Visual-Editing**, und die Seitenleiste zeigt nur Formulare, die die
  Zielseite per `useTina` registriert. Lösung: Die Kopf-Blöcke (Kicker/Titel/Intro) von
  **Galerie-, Stories- und Reisen-Einstellungen** sind jetzt eine **useTina-Insel**
  (`SettingsHeader.tsx`, generisch via `docKey`) → die Seite registriert ein Formular →
  Bearbeiten + Live-Vorschau (Klick-zum-Feld, Sofort-Update). Verdrahtet auf
  `/portfolio`, `/stories`, `/trips` (+ `/en/`), Router wieder aktiv. `tina-lock` unverändert
  → kein Re-index.
  - **Bewusst NICHT live-verdrahtet:** Startseite, Highlights, Darstellung (zeigen alle auf
    `/`). Deren Zielseite ist eine Astro-Komposition (Hero/Teaser/Toggles) — echte Live-Vorschau
    hieße den halben Homepage-Baum nach React umbauen (großes Risiko, geringer Mehrwert).
    Diese bleiben **form-only ohne Router** (normal editierbar, nur ohne Vorschau-Fenster).
- **TEIL 3A — Zurück-Navigation im CMS ✅ gebaut**: (a) edit→Übersicht ist durch Tinas native
  Breadcrumb abgedeckt (Collection-Name oben anklicken); (b) CMS→Website neuer Menüpunkt
  „Zur Website" in der Seitenleiste (Kategorie „Site") via `cmsCallback`+ScreenPlugin
  (`tina/screens/BackToSiteScreen.tsx`) — leitet sofort nach „/" weiter (Fallback-Link inkl.
  „neuer Tab").
- **TEIL 9 — CMS-Benennung „Portfolio" ✅** (`79d4956`): „Alben"→„Portfolio Alben",
  „Galerie – Einstellungen"→„Portfolio". Nur Labels, kein Re-index.
- **Zusatz B — Klick-Untermenü in der Vorschau (Pilot)** (`8850f59`): Tina öffnet beim Klick
  auf Objekt-Felder {de,en} immer ein Unterformular. Lösung (Option 1, vom Nutzer gewählt):
  zweisprachige Felder flach machen → Klick springt direkt ins Freitextfeld. **Pilot** auf den
  3 Settings-Seiten (flache `*_de/*_en` + neues `EnglishOnlyField`, das sich bei „Nur Deutsch"
  ausblendet). ✅ **Komplett ausgerollt** (`cd8383c`) auf Reisen/Über uns/Kontakt/Equipment/
  Startseite/Album-Notiz: Helfer `bi()`/`tf()`, Daten via `scripts/flatten-bilingual.mjs`
  (166 Felder), Schema via `scripts/flatten-config.mjs`. ⚠️ Schema-Änderung → Re-index nötig.
  **Caveat:** Felder INNERHALB von Listen (Stationen, Galerie, Personen) öffnen weiterhin das
  Listen-Element (Tina-inhärent), aber ohne DE/EN-Unterebene. **Wartet auf Live-Abnahme.**
- **3A „Zur Website" Hinweis:** ist deployt, steckt im ☰-Menü (Rubrik „Site"); kein Dauer-Button
  möglich (Tina-Chrome). Zurück zur Übersicht = Brotkrümel oben im Formular.
- **Offen:** 4 Bild-Kontrolle ✅ analysiert (ABNAHME §11, wartet auf Auswahl) · 5 Karten-Scroll-Zoom-Schalter ·
  6 Rahmen+Schatten (3 Stufen) · 7 EN-Felder im CMS abheben (greift in B mit) ·
  8 Kartenstil-Sofortvorschau · 10 CMS-Orientierung „wo bin ich".

---

## Video-Clips (kurze Clips 5–30 s) — Analyse

**Status:** `offen` · **Typ:** (B) neue Fähigkeit · **kein Cutover-Blocker.** (Stand 2026-06-08)

**Wunsch:** Kurze Clips (5–30 s) direkt vom Handy hochladen (iPhone liefert `.mov`),
**automatische** Umwandlung zu web-tauglichem **MP4/H.264**, git-basiert, kostenlos,
**kein manuelles Vor-Konvertieren**.

### Live-Wahrheit — wie Video aktuell genutzt wird
- **Alte Sveltia-Seite:** Hero erlaubt **MP4-Datei-Upload** (`admin/config.yml` → „Video (MP4)",
  `widget: file`) + Poster; `<video>` im Hero. Längere/Story-Videos via **YouTube** (youtube-nocookie).
- **Astro/Tina-Version:**
  - **Hero** (`tina/config.ts`): mode-Select inkl. `video`; Feld `video` = **String-Pfad zu `/uploads/`**,
    Beschreibung wörtlich **„Video vorher lokal komprimieren (HandBrake/CapCut)"**; dazu `video_poster`.
    Render: `HomeHeroLive.tsx` → `<video src={normalizePath(hero.video)}>`.
  - **Stationen/Reisen:** optionales Feld `video` („Video-Loop (optional)") — gleiche
    „vorher lokal komprimieren"-Beschreibung.
  - **Stories:** YouTube via `wwYouTubeEmbed` (youtube-nocookie).
  - **Aktuell liegt KEINE Videodatei in `/uploads`** → Hero/Stationen nutzen derzeit Bilder.
- **Kernbefund:** Der aktuelle Entwurf **erwartet manuelles Vor-Komprimieren** (HandBrake/CapCut) —
  genau das will der Nutzer NICHT. **Auto-Konvertierung ist eine neue Fähigkeit.**

### iPhone-Formate (ehrliche Antwort)
- iPhone-Kamera: „High Efficiency" = **HEVC/H.265 in `.mov`** (Standard); „Most Compatible" = **H.264 in `.mov`**.
- **HEVC läuft in Safari, aber nicht zuverlässig in Chrome/Firefox.** „Läuft überall" = **MP4-Container +
  H.264 (AVC) + AAC**. iOS kodiert beim Web-Upload HEVC **manchmal**, aber **nicht verlässlich** zu H.264 →
  nicht drauf verlassen.

### Wege (ehrlich bewertet)
- **(a) Browser-Transcoding beim Upload (wie jSquash für Bilder):** bräuchte **ffmpeg.wasm**
  (~25–30 MB WASM, SharedArrayBuffer + COOP/COEP-Header). **Auf iPhone/iPad/Safari unzuverlässig**
  (Speicherlimits killen Tabs, HEVC-Decode heikel, langsam). **Urteil: NICHT zuverlässig — nicht versprechen.**
  (Anders als Bilder: dort geht jSquash, bei Video nicht.)
- **(b) Umwandlung beim Build/CI (GitHub Action mit ffmpeg):** `.mov` → MP4/H.264 automatisch beim Commit;
  kostenlos (Actions-Freikontingent), zuverlässig. **Aber:** Video-Originale im git = **Repo-Bloat**
  (Video ist groß, git schlecht für Binärvideo) → ggf. git-lfs / `.mov` nach Transcode entfernen; Referenz-Handling nötig.
- **(c) Externer Dienst (Cloudflare Stream / Mux):** löst Transcode + Thumbnails + Streaming sauber —
  **kostenpflichtig, nicht git-basiert.** Raus per Constraints.
- **(d) YouTube/Vimeo (wie heute für Stories):** kostenlos, zuverlässig, kein Transcode, kein git-Bloat.
  **Aber** für kurze Hintergrund-Clips klobig (Branding/Controls); DSGVO: youtube-nocookie verbindet beim
  Abspielen doch zu Google. Vimeo sauberer, Free-Tier begrenzt.

### Empfehlung
- Browser-Transcoding **(a): nein** (iOS unzuverlässig — ehrlich, kein Versprechen).
- Beste git+kostenlos+Auto-Konvert-Lösung: **(b) CI-Transcode (GitHub Action, ffmpeg)** — mit Vorbehalt
  **Repo-Bloat** (nur wirklich kurze Clips; `.mov` nach Transcode entfernen oder git-lfs).
- Wenn Repo-Bloat inakzeptabel: **externer Dienst (c)** (löst es sauber, kostet aber).
- Da Video **kein Cutover-Blocker** ist und aktuell **kein** Clip genutzt wird: **vorerst zurückstellen.**
  Wenn gewünscht: Pilot mit (b) an **einem** Hero-Clip; `video_poster` als Standbild beibehalten.

---

## Z. Design-/Regler-System global ausweiten (nach den Reisen) — (B, später)

### Z1 · Zentrales Design-/Regler-System auch für Portfolio/Alben/Stories — (B)
- **Status:** offen · **Zugeordnet:** NACH dem Reisen-Design-System (Schritt 1–3), eigener Brocken
- **Was:** Das für die Reisen gebaute Modell (zentrale Design-Vorlagen + Regler mit Live-Vorschau,
  gespeist aus einer geteilten Quelle `lib/tripDesigns.ts` → `designToVars`/`<style>`) später analog
  auf die **globalen Seiten-Designs** (Portfolio, Alben, Stories, Buttons/Formulare, Stats) übertragen —
  damit auch dort Rahmen/Schatten/Abstände zentral mit Reglern + Vorschau pflegbar sind, statt nur über
  die 3 festen `appearance.image_frame`-Stufen.
- **Warum bewusst getrennt / Vorsicht:** Die globalen Tokens `--ww-ring`/`--ww-shadow` (+ `-d`) werden
  von **sehr vielen** Consumern gelesen (`.story-card`, `.gallery .item`, `.album-slideshow`, `.trip-card`,
  `.map-box`, `.teaser`, `.insta-link`, Buttons/Formulare, Stats, `.person` …). Der **Blast-Radius** ist
  also groß — eine zentrale Änderung wirkt seitenweit. Das braucht **eigenes, breites Testing** (jede
  betroffene Sektion seite-an-seite prüfen), bevor irgendetwas umgestellt wird. **Kein Cutover-Blocker.**
- **Technik-Hinweis:** Das Reise-Reglersystem (Schritt 3) **technisch wiederverwendbar** bauen
  (generisches „Design-Set → CSS-Variablen"-Feld + geteilte Quelle), sodass die globale Ausweitung
  später nur eine zweite Instanz/Datenquelle ist — nicht eine Neuentwicklung.
- **Aufwand:** mittel–hoch (wegen Blast-Radius + Testing) · **Capability-Lock:** betrifft ALLE Seiten →
  nur mit ausdrücklicher Freigabe + dokumentiertem Seite-an-Seite-Vergleich.

---

_Quelle der Ideen: tiefe Live-Code-Analyse (siehe `ANALYSE-Reisen.md`) + Bau von
Stufe 1 (Stories) und dem Foto-Upload-Feld. Pflege: Status pro Punkt aktualisieren,
sobald David ihn im jeweiligen Schritt freigibt/umsetzt._
