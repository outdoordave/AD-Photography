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

### W4 · Alt-Texte aus Bildunterschriften befüllen — (B, additiv)
- **Status:** freigegeben (klein) · **Zugeordnet:** **beim jeweiligen Sektions-Bau mitnehmen**
- **Was:** statt vieler `alt=""` die vorhandenen Captions als Alt-Text nutzen.
- **Warum besser:** Zugänglichkeit + SEO, kostet im CMS quasi nichts.
- **Aufwand:** niedrig · **Capability-Lock:** additiv.

### W5 · Kontaktformular wirklich versenden — (B, schließt fehlende Funktion)
- **Status:** offen — **eigenständiges Vorhaben, David terminiert separat**
- **Was:** `handleSend` (heute nur Vorschau, kein echter Versand) an einen Gratis-Dienst hängen (z. B. Formspree/Cloudflare).
- **Warum besser:** macht eine aktuell **fehlende** Funktion echt.
- **Aufwand:** niedrig–mittel · **Capability-Lock:** schließt Lücke, nimmt nichts weg.

### W6 · Karte höher/quadratischer im Reisen-Layout — (B, optische Abweichung)
- **Status:** offen · **Zugeordnet:** Reisen-Vollausbau (David entscheidet im Kontext)
- **Was:** die Reisen-Karte höher/quadratischer statt heute „1,5fr breit × 420px hoch".
- **Warum besser:** wirkte im Prototyp sehr breit/flach; mehr Höhe könnte angenehmer sein.
- **Aufwand:** sehr niedrig (CSS) · **Capability-Lock:** **bewusste Abweichung von Live** —
  daher (B); nicht vorab im Prototyp ändern, erst im echten Reisen-Layout im Kontext entscheiden.

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
- **Status:** offen · **„Inventur nach dem Umzug"**
- Tote Code-Reste entfernen — u. a. der bereits gefundene **Legacy-Karten-Code
  `projectUSA`/`projectAlaska`/`ensureXY`/`USA_PATH`/`ALASKA_PATH`** (s. `ANALYSE-Reisen.md`),
  auskommentierter **Decap-Fallback**, **ungenutzte Bild-Assets** in `/uploads`.
- Prüfen, ob **weitere ungenutzte Funktionen/Dateien** aus der alten `index.html`
  übrig sind (erst sinnvoll, wenn alles portiert ist).

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
- **Offen:** 4 Bild-Kontrolle-Optionen (nur Analyse) · 5 Karten-Scroll-Zoom-Schalter ·
  6 Rahmen+Schatten (3 Stufen) · 7 EN-Felder im CMS abheben · 8 Kartenstil-Sofortvorschau ·
  9 CMS-Benennung „Portfolio" · 10 CMS-Orientierung „wo bin ich".

---

_Quelle der Ideen: tiefe Live-Code-Analyse (siehe `ANALYSE-Reisen.md`) + Bau von
Stufe 1 (Stories) und dem Foto-Upload-Feld. Pflege: Status pro Punkt aktualisieren,
sobald David ihn im jeweiligen Schritt freigibt/umsetzt._
