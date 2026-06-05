# ABNAHME — AD-Photography (neue Astro/Tina-Seite vs. Live)

> **Zweck:** Schritt-für-Schritt-Vergleich der **neuen** Seite mit der **Live**-Seite,
> bevor `main` umgestellt wird (Cutover). iPad-tauglich: zwei Tabs nebeneinander,
> jeden Punkt antippen/abhaken. **Abweichungen** unten unter „Notizen" sammeln.
>
> - **LIVE (alt):** `https://aandd-photography.pages.dev`
> - **NEU (Astro):** `https://aandd-photography-astro.pages.dev`
> - **CMS (neu):** `https://aandd-photography-astro.pages.dev/admin`
>
> **Vor dem Test:** auf beiden Seiten **Hard-Reload** (iPad: Seite neu laden / Cache).
> Jede Sektion **in DE und in EN** prüfen (oben rechts umschalten).
>
> Legende: ✅ = wie Live · ⚠️ = leicht anders · ❌ = fehlt/falsch · 🟰 = bewusst anders (siehe Hinweis)

---

## 0. So testest du
1. NEU-Seite öffnen, oben rechts **DE/EN** beachten.
2. Daneben dieselbe Seite auf **LIVE** öffnen.
3. Abschnitt für Abschnitt vergleichen, Haken setzen.
4. Im Zweifel: **was steht im CMS?** (Abschnitt „CMS oder fest verdrahtet?" je Sektion.)

---

## 1. GLOBAL (auf **jeder** Seite prüfen)

### Kopf / Navigation
- [ ] **Logo** oben links, klick → **Startseite**.
- [ ] **Menü-Links** vorhanden: Start · Portfolio · (Stories*) · Reisen · Equipment · Über uns · Kontakt.
  - *Stories-Link erscheint nur, wenn Stories aktiviert sind (CMS → 🎨 Darstellung → „Stories zeigen").*
- [ ] **Aktiver Link** ist hervorgehoben (Terrakotta + Unterstrich) je nach Seite.
- [ ] **Sticky:** Kopf bleibt beim Scrollen oben, leicht durchscheinend.

### Sprache DE/EN — **wechselt WIRKLICH alles?**
- [ ] Umschalter oben rechts, **aktive Sprache** markiert.
- [ ] Klick auf **EN** → dieselbe Seite unter `/en/…`, **alle** Texte englisch (Menü, Überschriften, Fließtext, Knöpfe).
- [ ] Klick zurück auf **DE** → alles wieder deutsch, **gleiche Seite** (nicht zur Startseite gesprungen).
- [ ] Stichprobe je Sektion: Reisen-Tabs, Album-Namen, Stations-Texte, Kontakt-Labels.

### Footer
- [ ] **Logo** + **7 Footer-Links** + „© 2026 Alexandra Apostel & David Bastisch · **Admin**" + „Travel & Outdoor Photography".
- [ ] **Admin**-Link führt zu `/admin` (CMS-Login).

### Mobil / iPad (schmaler Bildschirm)
- [ ] **Burger-Menü** (☰) erscheint, öffnet ein Panel **von rechts**.
- [ ] Tippen auf einen Link **schließt** das Menü und navigiert.
- [ ] DE/EN-Umschalter auch im offenen Menü erreichbar.

### CMS oder fest verdrahtet? (Global)
- **Logo** (Nav/Hero/Footer): **CMS** → 🎨 Darstellung → „Logo".
- **Sichtbarkeits-Schalter** (Stories, „Entdecken", Hero-Logo): **CMS** → 🎨 Darstellung.
- **Menü-Beschriftungen / Footer-Links / Copyright-Zeile:** **fest verdrahtet** (im Code), bewusst — ändern sich selten.

---

## 2. STARTSEITE (ausführlich)

Aufbau von oben nach unten: **Hero → Intro → Momentaufnahmen → Aktuell → Entdecken**.

### Hero (Kopfbild)
- [ ] Großes Bild/Diashow/Video füllt fast den Bildschirm.
- [ ] **Logo** mittig (falls im CMS „Hero-Logo zeigen" an).
- [ ] **Überschrift** („Wir fotografieren die Weite Amerikas …").
- [ ] **Knopf 1** „Portfolio ansehen" → `/portfolio`.
- [ ] **Knopf 2** „Reiseberichte lesen" → nur sichtbar, wenn Stories aktiv.
- [ ] **Scroll-Hinweis** unten + **gerissene Kante** (Übergang zur Seitenfarbe).
- [ ] 🟰 **Politur-Effekte** (Ken-Burns-Zoom, Verlauf, edle Headline, Scroll-Stil) — **neu ggü. Live**, im CMS abschaltbar (Standard an). Gefällt dir der Look?

### Intro-Block
- [ ] Überschrift „Zwei Blickwinkel, ein endloser Horizont." + ✦ + Text.
- [ ] **Instagram-Links** (@a3_flow / @davidbastisch) — Standard im Intro (im CMS auch in Hero/Footer schaltbar).

### Momentaufnahmen
- [ ] Raster aus bis zu **6 Fotos**, **mischt sich bei jedem Neuladen**.
- [ ] Klick auf ein Foto → **Lightbox** (blätterbar, Filmstreifen).
- [ ] Albumname als kleines Label.

### Aktuell („Frisch aus dem Westen")
- [ ] Bis zu **3 Karten** (neueste Reisen/Alben/Stories nach Datum).
- [ ] Tag (Neue Reise/Neues Album/Neuer Beitrag) + Titel + Datum.
- [ ] Klick → richtige Reise/Album/Story.

### Entdecken („Wonach uns gerade ist")
- [ ] **3 Teaser** (Fotos/Alben/Reisen), **mischt sich bei jedem Neuladen**.
- [ ] Nur sichtbar, wenn im CMS „Entdecken zeigen" an (🎨 Darstellung).

### CMS oder fest verdrahtet? (Startseite)
Alles im **CMS → 🏠 Startseite**:
- Hero: Typ (Bild/Diashow/Video), Bild(er), Video+Poster, **Überschrift**, beide **Knopf-Texte**, Politur-Schalter.
- **Intro:** Zwischenüberschrift, Text, **Social-Links** (Plattform + Name) + „wo anzeigen".
- **Sektion-Überschriften:** Momentaufnahmen/Aktuell/Entdecken (Kicker + Titel).
- **Momentaufnahmen/Entdecken-Fotos:** CMS → ⭐ Highlights (sonst Zufall aus Alben).
- **Aktuell** zieht automatisch die neuesten Reisen/Alben/Stories.

---

## 3. STORIES (Liste + Beitrag)

> Hinweis: Stories sind **standardmäßig aus** (wie Live). Zum Testen im CMS → 🎨 Darstellung → „Stories zeigen" anschalten.

### Liste (`/stories`)
- [ ] Karten-Raster, je Karte Cover + Titel + Datum/Kategorie.
- [ ] Klick → Beitrag.

### Beitrag (Reader)
- [ ] Titel/Datum/Kategorie, Cover, Fließtext (Markdown), evtl. YouTube/Bilder.
- [ ] Bilder im Text → **Lightbox**.
- [ ] DE/EN korrekt.

### CMS oder fest verdrahtet? (Stories)
- **Beiträge** (Titel, Text, Cover, Kategorie, DE/EN): **CMS** → Stories.
- ⚠️ **Nahtstelle:** Der **Seitentitel der Stories-Liste** („Reiseberichte / Geschichten von unterwegs …") ist aktuell **fest verdrahtet** (nicht im CMS). Auf Live kam er aus dem CMS. → unter „Offene Punkte".

---

## 4. REISEN (ausführlich)

### Seite (`/trips`)
- [ ] **Seitenkopf** (Kicker/Titel/Einleitung).
- [ ] **Reise-Tabs** (Geburtstag 2023, Westen 2024, Süden 2025, …, **Alaska 2026**), aktiver markiert, mobil scrollbar.
  - [ ] Alaska-Tab zeigt **genau** den CMS-Titel (kein doppeltes „· soon · bald ✦" mehr). *(Teil 1 erledigt.)*
- [ ] **Reise-Kopf:** Meta-Zeile + Zusammenfassung. Bei verknüpftem Album: „Mehr Fotos im Album → …".

### Karte (MapLibre)
- [ ] Karte lädt, **Marker** je Station, aktiver Marker hervorgehoben, Popup mit Name/Datum.
- [ ] Klick auf Marker → springt zur Station; Karte **fliegt** zur Station.
- [ ] Sprach-Labels der Karte passen zur Seitensprache.
- [ ] 🟰 **Scroll-Zoom** über der Karte: aktuell **aus** (wie Live, „cooperative gestures"). → wird Teil 5 (CMS-Schalter).

### Stationen
- [ ] **Stations-Bahn** horizontal, einrastend (Snap), **‹/›-Pfeile**.
- [ ] Je Station: „Station X/Y", Titel, Datum, **Titelbild**, Text, **weitere Fotos** (→ Lightbox), **Video-Loop**, **YouTube**.
- [ ] **Stop-Liste** unter der Karte, Klick scrollt zur Station.
- [ ] „Reisefazit"-Galerie (falls vorhanden) → Lightbox.

### CMS oder fest verdrahtet? (Reisen)
- **Jede Reise** (Titel, Meta, Zusammenfassung, **Stationen** mit Ort/Bildern/Video/YouTube, „kommende Reise"-Schalter, verknüpftes Album, Reihenfolge): **CMS** → 🧭 Reisen.
- **Seitentexte + Kartenstil** (1 globaler Stil, 5 Optionen): **CMS** → 🧭 Reisen – Einstellungen.
- **Nahtstelle (gelöst, Teil 1):** „· bald ✦" steht jetzt **im Titel** (nicht automatisch) — du steuerst es selbst.
- 🟰 **Kartenstil-Sofortvorschau** im CMS fehlt noch → Teil 8.

---

## 5. PORTFOLIO / ALBEN

### Galerie (`/portfolio`)
- [ ] **Album-Karten** (2 Spalten, mobil 1), je Karte Titel + Pfeil + Foto-Anzahl + Notiz.
- [ ] **Auto-Diashow** in der Karte (Bilder gleiten, **‹/›-Pfeile**, läuft alle paar Sekunden).
- [ ] **Klick auf die Diashow** → Lightbox; **Klick auf den Titel** → **Album-Unterseite**.
- [ ] (Falls im CMS aktiviert) Sortier-Leiste **Alben / Neueste / A–Z**. *(Standard: nur Alben, wie Live.)*

### Album-Unterseite (`/portfolio/<name>`)
- [ ] Kopf „Album" + Name + Notiz + **Foto-Raster** → Lightbox.

### CMS oder fest verdrahtet? (Portfolio)
- **Alben** (Name, Notiz, Datum, Fotos, verknüpfte Reise, Anheften+Reihenfolge): **CMS** → 🖼️ Alben.
- **Seitentexte + Sortier-Modi:** **CMS** → 🖼️ Galerie-Einstellungen.
- 🟰 **CMS-Benennung** heißt „Galerie/Alben", Website sagt „Portfolio" → wird Teil 9 angeglichen.

---

## 6. EQUIPMENT (`/gear`)
- [ ] Liste nach **Kategorien**, je Eintrag Name/Marke + Link mit „↗".
- [ ] DE/EN.
- [ ] **CMS** → 🎒 Equipment (Seitentexte + Einträge mit Kategorie-Auswahl).

## 7. ÜBER UNS (`/about`)
- [ ] Kopf + **2 Personen** (Foto, Name, Rolle, Bio, Ausrüstungs-Zeile) + „Warum die USA?"-Block.
- [ ] Personen-Fotos: hochgeladen → echtes Bild, sonst Illustration.
- [ ] DE/EN.
- [ ] **CMS** → 📄 Über uns.
- 🟰 **Foto-Positionierung** (nichts abschneiden): Optionen siehe „Bild-Kontrolle" (Teil 4).

## 8. KONTAKT (`/contact`)
- [ ] Kopf + „Schreib uns direkt"-Block + **Kanäle** (E-Mail/Social mit Icons) + Standort.
- [ ] **Formular** sichtbar (Name/E-Mail/Nachricht + Senden).
- [ ] ⚠️ **Formular sendet noch NICHT** wirklich (nur Vorschau) → „Offene Punkte" (W5).
- [ ] **CMS** → ✉️ Kontakt.

---

## 9. OFFENE PUNKTE — **vor Cutover klären**

- [ ] **Bild `IMG_5618.webp`** (in Story „Utah-Drohne-Kevin") fehlt im Repo → neu hochladen **oder** Referenz entfernen.
- [ ] **Bild `IMG_5534.webp`** (Test-Station „Anchorage") liegt lokal, aber **uncommittet** → mitcommitten oder verwerfen.
- [ ] **Kontaktformular-Versand (W5):** echter Versand-Dienst + Datenschutz — Entscheidung offen.
- [ ] **Reisen-Vorschau-Feinschliff:** Stations-Durchscrollen/Snap im schmalen CMS-Vorschau-Iframe noch geradeziehen.
- [x] **Alaska-Titel:** geklärt (Teil 1 — Tab = reiner CMS-Titel; Zusatz tippst du selbst).
- [ ] **Stories-Seitentitel** (Liste): aktuell fest verdrahtet → soll er ins CMS? (Entscheidung.)
- [ ] **Bild-Kontrolle / Zuschnitt:** Optionen aufbereitet (Teil 4, weiter unten) → du wählst.
- [ ] **Gesamt-Bildkontrolle:** alle Seiten DE+EN auf abgeschnittene/fehlende Bilder durchsehen.

---

## 10. PRÜFGRUPPEN — noch zu bauende Teile (Sammel-Auftrag)

> Diese Punkte werden **erst gebaut** und dann hier abgehakt. Stand: offen.

- [ ] **Teil 3 – CMS-Komfort:** (a) Zurück-Buttons (Bearbeitung→Übersicht, CMS→Website), (b) **Live-Vorschau auf jeder** CMS-Seite vereinheitlicht, (c) Admin-Banner auf der Website (an/aus, Standard aus).
- [ ] **Teil 4 – Bild-Kontrolle:** Optionen zum Skalieren/Positionieren (siehe unten) — **nur Auswahl**, kein Bau in dieser Runde.
- [ ] **Teil 5 – Karten-Scroll-Zoom:** als CMS-Schalter (Standard wie jetzt = aus).
- [ ] **Teil 6 – Rahmen + Schatten:** 3-Stufen-CMS-Einstellung (keine/ausgewogen/kräftig), warm getönte Schatten, global.
- [ ] **Teil 7 – EN-Felder im CMS** visuell abheben (dezent, Erdtöne).
- [ ] **Teil 8 – Kartenstil-Sofortvorschau** im CMS (wie früher Sveltia).
- [ ] **Teil 9 – CMS-Benennung „Portfolio"** an die Website angleichen (+ Liste weiterer Abweichungen).
- [ ] **Teil 10 – CMS-Orientierung „Wo bin ich"** (Klartext-Name oben, aktiver Menüpunkt markiert).

---

## 11. BILD-KONTROLLE — Optionen (wird in Teil 4 ausgearbeitet)

> Platzhalter — wird mit der Live-Wahrheit-Analyse gefüllt (Skalieren in Reise-/Story-Beiträgen,
> Positionieren der „Über uns"-Fotos: freies Transformieren vs. Fokuspunkt vs. Zoom+Position;
> je Aufwand, Wirkung, Mobile-Auswirkung). Du wählst danach.

---

## NOTIZEN / Abweichungen (hier sammeln)
- …
