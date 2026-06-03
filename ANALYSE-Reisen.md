# Analyse: Reisen-Sektion (Schritt 0 — Live-Wahrheit zuerst)

> Read-only-Analyse aus dem **echten** `index.html` / `admin/config.yml` /
> `content/trips/*.json`. **Nichts gebaut.** Grundlage für eine spätere
> Machbarkeitsentscheidung zur Portierung nach Astro + TinaCMS.
> Stand: 2026-06-02. Code-Fundstellen in Klammern (Zeilen in `index.html`).

---

## 0. Wichtigster Befund: viel ist gar nicht mehr aktiv

`projectUSA` (3197), `projectAlaska` (3203), `ensureXY` (3211), `USA_PATH`
(1272), `ALASKA_PATH` (1274) sind **toter Legacy-Code** einer alten, selbst
gezeichneten SVG-USA-Karte. Belegt: `ensureXY` wird **nirgends aufgerufen**,
`USA_PATH`/`ALASKA_PATH` werden **nirgends verwendet**. Die heutige Karte ist
**reines MapLibre** und nutzt direkt `stop.lon` / `stop.lat`.
→ **Diese Projektionen müssen NICHT portiert werden.** (Wäre fast der teuerste
Irrtum gewesen — klassischer „Live-Wahrheit zuerst"-Fall.)

---

## 1. MapLibre-Karte (das Herzstück)

**Bibliothek:** MapLibre GL **5.21.0** von unpkg (JS+CSS, Z. 4336/5).
Kartenstile von **OpenFreeMap** (Vektor, gratis, kein API-Key).

**Init** (`renderTrip`, 3259–3304):
- `new maplibregl.Map({ container:'mlMap', style: wwMapStyleUrl(), center:[-110,40], zoom:3, cooperativeGestures:true, attributionControl:{compact:true} })`
- `NavigationControl({showCompass:false})` oben rechts; `scrollZoom.disable()`
  (Seiten-Scroll statt Karten-Zoom); `cooperativeGestures` (Touch: 2 Finger Karte,
  1 Finger Seite).
- **Robustheit:** `on('error')` schluckt Tile-Aussetzer; **8-s-Fallback** auf Stil
  `liberty`, falls der gewählte Stil hängt (immer eine Karte sichtbar).
- Karte wird **einmal** erzeugt (`window._mlMap`), danach nur neu bezeichnet.

**Marker** (`wwDrawTrip`, 3355–3406):
- Pro Stop ein **DOM-Marker**: 44px transparenter Tap-Bereich + farbiger Punkt
  (aktiv 18px hell, sonst 14px terrakotta), `Popup` (Name + Datum),
  `setLngLat([s.lon, s.lat])`, Klick → `selectStop(idx)`.
- Alte Marker werden vor jedem Zeichnen entfernt. (Route-Linie bewusst entfernt.)
- **Auto-Zoom:** `fitBounds` über alle Stops (padding 50) bzw. `flyTo` bei 1 Stop.

**flyTo zur Station** (`wwActivateStop`, 3472): wenn der Observer eine Station
zentriert → `currentStop` setzen, Marker neu zeichnen, `map.flyTo({center:[lon,lat],
zoom: max(aktuell,5), duration:600})`. **Entkoppelt:** die Karte treibt die
Stationen-Bahn NICHT (verhindert Aufschaukeln).

**5 Stile + Stil-URL** (`wwMapStyleUrl`, 3028): `liberty|positron|bright|fiord|dark`
→ `https://tiles.openfreemap.org/styles/<name>`. Aktiver Stil aus
`trips-settings.json` (`map_style`, geladen in `loadTripSettings`, 3018).
**Admin-Stil-Umschalter** (`wwAdminMapPanel`, 3039): nur im Sveltia-Admin-Modus,
flüchtig (`map.setStyle` + nach `idle` neu zeichnen), kein Writeback.

**Sprach-Labels** (`wwSetMapLanguage`, 3338): iteriert alle `symbol`-Layer mit
`text-field` und setzt `['coalesce', ['get','name:de'|'name:en'], ['get','name:latin'], ['get','name']]`.

**Karte ↔ Stationen:** Klick auf Marker → `selectStop` → scrollt die Bahn zur
Station; Bahn-Scroll → Observer → `wwActivateStop` → Karte fliegt. Klick auf
Stop-Button-Liste (`#tripStoplist`) → ebenfalls `selectStop`.

**Frontend vs. CMS:** Die **komplette Karte ist reiner Frontend-Code**. Aus dem
CMS kommen nur **Daten** (Stops mit `lon/lat`, Texte) + **eine Einstellung**
(`map_style`). Keine tiefere CMS-Kopplung. → **Als Astro-Insel portierbar.**

**Risiken/Stolpersteine bei der Astro-Portierung:**
- 🟡 MapLibre ist eine große Client-Lib → muss als **hydratisierte Insel**
  (`client:load`/`visible`) laufen, nicht statisch.
- 🟡 Die **Entkopplung Observer→Karte** (kein Rückkanal Karte→Bahn) muss exakt
  nachgebaut werden, sonst Flackern/Aufschaukeln.
- 🟢 `map.resize()` nach Sichtbarwerden: In der SPA nötig (versteckter Container);
  in Astro mit **echten Routen** entfällt das Problem meist → eher einfacher.
- 🟢 Stil-Umschalter ist admin-only (Sveltia) → in Tina **gegenstandslos/ersetzt**.
- 🟢 OpenFreeMap/MapLibre sind **gratis & framework-agnostisch** → keine Lizenz-
  oder Kostenfrage.
- **Einschätzung Karte: machbar, mittleres Risiko** — im Kern „MapLibre in einer
  Insel verdrahten und mit Daten füttern".

---

## 2. Stationen + flüssiges Durchwischen

**Aufbau** (`renderStops`, 3534; CSS 633–645):
- `#tripDetail`: horizontaler Flex-Scroll-Container, `scroll-snap-type: x mandatory`,
  `overscroll-behavior-x: contain` (keine Browser-Zurück-Geste), Scrollbar
  ausgeblendet.
- `.trip-slide`: `flex: 0 0 100%`, `padding: 28px`, `scroll-snap-align: center`.
  **Wichtig:** Das Padding liegt **in den Slides**, nicht am Container — damit ist
  der **WebKit-`scrollWidth`-Bug** (End-Padding) von vornherein umgangen.

**Blättern/Wischen:**
- `wwScrollStopTo(idx, smooth)` (3463): `detail.scrollTo({ left: slide.offsetLeft,
  behavior: smooth?'smooth':'auto' })`.
- **IntersectionObserver** (3584): `root:#tripDetail`, `threshold:[0.6,0.9]`;
  Station ≥ 60 % sichtbar → `wwActivateStop`.
- Pfeile (Overlay außerhalb der Snap-Slides) → `stepStop(±1)` (3438) →
  `wwScrollStopTo(target, true)`, geklemmt (kein Umlauf).
- `wwCenteredStopIndex` (3451): nächste Station per `offsetLeft` vs. `scrollLeft`.

**Trackpad-/Touch-Feinheiten — ehrlich:** Anders als die Lightbox gibt es hier
**KEINEN Custom-Wheel/Trackpad-Handler und kein manuelles Entprellen**. Das
Wischen ist **rein nativ** (CSS-Scroll-Snap + `scrollTo` + Observer). Das ist
deutlich **einfacher** als die Lightbox/Filmstreifen-Mechanik.

**Safari-Eigenheiten:** Gleiche Grundbausteine wie die Lightbox (`scroll-snap-type:
x mandatory` + `scrollTo(offsetLeft)`), **aber**: keine eigene Gesten-Logik, kein
Filmstreifen, und der End-Padding-`scrollWidth`-Bug ist durch „Padding in den
Slides" bereits gelöst; `overscroll-behavior-x: contain` neutralisiert die
Zurück-Geste. → **Weniger Safari-Fallen als die Lightbox.**
**Einschätzung Stationen: niedriges–mittleres Risiko**, portiert sich praktisch
1:1 (reines HTML/CSS/JS, keine Framework-Magie).

---

## 3. Ortssuche im CMS (Nominatim)

**Heute (Sveltia):** Feld `location` ist Sveltias **eingebautes `widget: map`**
(`admin/config.yml` 428–434: `type: Point`, `decimals: 6`). Das bringt **von Haus
aus** eine Karte **+ Ortssuche** (Nominatim/OSM) mit: „San Francisco" tippen →
auswählen → Koordinaten werden gefüllt. Gespeichert wird ein **GeoJSON-Point-String**:
`{"type":"Point","coordinates":[lon,lat]}` (lon zuerst!). Gelesen via
`pickStopCoord` (1557): erst `location`-GeoJSON, dann `coords.lat/lon`, dann
direkt `s.lat/s.lon`.

**In Tina nachbauen:** Tina hat **kein** eingebautes Karten-/Such-Widget → man baut
ein **eigenes Tina-Feld** (genau wie das Foto-Upload-Feld, das wir schon haben):
1. Suchfeld → Anfrage an **Nominatim** (`https://nominatim.openstreetmap.org/search?q=…&format=json`),
2. Trefferliste als Dropdown,
3. bei Auswahl → Koordinaten als **denselben GeoJSON-Point-String** speichern
   (dann bleibt `pickStopCoord`/`buildTrip` 1:1 kompatibel),
4. optional kleine **MapLibre-Vorschau** zum Feinjustieren (Klick auf Karte setzt
   den Punkt — wie Sveltia).
**Machbarkeit: hoch.** **Aufwand:** mittel — die reine Suche + Dropdown ist
schnell; die optionale Karten-Vorschau/Klick-Auswahl ist der größere Teil.
**Hinweis Nominatim-Policy:** fairer User-Agent/Referer, max. ~1 Anfrage/s,
Attribution. Für ein kleines CMS unproblematisch (Alternative: Photon/komoot).

**Weitere Custom-CMS-Features der Reisen, die man leicht übersieht:**
- **`map_style`-Auswahl** (5 Stile) in `trips-settings.json` → als Tina-Select.
- **`pin` (highlight/highlight_order)** → Reihenfolge/Anpinnen der Reisen
  (steckt in `build-indexes.js` → `trips-index.json`).
- **Verknüpftes Album** (`album.linked_trip` → „Mehr Fotos im Album", 3236).
- **DE/EN je Station UND je Reise** (verschachtelt `english{}` bzw. flache `*_en`).
- **`photos` (multiple)** pro Station → Bulk-WebP-Feld (haben wir schon).
- **`video` (Loop-Clip)** + **`youtube_url`** pro Station.
- **Reise-Gesamtgalerie** (`gallery_block.gallery`, „Reisefazit") mit Captions de/en.

---

## 4. Inhalts-Struktur Reisen (`content/trips/*.json`)

5 Reisen: `alaska2026, birthday, florida, robin, west`.

**Reise (Top-Level):** `title_de, date, meta_de, summary_de, upcoming, stops[]`,
EN als flache Geschwister (`summary_en, has_english, title_en, meta_en`) **oder**
verschachtelt `english{}` (Code unterstützt beides via `pickEN`). Optional
`gallery_block.gallery[]`, `pin{highlight,highlight_order}`.

**Station (`stops[]`):**
`location` (GeoJSON-Point-String), `name`, `title_de`, `text_de`, `date_de`,
`photo`, `photos[]`, `video`, `youtube_url`, `lat`, `lon` (Legacy-Direktwerte,
Fallback), EN: `date_en/title_en/text_en` (flach) **oder** `english{}`.
Beispiel real: `"location":"{\"type\":\"Point\",\"coordinates\":[-122.42,37.77]}"`,
`name:"San Francisco"`, zusätzlich `lat:37.77, lon:-122.42`.

`buildTrip` (2928) normalisiert all das in `{date, de/en{meta,summary}, upcoming,
title{de,en}, stops[{name,lat,lon,photo,photos,video,youtube,de/en{date,t,txt}}],
gallery[{src,cap{de,en}}]}`.

---

## 5. Gesamturteil

**Ist „Live-Karte + flüssiges Wischen + Ortssuche" in Astro+Tina realistisch 1:1
erreichbar? → JA.**
- **Karte:** MapLibre ist framework-agnostisch → als Astro-Insel mit Daten füttern.
  Toter SVG-Projektions-Code entfällt. **Mittel.**
- **Stationen/Wischen:** rein nativer Scroll-Snap + IntersectionObserver → portiert
  sich nahezu 1:1, **weniger** Safari-Fallen als die Lightbox. **Niedrig–mittel.**
- **Ortssuche:** Sveltia kann es eingebaut; in Tina als **eigenes Feld** nachbaubar
  (Nominatim) — wie das schon gebaute Foto-Feld. **Mittel.**

**Grober Aufwand:** überschaubar verteilt — die Karte und das Tina-Such-Feld sind
die zwei „echten" Bau-Brocken; die Stationen-Bahn ist Fleißarbeit.

**Größte Risiken:** (1) MapLibre-Insel-Hydration + exakte Observer↔Karte-
Entkopplung. (2) Tina-Karten/Such-Feld ist net-neu (kein eingebautes Widget) — aber
machbar. (3) DE/EN- und Koordinaten-Fallbacks (`pickStopCoord`, flach vs.
`english{}`) müssen erhalten bleiben.

**Was ich ZUERST als Prototyp testen würde (bevor man die ganze Sektion baut):**
1. **MapLibre-Mini-Insel in Astro:** OpenFreeMap-Stil laden, 3–4 Marker aus
   Beispiel-Stops, `flyTo`/`fitBounds`, Sprach-Labels — beweist, dass die Karte als
   Insel sauber läuft (der größte Unbekannte).
2. **Tina-„Ort suchen"-Feld:** Nominatim-Suche → speichert GeoJSON-Point —
   beweist das CMS-Herzstück.
Die Stationen-Bahn ist risikoarm und muss nicht vorab als Prototyp abgesichert
werden.

**Kosten:** weiterhin **0 €** (MapLibre + OpenFreeMap gratis, Nominatim gratis mit
Policy, Tina lokal gratis).
