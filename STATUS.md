# STATUS.md — Aktueller Projektstand

> **Stand: 2026-07-16** · Live-Branch `main`. Seite **live**, Cutover durch. SEO-Grundlage steht
> (Sitemap, JSON-LD, Google Search Console bestätigt + Sitemap gelesen), Datenschutz **vollständig**
> (inkl. Web3Forms), Performance ok, A11y-Basics drin, Security-Header + CSP gesetzt. **Keine offenen
> Pflicht-Punkte.** Übriges ist geparkt/Kür (§6). Diese Datei ist eine **Momentaufnahme** (wird je
> Session überschrieben). Historie → `CHANGELOG.md`. Cutover-Lehren → `FAHRPLAN.md`.
>
> **🆕 Medien-Manager: fester Finder — Vorschau/Toolbar stehen endgültig fest (16.07., `e2a483e`).**
> Die wiederholten Sticky-Versuche (07-13) sind **abgelöst**: statt Page-Scroll + `position:sticky`
> jetzt ein Finder mit **fester Höhe**. `.ww-mm-body` füllt ab >=721px vom Oberrand bis kurz vor den
> Viewport-Boden (JS setzt `--mm-h`), **jede Spalte scrollt intern** (Ordner-Baum · Bilderliste ·
> Vorschau). Die Detail-Vorschau bleibt damit zuverlässig stehen (im Browser verifiziert: interner
> Scroll 1→400, Vorschau top=226 unverändert), die Spaltenüberschrift klebt oben in der Liste, links
> (Ordner) + Mitte (Toolbar/Suche) sind oben bündig. Kompakter, linksbündiger Seitenkopf statt
> Magazin-Hero (der Hero schob den Finder sonst nach unten → ganze Seite scrollte = Ursache des
> „Vorschau scrollt mit"). Marquee auf den internen Scroll-Container umgestellt. ⚠️ Im echten
> Safari/CMS gegenprüfen (Cutover-Regel). 🟡 **Offen (EXIF, wartet auf Entscheidung):** herstellerneutrale
> Brennweiten-Kette (FocalLengthIn35mmFormat → LensModel → FocalLength → Make/Model) analysiert und mit
> 3 echten Fotos belegt — **Konflikt** mit früher gewünschtem Verhalten (Sony real 28mm statt äquiv. 42mm;
> „Tamron"-Präfix; iPhone „Weitwinkel" statt roher Lens-String). Noch NICHT umgesetzt; David entscheidet.
>
> **🆕 Medien-Manager `/medien-manager` (10.07., neuester Stand — Commits `6640d32`…`32b5b67`).** Eigene
> login-geschützte Finder-Seite im Website-Look (wie /statistik, noindex) zum Durchsuchen/Ordnen/Verwalten
> der Bild-Uploads — ergänzt Tinas „Medien". Ordnerbaum (rekursives Manifest), Breadcrumbs, Thumbnail-Grid,
> Suche, Drag&Drop-/Dialog-Upload in den aktuellen Ordner, Löschen, **„Verwendet in"** (Nutzungs-Check über
> `_values` aller Sammlungen inkl. Rich-Text-Bilder), Rechtsklick **„Einem Inhalt zuweisen"**. Neue Uploads
> landen kontextabhängig in Ordnern (`resolveUploadDir`: reisen/<slug>, alben/<slug>, journal/, stories/,
> site/…, allgemein/) — **kein Re-Index** (keine Schema-Änderung), kein Migration des Altbestands. Eigener
> Assets-Client (`src/lib/mediaCloud.ts`, Tinas Cloud-Flow 1:1), da /medien-manager kein `cms.media` hat.
> **Ausbau (`b66d60e`, `32b5b67`):** (a) 404-Fix des „Medien"-Links (Schrägstrich — Cloudflare leitet
> `/medien-manager` ohne Slash nicht um); (b) **Mehrfachauswahl** (Häkchen je Kachel) + **fixe, mitscrollende
> Aktionsleiste** (Alle im Ordner / Verschieben nach… / N löschen / Fertig); (c) **Verschieben nach Ordner**
> (vorhandener oder neuer Name): `moveInCloud` kopiert → `rewriteReferences` biegt ALLE Fundstellen automatisch
> um (inkl. Rich-Text) → alte Datei löschen (nie eine tote Referenz). Der Altbestand (33 Bilder, flach in
> `uploads/`) lässt sich damit nachträglich in Ordner einsortieren. **Explorer-Optik (`c366c06`):** linke
> **Ordner-Baum-Leiste** (sticky, uploads-Wurzel + alle Ordner, aktueller hervorgehoben) + **„Neuer Ordner"**
> (inline; wird dauerhaft, sobald ein Bild drin liegt). Wichtig: aktuell gibt es **noch keine Unterordner** —
> die Struktur entsteht erst durch Anlegen + Hineinlegen/Verschieben von Bildern. **Datei-Manager-Gesten
> (`4de71f4`, `58626ad`, `d83e0d8`):** Cmd/Strg-Klick + Shift-Bereich + Marquee + Cmd/Strg+A; Klick ins Leere
> abwählen; Entf/Esc; **Doppelklick = Lightbox** (←/→); **Drag & Drop** auf Ordner (Baum/Kachel) = verschieben;
> **Sortierung Name A–Z/Z–A**. Offen: Sortierung nach **Datum** (Manifest braucht Zeitstempel) + **Umbenennen**.
> ⚠️ Mac: Strg-Klick = Rechtsklick → für Mehrfachauswahl **Cmd** nutzen. **Detail-Panel (`6cfa6d7`):** liegt
> jetzt über der Kopfleiste (z-index 1200) mit Backdrop (Klick daneben schließt) + sichtbarem ✕. **Klick-
> Lightbox (`e2249c0`):** Klick auf ein Bild öffnet eine Lightbox (Bild + Info-Panel: Name/Pfad/Verwendet-in/
> Aktionen) mit Durchblättern (Pfeile + ←/→). **Ordner-Leiste sticky** unter der Kopfleiste (immer als
> Drop-Ziel erreichbar). **DnD-Fix** `onDragEnter/preventDefault`. ⚠️ Verschieben braucht einen Zielordner
> (sonst nur uploads-Wurzel = „identisch") + Cloud-Test im echten CMS. **Move-Teilfehler + Badge-Klartext
> (`e9c764e`):** Beim Verschieben wird ein Teil-Erfolg (kopiert + Verweise umgeschrieben, aber altes Löschen
> gescheitert) jetzt als **Warnung** gezeigt und die alte Kachel bleibt sichtbar (nachlöschbar) — vorher
> stilles grünes „verschoben" + ausgeblendet → nach Rebuild lag das Bild doppelt da. **Duplikat nach Move =
> Zeichen, dass der Cloud-DELETE scheitert** (dessen echte Fehlermeldung wird nun sichtbar → ggf. Rückmelde-
> Fall). „Verwendet in" zeigt bei Einzel-Seiten ohne Titelfeld (Startseite/Highlights) **keinen Roh-Slug**
> mehr (`home-settings`), nur echte Titel als Klartext (`u.label !== u.filename`). **Crop-Hinweis:** aktueller
> Zuschnitt speichert Crop als Koordinaten im Feld (`{original,crop:{x,y,w,h}}`) → **keine zweite Datei**,
> Original bleibt in Gebrauch und wird korrekt als „verwendet" erkannt; `a7406523-/a7406566-crop*.webp` sind
> verwaiste Alt-Zuschnitte (nirgends referenziert → „nicht verwendet" korrekt, löschbar).
> **Löschbug „Load failed" behoben (`e8c13e1`):** Nach DELETE/Upload pollt der Client den Request-Status; Tina
> baut diese URL **ohne** Versions-Segment (`content.tinajs.io/request-status/<id>/<req>`), unser `parts()`
> hatte fälschlich `/1.6/` drin → Poll scheiterte NACH dem DELETE mit „Load failed" (deshalb schlug Löschen fehl
> UND das Verschieben ließ die alte Datei liegen). Poll-URL korrigiert; `assetsBase`/DELETE/`upload_url` waren
> korrekt. **Toolbar sticky + Mülleimer je Kachel (`423b391`):** obere Leiste bleibt beim Scrollen sichtbar
> (`sticky top:124px`, mobil static; Bulk-Leiste war schon `fixed`); je Kachel oben rechts ein Mülleimer
> (**SVG wie die Beitrags-Kacheln**, nicht Emoji) → direkte Lösch-Nachfrage (in der Mehrfachauswahl
> ausgeblendet). Sticky-`top` auf **124px** (statt 132): Oberkante gleitet 3px unter die Kopfleiste (Ende 127,
> z-index 1100) → **kein Spalt** mehr, durch den Kacheln beim Scrollen sichtbar waren (`5bdf92c`). ⚠️ Der
> URL-Fix (Löschen/Verschieben) ist nur im echten CMS voll prüfbar. Löschen entfernt die Datei **auch aus
> GitHub** (Tina-Cloud committet die Entfernung aus `web/public/uploads/` autonom auf `main`).
> **Rotes Icon + Lade-Spinner + Header-Spalt (`9e28b23`):** Kachel-Mülleimer jetzt rot (`#ec8c7d`, Hover
> `#a3231d`) wie die Beitrags-Kacheln. Wiederverwendbarer Lade-Kreisel `.ww-spinner` (nutzt `ww-spin`) in
> allen Warte-Zuständen (Löschen/Bulk/Verschieben/Hochladen/Zuweisen); Beitrags-Kacheln haben ihren Spinner
> schon über `.ww-dt-btn.is-busy`. **Header-Durchscroll-Spalt (nur Admin):** Header klebte bei `top:38px`,
> Admin-Leiste endet ~34px → 4px scharfer Spalt; auf `top:33px` korrigiert (nur `html.ww-adminbar-on`, kein
> Besucher-Effekt, Frosted-Glass bleibt). ⚠️ Offen/optional: Header ganz deckend statt Frosted (Besucher-
> Design) — nur auf ausdrückliche Freigabe.
> **Token-Refresh gegen „HTTP 401" (`f8ba234`):** /medien-manager läuft ohne Tina-Client, der den id_token
> erneuert (lebt ~1h) → „Verwendet in" gab bei später geprüften Bildern „Fehler (HTTP 401)". Tinas
> `getRefreshedToken` nachgebaut: `freshToken()` in `tinaAdmin.ts` erneuert den Token bei <120 s Rest per
> Cognito `REFRESH_TOKEN_AUTH` und schreibt `tinacms-auth` zurück; `tinaGql` + Upload/Delete nutzen ihn.
> **Rest-Sliver über der Toolbar (`ee819b9`):** Toolbar+Baum auf `top:118` + opaker `::before`-Deckstreifen
> (14px) → durchgehende Deckung ab ~104px, robust gegen die Header-Höhe.
> **Finder-Ausbau (12.07., `0da48f0`+`a5457b2`):** (a) **Metadaten-Manifest** `uploads-meta.json`
> `{pfad:{size,added}}` (Größe + echtes Git-Upload-Datum; `uploads-manifest.json` bleibt string[] für die
> Picker). (b) **Drei Ansichten** Kacheln/Liste/Details (Details = Liste + feste Vorschau-Leiste rechts; Klick
> öffnet dort nur die Vorschau, keine Lightbox). (c) **Sortierung** Name/Größe/Datum/Typ/**Unbenutzt** (nutzt
> `findAllUsed`) + Richtung ↑/↓. (d) **Marquee-Fix**: keine Text-Auswahl (`user-select:none`), Auto-Scroll am
> Rand, Anker in Seiten-Koordinaten. (e) **DnD-Upload**: ganzer Bereich sichtbar gerahmt. (f) **Auto-Ordner**
> „Nach Alben ordnen" (alben/<slug>/, Vorschau zuerst, Referenzen ziehen mit; Journal außen vor) + Upload-Ziel
> „Album". **Master = Alben/Portfolio** (Storys/Reisen verweisen darauf). ⚠️ Nur im echten CMS prüfbar:
> findAllUsed/„Verwendet in", Auto-Ordner-Verschieben, Album-Upload; Marquee-Auto-Scroll im echten Browser.
> **Offen (Idee):** „Am meisten angesehen"-Sortierung — Daten existieren (Lightbox sendet `foto`-Events an
> Umami), braucht aber Umami-Cloud-API-Abruf (API-Key, Build-Schritt). Noch nicht gebaut.
> **Upload-Fenster + Vorschau + Kamera (12.07., `fa4294e`/`8e3f553`/`9e630ed`):** (a) **Upload-Modal**
> („+ Hochladen" öffnet Fenster mit Drop-Feld + Ziel aktueller Ordner/Album/neuer Ordner; „Ziel"-Select
> raus aus der Toolbar; schneller Drop in die Ansicht bleibt). (b) **Details-Vorschau** liegt außerhalb des
> Drop-Felds in einem Viewport mit fester Höhe → Liste scrollt intern, Vorschau bleibt stehen (Finder-Spalten-
> ansicht). (c) **Fade** unter der Sticky-Toolbar. (d) **Kamera-Erkennung** aus EXIF: Build liest Make/Model
> (JPEG+WebP) → `camera` in `uploads-meta.json` (Klarnamen: Sony A7 IV/DJI Air 2S/iPhone …); beim Upload wird
> ein minimaler EXIF-Block in die WebP-Datei gemuxt (`src/lib/exifWebp.ts` + `webpEncode.ts`), damit auch neue
> Uploads die Kamera behalten. UI: Kamera-Spalte (Liste/Details) + Fakt (📷) + Sortier-Option. ⚠️ Alt-WebPs
> ohne EXIF bleiben „—"; echter Upload-EXIF-Erhalt nur im echten CMS/Deploy prüfbar (Node-Round-Trip bestanden).
> **Foto-EXIF + Meistgesehen (12.07., `1e22a77`/`f2558a5`):** Kamera-Erkennung erweitert um **Blende,
> Belichtungszeit, ISO, Brennweite (+KB-Äquiv.), Objektiv, Aufnahmedatum** — Build liest ExifIFD (`exif` in
> `uploads-meta.json`), Upload muxt sie mit in die WebP (`exifWebp.ts` `buildExifTiff`, ~180–260 B; Round-Trip
> ok). UI: Foto-Daten-Block in der Vorschau. **„Am meisten angesehen"**: Build-Schritt `gen-uploads-views.mjs`
> zieht Aufrufe je Bild aus der Umami-Cloud-API (`foto`-Events, `bild`=Dateiname) → `uploads-views.json`;
> Sortierung + 👁 N× in der Vorschau. **Datenquelle = eigener Cloudflare-KV-Zähler** (`functions/api/view.js`;
> Lightbox pingt via `track.countView`, Medien-Manager liest LIVE aus `/api/view`, Fallback statische Datei).
> Umami-Weg verworfen: freier Share weist Event-Daten mit 401 ab, API-Key nur im 20-USD-Plan. 🟡 **Offen
> (David, einmalig):** in Cloudflare ein KV-Namespace anlegen und im Pages-Projekt (Settings → Functions →
> KV namespace bindings) als **`VIEWS`** binden (Production + Preview). Ohne Binding zählt nichts (kein Fehler).
> ⚠️ **Nur im echten CMS prüfbar:** Hochladen/Löschen/**Verschieben+Umschreiben**/**Bulk-Löschen** (Assets-API,
> **CORS-Risiko** beim Signed-PUT → falls unzuverlässig: mit David abgestimmter Rückmelde-Fall, KEIN
> Auto-Wechsel auf Custom-Screen), „Verwendet in"-Treffer, Zuweisen, korrektes Ordner-Landen. Offline
> verifiziert: Manifest-Rekursion, Resolver-Mapping, Finder-Navigation/Suche/Grid, **Auswahl-Modus +
> Bulk-Leiste + Verschieben-Modal + Ziel-Vorschau** (lokaler Browser), Modal-Strukturen + Fehlerpfade.
>
> **🆕 Übersicht-Mehrfachauswahl (09.07. `c9c42a2`, erweitert 10.07. `32ac74a`).** In der nicht-archivierten
> Übersicht: „Mehrere auswählen" → Häkchen je Karte statt der Knöpfe (umrandet), fixe Leiste „N ausgewählt ·
> N archivieren · **N löschen** · Fertig" → Bulk-Archivieren **und Bulk-Löschen** (endgültig, mit Nachfrage;
> Karten blenden aus, Zahl zieht nach, Toast). **Neu:** im Auswahl-Modus ist die **ganze Kachel** anklickbar
> (nicht nur der Kreis) — Klick schaltet Auswahl um, Navigation unterdrückt (Capture). Gelöschte Karten
> blenden sofort über `ww:docs-removed` aus (Gelöschtes taucht — anders als Archiviertes — nicht im Archiv
> auf). Geteilter Speicher `lib/adminSelect.ts` koppelt die Karten-Inseln; getrennt von der Mehrfachauswahl
> im Archiv. Verifiziert (lokaler Browser: Ganz-Kachel-Klick + „N löschen"-Leiste; Screenshot, Build grün).
> **Umgebungs-Notiz:** `~/Dokumente` war zwischenzeitlich TCC-gesperrt (iCloud/
> Dateizugriff, „Operation not permitted") → gelöst via Festplattenvollzugriff für die Claude-App; Repo bei
> Bedarf nach `~/dev/` verschieben.
>
> **🆕 Archiv-Mehrfachauswahl (09.07., `0534eff`).** Häkchen je Kärtchen + „Alle auswählen";
> Aktionsleiste „N ausgewählt · Wiederherstellen · Endgültig löschen · Auswahl aufheben" (Bulk, mit
> Toast + Nachfrage beim Löschen). „Archiv leeren (alle)" bleibt. Verifiziert (2 Test-Archive, Screenshot,
> Build grün). Mehrfach-Archivieren in der NICHT-archivierten Übersicht ist **umgesetzt** (`c9c42a2`, +
> Löschen `32ac74a`). Git-**Mediathek** eigenständig: `/medien-manager` (s. o.) — ergänzt Tinas eingebauten
> Medienmanager („Medien" in der Sidebar/SITE, `media.tina`-Config).
>
> **🆕 Edit-Knopf öffnet die Story mit Live-Vorschau (09.07., `4640923`).** Gelöst: Tinas
> Formular-Editor (`/collections/edit/…`) hat keine seitliche Vorschau (im Admin-Bundle belegt). Die
> gewünschte „Formular + Live-Vorschau" ist Tinas **visuelle Bearbeitung**, die entsteht, wenn die Vorschau
> zur Detailseite navigiert. Fix: der Stift verlinkt jetzt auf die **Detailseite** (`/stories/<slug>` etc.)
> im **selben Fenster** (kein `target=_top`) → in der CMS-Vorschau exakt die visuelle Bearbeitung, „als
> hätte man die Karte angeklickt". Verifiziert (Href = Karten-Link, Build grün). Archivieren/Wiederherstellen
> laufen laut David „super"; Safari-Ladesymbol beim Speichern ist harmlose Kosmetik.
>
> **🆕 Verwaltung-UX-Feinschliff (08.07., `60f6e5a`).** Archiv-**Zahl** zieht sofort nach
> (Event `ww:archive-changed` von `AdminDocTools` → `AdminArchive` refetcht live). **Leere Jahres-Gruppe**
> (Stories) verschwindet beim Ausblenden des letzten Kärtchens. Dezenter **Toast** grün/rot (`showToast`)
> bei allen Aktionen. **Lade-Anzeige:** Rahmen des laufenden Icon-Knopfes rotiert in seiner Farbe
> (`.ww-dt-btn.is-busy`), Dialog-Pillen mit Ladebalken-Schimmer. ⚠️ **Weiter offen:** Live-Vorschau im
> Edit-Menü fehlt (Route korrekt = Tinas eigene; Ursache lokal nicht reproduzierbar → Screenshot/Console
> aus Davids echtem Admin nötig, um es zu knacken).
>
> **🆕 Archiv LIVE aus Tina Cloud + Edit-Route korrigiert (08.07., `422222b`+`0658f47`).**
> **Edit:** Route zurück auf `#/collections/edit/<name>/~/<slug>` (die Umstellung ohne `edit/` führte in
> den Ordner-Browser → „No documents found"). **Archiv live:** Archiv-Liste, Zahl und das Ausblenden
> archivierter Karten holen ihren Stand jetzt **live aus Tina Cloud** (nur eingeloggt), nicht mehr aus dem
> statischen Build → Archivieren/Wiederherstellen wirken **sofort**, auch nach Reload (vorher erst nach dem
> Cloudflare-Build → „grüner Haken, aber wieder da"). Helfer `archivedNodes`/`mapArchived`/`invalidateArchived`
> in `lib/tinaAdmin`; **Fallback** auf statische Props, wenn die Live-Abfrage scheitert (nichts bricht).
> Löschen: Datei raus aus GitHub, Build im Hintergrund. Offline verifiziert (Fallback + Build grün); echter
> Live-Durchlauf nur im echten CMS mit Token. ⚠️ `alaska-california-2026` + `westcoast-2023` sind aktuell
> `archived:true` (aus Davids CMS-Tests) → per „Wiederherstellen" zurückholbar.
>
> **🆕 Verwaltung umstrukturiert — 3 Knöpfe + ein „Archiv" (08.07., `64e81b4`+`f733841`).**
> Nach Brainstorming: **(1) Edit mit Live-Vorschau** — `editHref` nutzt jetzt Tinas visuelle Route
> `#/collections/<name>/~/<slug>` statt der Formular-only-Route `…/edit/…` (das war die Ursache der
> fehlenden Vorschau im Edit-Menü). **(2) Drei Icon-Knöpfe** je Kärtchen: ✏️ Bearbeiten · 🗄️ Archivieren
> (amber, 1 Klick, umkehrbar) · 🗑️ Löschen (rot → Dialog „Endgültig löschen" / „Lieber archivieren" /
> „Abbrechen"; endgültig = Datei **wirklich aus dem GitHub-Repo**). **(3)** „Papierkorb" heißt überall
> **„Archiv"**; im Archiv zusätzlich **„Archiv leeren"**. **(4)** Kein irreführendes Neuladen mehr: kurze
> grüne Bestätigung → Kärtchen ausblenden (Detailseite → zur Bereichs-Übersicht). **(5) Fix:** `_values`
> filtert System-Felder (`_collection`/`_template`) vor `updateDocument` (sonst „not defined by
> ReisenMutation"). ⚠️ **Wichtig (statische Seite):** archivieren/löschen schreibt ins Repo → echte Wirkung
> (aus Liste raus / im Archiv sichtbar) erst nach dem **nächsten Cloudflare-Build**. Verifiziert (Login-Sim,
> Testarchiv, Screenshot, `astro build` grün); echte Mutationen nur im echten CMS mit Token prüfbar.
>
> **🆕 CMS-Seitenleiste aufgeräumt (08.07.2026, `2a5bb14`) — eine natürliche Kachel pro Reiter.**
> Journal/Portfolio/Stories/Reisen hatten je ZWEI Sidebar-Einträge: die rohe `.md`/`.json`-**Dateiliste**
> (Mehrfach-Bereich, „Add File/Add Folder") + den Einstellungen-Bereich (routet auf die Live-Übersicht).
> David arbeitet nicht mit Einzeldateien → die **vier Dateilisten** (`journal`, `alben`, `story`, `reisen`)
> sind jetzt per **CSS im `cmsCallback`** aus der Leiste ausgeblendet
> (`li:not([data-slot]):has(> a[href$="/collections/<name>/~"]){display:none}`; Breadcrumbs tragen
> `data-slot` → unberührt; DOM-Struktur aus dem gebauten `public/admin`-Bundle belegt). Verbleibende
> Bereiche umbenannt: **„Journal", „Stories", „Reisen"** (vorher „… – Einstellungen"; „Portfolio" hieß schon so).
> Pflege komplett über die **Live-Übersichtsseiten** (Karten-Knöpfe Neu/Bearbeiten/Archiv/Löschen). Die
> Listen-Bereiche existieren weiter (Bearbeiten/Neu-Anlegen funktioniert), nur unsichtbar. **Nur UI/Labels →
> KEIN Re-Index**; `tina-lock.json` neu, `astro build` grün (57 Seiten). ✅ **Von David abgenommen** („die
> übersicht ist jetzt perfekt … so hab ich mir das vorgestellt") — als **Dauer-Vorgabe** gemerkt (Memory
> `cms-eine-kachel-pro-reiter`): jeder neue Mehrfach-Bereich bekommt diese Ein-Kachel-Behandlung.
>
> **🆕 Papierkorb pro Bereich + 1-Klick-Archivieren + Knopf-Kopplung (08.07., `932b1b2`+`20291da`).**
> Aus Davids Rückmeldung (nach Visualisierung + Rückfragen gebaut): **(1)** Wandernde Knöpfe behoben —
> Hover-Ziel-Mismatch (Karte hob bei `.story-card:hover`, Overlay bei `.ww-card-wrap:hover` → Karte fiel
> beim Zeigen auf die Knöpfe zurück); jetzt hebt die Karte am Wrap-Hover, beide als ein Stück. **(2)**
> Kärtchen-Knopf ist jetzt **1-Klick „In den Papierkorb"** (coral) — sichere Helfer `setArchived`/
> `archiveDocument`/`restoreDocument` (`lib/tinaAdmin`): rohe `_values` lesen, nur `archived` ändern,
> `updateDocument` zurückschreiben (wie Tinas Speichern, kein Datenverlust). Kein Lösch-Dialog mehr am
> Kärtchen; man landet fürs Archivieren nie im Bearbeiten-Menü. **(3)** „Archiv (N)" → **„Papierkorb (N)"**:
> ein Klick öffnet eine bildschirmfüllende Ansicht im Look der Sektion (Nav bleibt Rahmen), entfernte
> Beiträge als **Lese-Kärtchen** (Titel + Datum + Teaser, kein Titelbild, Klick → echter Beitrag), je
> **🔁 Wiederherstellen** (1 Klick) + **🗑️ Endgültig löschen** (Nachfrage). Alle 4 Bereiche, DE+EN.
> Verifiziert (Login-Sim, Testarchiv, Screenshot, Fehlerpfad 401, `astro build` grün). ⚠️ **Echter
> Mutations-Durchlauf** (archivieren/wiederherstellen/löschen) nur im echten CMS mit Token prüfbar.
> **CMS-Präferenz gemerkt** (Memory `cms-eine-kachel-pro-reiter`): eine Kachel pro Reiter → Live-Übersicht.
>
> **🆕 Verwaltungs-Werkzeuge auch in der CMS-Vorschau (08.07., `24940bb`).** Bearbeiten/Archiv/Löschen +
> „+ Neu" waren auf `self===top` gegated (nur echte Live-Seite) — dadurch fehlten sie in der CMS-Vorschau,
> also genau dort, wo David die Übersicht jetzt erreicht (Reiter → Live-Übersicht im iframe). Der Riegel
> (`e3846da`) war ein **Fehl-Verdacht** gegen die „fehlende Vorschau"; die echte Ursache (Dateilisten der
> Mehrfach-Bereiche) ist mit `2a5bb14` behoben. Jetzt: Werkzeuge sichtbar, **sobald angemeldet** (Live UND
> Vorschau). Leak-Sicherheit unverändert (Besucher ohne Token → nichts). **Verifiziert per Same-Origin-iframe**
> (self≠top + eingeloggt = CMS-Vorschau-Bedingung): `/stories` 6 Karten je Bearbeiten+Löschen + Archiv + „+ Neu",
> `/journal` 4 Einträge je Werkzeuge + Admin-Zeile (Screenshot bestätigt).
>
> **🆕 Journal-Bereich (03.07.2026) — ausgebaut, lokal verifiziert, aktuell SICHTBAR (`show_journal`=true).**
> `journal`-Collection (Tagebuch: kurze datierte Einträge, neueste zuerst; Datum+Text reichen). Seiten
> `/journal` + `/journal/<slug>` + `/en`-Pendants (Detail = Foto-Lightbox, echte MapLibre-Standortkarte,
> YouTube-nocookie, Verknüpfungskarte Album/Story/Reise, Social-Karte, externer Link).
> **Kopf editierbar** (`journal_settings`: Kicker/Titel/Intro DE/EN), **Listen-Stil umschaltbar**
> (`journal_style`: stream/plain/card/notes, CMS-Vorschau), **„Neuer Beitrag"-Button** (nur eingeloggt).
> Startseite: Journal als **Kärtchen im Entdecken-Stil** (kein separater „Aktuell"-Teaser mehr).
> **NEU (03.07., `d210c5b`):**
> • **Hero-Kachel** — Schalter `hero_journal` (Darstellung, getrennt, nur wenn Journal AN) zeigt den
>   **neuesten** Eintrag als schwebende **Ghost-Kachel** statt der Hero-Tagline (Schalter aus → Tagline
>   unverändert); nur Text + Linien-Glyphen für Anhänge (`src/lib/journalGlyphs.ts`). **Hover-Lift** wie
>   die Buttons (Animation auf Wrapper `.hero-journal-wrap`, damit Hover-`transform` nicht überschrieben
>   wird). **Klick führt direkt zum Eintrag** (`/journal/<slug>`, `0b619b0`) — Symbole dort sind reine
>   Hinweise (keine einzelnen Lightboxen auf dem Hero, bewusst). DE+EN.
> • **Listen-Stile aufgewertet (`c154613`,`fe331f7`):** `notes` = **Kraftpapier/Notizbuch**, dabei ist
>   JEDER Eintrag ein **eigenes Kärtchen** (Fläche `#ede1ca` + Schatten + Rand-Linie, mit Abstand — kein
>   großer Block); card = erhabene Blöcke.
> • **Ganzes Kärtchen klickbar (`fe331f7`, nur live):** Klick aufs Kärtchen öffnet den Eintrag (außer auf
>   echtem Symbol/Link oder bei Textmarkierung; `closest('a,button')`); Cursor + Anheben als Signal.
> • **Klickbare Symbole (`c154613`,`fe331f7`, nur live):** Album/Story/Reise → Zielseite, **Pin →
>   OpenFreeMap-Karte in Lightbox** (MapLibre `React.lazy`, dezenter Rahmen), **Mini-Bild → Foto-Lightbox**
>   (dieselbe wie im Detail), Pfeil/Social/Video → Link. Im CMS-Editor (self≠top) bleiben Spans mit
>   `data-tina-field` (Klick = zum Feld).
> • **Kurz-Textvorschau (`b63d3b0`,`7a88ec9`):** Link-Symbol zeigt Kurzlink (`shortUrlLabel`: „@handle ·
>   Instagram", „YouTube", sonst Domain) bzw. eigenen Link-Text. Standort-Symbol zeigt den **optionalen
>   Ortsnamen** (neues Feld `place`, z. B. „Dresden") — leer „Auf der Karte"; Detailseite zeigt ihn über der
>   Karte. **Entscheidungen (David):** Link bleibt **Kurzlink** (keine OG-Fetch-Vorschau); Ortsname als
>   **optionales Kurz-Label** (kein Auto-Geocoding). `place` ist Schema → Teil des ausstehenden Re-Index.
> • **Archiv nach Alter** — Feld `pin` („oben anheften/nicht archivieren") + Einstellung
>   `archive_after_months` (Standard 12, 0 = nie); ältere, nicht angepinnte Einträge in aufklappbarem
>   „Archiv (N)"-Bereich. Logik `partitionJournal` in `src/lib/journal.ts`.
> • **Kombinierte Insel `JournalArchive`** — Kopf + Button + Liste + Archiv in EINER Insel; Kopf/Stil/
>   Archiv-Schwelle jetzt **live** aus `journal_settings` → **CMS-Vorschau reagiert sofort** auf den
>   Stil-Umschalter (vorher erst nach Rebuild). `SettingsHeader`/`JournalNewButton` auf `/journal` abgelöst.
> **Schalter `show_journal`** (Default-Verhalten: aus = ALLES weg — Nav DE+EN, Footer, Kärtchen, Hero-Kachel,
> Direktaufruf→Redirect). TikTok-Vorschaubild via oEmbed beim Build lokal gehostet
> (`scripts/fetch-social-thumbs.mjs`, robust); Instagram-Thumb manuell. Datenschutz-Absatz vorhanden.
> Reiner Zusatz — Wander-Titel/Trip-Timeline/Lightbox/MapLibre/Scroll-Spy unberührt.
> ⚠️ **Struktureller Schema-Eingriff (`pin`, `archive_after_months`, `hero_journal`) → Tina-Cloud-RE-INDEX
> nötig (David, nach Push+Deploy).** Belegt: Live `/journal/` liefert schon korrekt `journal-style-notes`
> (curl) — „Stil wirkt nicht" lag an Vorschau (Build-Wert)/Browser-Cache, nicht am Code.
>
> **✅ Inhalts-Verwaltung an Kärtchen (Bearbeiten + Papierkorb + „+ Neu") — über ALLE Bereiche, Live + CMS-Vorschau.**
> Aktueller Stand (Details im 08.07.-Block ganz oben): **`AdminDocTools.tsx`** (React-Insel, sichtbar sobald
> angemeldet, leak-sicher) zeigt je Inhalt **✏️ Bearbeiten** (Link in den CMS-Editor, `target=_top`) + einen
> **🗑️ Papierkorb-Knopf** (1 Klick → `archiveDocument`, kein Dialog). **„+ Neu"** je Bereich (`AdminSectionBar` +
> Journal-Zeile). **Papierkorb pro Bereich** (`AdminArchive.tsx`, „Papierkorb (N)"): bildschirmfüllende Ansicht im
> Sektions-Look mit Lese-Kärtchen + 🔁 Wiederherstellen / 🗑️ endgültig Löschen. Sichere Helfer in
> `src/lib/tinaAdmin.ts` (`setArchived`/`archiveDocument`/`restoreDocument` via `_values`+`updateDocument`;
> `deleteDocument`). `archived`-Feld in allen vier Bereichen (+ Astro-Zod bei stories); archivierte aus
> Besucher-Listen gefiltert + Detail `noindex` (bleiben gebaut → zurückholbar).
> ⚠️ **Echter Mutations-Durchlauf** (archivieren/wiederherstellen/löschen) nur im echten CMS mit Token prüfbar;
> Löschen = echter Commit (git-wiederherstellbar). ⚠️ `archived` (reisen/alben/journal) = Schema → **Re-Index**
> (mit Stories gebündelt, steht mit dem nächsten Deploy noch aus).
>
> **✅ Detail-Köpfe „wandernder Titel" — Mobil UND Desktop fertig (von David abgenommen, 25.06.).**
> Reise + Story, beide Breakpoints. Architektur (für künftige Header wiederverwendbar, s. Memory
> `wandering-title-architektur`): vertikales Wandern + Andocken = natives `position: sticky` (hoher
> Containing-Block: Reise `.tl-stage`, Story `#page-story`); Schrumpfen = **CSS Scroll-Driven Animation**
> (`animation-timeline: scroll(root)` treibt `@property`-Vars `--tl-p`/`--st-m` → `transform` der h1),
> Easing `cubic-bezier(.42,0,.58,1)`; `@supports`-Gate + **JS-rAF-Lerp-Fallback** (ältere iOS); Titel
> immer einzeilig via gemessenem `scrollWidth` (`--*-fitscale`), **vom großen Font HERUNTER**skaliert
> (scharf). **Desktop:** vollbreite deckende Leiste (Reise `.tl-topbar` grid 1/-1; Story `.story-topline`),
> Fade nur über der Inhaltsspalte (Reise: Karte rechts bleibt scharf + tuckt unter die Leiste), ein
> Zurück-Button, angedockter Titel auf Pillen-Höhe + neben der Pille (JS-gemessen `--st-dock-top/-x`).
> Story dockt **spät** an (Foto erst genießen, `animation-range 34vh 46vh`). **Mobil ≤767 unangetastet.**
> Spy: Reise `.tl-topbar`/headRef konstant 46px → `headH` stabil → `alaska2026`→Station 1 hält.
>
> **✅ CMS-Haupttext-Editor verständlicher — Option 1 (25.06., `1d4e271`+`7391f11`).** Format-Knöpfe
> jetzt **Symbol + Wort** (Fett/Kursiv/Überschrift/Zitat/Liste) statt nur `F K H ❝ •`; Story-Haupttext
> hat eine **Live-Vorschau** (`mdToHtml`-Port wie die echte Seite) → formatierter Text statt rohem
> Markdown. Speicherformat unverändert Markdown. Dateien `MarkdownToolbar.tsx`, `StoryBodyField.tsx`.
>
> **✅ 35-Zeichen-Grenze für Titel (`d27972d`).** `ui.validate` an Reise `title`/`title_en` + Story
> `title_de`/`title_en`. **UI-only → KEIN Re-Index**, nur `tina-lock.json` neu + Deploy. ⚠️ EN-Felder
> nutzen Komponente ohne `wrapFieldsWithMeta` → Fehlertext dort nicht sichtbar (DE zeigt ihn).
>
> ✅ **WYSIWYG-Editor (Weg B) — FERTIG & LIVE auf `main`** (deployt + Tina-Cloud re-indext, läuft; Detail + Spike-Ergebnisse in
> `CAPABILITIES.md`). Tina `rich-text` speichert weiter **Markdown** (Inhalt 1:1), Query liefert **AST** →
> Render via `web/src/components/RichText.tsx` (`<TinaMarkdown>`, `.ww-rich`-Optik 1:1; Helfer
> `pickRich`/`richIsEmpty`/`richToPlain`). Nicht-Story-Felder = `parser:markdown`; EN-Felder via
> `EnglishRichTextField` (Auto-Ausblenden bleibt). **Story = Standard-MDX-Parser** (für native Template-
> Round-Trips) + zwei „+"-Menü-Bausteine **📷 Foto** (`PhotoUploadField`, jSquash-WebP + Mediathek-Picker,
> OHNE Medien-Manager) + **📸 Album**.
> **✅ Fertig + lokal verifiziert (Render + bestehender Inhalt 1:1):** Intro, Bio, Reise-Zusammenfassung+
> Stations-Text, Datenschutz, Impressum (inkl. Inhalts-Aufräumung der Rechts-Seiten, KEINE Wortänderung),
> **Story-Haupttext** (WYSIWYG-Editor im `/admin` bestätigt — kein rohes Markdown; Text/Bild/Pullquote/Album
> rendern + speichern 1:1). Alte Komponenten (StoryBodyField/MarkdownTextarea, Option-1-Vorschau) entfernt.
> **✅ Hands-on bestätigt (David, 26.06.):** 📷 Foto-Baustein einfügen funktioniert; Album-Baustein steht
> noch aus (kein komplettes Album zum Hochladen) — Mechanik identisch, daher unkritisch.
> - **Breakpoint 768–860 bereinigt** (`66e9d0f`): Nav-Zurück auf Detail bis 860 aus + Reise-Band-Pille ab 768
>   sichtbar (überschreibt die `.trip-back ≤860`-Regel) → eine Zurück-Quelle, Story+Reise konsistent (verifiziert
>   768/800/860/861). **✅ erledigt.**
> - **Editor-Feinschliff (Davids Live-Test):** Deutsch (Menü+Tooltips), eingebauter Bild-Knopf raus, Drop-Cap-
>   Hinweis am Feld, EN-Haupttext blendet aus — alle **Editor-JS/Config → nur Deploy, kein Re-Index**.
> - **✅ Bild-„?" behoben (26.06., `1cdaa75`):** Das Foto-Feld zeigte direkt nach dem Upload ein `?` — der
>   gespeicherte `/uploads`-Pfad wird erst nach dem **nächsten Deploy** ausgeliefert. Jetzt zeigen
>   `PhotoUploadField` **und** `SinglePhotoField` das gewählte Bild sofort als **`blob:`-Vorschau**
>   (Fallback `toLocalMedia`). ⚠️ Datei-Dialog headless nicht testbar → Davids Hands-on im Cloud-`/admin`.
>   (BulkPhoto/CropPhoto = Album/Station/Hero haben dieselbe Eigenheit; gleicher Einzeiler bei Bedarf.)
> - **✅ „Edit-Möglichkeiten" durch die Bank Deutsch (26.06., `700ddb7`+`5943d6a`):** Zwei Tooltip-Ebenen!
>   (1) SVG-`<title>` (`format bold` …) via Exakt-Map. (2) **Die WIRKLICH sichtbaren** schwebenden Tooltips
>   (Radix) heißen „Bold (⌘+B)"/„Quote (⌘+⇧+.)"/„Headings" — Begriff + Kürzel, am PC „Ctrl". Dafür ein
>   **Tooltip-Übersetzer** (`5943d6a`), der nur in Tooltip-Containern den führenden Begriff ersetzt und das
>   Kürzel behält (Fett/Kursiv/Link einfügen/Zitat/Aufzählung/Nummerierte Liste/Überschriften), Editor-Text
>   bleibt unberührt. Dazu Save/Reset/Bitte wählen/Abmelden/Medien/Bereiche/veröffentlicht; `Site`→`Website`.
>   **Im `/admin` durch Hovern verifiziert:** „Fett (⌘+B)", „Zitat (⌘+⇧+.)", „Überschriften", „Aufzählung".
> - **✅ Story-EN-Felder folgen `has_english` (26.06., `700ddb7`):** Stories haben keinen globalen Sprach-
>   Schalter, sondern `has_english`. Bisher waren title/category/excerpt_en immer sichtbar + body_en hing am
>   globalen Schalter. Jetzt folgen **alle vier** EN-Felder `has_english` (neue `EnglishStory*` via `useFormState`):
>   aus → unsichtbar, an → sichtbar, Wert bleibt erhalten. Verifiziert (Florida). Tote `EnglishStyled*` raus.
> - **✅ CMS-Vorschau zeigt frisch hochgeladenes Bild sofort (26.06., `72ef29f`):** Problem war, dass ein
>   frischer Upload `/uploads/<neu>` speichert, das erst nach dem Deploy ausgeliefert wird → Vorschau zeigte
>   das „alte" Cover. **Frisch-Upload-Brücke** (`web/src/lib/freshMedia.ts`): Upload-Feld legt die Datei als
>   `data:`-URL im `localStorage` ab; `normalizePath` liefert sie **nur im Editor-iframe** (`self!==top`) —
>   **Live-Seite + SSG-Build unberührt** (immer `null`). Unit-getestet + Live-Render gegengeprüft (0 `data:`,
>   0 kaputt). Seit `5780f3d` für **alle vier** Upload-Felder (Single/Bulk/Crop/Foto-Baustein) — Crop lädt das
>   frische Original sofort (Zuschnitt-Editor funktioniert vor dem Deploy). ⚠️ Cloud-Flow von David gegenchecken.
> - **✅ „Aus Mediathek"-Picker zeigt CMS-Uploads (26.06., `cf16ac1`):** Picker liest `/uploads-manifest.json`;
>   das Skript scannte nur Repo-Wurzel `/uploads`, CMS-Uploads liegen aber in `web/public/uploads` → fehlten.
>   Skript scannt jetzt **beide** Ordner (merge+dedupe); committetes Manifest aus root + nur-getrackten
>   public/uploads (16 → 30). Build-statisch: ganz frische Uploads erst nach Deploy. **✅ Seit `ad0c574` nur
>   noch EIN Ordner** (`web/public/uploads`) — Manifest scannt entsprechend nur noch eine Quelle.
> - **✅ CMS-Formular schneidet rechts nicht mehr ab (26.06., `e303c92`):** Tina setzt auf dem Formular-
>   Feld-Container `whitespace-nowrap` → nichts brach um → Formular blieb breiter als ein schmales Panel und
>   wurde rechts abgeschnitten (Texte/Knöpfe im unsichtbaren Bereich). **Eine** Ursache, nicht einzelne Texte.
>   Fix: `cmsCallback` injiziert `<style>` → genau dieser Container `white-space:normal` (Code-Blöcke bleiben).
>   Admin-CSS, Live/Schema unberührt. Verifiziert bei 470px: 0 Überhang, alles bricht sauber um.
> - **✅ Story-Bausteine bestätigt:** 📷 Foto einfügen → speichert + rendert (David, 26.06.). 📸 Album noch
>   offen (kein komplettes Album zum Hochladen) — Mechanik identisch. Alle Editor-Fixes = **kein Schema-Eingriff**
>   (`tina-lock.json` unverändert) → kein Re-Index, nur Push + Deploy.
> - **✅ „Foto tauschen"-Overlay auf dem Cover (26.06. `97abe0d`; Folge-Fixes 28.+29.06.):** Dezente Knöpfe
>   „📷 Foto ersetzen / 🖼️ Aus Mediathek" **direkt auf dem Cover** in der Live-Vorschau (`PhotoSwapOverlay.tsx`).
>   iframe→parent via `CustomEvent('ww:swap-media')` → `SinglePhotoField` handelt bei Wert-Match. **Nur im
>   Editor-iframe** sichtbar, live nie gerendert (verifiziert: 0 Overlay live). Scope nur Cover. Drei Folge-Fixes:
>   **(a)** Klicks gingen nicht — `.story-topline` (z-1095) fing sie ab → im Editor `pointer-events:none` (`f371651`).
>   **(b)** „Aus Mediathek" ohne Hover → `MediaPickerButton` bekam `className`-Prop, Overlay reicht `ww-swap-btn`
>   durch (`6482d35`). **(c)** Mediathek-Modal lag UNTER der Titel-Leiste (steckte im z-4-Käfig der Overlay) →
>   per `createPortal` an `document.body` (`6482d35`); jetzt sauberes Fenster mit sichtbarem „Schließen ✕".
>   **(d)** Upload aus der Vorschau ging, aber: Live-Cover blieb alt, keine Info, Upload fehlte in der Mediathek
>   (`0d657b2`). Ursachen/Fix: **Schlüssel-Mismatch** der Frisch-Brücke (Cover=`type:'image'` → Tina-CDN-URL ≠
>   `/uploads`-Schreibschlüssel) → `canonUpload` kanonisiert put+get; `StoryReaderContent` rendert bei
>   `storage`/`ww:fresh-media` neu. **Info am Bild** via `putSwapInfo`/`getSwapInfo` (⏳→✓/✗-Pille). **Mediathek**
>   zeigt frische Uploads (`listFreshMedia`) oben mit „NEU"-Badge. ⚠️ **Finaler Upload (Finder-Dialog im iframe)
>   im echten CMS von David hands-on zu prüfen** — besonders ob die CDN-Kanonisierung auf der echten Tina Cloud
>   greift (lokal nicht reproduzierbar; Logik per Node-Test + iframe-Sim belegt). Isoliert/live-gated.
>
> **✅ Sidebar folgt der Vorschau-Navigation (29.06., `bd0e385`):** Forward-Kopplung (Vorschau-Seite öffnen →
> Tina-Formular links zeigt dies Dokument) lief bisher erst bei Klick auf ein Feld. Ursache (Tina-Doku +
> `@tinacms/app`-Quelle): bei mehreren `useTina`-Formularen pro Seite gewinnt standardmäßig „das erste Query" —
> hier das globale Logo (`LogoLink` in SiteNav+SiteFooter). Fix: Tinas `experimental___selectFormByFormId()` in
> jeder Inhalts-Insel, das die echte Form-ID (`_sys.path` = `_internalSys.path`) meldet; zentraler Helfer
> `src/lib/tinaForm.ts` (Einzeldoc + Connection-mit-Slug). Reverse-Kopplung (Liste→Vorschau) lief schon via
> `ui.router`. Verifiziert: genau ein `user-select-form` mit korrekter ID (Story/Reise). **Nachtrag `183a279`:**
> Selector aus `GalleryContent` (Portfolio-Übersicht, `albenConnection` ohne Slug) wieder entfernt — er postete
> `undefined` und löschte die `SettingsHeader`-Auswahl → Sidebar zeigte die ganze Liste. Jetzt postet jede Seite
> genau eine valide Form-ID. **Ladekreis (`5893eae`):** Der kurze Navigations-Übergang zeigte weiterhin Tinas
> Dokumentliste; Fix im `cmsCallback` — Listener auf `url-changed` (Vorschau-Inseln) → Tinas eingebauten
> Lade-Zustand (`sidebar:set-loading-state`) an, nach 700 ms Debounce aus → Tinas **eigener Ladekreis** statt
> Liste. Tinas eigener Auslöser ist in `@tinacms/app` auskommentiert; wir reaktivieren ihn. Kein Schema → kein
> Re-Index. ⚠️ Sichtbarer Spinner + Sidebar-Wechsel im echten `/admin` zu bestätigen (lokal kein Admin-`cms`).
>
> **✅ Deploy + Re-Index erledigt:** Die rich-text-Umstellung (strukturell) ist live auf `main`, Tina-Cloud
> re-indext, Build grün, CMS in Nutzung — der frühere `?`-/Schema-Mismatch ist Geschichte. Seither nur noch
> UI-/Editor-/Build-Feinschliff (kein Schema-Eingriff, `tina-lock.json` unverändert → kein weiterer Re-Index).
>
> **Aktuell offen (Reihenfolge):** 1) **Letzte Commits pushen** (`b66d60e`, `32ac74a`, `32b5b67`, `c366c06`, `4de71f4`, `58626ad`, `d83e0d8`, `6cfa6d7`, `e2249c0`; vorher
> `git pull` — Tina Cloud committet autonom auf `main`, s. Memory `origin-main-moving-target`); nach Deploy
> hart neu laden + Logo/Bilder prüfen. 2) **Im echten CMS testen** (eingeloggt): Medien-Manager Verschieben
> nach Ordner + Referenz-Umschreiben (⚠️ am wichtigsten — verändert Content!), Bulk-Löschen, Signed-PUT-Upload;
> Übersicht Ganz-Kachel-Klick + Bulk-Löschen. 3) Geparkte Kür (§6). — **✅ Bild-Quellen vereinheitlicht** (26.06., `ad0c574`): alles in `web/public/uploads`,
> Repo-Wurzel `/uploads` + `copy-uploads.mjs` raus, Logo entspaced. (Lokal noch ein paar ungetrackte Test-Reste
> in `web/public/uploads` — deployen nie; optional `git clean -fd web/public/uploads`.)
>
> ⚠️ **Lokale Verifikation:** `npm run dev` (tinacms dev) läuft offline → Desktop-Preview bei beliebiger
> Breite möglich (Memory `local-tinacms-dev-preview`). Aber: Scroll-Driven-Animation re-engaged in der
> Headless-Preview nicht nach Reload (Memory `headless-preview-sda-caveat`) und Mobil-`innerWidth` ≠
> Render-Breite → finale Optik immer am echten Gerät/Deploy gegenchecken.

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
- **Build-Pipeline** (`web/package.json`): `gen-uploads-manifest.mjs` (Mediathek-Liste aus
  `web/public/uploads`) → `tinacms build -c "astro build"` → `optimize-uploads.mjs` (Sharp,
  optimiert `dist/uploads`, Repo-Originale bleiben). *(`copy-uploads.mjs` entfiel mit der
  Bild-Quellen-Zusammenlegung, 26.06. — alles liegt jetzt in `web/public/uploads`.)*
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
- **Bilder:** einheitlich in **`web/public/uploads/`** (getrackt; Tinas Medien-Ziel, von Astro als
  `/uploads/` ausgeliefert). Tina speichert Originale 1:1; Verkleinern/WebP via eigenes Bulk-/Crop-Feld
  (jSquash) bzw. Build-Sharp-Schritt.

## 3. Funktions-Inventur — alle portiert ✅ (live)
- **Startseite:** Hero (Bild/Slideshow/Video; optional neueste Journal-Kachel statt Tagline via
  `hero_journal`), Intro + Social-Row, Momentaufnahmen (Lightbox), Aktuell, Entdecken, Journal-Kärtchen.
- **Journal:** `/journal` (Archiv: Kopf editierbar, Stil umschaltbar, Archiv nach Alter + Anpinnen) +
  `/journal/<slug>` (Foto-Lightbox, MapLibre-Karte, YouTube, Verknüpfungs-/Social-Karte) — an-/abschaltbar.
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
- **Bilder online erst nach Save+Deploy** (repo-basierte Git-Medien); lokal sofort. Im Foto-**Feld** zeigt
  der Editor seit `1cdaa75` direkt nach dem Upload eine **`blob:`-Sofortvorschau** (sonst `?`, weil der
  `/uploads`-Pfad erst nach dem Deploy ausgeliefert wird). Auch die **Live-Vorschau** zeigt frische Uploads
  seit `72ef29f` sofort — via `localStorage`-`data:`-Brücke (`freshMedia.ts`), aber **nur im Editor-iframe**.
  Gilt seit `5780f3d` für **alle vier** Upload-Felder (Single/Bulk/Crop/Foto-Baustein) — gleiche Logik.
  Live-Seite + Build bleiben unberührt.
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
