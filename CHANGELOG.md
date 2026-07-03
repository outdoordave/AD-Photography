# CHANGELOG — AD-Photography

Chronologische Historie aller Änderungen. **Nur ergänzen** (neueste oben).
Den aktuellen Gesamtstand zeigt `STATUS.md`.

**Format für neue Einträge:**
```
## YYYY-MM-DD HH:MM — <Kurztitel>
- was geändert
- betroffene Dateien
- Commit: <hash> (mehrere mit Komma)
```

> Hinweis: Die Einträge unterhalb wurden **rückwirkend rekonstruiert** — Datum/
> Uhrzeit stammen aus `git log` (echte Commit-Zeitstempel), die Kurzbeschreibungen
> aus den Commit-Messages. Verwandte Commits sind gruppiert.

---

## 2026-07-03 18:25 — Journal: Hero-Kachel + Archiv nach Alter + Live-Stil in der Vorschau
- **Hero-Kachel (`d210c5b`):** neuer Darstellungs-Schalter `hero_journal` („Neuesten Journal-Eintrag im
  Hero zeigen?", getrennt vom Journal-An/Aus, nur aktiv wenn Journal AN). Zeigt den **neuesten** Eintrag als
  schwebende **Ghost-Kachel** (Optik wie `.btn.ghost`) **statt der Hero-Tagline**; Schalter aus → Tagline
  unverändert. Nur Text (Datum/Titel/Kurzvorschau) + dezente **Linien-Glyphen** für Anhänge
  (Foto/Standort/Video/Social/verknüpft/Link) statt Emojis. DE+EN. Neu: `src/lib/journalGlyphs.ts`.
- **Archiv nach Alter (`d210c5b`):** neues Feld **„Oben anheften (nicht archivieren)"** (`pin`) pro Eintrag +
  Einstellung **„Archivieren nach … Monaten"** (`archive_after_months`, Standard 12, 0 = nie). Ältere,
  nicht angepinnte Einträge wandern in einen aufklappbaren **„Archiv (N)"**-Bereich; angepinnte bleiben oben.
  Logik in `src/lib/journal.ts` (`partitionJournal`/`journalIsPinned`).
- **Vorschau-Fix / kombinierte Insel (`d210c5b`):** `JournalArchive` rendert Kopf + „Neuer Beitrag" +
  Haupt-Liste + Archiv in **einer** Insel — Kopf-Texte, Listen-Stil UND Archiv-Schwelle kommen jetzt **live**
  aus `journal_settings` (useTina) → CMS-Vorschau reagiert **sofort** auf den Stil-Umschalter (vorher erst
  nach Rebuild). `SettingsHeader`/`JournalNewButton` auf `/journal` abgelöst (Button jetzt in der Insel).
- **Belegte Diagnose:** Live `/journal/` lieferte bereits korrekt `journal-style-notes` (curl) — der „Stil
  ändert sich nicht"-Effekt lag an der Vorschau (Build-Wert) bzw. Browser-Cache, nicht am Code.
- **Lokal geprüft:** Astro-Build grün (57 Seiten); Hero-Panel + 4 Glyphen + Archiv-Aufklapper per Dev-Server
  verifiziert (Test-Einträge angelegt/geprüft/entfernt).
- ⚠️ Schema-Änderung (`pin`, `archive_after_months`, `hero_journal`) → **ein Tina-Re-Index** nötig (David, nach Deploy).

## 2026-07-03 — Journal-Ausbau: editierbarer Kopf, Stil-Umschalter, „Neuer Beitrag", Startseite entdoppelt
- **Sidebar-Reorder (`d137253`):** Journal + Journal-Einstellungen direkt hinter die Startseite (CMS).
- **Editierbarer Kopf (`d137253`,`26b8b08`):** neue `journal_settings`-Collection (Kicker/Titel/Intro DE/EN)
  → `/journal`-Kopf im CMS editierbar (SettingsHeader, Klick-zum-Feld) statt fest im Code.
- **Listen-Stil-Umschalter (`d137253`,`26b8b08`):** `journal_style` mit CMS-Vorschau (`JournalStyleField`) —
  4 Stile **Stream (wie bisher) / Schlicht / Karte / Field-Notes**; Medien (Foto/Karte/Social) bleiben
  eingebettet. Lokal geprüft (stream + card).
- **„Neuer Beitrag"-Button (`26b8b08`):** auf `/journal`, **nur eingeloggt** (`ww-admin-only`) → Tinas
  Neuanlage-Route der `journal`-Collection.
- **Startseite entdoppelt (`86203f2`):** der separate „Aktuell"-Journal-Teaser (Dopplung) ist raus; Journal
  erscheint jetzt als **Kärtchen im Entdecken-Stil** (Mini-Foto/Datum/Titel/Link) unter „Entdecken".
- **Referenz-Klartext (`2b69495`, vom Vortag):** Album-Name/Titel statt `.json`-Pfad im `linked_content`-Dropdown.
- ⚠️ Schema-Änderungen (journal_settings + journal_style + Reorder) → **ein Tina-Re-Index** nötig (David, nach Deploy).

## 2026-07-02 — Journal + CMS-Feinschliff (Klartext-Referenz, editierbares Archiv, Router-Fix)
- **Beispiel-Einträge (`ee85747`)** + Journal im CMS nach „Stories – Einstellungen" einsortiert +
  `show_journal` an (`39b8761`).
- **Verknüpfungs-Auswahl als Klartext (`2b69495`):** `optionComponent` am `linked_content`-Feld → Liste zeigt
  Album-Name / Story- bzw. Reise-Titel statt `.json`-Pfad. UI-only, kein Re-Index.
- **Archivseite editierbar (`565bd28`):** `/journal` (+ `/en`) rendert den Stream jetzt als `useTina`-Insel
  `JournalArchive` (data-tina-field pro Eintrag) → in der Vorschau ist die echte Besucherseite bearbeitbar,
  Tina zeigt links die Eintrags-Liste (Connection-Query, **ohne** selectFormByFormId — Lehre aus GalleryContent).
- **CMS-Router-Fix (`77ffe04`):** `router: () => '/'` an **Darstellung** + **Highlights** entfernt — führte beim
  Anklicken immer zur Startseite. Jetzt öffnet der Klick direkt das Formular (wie früher). Alle übrigen 14
  Collection-Router geprüft: korrekt verlinkt. UI-only, kein Re-Index.

## 2026-07-02 — Journal-Bereich (Tagebuch) — neues Feature, komplett abschaltbar
- **Neu:** Ein „Journal"-Reiter — kurze, datierte Einträge (neueste zuerst) zwischen Reisen/Stories.
  Kein Zwang zu Titel oder Bild: Datum + Text reichen. Reiner Zusatz, nichts Bestehendes verändert
  (Wander-Titel/Trip-Timeline/Lightbox/MapLibre/Scroll-Spy unberührt).
- **Schema (`journal`-Collection, `1c6616a`):** date (Pflicht), title_de (optional), text_de (rich-text,
  Bold/Italic/Link), photos (BulkPhotoField), location (LocationSearchField/GeoJSON wie Reisen), youtube_url,
  link {label,url}, linked_content (reference alben/story/reisen → reiche Karte), social {platform,url,
  caption,thumbnail}, EN via has_english. Slug = Datum (+ optional Kurz-Titel; Zähler bei Mehrfach).
- **Lib + Seiten (`85b7507`,`7bca530`,`a668145`):** `src/lib/journal.ts`; Reader-Insel `JournalEntryContent`
  (+ `JournalMap` = schlanke MapLibre-Einzelpunkt-Karte, liberty); `/journal` + `/journal/<slug>` + `/en`-
  Pendants (Archiv-Stream: Text inline, Medien nur als kleines Symbol; Detail: Foto-Lightbox, echte Karte,
  YouTube-nocookie, Album/Story/Reise-Verknüpfungskarte, Social-Karte, externer Link). `journal.css` mit
  echten Tokens. Fix: `.journal-head` als `<div>` (globale `header{sticky}`-Regel).
- **OG-Bild (`7e5b117`):** BaseLayout optionales `image`-Prop (Journal-Detail: erstes Foto/Social-Thumb);
  überschreibt die globale Fallback-Kette, sonst unverändert.
- **Sichtbarkeit (`20e085e`):** Schalter **`show_journal`** (Darstellung, Default AUS) schaltet das
  **komplette** Journal — Nav-Link DE+EN, Footer, Startseiten-Teaser (unter dem Hero, VOR dem Intro) **und**
  Direktaufruf der Seiten (Redirect wie bei Stories).
- **TikTok-Vorschaubild (`cba5c09`):** `scripts/fetch-social-thumbs.mjs` holt beim Build via öffentlichem
  oEmbed (kein Token) das Bild, re-encodiert per sharp zu WebP, hostet lokal (`/uploads/social/tiktok-<id>.webp`);
  robust (TikTok down → nur Log, Build läuft weiter). Instagram-Thumbnail manuell.
- **Datenschutz (`3a37f21`):** Absatz Instagram/TikTok-Vorschaubilder (selbst gehostet, kein Fremd-Skript).
- **Verifiziert** (npm run dev, offline, Test-Eintrag): DE+EN Archiv/Detail = 200; Detail rendert Rich-Text,
  Foto-Lightbox, echte Karte, YouTube, Verknüpfungs-/Social-Karte; Archiv Text inline + Symbole; Teaser +
  Nav-Reiter DE+EN erscheinen bei `show_journal=true`. Test-Eintrag entfernt.
- ⚠️ **Struktureller Schema-Eingriff (journal + show_journal) → Tina-Cloud-RE-INDEX nötig** (nach Deploy, David).
- Commits: `1c6616a`, `85b7507`, `7bca530`, `a668145`, `7e5b117`, `20e085e`, `cba5c09`, `3a37f21` (+ diese Doku)

## 2026-06-29 — CMS: Ladekreis bei Navigation statt aufblitzender Dokumentliste
- **Wunsch (David):** Beim Navigieren in der Vorschau blitzte links kurz Tinas **Dokumentliste**
  (`.json`-Einträge) auf, bis das passende Formular feststand — gewünscht: ein Apple-artiger Ladekreis.
- **Ursache (Tina-Quelle):** Die Sidebar zeigt `FormLists`, wenn mehrere Formulare registriert sind und
  noch **kein aktives passt** (`tinacms/dist/index.js:47275`) — genau die Lücke beim Seitenwechsel. Tina
  **hat** einen eingebauten Lade-Platzhalter (`isLoadingContent` → `SidebarLoadingPlaceholder`), schaltet
  ihn bei Navigation aber **nicht** ein: der eigene Auslöser ist in `@tinacms/app/graphql-reducer.ts:566`
  auskommentiert („TODO webpack HMR").
- **Fix (`cmsCallback`, Editor-only):** Listener auf das `url-changed`-Signal der Vorschau-Inseln (sendet
  `useTina` beim Seitenwechsel) → `cms.dispatch({type:'sidebar:set-loading-state', value:true})`, nach
  **700 ms Ruhephase (Debounce)** wieder `false`. So erscheint Tinas **eigener** Ladekreis statt der Liste,
  bis die neue Seite ihre Formulare registriert + der aktive (`selectFormByFormId`) feststeht. `cms.dispatch`
  wird erst zur Laufzeit gelesen; `try/catch` → bricht bei Tina-Update nicht hart.
- **Kein Schema-Eingriff → `tina-lock` unverändert, KEIN Re-Index.** Verifiziert (iframe-Sim mit echten
  `url-changed`-Nachrichten + Mock-`dispatch`): Burst→`true`, ~700 ms nach der letzten→`false`, kein
  Hängenbleiben, sauberer Re-Trigger bei Folge-Navigation. ⚠️ Sichtbarer Spinner nur im echten `/admin`
  (lokal kein Admin-`cms`) → von David zu bestätigen. Hinweis: Tinas Spinner hat ~1 s Mindestanzeige.
- Commit: `5893eae`

## 2026-06-29 — Fix: Portfolio-Sidebar zeigte ganze Dokumentliste (undefined user-select-form)
- **Nachtrag zu `bd0e385`** (von David gemeldet + Screenshot): Auf der **Portfolio-Übersicht** lud die
  Sidebar links „etwas Unzuordenbares" — die **ganze Dokumentliste** statt eines Formulars.
- **Ursache:** `GalleryContent` (Portfolio-Übersicht) fragt `albenConnection` ab (alle Alben, **kein**
  einzelnes aktives Dokument) → mein `selectActiveFormId` lieferte dort `undefined`. Tina postet
  `experimental___selectFormByFormId` aber **immer** (auch `undefined`) → `forms:set-active-form-id`
  wurde auf `undefined` gesetzt und **löschte** die saubere Auswahl der `SettingsHeader`-Insel
  (`galerie_settings`) → Sidebar fiel auf die Gesamtliste zurück.
- **Fix:** Selector aus `GalleryContent` entfernt (Connection-ohne-Slug darf nicht posten). Auf
  `/portfolio` wählt jetzt allein `SettingsHeader` → `galerie_settings`. Einzige betroffene Insel:
  `GalleryContent` läuft nur auf der Übersicht; `TripTimeline` hat immer `initialSlug`, `/trips` +
  `/stories` haben nur `SettingsHeader` (Einzeldokument).
- **Verifiziert** (iframe-Sim): `/portfolio` postet genau **ein** `user-select-form` =
  `src/data/gallery-settings.json` (kein `undefined`); `/trips`→`trips-settings.json`,
  `/stories`→`stories-settings.json`, `/about`→`about.json`. ⚠️ Restlicher kurzer Übergang beim
  Navigieren (altes→neues Formular während des iframe-Reloads) ist Tina-eigenes MPA-Verhalten; ein
  eigener Lade-Spinner in Tinas Sidebar ist von unserer Seite nicht steuerbar — die „ganze Liste"
  erscheint aber nicht mehr.
- Commit: `183a279`

## 2026-06-29 — CMS: Sidebar folgt der Vorschau-Navigation automatisch
- **Wunsch (David):** Beim Öffnen/Navigieren einer Seite in der Live-Vorschau soll das Tina-Formular
  links automatisch das passende Dokument zeigen (und umgekehrt). **Reverse (Liste→Vorschau)** lief
  bereits über `ui.router` (pro Collection gesetzt). **Forward (Vorschau→Sidebar)** schaltete aber erst
  bei Klick auf ein `data-tina-field`-Feld um, nicht beim bloßen Navigieren.
- **Ursache (belegt: Tina-Doku + Quellcode `@tinacms/app/graphql-reducer.ts`):** Bei MEHREREN
  `useTina`-Formularen pro Seite nimmt Tina standardmäßig „das **erste** angeforderte Query". Hier ist
  das das **globale Logo** (`LogoLink` in SiteNav **und** SiteFooter, je `client:load`) — nicht der
  Seiteninhalt. Erst Click-to-Edit setzt das aktive Formular aufs geklickte Dokument.
- **Fix (Tina-offiziell):** `experimental___selectFormByFormId()` im `useTina` jeder **Inhalts-Insel**.
  Postet `{type:'user-select-form', formId}` → `forms:set-active-form-id`. Die echte Form-ID ist der
  Dokument-Pfad `_internalSys.path` (= `_sys.path` in den Query-Daten). Zentraler Helfer
  `web/src/lib/tinaForm.ts` (`selectActiveFormId`): Einzeldokument → `<doc>._sys.path`; Connection
  (Reisen: aktive per `initialSlug`) → passender Knoten; ohne Slug bewusst `undefined`.
- **Eingesetzt:** StoryReaderContent, TripTimeline (aktive Reise), AlbumContent, AboutContent,
  GearContent, ContactContent, StatsContent, LegalContent, SettingsHeader, HomeHeroLive. GalleryContent
  (Übersicht/Connection) → kein Zwang. **LogoLink bewusst OHNE Selector** (soll nicht gewinnen).
- **Verifiziert** (lokaler Dev + iframe): genau **ein** `user-select-form` mit korrekter ID — Story
  `src/content/stories/alaska-california-2026.md`, Reise `/trips/florida` → `src/data/trips/florida.json`.
  UI/Editor-only, **kein Schema → kein Re-Index**. ⚠️ Sichtbarer Sidebar-Wechsel im echten `/admin` von
  David zu bestätigen (lokal kein echter Editor-iframe).
- Commit: `bd0e385`

## 2026-06-29 — Fix: Vorschau-Upload nutzbar (Live-Cover aktualisiert, Info am Bild, frische Uploads in Mediathek)
- Drei zusammenhängende Korrekturen am „Foto tauschen"-Overlay (von David gemeldet — Upload ging,
  aber: keine Rückmeldung, Live-Vorschau zeigte das alte Bild, Upload in der Mediathek nicht auffindbar):
  1. **Live-Cover aktualisierte nicht** — **Schlüssel-Mismatch** der Frisch-Upload-Brücke. Das Cover ist
     `type:'image'`; Tina liefert dessen Anzeige-URL oft als `assets.tina.io`-CDN-Pfad, der Blob wird aber
     unter `/uploads/<datei>` abgelegt → `getFreshMedia` fand nichts → 404 → altes Bild. **Fix:** Schlüssel
     in `putFreshMedia` UND `getFreshMedia` **kanonisieren** (`canonUpload`: CDN→`/uploads` + Dedupe) →
     matcht unabhängig von der Form. Dazu rendert `StoryReaderContent` bei `storage`/`ww:fresh-media` neu
     (deckt den Timing-Race ab, falls die `data:`-URL erst nach Tinas Re-Render geschrieben wird).
  2. **Keine Rückmeldung in der Vorschau** — das Feld meldet Erfolg/Fehler + Größen-Info jetzt per
     localStorage-Brücke (`putSwapInfo`/`getSwapInfo`) zurück; die Overlay zeigt „⏳ … wird hochgeladen",
     dann „✓ ersetzt · alt→neu (WebP)" bzw. „✗ Fehler" **direkt am Bild** (`.ww-swap-info`).
  3. **Frischer Upload nicht in der Mediathek** — der Picker liest nur das Build-Manifest. Jetzt stellt er
     frische Uploads (aus der Brücke, `listFreshMedia`) **oben voran**, mit grünem **„NEU"-Badge** + `data:`-Vorschau.
- **Verifiziert** (lokaler Dev + iframe `ww-cms-preview`): Cover schaltet bei `storage`-Event auf die
  `data:`-URL; `canonUpload` matcht `/uploads` ↔ CDN (Node-Logiktest); Mediathek zeigt NEU-Kachel zuerst;
  Overlay zeigt ⏳→✓-Pille (synthetischer Datei-`change`). UI-only, **kein** Schema → kein Re-Index.
- Dateien: `web/src/lib/freshMedia.ts`, `web/src/components/StoryReaderContent.tsx`,
  `web/src/components/PhotoSwapOverlay.tsx`, `web/src/styles/global.css`,
  `web/tina/fields/SinglePhotoField.tsx`, `web/tina/fields/MediaPicker.tsx`
- Commit: `0d657b2`

## 2026-06-29 — Fix: Mediathek-Modal sichtbar machen (Portal) + Hover für „Aus Mediathek"
- Drei Korrekturen am Foto-Tausch-Overlay der CMS-Vorschau (von David gemeldet):
  1. **Hover:** „Aus Mediathek" bekam keinen Hover wie „Foto ersetzen". `MediaPickerButton` erhielt
     eine optionale `className`-Prop; das Overlay reicht `ww-swap-btn` durch → identischer Hover.
     Andere Konsumenten (SinglePhotoField/BulkPhotoField/CropPhotoField) ohne `className` behalten
     den bisherigen Inline-Style (unverändert).
  2. **Überschrift schwebte im Bild** + 3. **Modal-Box/„Schließen ✕" unsichtbar:** gleiche Ursache —
     das Modal (z-9999) war ein Kind der `.ww-swap-overlay`, die in der Vorschau auf `z-index: 4`
     einen eigenen Stacking-Context bildet. Damit lag das gesamte Modal **unter** der Wander-Titel-
     Leiste (`.story-topline`, z-1095): nur das Bild-Raster schien durch, Story-Titel davor, weiße
     Box samt Schließen-Knopf verdeckt. **Fix:** Modal per `createPortal` an `document.body` hängen →
     entkommt dem z-4-Käfig, liegt über allem.
- **Verifiziert** (lokaler Dev + iframe mit `ww-cms-preview`): beide Knöpfe haben Klasse `ww-swap-btn`;
  Modal-Elternknoten = `BODY` (nicht mehr in `.ww-swap-overlay`); bei 80px von oben liegt jetzt die
  Modal-Überschrift oben statt `.story-topline`; „Schließen ✕" sichtbar, Hit-Target `BUTTON`, Klick
  schließt (Modal `true`→`false`).
- Dateien: `web/tina/fields/MediaPicker.tsx`, `web/src/components/PhotoSwapOverlay.tsx`
  (UI-only, **kein** Tina-Schema → kein Re-Index)
- Commit: `6482d35`

## 2026-06-28 — Fix: Foto-Tausch-Knöpfe im Bild waren nicht klickbar (Wander-Titel-Leiste)
- **Diagnose statt Raten:** Ein temporärer Diagnose-Streifen (`70e8fd1`) zeigte das echte Klick-Ziel —
  **`.story-topline`**. Die Wander-Titel-Leiste (`position: sticky; z-index: 1095`) überlagert per
  negativem `margin` die obere Hero-Kante und fing die Klicks auf den Overlay-Knöpfen (`top: 14px`) ab.
  **Kein Tina-/iframe-Problem** — eigenes CSS-Stacking. (Tinas Klick-Handler, per Quellcode geprüft, war
  unbeteiligt; die Knöpfe liegen in keiner `data-tina-field`-Region.)
- **Fix** (`f371651`): **Nur im CMS-Editor** (`html.ww-cms-preview` — genau dort erscheint das Overlay)
  ist `.story-topline` jetzt **klick-durchlässig** (`pointer-events: none`); die Zurück-Pille bleibt
  klickbar (`auto`). Damit erreichen die Klicks die Knöpfe darunter. **Live-Seite unberührt** (dort kein
  Overlay + Regel greift nicht). Diagnose-Code wieder entfernt. **Verifiziert** (iframe + ww-cms-preview):
  `elementFromPoint` am Knopf = `BUTTON.ww-swap-btn` (vorher `.story-topline`); „Aus Mediathek" öffnet
  das Bild-Raster. ⚠️ Ob „Foto ersetzen" den **Finder** im iframe öffnet, prüft David hands-on.
- Commits: `70e8fd1` (Diagnose, entfernt), `f371651` (Fix)

## 2026-06-28 — Stories-Raster konsistent zu Reisen (auto-fit statt hartem Umbruch)
- **Befund (gemessen):** Bei gleicher Breite (800px) zeigte `/trips` **2 Spalten**, `/stories` nur **1**.
  Ursache: `.trips-overview` nutzt `repeat(auto-fill, minmax(300px,1fr))` (passt Spaltenzahl automatisch an),
  `.stories-grid` dagegen feste `repeat(3,1fr)` + harten `@media (max-width:860px) → 1fr`. Daher wirkte Stories
  bei schmaler Breite „mobil", Reisen „desktop".
- **Fix:** `.stories-grid` auf dieselbe Auto-Fit-Technik wie `.trips-overview` umgestellt
  (`repeat(auto-fill, minmax(300px,1fr))`), den harten 860er-1-Spalten-Umbruch entfernt. **Verifiziert:**
  1280px → 3 Spalten (unverändert), 800px → 2 Spalten (vorher 1, jetzt wie Reisen). Kein Nav-/Breakpoint-Eingriff,
  echte Mobil-Ansicht (<~620px) bleibt 1-spaltig. Datei: `web/src/styles/global.css`.

## 2026-06-26 20:10 — Fix: Foto-Tausch-Knöpfe brechen bei schmaler Vorschau um (klickbar)
- **Befund (David):** Bei sehr schmalem Vorschau-Panel (¼-Bildschirm-Fenster) wirkten die beiden Overlay-
  Knöpfe „zusammen" und ließen sich nicht klicken. Ursache: nebeneinander in einer Flex-Zeile liefen sie
  bei schmaler Breite über den linken Cover-Rand hinaus → der Teil war abgeschnitten/nicht klickbar.
- **Fix** (`global.css` `.ww-swap-overlay`): `flex-wrap: wrap` + `justify-content: flex-end` +
  `max-width: calc(100% - 28px)` → die Knöpfe **brechen im Cover um** statt überzulaufen, bleiben immer
  innerhalb + klickbar. Desktop unverändert (nebeneinander). **Verifiziert** bei 280px: 2 Zeilen, kein
  Überlauf links/rechts, „Aus Mediathek"-Klick öffnet den Picker.

## 2026-06-26 19:40 — „Foto tauschen" direkt auf dem Cover in der CMS-Vorschau
- **Feature** (`97abe0d`, Branch `foto-tausch-overlay` → ff-Merge auf `main`, Branch gelöscht): Dezente Knöpfe
  **📷 Foto ersetzen** + **🖼️ Aus Mediathek** liegen jetzt **direkt auf dem Cover** in der Live-Vorschau —
  kein Umweg mehr ins Formular. Neu: `web/src/components/PhotoSwapOverlay.tsx`.
- **Mechanik (ohne Tina-Internas-Hack):** Die Vorschau ist ein iframe (gleicher Origin); das Upload-Feld lebt
  im Admin. Das Overlay reicht nur das **Ergebnis** per `CustomEvent('ww:swap-media')` an `window.parent`:
  „Ersetzen" öffnet den Datei-Dialog **im iframe** (User-Geste da) → File ans Feld; „Mediathek" nutzt den
  bestehenden `MediaPickerButton` → Pfad ans Feld. `SinglePhotoField` (Cover) hört zu und handelt **nur**,
  wenn `detail.value === input.value` (eindeutige Zuordnung) → File ⇒ bestehender `handleFile`; Pfad ⇒
  `input.onChange`. Sichtbar **nur im Editor-iframe** (`window.self !== window.top`) → **live nie gerendert**.
- **Verifiziert (lokal):** live (top-level) kein Overlay (0 Treffer, 0 kaputte Bilder); im iframe-Kontext
  rendert es mit beiden Knöpfen; Cross-Frame-Event iframe→parent kommt an. ⚠️ **Headless nicht testbar:** der
  finale Datei-Dialog→Upload im echten Tina-Formular → **David testet hands-on** (lokal oder nach Deploy).
- **Scope bewusst nur Cover** (nicht Text-Fotos — technisch nicht sauber; Stationen könnten mit gleicher
  Mechanik folgen). Kein Schema-Eingriff, kein Re-Index. Isoliert + live-gated → leicht erweiter- oder rückbaubar.
- Commit: `97abe0d`

## 2026-06-26 19:00 — Bild-Quellen vereinheitlicht (eine Quelle: web/public/uploads)
- **Problem:** Bilder lagen an **zwei** Stellen, die auseinanderliefen — Repo-Wurzel `/uploads` („tragend",
  via `copy-uploads.mjs` in den Build) **und** `web/public/uploads` (Tinas Upload-Ziel). Unsauber, Quelle
  von Verwirrung (z. B. Mediathek-Picker, der nur eine Seite sah).
- **Fix** (`ad0c574`): **alles nach `web/public/uploads`** (Tinas natives Ziel, von Astro direkt als
  `/uploads/` ausgeliefert). Im Detail: 17 Wurzel-Bilder per `git mv` rüber (inhaltsgleich = Renames);
  Repo-Wurzel `/uploads` entfernt; `.gitignore`-Regel `public/uploads` raus (jetzt getrackt); `copy-uploads.mjs`
  gelöscht + aus `npm run build` genommen; `gen-uploads-manifest.mjs` scannt nur noch einen Ordner (Manifest
  neu: 31 getrackte Bilder); Logo entspaced `Logo Website.webp`→`logo-website.webp` (einzige Referenz in
  `appearance-settings.json` angepasst); CLAUDE.md aktualisiert.
- **Deploy-neutral im Inhalt:** `dist/uploads` bleibt gleich bestückt (Bilder waren vorher per copy-uploads
  dort, jetzt direkt) — nur das Logo lädt unter neuem Namen. Kein Schema-Eingriff, kein Re-Index.
  ⚠️ Nach Deploy **hart neu laden** + Logo/Bilder gegenchecken.
- **Hinweis lokal:** In `web/public/uploads` liegen noch ein paar **nur-lokale, ungetrackte** Bilder
  (alte Test-Uploads, u. a. die alte gespacte Logo-Kopie) — sie sind **nicht** im Commit und deployen nie.
  Aufräumen optional via `git clean -fd web/public/uploads` (Vorsicht: löscht alle ungetrackten dort).
- Commit: `ad0c574`

## 2026-06-26 18:20 — Frisch-Upload-Logik auf alle Bild-Felder + STATUS-Kopf entstaubt
- **Brücke jetzt in allen vier Upload-Feldern** (`5780f3d`): `BulkPhotoField` (Galerie/Diashow/Stations-
  Fotos/Highlights) zeigt frische Kacheln sofort als `blob:` + `putFreshMedia` für die Live-Vorschau;
  `CropPhotoField` (Stations-/Personen-Foto) lädt das frische Original als `blob:` → der **Zuschnitt-Editor
  funktioniert sofort** (vorher konnte `loadImage` den noch nicht ausgelieferten `/uploads`-Pfad nicht laden
  → „Original konnte nicht geladen werden"). Damit haben Single/Bulk/Crop/Foto-Baustein **dieselbe** Logik.
  Gemeinsame Engine: jSquash-WebP + `cms.media.persist` + `mediaPath` + `freshMedia`-Brücke. Verifiziert:
  esbuild grün, Album-Editor rendert (5 Kacheln), keine Laufzeitfehler.
- **STATUS-Kopf aktualisiert (Doku-Hygiene):** Die veraltete „WYSIWYG fast fertig / Tina-Cloud-Re-Index
  nötig / Offen für David: push + re-index"-Formulierung stammte von **vor** dem Deploy. WYSIWYG ist live
  + re-indext + in Nutzung → auf **✅ FERTIG & LIVE** gesetzt; offene Punkte auf den aktuellen Stand
  (Push, Bild-Quellen vereinheitlichen, Kür) umgeschrieben. 📷-Baustein von David hands-on bestätigt.
- Commit: `5780f3d` (+ STATUS/CHANGELOG)

## 2026-06-26 17:40 — CMS-Formular: bricht um statt rechts abzuschneiden
- **Befund (im `/admin` analysiert):** David sah „manche Texte/Buttons im nicht sichtbaren Bereich rechts".
  Ursache ist **nicht** ein einzelner Text, sondern **eine** Quelle: Tina setzt auf dem Formular-Feld-
  Container die Tailwind-Klasse `whitespace-nowrap`. Dadurch bricht **kein** Label/keine Beschreibung um →
  das Formular kann nicht schmaler werden als seine längste Zeile und wird bei **schmalem Bearbeiten-Panel**
  (z. B. neben der Live-Vorschau) rechts abgeschnitten. Die längeren deutschen Labels machten es sichtbarer.
  Diagnose: Scan nach Elementen, die ihren Clip-Container überlaufen → Quelle des `nowrap` aufgespürt
  (`div.whitespace-nowrap.overflow-x-visible`, 14 Kinder, umschließt Breadcrumb + alle Felder).
- **Fix** (`e303c92`): `cmsCallback` injiziert ein `<style>`, das genau diesen Container auf
  `white-space: normal` stellt (Klassen-Kombi, spezifischer als die Utility) → alles umbricht, Formular
  passt sich der Panel-Breite an. Nur der Container → Nachfahren mit eigenem `white-space` (Code-Blöcke)
  bleiben unberührt. **Admin-/Editor-CSS** → Live-Seite + Schema unberührt, kein Re-Index.
- **Verifiziert** im `/admin` bei 470px Panel-Breite: Container `white-space=normal`, **0** abgeschnittene
  Formular-Container (vorher 70px Überhang), Labels/Beschreibungen/Knöpfe brechen sauber um (Screenshot).
- Commit: `e303c92`

## 2026-06-26 17:10 — „Aus Mediathek"-Picker zeigt jetzt auch CMS-Uploads
- **Befund (belegt):** Der „🖼️ Aus Mediathek"-Picker (`PhotoUploadField`) liest `/uploads-manifest.json`.
  Das Skript `gen-uploads-manifest.mjs` scannte bisher **nur** den Repo-Wurzel-Ordner `/uploads`. TinaCMS
  committet frische CMS-Uploads aber nach **`web/public/uploads`** (media `mediaRoot:'uploads'` +
  `publicFolder:'public'`) — z. B. `IMG_5312/5685/5736.webp`. Beide Ordner liefern unter derselben URL
  `/uploads/<datei>` aus, lagen im Repo aber getrennt → CMS-Uploads tauchten im Picker nie auf.
- **Fix** (`cf16ac1`): `gen-uploads-manifest.mjs` scannt jetzt **beide** Ordner, mergt nach Dateiname,
  dedupet. Committetes Manifest neu erzeugt aus root + **nur git-getrackten** `public/uploads` (= was der
  Cloudflare-Checkout hat) → keine nur-lokalen Dateien als tote Picker-Einträge. **16 → 30 Bilder**, inkl.
  der zuletzt per CMS hochgeladenen. **Verifiziert:** Dev-Server liefert 30 (Test-Uploads drin, 5 nur-lokale
  Cruft-Dateien raus).
- **Weiterhin Build-statisch:** Ganz frische Uploads erscheinen erst nach dem nächsten Deploy (Manifest wird
  im Build neu erzeugt). Für Wiederverwendung älterer Uploads genau richtig.
- **🅿️ Größere Baustelle (nicht hier gelöst):** CMS-Uploads landen in `web/public/uploads`, der „tragende"
  Bestand in der Repo-Wurzel `/uploads` — zwei Quellen, die auseinanderlaufen (der lokale Symlink-Plan ist
  aktuell gebrochen, `public/uploads` ist ein realer Ordner mit getrackten Tina-Dateien). Funktioniert
  (beide deployen), aber unsauber → eigener Aufräum-Task (IDEEN.md-Kandidat).
- Commit: `cf16ac1`

## 2026-06-26 16:40 — CMS-Live-Vorschau: frisch hochgeladenes Bild sofort sichtbar
- **Analyse zuerst (belegt, Live-Render-Pfad ist 🔴):** Per `curl` gegen die Live-Seite geprüft —
  das HTML enthält in den Insel-Props echte `assets.tina.io/<clientId>/…`-URLs; `normalizePath`
  biegt die zur Laufzeit auf `/uploads` zurück (Kern-Infra, überall genutzt). Gespeichert werden
  `cover`-Werte aber als `/uploads/…` (nie `assets.tina.io`). Folge: Beim **frischen Upload** schreibt
  das Feld `/uploads/<neu>` → die Vorschau lädt das (noch nicht deployte) → 404 → „altes" Bild.
  Ein erster `normalizePath`-Ansatz (assets.tina.io im Editor behalten) traf diesen Wert NICHT →
  wieder verworfen (`stories.ts` zurückgesetzt).
- **Frisch-Upload-Brücke** (`72ef29f`, neu `web/src/lib/freshMedia.ts`): Das Upload-Feld legt die
  Datei als portable `data:`-URL im `localStorage` ab (Schlüssel = gespeicherter Pfad). Die Vorschau
  läuft als **iframe im selben Origin** → liest denselben `localStorage` → zeigt das frische Bild sofort.
  Schreiben: `SinglePhotoField` (Cover) + `PhotoUploadField` (📷-Baustein) nach dem Upload. Lesen:
  `normalizePath` liefert die `data:`-URL **nur im Editor-iframe** (`window.self !== window.top`);
  **Live-Seite** (top-level; CSP `frame-ancestors 'self'`) **und SSG-Build** (kein `window`) liefern
  immer `null` → Render-Pfad dort 1:1. Cache gedeckelt (max. 8 Einträge, Quota-Fallback).
- **Verifiziert:** Unit-Tests (Build/Live=null, Editor-iframe=`data:`-URL, Prune-Cap ≤8); die echte
  Live-Story-Seite rendert weiter `/uploads` (0 `data:`-URLs, 0 kaputte Bilder, auch mit gesetztem
  Brücken-Eintrag); Admin lädt mit den neuen Imports. ⚠️ **Cloud-Editor-Flow** (Upload → Vorschau
  zeigt frisch) **von David hands-on** zu prüfen; headless nicht voll testbar. (Album/Hero via
  Bulk/Crop-Feld nutzen die Brücke noch nicht — gleicher Einzeiler bei Bedarf.)
- Commit: `72ef29f`

## 2026-06-26 16:10 — Nachschlag: die WIRKLICH sichtbaren Knopf-Tooltips eindeutschen
- **Knopf-Tooltips (Radix-Popover) auf Deutsch** (`5943d6a`): Davids Screenshot zeigte beim Hovern
  „Bold (⌘+B)" — also NICHT die SVG-`<title>` (die ich zuvor übersetzt hatte), sondern eine zweite,
  schwebende Tooltip-Ebene (Radix). Die alte Exakt-Map („Bold") traf das nie: der String hat ein
  Kürzel-Suffix und heißt am PC „Ctrl" statt „⌘". **Neu:** ein Tooltip-Übersetzer, der **nur innerhalb
  von Tooltip-/Popover-Containern** den führenden Begriff ersetzt und das Kürzel behält
  (Bold→Fett, Italic→Kursiv, Link→Link einfügen, Quote→Zitat, Bulleted/Numbered List→Aufzählung/
  Nummerierte Liste, Headings→Überschriften …) — **plattformunabhängig**, Editor-Text bleibt unberührt.
  **Im `/admin` verifiziert** (gehovert): „Fett (⌘+B)", „Zitat (⌘+⇧+.)", „Überschriften", „Aufzählung".
- ⚠️ **Wichtig:** Diese und die Fixes von 15:45 sind **noch nicht live** — der `/admin`-Editor lädt aus
  dem **gebauten** Build. Erst nach **Push + Cloudflare-Rebuild** sind die deutschen Tooltips UND die
  Bild-Sofortvorschau im echten CMS da. (Davids Test am alten Build zeigt erwartungsgemäß noch „Bold"/„?".)
- Commit: `5943d6a`

## 2026-06-26 15:45 — Editor-Feinschliff aus Davids Live-Test: Bild-„?", Deutsch komplett, Story-EN
- **Bild-Upload „?" behoben** (`1cdaa75`): Direkt nach dem Hochladen zeigte das Foto-Feld ein „?".
  Ursache: gespeichert wird ein `/uploads`-Pfad, der erst nach dem **nächsten Deploy** ausgeliefert
  wird → bis dahin 404. Fix: `PhotoUploadField` **und** `SinglePhotoField` zeigen das gerade gewählte
  Bild sofort als **`blob:`-URL** (`URL.createObjectURL` vor `persist`), Fallback bleibt `toLocalMedia`.
  Mediathek-Auswahl + Entfernen geben den `blob:` wieder frei (kein Leck). ⚠️ Headless nicht voll
  testbar (Datei-Dialog) → Davids Hands-on im echten Cloud-`/admin`. BulkPhoto/CropPhoto (Album/
  Station/Hero) haben dieselbe Eigenheit — gleicher Einzeiler-Fix bei Bedarf.
- **„Edit-Möglichkeiten" jetzt durch die Bank Deutsch** (`700ddb7`): Die Symbol-Knöpfe der Rich-Text-
  Leiste tragen ihre Tooltips als **SVG-`<title>` in Kleinschreibung** (Material-Symbol-Namen wie
  `format bold`) — die liefen NICHT durch die alte Relabel-Map (dort stand „Bold"). Im `cmsCallback`
  ergänzt: `format size`→Textgröße, `format bold`→Fett, `format italic`→Kursiv, `insert link`→Link
  einfügen, `format quote`→Zitat, Listen, `image`→Bild; dazu `Save`→Speichern, `Reset`→Zurücksetzen,
  `Choose an option...`→Bitte wählen, `Log Out`→Abmelden, `Media Manager`→Medien, `Collections`→Bereiche,
  `published`→veröffentlicht. Screen-Kategorie `Site`→`Website` (an der Quelle, BackToSite/Logout).
  **Im lokalen `/admin` verifiziert:** Leiste zeigt Textgröße/Fett/Kursiv/Link einfügen/Zitat.
- **Story-EN-Felder folgen jetzt `has_english`** (`700ddb7`): Stories haben keinen globalen Sprach-
  Schalter, sondern das gespeicherte Feld `has_english` („Englische Version anzeigen?"). Bisher waren
  `title/category/excerpt_en` **immer** sichtbar (`alwaysShow`) und `body_en` hing am globalen Schalter
  → beim Ausschalten blieben die EN-Felder stehen. Jetzt folgen **alle vier** EN-Felder genau
  `has_english` (neue `EnglishStory*`-Komponenten via `useFormState`, wie `GearCategoryField`):
  **aus → unsichtbar, an → sichtbar**, Wert bleibt erhalten (An/Aus löscht nichts). Tote
  `EnglishStyled*`-Exporte entfernt. **Verifiziert** im `/admin`: Florida-Story, Schalter aus → 0 EN-
  Felder/1 Editor, an → 3 🌐-Felder + EN-Body mit erhaltenem Inhalt.
- **Kein Schema-Eingriff:** alles `ui.component`/`cmsCallback` → **`tina-lock.json` unverändert**,
  **kein Tina-Cloud-Re-Index nötig** (nur Push + Deploy durch David).
- Commits: `1cdaa75`, `700ddb7`

## 2026-06-26 — WYSIWYG-Editor (Weg B) — Stufe 1 + 2 (Nicht-Story), IN ARBEIT
- **Capability-Lock Schritt 0+A+B** (`a663453`, `7cd86b0`) + **Spike S1–S6** (`b0dfbdf`): Tina 2.10.1
  `rich-text` + `parser:markdown` speichert **Markdown** (JSON=String, MD=YAML-Block, Inhalt 1:1),
  Query liefert **AST** → Render auf `<TinaMarkdown>`. Keine destruktive Migration nötig.
- **Stufe 1** (`ccbbbab`): `web/src/components/RichText.tsx` — rendert AST in `.ww-rich`-Optik 1:1
  (h1/h2→h2, h3, blockquote→`.pullquote`, Link target, img, html/html_inline für rohes HTML);
  Dual-Modus String/AST. Lokal mit echten ASTs verifiziert (inkl. rohes HTML / S4).
- **Stufe 2 Baustein** (`493fc3c`): `EnglishRichTextField` (Auto-Ausblenden via `MdxFieldPlugin.Component`)
  + `richIsEmpty`/`pickRich`/`richToPlain`.
- **Stufe 2 Nicht-Story** (`0bac071`): Schema Intro (subtext), Reise (summary inline / Stations-text),
  Bio, Datenschutz, Impressum → `rich-text` + `parser:markdown`; EN via `EnglishRichTextField`.
  Konsumenten HomeIntroLive/AboutContent/TripTimeline/LegalContent → `<RichText>`; Reise-Meta via
  `richToPlain`. **Lokal verifiziert:** Intro/Bio/Reise-Summary+Station rendern 1:1, Klick-zum-Feld bleibt.
- **Entscheide:** EN-Felder behalten Auto-Ausblenden; Rechts-Seiten werden umgestellt UND Inhalt
  einmalig aufgeräumt (David: „einmal richtig").
- **Rechts-Seiten-Inhalt aufgeräumt** (`6fc323a`): e-recht24-Paste (gemischte `**`/`---`, Einzel-`\n`,
  rendert sonst als Block) → `**N. Titel**`→`## Titel`, `---` raus, jede Zeile eigener Absatz (Adress-Blöcke
  als Hard-Break). **KEINE Wortänderung** (verifiziert: Wort-Inhalt identisch DE+EN). Rendert nun als
  8 Überschriften + 102 Absätze. ⚠️ David liest gegen (oben „Datenschutzerklärung" doppelt = Body-Überschrift
  + Seitentitel, kann raus).
- **⚠️ Regression behoben** (`2d1189f`): `/trips`-Übersicht crashte (`stripMarkdown` auf rich-text-AST der
  Summary) → `richToPlain`; `buildStory` typeof-Guard für `body_de/_en` (AST-sicher). **War in `0bac071`
  übersehen → wer `0bac071` ohne `2d1189f` deployt, hat kaputte `/trips`-Übersicht.**
- **Bugfix nebenbei** (`41c259c`): Story-Zurück-Pille (`.story-back-line`) hatte auf Desktop keinen `:hover`
  → ergänzt (gleiche Ghost-Optik wie Reise) + sanfter Übergang.
- **Story-Editor** (`5bffc80` Render + `f40b1ca` Foto-Baustein): body_de/_en → rich-text; Story nutzt den
  **Standard-MDX-Parser** (statt parser:markdown — round-trippt Templates nativ; bestehender Inhalt bleibt
  sauberes Markdown, verifiziert). Zwei „+"-Menü-Bausteine: **📷 Foto** (`PhotoUploadField` = jSquash-WebP-
  Upload + Mediathek-Picker, **OHNE** Tina-Medien-Manager) + **📸 Album**. `StoryReaderContent` rendert den
  Body aus dem AST via `<RichText>`, teilt an Album-Stellen (Template-Node ODER Legacy-`[[album]]`), Inline-
  Bild-Lightbox unverändert. **Lokal im `/admin` verifiziert:** WYSIWYG-Editor (kein rohes Markdown), bestehender
  Inhalt (Text/Drop-Cap/Bild/Pullquote/Album) rendert + speichert 1:1. ⚠️ **Das EINFÜGEN neuer Foto/Album-
  Bausteine via „+"-Menü ist headless nicht voll testbar → Davids Hands-on-Test im echten CMS.**
- **Cleanup** (`a9eebeb`): `StoryBodyField` (inkl. Option-1-Vorschau-Box) + `MarkdownTextarea` gelöscht, tote
  config-Imports raus. Option-1-Vorschau ist damit aus dem Editor verschwunden.
- **Editor-Feinschliff aus Davids Live-Test** (`2b21d64`, `bcaa54b`, `cfa67b9`): (1) Tinas eingebauten Bild-Knopf
  aus der Story-Leiste entfernt (`overrides.toolbar`) → kein Tina-Cloud-Medien-Manager mehr, Fotos nur über den
  eigenen 📷-Baustein. (2) **Editor auf Deutsch** via MutationObserver im `cmsCallback` (Tina hat keine i18n):
  Absatz, Überschrift 1–6 (+ Größen-Hinweis groß/mittel/klein), Einfügen, und die Hover-Tooltips (Fett, Kursiv,
  Zitat, Aufzählung, Nummerierte Liste …). Nur exakte Treffer (graceful), heilt sich nach Re-Renders. **Editor-JS
  only → KEIN Re-Index, nur Deploy.** Verifiziert: Leiste + Dropdown + Test-Knoten deutsch.
- **Drop-Cap-Hinweis** (`da431c3`): bleibt automatisch auf dem ersten Absatz (Davids Wunsch); Haupttext-Feld
  bekommt eine `description`, die das erklärt (DE+EN).
- **EN-Haupttext-Ausblenden** (`7a118ef`): Story-`body_en` war als normales rich-text immer sichtbar → bei
  „Nur Deutsch" blieb „Body (EN)" stehen (Doppel zu den ausblendenden EN-Feldern). Jetzt `EnglishRichTextField`
  → blendet mit dem Sprach-Schalter aus, erscheint mit vollem Editor bei Englisch an. Verifiziert.
- **Breakpoint 768–860 bereinigt** (`66e9d0f`): seit dem Desktop-Wander-Titel (≥768) hat der Korridor die
  Band-Pille → Nav-Zurück dort war Doppel (Story) bzw. Reise-Band-Pille von `global.css` Z.155 versteckt. Fix:
  Nav-Zurück auf Detail bis 860 aus (statt nur ≤767); Reise-`.tl-topbar .trip-back` im Desktop-Block
  `display:inline-flex` (überschreibt Z.155). Eine Zurück-Quelle, Story+Reise konsistent. Verifiziert 768/800/860/861.
- **OFFEN:** (a) **Tina-Cloud-Media** — CMS-Bild-Uploads zeigen live ein `?`; Media IST im Dashboard aktiv
  (public/uploads/main) → vermutlich Sync-/Rebuild-Timing: „Resync Media" + nach Deploy prüfen; falls `?` bleibt,
  echte Bild-URL liefern (Pfad-Diagnose). (b) Story-Bausteine-Einfügen (📷/📸) Hands-on im echten CMS.
  **STRUKTURELLE Schema-Änderung → Tina-Cloud-Re-Index auf `main` nötig (David).**
- Commits: `a663453`, `7cd86b0`, `b0dfbdf`, `ccbbbab`, `493fc3c`, `0bac071`, `6fc323a`, `41c259c`, `2d1189f`,
  `5bffc80`, `f40b1ca`, `a9eebeb`, `2b21d64`, `bcaa54b`, `cfa67b9`, `da431c3`, `7a118ef`, `66e9d0f`

## 2026-06-25 — CMS: Haupttext-Editor verständlicher (Option 1 von „2 und 1")
- **Format-Knöpfe beschriftet** (`1d4e271`): Die Markdown-Toolbar zeigte nur kryptische Symbole
  (`F K H ❝ •`). Jetzt jeder Knopf = **Symbol-Chip + Wort** („Fett", „Kursiv", „Überschrift",
  „Zitat", „Liste") + ausführlichere Tooltips. Laientauglich für Alexandra. Wirkt **überall**, wo
  `MarkdownToolbar` genutzt wird (Story-Haupttext, Stations-Text, Bio, Startseite-Intro,
  Datenschutz/Impressum). Datei: `web/tina/fields/MarkdownToolbar.tsx`.
- **Live-Vorschau unter dem Story-Haupttext** (`7391f11`): Eine Vorschau-Box unterm Textfeld rendert
  den Text mit demselben **`mdToHtml`-Port** wie die echte Seite (`web/src/lib/stories.ts`) →
  Überschriften/Fett/Kursiv/Zitat erscheinen **formatiert** statt als rohes Markdown (`###`, `**`, `*`).
  `[[album]]`-Marker → sichtbarer Platzhalter. Speicherformat bleibt unverändert Markdown.
  Datei: `web/tina/fields/StoryBodyField.tsx` (Default-Export jetzt Wrapper mit `<style>` + Inner-Feld).
- **Verifikation:** esbuild-Bundle beider Felder grün; `mdToHtml`-Output für Davids Alaska-Beispiel
  geprüft (`### → <h3>`, `**Alaska** → <strong>`, `*…* → <em>`). CMS-Admin-UI headless nicht
  zuverlässig erreichbar → finaler Look von David im echten CMS gegenzuchecken.
- **Kontext:** David wählte „2 und 1" — dies ist **Option 1** (sicher, direkt auf `main`). **Option 2
  (echtes WYSIWYG, kein rohes Markdown mehr im Feld)** folgt als eigenes Branch+Preview-Projekt mit
  vorab-Capability-Liste (Schema-Änderung, Tina-Cloud-Re-Index, Bild-/Album-/WebP-Port). Noch offen.
- Commits: `1d4e271`, `7391f11`

## 2026-06-25 — Reise DESKTOP: wandernder Titel, Variante B (Schritt 1+2, Mobil unberührt)
- **Schritt 1 — vollbreite deckende Leiste** (`ec502b1`): `.tl-topbar` `grid-column: 1 → 1/-1` (auch über die
  Karten-Oberkante), Milchglas/Frost → **deckend** (rampt mit `--tl-p`), Border → weiche `::after`-Unterkante
  (`left/right:0`, `pointer-events:none`). `min-height: 46px` unverändert → headRef-Höhe konstant.
- **Schritt 2 — EIN wandernder, schrumpfender Titel** (`034fec5`): Crossfade ersetzt durch die Mobil-Mechanik,
  in `@media (min-width:768px)` (Mobil ≤767 unberührt): `.tl-herohead` `position: sticky` (top sticky-top+12,
  margin-top 84 → Wanderstrecke ~120px, hält über den Grid-Container angedockt); h1 `width:max-content`+nowrap,
  angedockt 20px, skaliert via **`--tl-bigscale`** (adaptiv, `scrollWidth` vs. Spaltenbreite, max 2.0 → lange
  Titel starten kleiner, immer einzeilig), `translateX 110` macht Platz für die Pille. Schrumpfen via
  Scroll-Driven (`tl-p-drive`/`tl-hero-fly`, `@property --tl-p`, range 0 120px) + JS-Fallback (CF 0/120).
  `.trip-back` fadet ab ~40% ein, Crossfade-Span + Kicker im Wander-Kopf aus. `armCrossfade` gated bei
  SDA komplett aus (CSS treibt Desktop `--tl-p` UND Mobil `--tl-m`).
- **Spy:** `.tl-topbar` (headRef) unverändert (46px) → `headH` konstant → alaska2026 → Station 1.
- Dateien: `trips-timeline.css`, `TripTimeline.tsx`. **Nur Desktop, reines CSS/JS, kein Re-Index.**
  **Story + 35-Zeichen-Grenze folgen nach Davids Geräte-Test.**
- Commits: `ec502b1`, `034fec5`
- **Feinschliff aus Geräte-Test** (`51c572d`): (1) Titel war zu weit unten → `.tl-herohead margin-top`
  84→30, Range 64; Pillen-Schatten wurde vom `::after` abgeschnitten → `.trip-back box-shadow: none`.
  (2) Karte war ausgefadet → Karte klebt jetzt **unter** der Leiste (`top + --ww-mininav-h`), `::after`-Höhe
  = `--ww-map-gap` endet an der Karten-Oberkante (Fade über Creme-Spalt, nicht über der Karte). (3) Titel
  verschwommen → `will-change: transform` an der h1 entfernt (angedockt = Scale 1 wird scharf gerastert).
- **Test-Runde 2** (`54cb227`): (1) noch verschwommen → h1 wird jetzt bei **großer** Größe gerendert
  (`font-size ×2`) und **runterskaliert** (Downscale = scharf); `--tl-bigscale`→`--tl-fitscale` (≤1,
  scrollWidth vs. Spaltenbreite), angedockt fix Scale 0.5; feste font-size → konstante vertikale Mitte
  (`top` +1). (2) am Text „angeklatscht" → Render-bei-Großgröße hält das Visual in der Box (kein Bluten) +
  `margin-bottom: 20`; `margin-top: 25`, Range 70. (3) Pille nur teils klickbar → `pointer-events: none`
  an der h1 (z7 überdeckte die Pille z6), im Editor (`.is-editor`) wieder `auto`. Bekannte Kante: sehr
  schmaler Desktop + sehr langer Titel.
- **Test-Runde 3** (`2ae21c5`): Pillen-Schatten zurück — Ursache war nicht die Fade-Höhe, sondern das
  `::after`-Pseudo, das über dem Pillen-Inhalt gemalt wird. Statt `box-shadow: none` jetzt `position:
  relative; z-index: 1` an `.tl-topbar .trip-back` → Pille (samt geerbtem Schatten) liegt über dem Fade,
  Schatten zeigt sich voll, fällt nur in der linken Spalte (kein Karten-Kontakt). Fade bleibt kurz.
- **Test-Runde 4** (`94f6937`): harte Kante unter der Leiste weicher → `::after`-Höhe
  `calc(--ww-map-gap + 8px)` (statt exakt an der Foto-Kante endend), der fast transparente Verlaufs-
  Schwanz läuft sanft über die oberste Foto-Kante aus (fluffiger), Kartenkern bleibt frei.
- **Test-Runde 5** (`360a446`): Zurück-Pille war ganz unklickbar — `pointer-events: none` lag nur auf der
  h1, aber der `.tl-herohead`-**Container** (z7) spannt über die ganze linke Spalte und fing als sticky Box
  die Pillen-Klicks (z6) ab. Jetzt `pointer-events: none` am Container (h1 erbt es); im Editor
  (`.is-editor .tl-herohead h1`) wieder `auto`.
- **Test-Runde 6** (`a701fea`): mehr Luft zwischen Leiste und Timeline → `--ww-map-gap` 16→28 (steuert
  koordiniert Fade-Höhe `map-gap+8` UND Karten-Position `+map-gap`: Fade zieht tiefer, Karte wandert mit
  runter, 8px-Schwanz über der Karte konstant). `.tl-editbar` (Editor) um fehlendes `--ww-mininav-h`
  ergänzt (saß im Editor zu hoch; live unberührt). Mobil/Spy unberührt.
- **Test-Runde 7** (`56c36f0`): zwei Spalten getrennt (per Skizze bestätigt) — der `::after`-Fade ist jetzt
  **nur linke Spalte** (`right: calc(420px + 36px)` = Karten-Spalte + gap → Karte rechts unberührt, kein
  Fade auf der Karte), Höhe 40px → Timeline verschwindet weich an tieferer Linie. Karte tuckt separat knapp
  unter die Leiste (`--ww-map-gap` 28→12, Oberkante nicht gefadet). Stellschrauben: `--ww-map-gap`
  (Karten-Spalt), `::after height` (Timeline-Cut-Tiefe).
- **Test-Runde 8** (`3516ec4`): mehr Luft unter dem Banner (Variante A) → `.tl-list` `padding-top`
  `2vh` → `calc(2vh + 40px)`, Timeline startet tiefer (Abstand Banner↔erste Station). Weicher Fade (40px)
  bleibt, liegt über dem leeren Abstand statt über dem Lesetext. Snap aus → rein Layout, spy-neutral
  (Station 1 bleibt aktiv). Stellschraube: die 40px.

## 2026-06-25 — Story DESKTOP: wandernder Titel mit verzögertem Andocken (Variante B)
- **Neu** (`6c95e83`): Story-Desktop-Kopf auf den Wander-Mechanismus umgestellt (vorher nur „erhalten").
  Wie Reise-Desktop + Story-Mobil, aber **verzögert**: der Titel bleibt erst groß auf dem Hero-Foto und
  dockt erst an, wenn das Foto fast durch ist (`animation-range: 42vh → 64vh`) — „erst Foto genießen".
  `.reader-hero-inner` desktop `absolute` → `position: sticky` (wandert + dockt, `top` nav+12); `margin-top`
  hebt den großen Titel auf den Hero. Titel **render-big-scale-down** (scharf): `font: --fs-display`, via
  `--st-fitscale` einzeilig auf die Spaltenbreite, dann via `--st-m` auf `--st-dock` (~22px). Vollbreite
  deckende `.story-topline` (desktop), erscheint mit `--st-m`; **Balken-Pille** (Ghost-Optik wie Reise) fadet
  ab ~40 % ein; **Foto-Pille** (`.story-back`) scrollt mit dem Bild weg. SDA treibt `--st-m` + `st-title-fly-d`
  über den verzögerten Range, `@supports`-Fallback JS-Lerp; JS misst `--st-nav`/`--st-fitscale`/`--st-dock`,
  Gate jetzt `sdaSupported` (Mobil+Desktop). **Story hat keinen Scroll-Spy.** Mobil unverändert.
- **Lokal in der Desktop-Preview (1300px) verifiziert** (Dev-Server via `tinacms dev` läuft offline):
  Scroll 0 = großer einzeiliger Titel auf dem Hero; gescrollt = angedockt (Leiste deckend `top 89`, Titel
  bei `top 101`, Foto-Pille weggescrollt). Stellschrauben: `--st-lift`, `animation-range` (42vh/64vh),
  `--st-dock`, `translateX`.
- Dateien: `global.css`, `StoryReaderContent.tsx`. **Kein Re-Index.** Commit: `6c95e83`
- **Test-Runde 1** (`1a5f7e8`): (1) harte Kante beim Runterscrollen → `.story-topline::after` 16→34px, weicher
  3-Stop-Verlauf (fluffiger). (2) zwei Zurück-Buttons (Foto-Pille scrollte weg, dann kam die Balken-Pille =
  redundant) → alte `.story-back` auf Desktop ausgeblendet; jetzt wie Reise: oben kein Button, Balken-Pille
  fadet in der Leiste ein.
- **Test-Runde 2** (`ed5f57d`): Titel dockte zu spät an (noch am Schrumpfen, während schon Body gescrollt
  wurde) → `animation-range` 42vh/64vh → **34vh/46vh**: fertig angedockt bei ~Scroll 396, deutlich vor dem
  Body (verifiziert: bei Scroll 445/Body sichtbar ist `--st-m` bereits 1). Titel bleibt für ~57 % des Heros groß.
- **Test-Runde 3** (`2bc81db`): angedockter Titel **auf Pillen-Höhe + neben die Pille** (wie Reise). JS misst
  breiten-robust `--st-dock-top` (Titel-Mitte = Banner-Mitte `nav+28`, via `origin left center`:
  `top = nav+28 − fpx*0.525`) + `--st-dock-x` (Titel-links = Pillen-rechts + 14); CSS koppelt `top`/`translateX`
  daran. Vars verifiziert (1300px): Mitte 117.5 ≈ Pille 117, Titel-links 195 = Pille+14.
- **35-Zeichen-Grenze** (`d27972d`): `ui.validate` (UI-only → kein Cloud-Re-Index, nur `tina-lock.json` neu +
  Deploy) an allen 4 Titelfeldern (Reise `title`/`title_en`, Story `title_de`/`title_en`) + `description`-
  Hinweis. ⚠️ EN-Felder nutzen eine Komponente ohne `wrapFieldsWithMeta` → roter Fehlertext dort nicht
  sichtbar (DE zeigt ihn; EN still mit-validiert). `tina-lock.json` mit-regeneriert.
- **Dev-Preview:** lokaler `tinacms dev`-Server läuft offline → Desktop verifizierbar (1300px). Bekannte
  Limitierung: nach programmatischem Reload engaged die Scroll-Driven-Animation in der Headless-Preview nicht
  neu (Werte/Math als Verifikation; Live am Deploy prüfen).
- **Noch offen:** Breakpoint-Bereinigung 768–860 (Band-Pille/Nav-Zurück konsistent, kein Doppel).

## 2026-06-25 — Mobil Story: Lücke über dem Titelbild behoben
- **Bug** (`126a1bf`): bei frisch geöffneter Story saß das Hero-Bild um die Banner-Höhe (~46px) nach unten
  versetzt. Ursache: die sticky `.story-topline` reservierte als erstes Kind ihren Fluss-Platz
  (`min-height: 46px`) **oberhalb** des Heros und schob es nach unten.
- **Fix:** `.story-topline { margin-bottom: -46px }` → die Leiste belegt netto 0 Fluss-Platz und
  **überlagert** den Hero nur (oben transparent `--st-m=0` + Link `opacity:0` → Bild voll sichtbar); beim
  Scrollen wird sie deckend wie gehabt. Nur Mobil, Desktop unberührt (Topline dort `display:none`).
- Datei: `global.css`. **Nur Mobil, CSS, kein Re-Index.** Commit: `126a1bf`

## 2026-06-25 — Mobil Story: Titel-Überschwingen beim Hochscrollen gefixt
- **Bug** (`8dc96b6`): beim Hochscrollen wurde der Titel kurz deutlich größer und ploppte zurück.
  Ursache: `--st-scale-big` wurde aus `offsetWidth` gemessen, und die h1-`max-width` hängt von `--st-m`
  ab. Ein `resize` mitten im Scrollen (iOS-URL-Leiste) maß bei `--st-m>0` eine kleinere Box → zu großes
  `scale-big` → Überschwingen, dann Korrektur bei `--st-m=0`.
- **Fix:** natürliche Textbreite **stabil** messen, unabhängig von der Kappung: h1 `width: max-content`
  (Box umhüllt den Text) + `measure()` nutzt **`scrollWidth`** statt `offsetWidth` (volle Inhaltsbreite,
  ignoriert die `--st-m`-abhängige max-width). `scale-big` ist damit invariant gegen `--st-m`/Resize.
- Dateien: `global.css`, `StoryReaderContent.tsx`. **Nur Mobil, kein Re-Index.** Commit: `8dc96b6`

## 2026-06-25 — Mobil Story: Titel via position:sticky nativ mitfedern (wie Reise)
- **Umbau** (`4b08bbf`): gleiche Endlösung wie Reise, jetzt für den Story-Reader. Damit Sticky den Titel
  andocken-und-**halten** kann (statt nach dem 60vh-Hero abzulösen — zu kurzer Containing-Block), liegt der
  Titel **nicht mehr im Hero**, sondern als Geschwister: `.reader-hero-inner` ist jetzt Kind von
  `#page-story` (hoch, analog `.tl-herohead` in `.tl-stage`).
  - **Mobil:** `.reader-hero-inner { position: sticky }` → federt beim iOS-Overscroll **nativ** mit, dockt
    an-und-bleibt; h1 macht nur noch Schrumpfen + Horizontal-Versatz (`--st-m`), vertikale Wanderung nativ.
    `--st-ov`/`--st-bigY` + das Nachjage-JS **entfallen**.
  - **Desktop:** `.reader-hero-inner` per `position: absolute` (`top:60vh; translateY(-100%)`) exakt an den
    Hero-Unterrand zurückgesetzt → Optik unverändert. (Lokal nicht verifizierbar — Tina-Netz; am Browser prüfen.)
  - `pointer-events: none` am Container (h1 wieder `auto`) → „← Stories"-Link klickbar, CMS-Klick-zum-
    Bearbeiten bleibt. Lange Titel weiter via gemessenem `--st-scale-big` einzeilig + Ellipsis.
- Stellschrauben: `.reader-hero-inner margin-top` (-60 = Anhebung über Hero), `--st-range`/`h-100`.
- Dateien: `StoryReaderContent.tsx`, `global.css`. **Mobil-Umbau + Desktop-Erhalt, kein Re-Index.**
- Commit: `4b08bbf`

## 2026-06-25 — Mobil Reise: zwei Sticky-Umbau-Regressionen gefixt
- **Titel hing im Beschreibungstext** (`de0dcf5`): `.tl-herohead margin-bottom` war `-40px` (zog den Intro
  unter den großen Titel) → jetzt `+18px`, der skalierte Titel hat eigenen Raum.
- **Seite wieder horizontal schiebbar** (`de0dcf5`): die h1 ist im Fluss block-breit, `scale(1.85)` ragte
  rechts aus dem Viewport → `width: max-content; max-width: 100%` (Box umhüllt nur den Text wie die frühere
  fixe shrink-to-fit-h1).
- Datei: `trips-timeline.css`. **Nur Mobil, CSS, kein Re-Index.** Commit: `de0dcf5`

## 2026-06-24 21:45 — Mobil Reise: Titel via position:sticky nativ mitfedern (Endlösung Overscroll)
- **Wurzel:** der Titel lag als **fixe** h1 in einer anderen Koordinatenwelt und wurde per JS dem Gummiband
  nachgejagt → Main-Thread-Lag + iOS-`scrollY`-Überschwinger = sichtbares „Regeln/Pendeln". Kein Tuning
  konnte das beheben (Architektur-, kein Reglerproblem).
- **Umbau** (`024165f`): `.tl-herohead` wird **`position: sticky`** (Titel liegt im Fluss) → federt beim
  iOS-Overscroll **nativ 1:1** mit dem Inhalt (Compositor, kein JS) und dockt nativ an (`top+13` = Band-Mitte;
  Containing-Block `.tl-stage` → bleibt die ganze Liste über angedockt). h1 macht nur noch Schrumpfen +
  Horizontal-Versatz; vertikale Wanderung ist nativ. Während des Overscrolls ist die Scroll-Animation bei 0
  geparkt → Titel federt als starres großes Element mit, **kein Pendeln**.
- Das gesamte `--tl-ov`-Overscroll-JS **entfällt**. **Spy unberührt** (headRef misst weiter nur `.tl-topbar`;
  `.tl-herohead` fließt in keine Spy-Größe ein). Stellschrauben: `.tl-herohead margin-top/-bottom` +
  `animation-range`/`M_RANGE` (70).
- Dateien: `trips-timeline.css`, `TripTimeline.tsx`. **Nur Mobil (≤767), CSS/JS, kein Re-Index.**
  **Story folgt separat nach Geräte-Bestätigung** (60vh-Hero = andere Bauform).
- Commit: `024165f`

## 2026-06-24 21:15 — Mobil: Overscroll-Federn gedämpft + horizontaler Überlauf behoben
- **Horizontaler Überlauf (Reise)** (`e69323a`): die sticky Zeile ist via `margin:0 -18px` schon randbündig;
  das `.tl-topbar::after` (Fade) stand zusätzlich auf `left/right: -18px` → ragte je 18px über den Viewport
  → Seite ließ sich horizontal verschieben. Jetzt `left/right: 0`. (Story war nicht betroffen.)
- **Overscroll-Federn oszillierte** (`b8a2616`): beim Zurückfedern pendelte der Titel hin und her (iOS' `scrollY`
  ist beim Spring nicht sauber monoton → rohes 1:1-Folgen wurde zum sichtbaren „Regeln ohne Hysterese").
  Jetzt frame-raten-unabhängige **Attack/Release-Hüllkurve**: schnell folgen beim Ziehen (ATK 25 ms), weich
  ausregeln beim Zurück (REL 90 ms) → gedämpft, ohne dem Finger hinterherzuhängen. Reise + Story.
- Dateien: `trips-timeline.css`, `TripTimeline.tsx`, `StoryReaderContent.tsx`. **Nur Mobil, CSS/JS, kein Re-Index.**
- Commits: `e69323a`, `b8a2616`

## 2026-06-24 20:50 — Mobil: Overscroll-Mitfedern per Frame abtasten (flüssigeres Rückfedern)
- **Problem:** das Zurückfedern hing an den groben Scroll-Events → der Titel kam **stufig/ruckelig** zurück
  („gewollt, nicht gekonnt").
- **Fix** (`61d55be`): solange überzogen ist (`ov > 0`) läuft eine **rAF-Schleife**, die `scrollY` **jeden
  Frame** liest und `--tl-ov`/`--st-ov` setzt → die elastische Rückbewegung wird mit Display-Rate
  (60/120 Hz) mitgenommen, 1:1 zur Inhaltsposition (kein Lerp). Bei 0 stoppt die Schleife (Batterie).
  Reise + Story.
- Dateien: `TripTimeline.tsx`, `StoryReaderContent.tsx`. **Nur Mobil, reines JS, kein Re-Index.**
- Commit: `61d55be`

## 2026-06-24 20:30 — Mobil: Titel beim iOS-Overscroll mitfedern (Reise + Story)
- **Problem:** beim Überziehen am oberen Rand federt iOS (Android tlw.) den Inhalt elastisch nach unten;
  der fixierte/scroll-gekoppelte Titel macht das per Plattform-Design **nicht** mit → blieb stehen, während
  der Hero wegfederte.
- **Fix** (`c145096`): iOS meldet beim Top-Overscroll **negatives `scrollY`** (= Pull-Distanz). Ein kleiner
  rAF-gedrosselter Scroll-Listener setzt `--tl-ov`/`--st-ov` = `max(0, -scrollY)`; diese stehen als
  **führendes `translateY(var(--…-ov))`** im Titel-Transform (statische Regel **und** Keyframes → SDA- und
  Fallback-Pfad) → Titel schiebt sich exakt mit dem Inhalt mit und schnellt mit zurück.
- Kein Wrapper/JSX-Umbau → Titel bleibt `position:fixed`, **Spy/`headH` unberührt**. Pille/Band sind bei
  `scrollY 0` unsichtbar (kein Mitfedern nötig). Desktop: `scrollY` wird nicht negativ → no-op.
- Dateien: `trips-timeline.css`, `global.css`, `TripTimeline.tsx`, `StoryReaderContent.tsx`.
  **Nur Mobil (≤767), reines CSS/JS, kein Re-Index.**
- Commit: `c145096`

## 2026-06-24 20:05 — Mobil Reise: angedockten Titel vertikal mittig zum Zurück-Button
- **Fix** (`630ebc0`): der angedockte Reise-Titel saß mit der Oberkante auf der Band-Mitte → hing unter
  dem „← Reisen"-Button. Jetzt Titel-Oberkante **+13 px** (statt +23) → Titel-**Mitte** auf die 46px-Band-
  Mitte = Höhe des Buttons; zentriert **im Band**, nicht über Band+Fade. Großer Hero-Titel bleibt via
  `translateY 56` (statt 46) an Ort — nur der angedockte Zustand rückt hoch. Keyframe-Startwert (SDA-Pfad)
  mitgezogen. **Story war bereits zentriert (+13), unverändert.**
- Datei: `web/src/styles/trips-timeline.css`. **Nur Mobil (≤767), reines CSS, kein Re-Index.**
- Commit: `630ebc0`

## 2026-06-24 19:40 — Mobil: Titel via Scroll-Driven Animation direkt an den Scroll koppeln
- **Problem (struktureller Kern):** der wandernde Titel (Reise + Story) wirkte „unbeholfen", weil er per
  JS-Lerp *geglättet* war, der Inhalt darunter aber **1:1 nativ** scrollt → beide driften gegeneinander.
  Kein Lerp-Wert kann „smooth bei langsam" und „klebt am Inhalt" zugleich. Lösung: Titel **direkt** an die
  Scroll-Position koppeln, nicht an einen geglätteten Wert.
- **Fix** (`fcd6504`): **CSS Scroll-Driven Animations** (`animation-timeline: scroll(root)`) treiben jetzt
  `--tl-m`/`--st-m` (Zeile, Pille, `max-width`) **und** den Titel-Transform direkt als `@keyframes`
  (kompositierbar = buttrig). Läuft auf derselben Timeline wie der native Scroll → Titel klebt 1:1 am
  Inhalt, kein Drift/Nachlauf, frame-raten-egal (60/120 Hz / ProMotion). `@property --tl-m/--st-m`
  registriert (interpolierbar), Easing `cubic-bezier(.42,0,.58,1)` ≈ smoothstep.
- **Story:** Keyframe-Endpunkte + `animation-range` lesen die per JS gemessenen Vars
  (`--st-bigY`/`--st-scale-big`/`--st-range`, neu); JS misst weiter bei resize.
- **Fallback ohne Risiko:** ältere iOS ohne `scroll()`-Support → `@supports` greift nicht → alte JS-Lerp-
  Lösung bleibt (heutiger Stand, keine Regression). JS gated den Mobil-Pfad dann aus (kein Konflikt).
- **Sicherheit:** Titel bleibt `position: fixed` → zählt nicht zur `.tl-topbar`-Höhe → Scroll-Spy/`headH`
  unberührt, `alaska2026`→Station 1 unverändert. Desktop-Crossfade (`--tl-p`) unangetastet.
- Dateien: `TripTimeline.tsx`, `StoryReaderContent.tsx`, `global.css`, `trips-timeline.css`.
  **Nur Mobil (≤767), reines CSS/JS, kein Re-Index.**
- Commit: `fcd6504`

## 2026-06-24 19:05 — Mobil: Titel-Glättung enger ans Scrollen koppeln (kein Trailing)
- **Problem:** der wandernde Titel (Reise `--tl-m`, Story `--st-m`) hinkte bei schnellem Scrollen
  hinterher — ein *fest gedeckelter* Lerp-Bruchteil kann „smooth bei langsam" und „kein Trailing bei
  schnell" nicht zugleich.
- **Fix** (`790a25f`): (1) frame-raten-unabhängige Glättung über die echte Frame-Zeit `dt`
  (`1-(1-k)^(dt/16.7)`, konsistent 60/120 Hz); (2) Pro-Frame-Faktor `k` wächst stufenlos (smoothstep)
  mit dem Rückstand → langsam = sanftes Gleiten, schnell = holt nahezu vollständig auf, kein Springen.
  `M_BASE/ST_BASE 0.14`, `LAG_FULL 0.4`. Desktop-Crossfade `--tl-p` bei 60 Hz unverändert (k=0.12).
- Dateien: `web/src/components/TripTimeline.tsx`, `web/src/components/StoryReaderContent.tsx`.
  **Reines JS (≤767), kein Re-Index.**
- Commit: `790a25f`

## 2026-06-24 18:35 — Mobil: weicher Fade unter Titel + flüssigerer Titel-Hochflug
- **Weicher Fade unter der Titelzeile** (`45ee79e`): full-bleed Verlauf (deckend→transparent, 18px)
  als `.tl-topbar::after` — hochscrollender Text fadet sanft aus statt harter Kante; über der
  cremefarbenen, full-bleed Karten-Spalte unsichtbar → Karten-Oberkante bleibt scharf.
- **Glättung an Scrollgeschwindigkeit gekoppelt** (`45ee79e`): adaptiver Lerp-Faktor
  `min(cap, base + Rückstand·k)` für Reise (`--tl-m`) und Story (`--st-m`) — schnell scrollen holt
  zügig auf (nicht träge), Ausklingen rastet weich ein.
- **Titel-Hochflug flüssiger** (`004e2a2`): Aufhol-Kappung gesenkt auf `0.5` (statt `0.8`) pro Frame,
  Multiplikator `0.8` (statt `1.2`) — weicheres Gleiten, bleibt bei schnellem Scrollen reaktiv.
- Dateien: `web/src/styles/trips-timeline.css`, `web/src/components/TripTimeline.tsx`,
  `web/src/components/StoryReaderContent.tsx`. **Reines CSS/JS (≤767), kein Re-Index nötig.**
- Commit: `45ee79e`, `004e2a2`

## 2026-06-23 16:15 — Mobil-Nachbesserung: Karten-Einschnitt, Pillen-Einflug, Titel-Vorschau
- **Karte oben eingeschnitten behoben** (`073fea7`): das mobile `.tl-topbar::after` (weiche Unterkante)
  lag über der Oberkante der direkt darunter klebenden Karte → mobiles `::after` entfernt (Karte ist opak
  mit runder Oberkante, sitzt sauber an der Zeile). Verifiziert: gap 0, kein `::after`.
- **Zurück-Pille fliegt ein** (`073fea7`): Reise + Story — `translateY` (10→0) + Fade ab ~40 % statt nur Fade.
- **CMS: „Vorschau (Handy)" für den Reise-Titel** (`e01a04c`): der Titel ist das bestehende Feld
  „Reise-Titel" (editierbar); neu ein reines Vorschau-Feld darunter, das den Titel in der Mobil-Leiste
  zeigt (mit „…"-Kürzung). Konsequenz aus P5. **Schema-Änderung → Tina-Re-Index nötig.**

## 2026-06-23 14:15 — Reise-Detail mobil: EIN wandernder, schrumpfender Titel (direkt auf main)
- **Reise mobil (`≤767`)** (`17eb5a8`): Das Zwei-Element-Crossfade ist durch **EIN** Titel-Element ersetzt —
  die echte `<h1>` wandert beim Scrollen kontinuierlich von groß/tief nach klein/oben in die Zeile und
  schrumpft dabei (`transform: translateX+translateY+scale`, BIG 1.85→1.0), getrieben von `--tl-m`
  (rAF-Lerp 0.11 + smoothstep, RANGE 90 — magnetischer Nachlauf). Titel ist **fixiert** → zählt NICHT zur
  gemessenen `.tl-topbar`-Höhe → `headH` konstant → **Scroll-Spy unberührt, `alaska2026`→Station 1**
  (verifiziert). Zeile **voll deckend** (ramped) mit weicher Unterkante (`::after`), kein harter Strich.
  Zurück-Pille in der Zeile = kompakter Akzent-Link, fadet ab ~40 %. Kicker mobil ausgeblendet (sauberer
  Hero). Desktop-Crossfade (`--tl-p`) unverändert.
- **Kein Doppel-Zurück** (`9a835e1`): Nav-Zurück-Link auf Reise-Detail `≤767` aus (`nav-back--trips`) — die
  Titelzeilen-Pille ist das einzige Zurück. 768–860 (iPad-Hochkant) + Story behalten den Nav-Link.
- **Story mobil (`≤767`)** (`6b9cf57`, nachgezogen): gleiches Muster fürs 60vh-Hero — die `<h1>` wandert
  von groß/tief (Hero-Unterkante) in eine neue sticky deckende Titel-Zeile und schrumpft (`--st-m` via
  rAF-Lerp in der `StoryReaderContent`-Insel, Strecke = Hero-Höhe). **Lösung für lange Prosa-Titel
  (Option A):** per JS so skaliert, dass sie **einzeilig** in die Breite passen (`--st-scale-big`) +
  **Ellipsis** in der Zeile → bricht/überläuft nie. Zurück-Pille (Akzent-Link) fadet ab ~40 %;
  Nav-Zurück-Link auf Story `≤767` aus. Story hat keine Scroll-Spy. **Optik nur am echten Gerät final
  prüfbar** (Preview-`innerWidth` ≠ Render-Breite → kann Mobil nicht zeigen; Logik per Messung bestätigt).

## 2026-06-23 11:45 — Reise-Detail: Crossfade-Kopf + reservierte Zurück-Pille (direkt auf main)
- **Teil A — Story-Zurück-Pille** (`17dcaad`): von fenster-`fixed` auf an die 760px-Lesespalte gebundene
  reservierte Pille über dem Hero (Desktop). Kollidiert bei keiner Breite mit dem Titel. Mobil unverändert
  (Nav-Zurück-Link). `.trip-back`/`.story-back` teilen nur noch die Optik, Position getrennt.
- **Reise-Kopf-Umbau (Teil A+B)** (`318b82d`): große `<h1>` raus aus dem Sticky in `.tl-herohead`
  (nicht klebend, scrollt weg, fade+blur bis 5px). Neues sticky **`.tl-topbar`** (= `headRef`) mit
  Zurück-Pille (**nur Desktop**; mobil `≤860` aus → Nav-Link) + eingeblendetem Titel (opacity + translateY).
  Crossfade über **eigenen rAF-Lerp** (smoothstep, Ramp 36/40px, Faktor 0.12), entkoppelt von der Spy.
  `headRef` misst jetzt das Kompaktband; **Aktivierungslogik unverändert** — `alaska2026` öffnet weiter auf
  **Station 1** (Desktop + Mobil lokal verifiziert). Hero-Titel mobil fix **19px** (kein Schrumpfen).
  Alte fixe `.trip-back` aus beiden `[slug].astro` entfernt; `::before/::after` (Trennlinie) entfallen.
- **Milchglas + Safari-Fallback** (`e0cc719`): Band-Hintergrund Alpha 0→0.58 + `backdrop-filter` blur 0→14px
  (+`-webkit-`), gerampt über `--tl-p`. `@supports not` → deckend ~0.95 ohne Frost. Linie-über-Karte behoben.
- Direkt auf `main`. Lokal verifiziert (Desktop-Crossfade, Mobil Nav-Link unverändert + Crossfade, Pille
  content-gebunden, Milchglas, keine Linie auf Karte, `alaska2026`→Station 1). Safari-Frost am Gerät prüfen.

## 2026-06-23 22:40 — Nav-Umbau mobil + globale safe-area + Sprach-Banner (Branch `nav-safearea-langbanner`)
- **safe-area global** (`5530d1d`): `viewport-fit=cover` ergänzt → `env(safe-area-inset-*)` greifen jetzt
  (vorher 0, G1). Header `padding-top: inset-top`, mobiler Nav-Drawer top/height/padding-bottom-Insets,
  `--ww-sticky-top` der Reise-Timeline → `calc(96px + inset-top)`. Fallback 0 (kein Doppelabstand Hochformat).
- **Nav mobil** (`fb09808`): auf `<=860px` Logo zentriert, Zurück-Link links **nur** auf Reise-/Story-Detail
  (Ziel/Label sprachabhängig), Burger rechts. Desktop **1:1 unverändert**. Sprachumschalter unangetastet im
  Drawer. CMS-Vorschau-Override neutralisiert (Logo bleibt im Tina-Iframe static).
- **Kein Doppel-Zurück mobil** (`c061d77`): alles auf Breakpoint **860px** vereinheitlicht — fixe
  `.story-back`/`.trip-back` `<=860` aus, `.tl-mininav-back` (aus `78645d3`) entfernt. Mininav-**Titel** bleibt.
- **Sprach-Banner** (`c2c963a` Schema, `8059b72` UI): neue Objekt-Gruppe `sprach_banner` in **Darstellung**
  (enabled, position oben/unten, text EN, switch/stay-Labels). Banner nur auf DE-Seiten gerendert; erscheint
  clientseitig nur bei nicht-deutscher Browser-Sprache + ohne localStorage-Merker. „Switch to English" →
  EN-Pendant der Seite; „Bleiben"/✕ → Merker, nie wieder. `navigator.language` nur gelesen. Unten-Banner
  schiebt den To-Top-Button hoch (Body-Klasse). **Tina-Cloud-Re-Index nötig** (Schemaänderung).
- **Datenschutz** (`f77cb43`): Abschnitt „Lokale Speicherung (Sprachhinweis)" in DE+EN (kein Re-Index).
- Lokal verifiziert: Nav-Mobil (Reise+Story), Logo zentriert, Drawer+Sprachumschalter, `alaska2026`→Station 1,
  Banner (DE-only/hidden/korrektes EN-Ziel/full-width unten). safe-area-Insets nur auf echtem Gerät testbar.

## 2026-06-21 17:40 — Reise-Zurück mobil in die Mininav-Zeile
- Auf dem Handy (`<768px`) lag die fixe „← Reisen"-Pille direkt auf dem Reise-Titel + der Mini-Karte
  (Reisen haben kein Hero-Bild wie Stories, über das die Pille fällt). Fix: fixe Pille mobil ausgeblendet,
  „← Reisen"/„← Trips" als schlanken Nav-Link in die ohnehin sticky `.tl-mininav`-Zeile gelegt (Akzentfarbe,
  blendet beim Scrollen mit dem Titel zusammen ein). Desktop unverändert = fixe Pille wie Stories.
- Mininav ist von der Scroll-Spy entkoppelt (misst nur `.tl-head`) → `alaska2026`-Station-1 unberührt.
  Lokal verifiziert (mobil + Desktop, Scroll/Collapse, Scroll-Spy).
- Dateien: `web/src/components/TripTimeline.tsx`, `web/src/styles/trips-timeline.css`, `DESIGN.md`
- Commit: `78645d3`

## 2026-06-21 — CMS-Format-Leiste + Markdown nachgerüstet + Zurück-Pille
- **Format-Leiste** `MarkdownToolbar` (`72e8175`): Fett/Kursiv (umschließt Auswahl) + Überschrift/Zitat/
  Liste (Zeilen-Präfix, Toggle). Laientauglich — kein Tippen von `**`/`>`. Per `allow` einschränkbar.
- **Markdown-Rendering nachgerüstet** (`2b2219c`): Stations-Text, Reise-Zusammenfassung, Über-uns-Bio,
  Startseite-Intro rendern jetzt via `mdToHtml` (vorher reiner Text). `<p>`→`<div class="… ww-rich">` +
  Reset-CSS, damit Text **ohne** Markdown 1:1 gleich aussieht. Karten-Teaser (`.trip-card-sum`):
  `stripMarkdown` → kein rohes `**` im Clamp. Speicherformat bleibt Markdown.
- **Story-Editor** (`2eea005`): Format-Leiste + Album-Status-Hinweis mit **Albumname** (aus `linked_album`
  via `useFormState`) statt nacktem `[[album]]`; „entfernen"-Knopf. Renderer/Token unverändert.
- **Leiste in alle nachgerüsteten Felder** (`7d2c4d9`): neue Feld-Komponenten `MarkdownTextarea`(+Inline)
  und EN-Varianten `EnglishMarkdownTextField`(+Inline, sprachschalter-tauglich) für Stations-Text/Bio/
  Intro/Datenschutz/Impressum (volle Leiste) + Reise-Summary (nur Fett/Kursiv). UI-only → Lock neu, **kein Re-Index**.
- **Zurück-Pille** (`dab705e`): `.story-back` ist jetzt eine **fixierte, halbtransparente Pille** (Blur,
  abgerundet, gleiches Idiom wie der Nach-oben-Button) statt einer Leiste, die das Hero-Bild runterschob.
- Alle Schritte Build-grün gegengeprüft; Speicherformat überall Markdown → **kein Tina-Re-Index**.

## 2026-06-20 — Jahreskapitel (Stories + Reisen) + Zurück-Link auf Story-Detail
- **Helper** (`9ff3f93`): `lib/groupByYear.ts` — gruppiert eine sortierte Liste nach Jahr (absteigend) aus
  dem vorhandenen `date`; ungültiges/leeres Datum → „Archiv" zuletzt. **Kein `year`-Feld, kein Re-Index.**
- **Stories-Übersicht** (`b6a6abb`): DE+EN nach Jahr gruppiert, Fraunces-Überschrift `.year-head`
  (38px/300/-0.02em, `border-bottom var(--c-line)`), Cards unverändert.
- **Reisen-Übersicht** (`4656237`): gleiche Gruppierung in `TripsOverview.astro` (DE+EN), Reihenfolge im
  Jahr = `sortTrips` (order, dann Datum).
- **Story-Detail-Zurück-Link** (`09c9f36`): `.story-back` „← Stories" (DE `/stories`, EN `/en/stories`),
  Stil identisch zu `.trip-back`. Reisen-Detail hatte `trip-back` bereits — nur verifiziert.
- Lokal gegengeprüft: Jahres-Überschriften 2026→2023 (Stories+Reisen, DE+EN), 6 Story-/5 Reise-Karten,
  Back-Links DE+EN, `trip-back` intakt, Build grün. Timeline/Lightbox/Karte unberührt.

## 2026-06-20 — CMS: Logo überall anklickbar (-> Darstellung-Logo-Feld)
- **Logo klickbar** (`ce21b29`): neue Insel `LogoLink` (liest `darstellung` via `useTina`, `data-tina-field`
  am Logo-`<img>`); in Nav, Footer und Hero eingesetzt. BaseLayout + beide index-Seiten holen die
  `darstellung`-Doc (`client.queries.darstellung`) und reichen sie durch. Klick aufs Logo in der CMS-Vorschau
  öffnet das Logo-Feld unter 🎨 Darstellung. Markup/CSS 1:1, Fallback auf statisches Logo. **Kein Re-Index.**
- Doku: `CMS-UX.md` um die Logo-Entscheidung ergänzt.

## 2026-06-20 — Fix: doppelter /uploads-Pfad bei Medien + Vorschau-Router (Darstellung/Highlights)
- **Medien-Fix** (`fa4e8e7`): Pfade kamen teils als `/uploads/uploads/<datei>` an (assets.tina.io-Umschreibung
  enthielt den mediaRoot doppelt) → „?" in CMS-Vorschau **und** live (Hero-Diashow). `normalizePath` (Frontend)
  + `toLocalMedia` (CMS) klappen den doppelten Präfix ein; Upload-Felder speichern via `dedupeUploads` sauber.
  Bestehende Doppel-Daten rendern dadurch korrekt **ohne** Daten-Eingriff. Kein Re-Index.
- **Vorschau-Router** (`827a3e0`): `🎨 Darstellung` + `⭐ Highlights` bekommen `router () => '/'` → Live-Vorschau
  + auffindbar (u. a. das Logo unter Darstellung). UI-only, kein Re-Index.

## 2026-06-20 — Equipment-Kategorie-Überschriften klickbar + CMS-UX-Doku
- **Klick-zum-Bearbeiten**: `data-tina-field` auf den Kategorie-`<h3>` der Equipment-Seite → Klick in der
  CMS-Vorschau springt direkt zur Kategorie (wie schon beim Klick auf ein Gerät). Kein Re-Index.
- **`CMS-UX.md`** neu: hält fest, **wie sich das CMS anfühlen soll** (Leitprinzipien P1–P4 + festgehaltene
  Entscheidungen). Dort kann David CMS-Wünsche dokumentieren (Text + Screenshot via GitHub-Issue/PR).

## 2026-06-20 — Nachjustierung (Feedback): Kategorien inline + Hover-Schalter auf „Über uns"
- **Equipment-Kategorien** (`d2b629d`): von der separaten Collection `gear_categories` auf eine
  **Inline-Liste `categories`** im Equipment-Formular umgestellt (David wollte keine eigene Datei-Liste,
  sondern Pflege direkt auf der Equipment-CMS-Seite mit Live-Vorschau). Geräte-Feld `category` = Custom-
  Dropdown `GearCategoryField` (liest die Geschwister-Liste via `react-final-form` `useFormState` —
  eine Instanz im Baum bestätigt; speichert die `key`). Separate Collection + 7 Dateien entfernt,
  Geräte von Referenz-Pfaden zurück auf Kennungen migriert. `lib/gear.ts`/`GearContent` gruppieren nach
  der Inline-Liste (Listenreihenfolge = Anzeige; unbekannte Kennung fällt nicht weg).
- **Über-uns-Hover-Schalter** (`a3f9b15`): von „Darstellung" (`about_person_hover`) auf die **„Über uns"-Seite**
  verschoben (`person_hover` in `about.json`); BaseLayout liest den Wert von dort.
- Beides weiterhin **Schema-Änderung → ein Re-Index** (zusammen mit dem Eintrag unten).

## 2026-06-20 — Equipment-Kategorien im CMS editierbar + Über-uns-Profile-Hover (⚠️ Re-Index)
- **Equipment-Kategorien** (`a112551`): die bisher im Code feste Kategorie-Liste ist jetzt eine
  eigene CMS-Collection **`gear_categories`** („🎒 Equipment – Kategorien": anlegen/umbenennen/
  sortieren via `order`). Das Geräte-Feld `category` ist ein natives **`reference`-Dropdown** darauf.
  7 bestehende Kategorien geseedet, alle 12 Geräte 1:1 auf die Referenzen migriert. Frontend
  (`lib/gear.ts` + `GearContent.tsx`) gruppiert nach referenzierter Kategorie, sortiert nach `order`.
- **Über-uns-Profile-Hover** (`a112551`): neuer CMS-Schalter **`about_person_hover`** (Standard an),
  Body-Klasse `ww-person-hover` → Profile heben sich beim Hovern an wie die Story-Karten (Muster von `album_hover`).
- Dateien: `web/tina/config.ts`, `web/tina/tina-lock.json`, `web/src/data/gear.json`,
  `web/src/data/gear-categories/*.json` (neu), `web/src/lib/gear.ts`, `web/src/components/GearContent.tsx`,
  `web/src/data/appearance-settings.json`, `web/src/layouts/BaseLayout.astro`, `web/src/styles/global.css`.
- **Schema-Änderung (neue Collection + neues Feld) → Tina-Cloud-Re-Index nötig** (nach dem Push, von David).
  Lokal gegengeprüft: Build grün, DE+EN-Überschriften in alter Reihenfolge, alle 12 Geräte erhalten.

## 2026-06-20 — ✅ Stabiler Abschluss-Stand (Meilenstein, bewusster Pausenpunkt)
- Kein Code, nur Stand festgehalten: Seite live auf `main`, Cutover durch, SEO-Grundlage steht
  (Sitemap, JSON-LD, Search Console: Property bestätigt + Sitemap erfolgreich gelesen),
  Datenschutz vollständig (inkl. Web3Forms), Performance ok, a11y-Basics (alt-Texte),
  Security-Header + CSP `frame-ancestors`. **Keine offenen Pflicht-Punkte.**
- Verbleibendes (eigene Domain/Namensentscheidung inkl. K8, G1, G2, alt Klasse 2, datePublished-Zeitzone,
  K3, K6, Kontakt-Empfängeradresse) als **geparkt/Kür** dokumentiert — keine offenen Aufgaben.
- Dateien: `STATUS.md` (Header + §1 SEO + §6 neu gefasst), `CHANGELOG.md`.

## 2026-06-19 — SEO: Sitemap-Fix (Statistik raus) + JSON-LD strukturierte Daten
- **Sitemap** (`c24f579`): noindex-Seiten `/statistik` (DE+EN) aus der Sitemap ausgeschlossen
  (Filter um `!page.includes('/statistik')` erweitert), sonst meldet die Search Console
  „Übermittelte URL als ‚noindex' gekennzeichnet". Am echten `dist/sitemap-0.xml` geprüft:
  38 URLs, kein `/statistik/` mehr. Einzureichende URL bleibt `/sitemap-index.xml`.
- **JSON-LD** (`fda0f74`): WebSite + Organization „Wide & Wild" global im `BaseLayout`
  (`sameAs` = Instagram aus `contact.json`, `logo` aus appearance-settings) als `@graph`;
  Story-Detailseiten (DE+EN) ergänzen einen `Article`-Knoten aus real existierenden Feldern
  (headline, excerpt, datePublished, Cover-Bild), author/publisher per `@id` auf die Organization.
- Dateien: `web/astro.config.mjs`, `web/src/layouts/BaseLayout.astro`,
  `web/src/pages/stories/[slug].astro` + EN-Pendant.
- **Rein Template-Ebene — KEIN Tina-Re-Index nötig.** Am echten Build (lokaler Tina-Dev-Server)
  gegengeprüft: DE+EN, Story mit/ohne Cover, valide JSON-LD-Struktur.

## 2026-06-19 — CMS: Karten-Auto-Popup ein-/ausschaltbar (⚠️ Re-Index)
- Neues zentrales Schalter-Feld **`reisen_settings.map_auto_popup`** (`1a1ef30`, Muster wie `map_scroll_zoom`):
  CMS → „Reisen – Einstellungen" → **„Karte: Info-Sprechblase automatisch zeigen"** (Standard AN).
  AUS = Popup nur bei Klick auf den Kartenpunkt.
- `tina/config.ts` (Feld), `TripTimeline` (Prop `autoPopup` → Gate in `drawMarkers`), `trips/[slug].astro` + EN
  (durchreichen), `trips-settings.json` (Default `true`), `tina-lock.json` neu erzeugt (idempotent geprüft).
- **Schema-Änderung → Tina-Cloud-Re-Index nötig** (nach dem Push, von David).

## 2026-06-19 — Reisen-Karte: Auto-Popup + stabile Fahrzeug-Ausrichtung
- **Auto-Popup** (`d3b8db9`): das (schon vorhandene) Marker-Popup „{Station} + {Datum}" erscheint jetzt
  automatisch für die aktive Station — beim Laden und bei jedem Stationswechsel, ohne Klick.
  Umsetzung in `drawMarkers()` (index-sicher, da Stationen ohne Koordinaten übersprungen werden).
  - **Nachtrag (`145bbd6`):** Popup erschien zunächst nicht — `popup.addTo(map)` öffnet ohne Position.
    Korrektur: über den aktiven Marker `togglePopup()` öffnen (setzt lnglat) + `closeOnClick:false`.
- **Fahrzeug-Flackern behoben** (`1e7d4d5`): das Auto sprang beim Losfahren kurz links/rechts. Ursache:
  Spiegelung (`scaleX`) hing am zittrigen Mini-Segment + Ruhezustand hart „rechts". Jetzt an der
  Gesamtrichtung der Etappe (Netto-Längengrad) bzw. Ankunftsrichtung. Flugzeug-Rotation unverändert.
- Map-„Ruckeln" war nach dem Timeline-Fix weg (war Konsolen-/Mess-Churn beim Debuggen) → erledigt.

## 2026-06-19 — Fix: Reise-Timeline startet wieder bei Station 1
- Regression (live aufgefallen): bei einer Reise mit kurzem Zwischenstopp als Station 2
  (z. B. „FRA - Airport") sprang die Timeline beim Öffnen sofort von Station 1 auf 2.
- Ursache: die höhenadaptive Aktivierung (Punkt 2, `53c3f71`) zog den `lead` kurzer Stationen
  zu weit nach oben. **Nicht** durch Charge 1/2 verursacht (die berühren die Scroll-Spy nicht).
- Fix (`0c29b98`): `lead` je Station auf den Abstand zur vorigen Station gedeckelt
  (`min(lead, blocks[i].top - blocks[i-1].top)`) → Aktivierungspunkt bleibt ≥ Oberkante der
  vorigen Station; beim Laden (Anker über Station 1) kann keine spätere Station aktiv werden.
  Getunte Früh-Umschaltung beim Scrollen bleibt. `TripTimeline.tsx`, esbuild grün.
  - **Nachtrag (`1b8e648`):** erster Deckel (Oberkante der vorigen Station) griff bei großer
    Viewport-Höhe nicht (Konsolen-Diagnose: `lead` < Abstand → wirkungslos; St2 trotzdem beim Laden aktiv).
    Korrektur: Deckel auf die **Unterkante** der vorigen Station (`blocks[i].top - blocks[i-1].bottom`)
    → eine Station wird erst aktiv, wenn die vorige den Anker passiert hat. Nachweis vh~1050: St2 466 > Anker 344.

## 2026-06-19 12:30 — Security: CSP frame-ancestors 'self' (direkt auf main)
- `web/public/_headers` `/*`: `Content-Security-Policy: frame-ancestors 'self'` ergänzt (`f608a11`).
- Clickjacking-Schutz; ersetzt das in Charge 1 weggelassene `X-Frame-Options`. **Verifiziert same-origin**:
  der Tina-Editor rahmt die Seiten per iframe `src="/gear"` (eigene Domain, nicht `app.tina.io`) → `'self'`
  lässt die CMS-Vorschau zu und blockt Fremd-Einbettung. BEWUSST nur `frame-ancestors` (keine weitere CSP).
- nosniff/Referrer-Policy + /uploads-Caching unverändert. MAENGEL **S1** erledigt.

## 2026-06-19 11:51 — Charge 2: alt-Texte + Hero-als-OG (direkt auf main)
- Reine Template-Ebene, **kein Tina-Re-Index**. Auf Davids Wunsch **ohne Preview-Umweg** per Fast-Forward direkt auf `main`
  (Branch `charge2-alt-og` wieder gelöscht); Verifikation = Live-Build nach dem Push + kurzer Gegencheck Lightbox/Galerie.
- **Hero-als-OG** (`d72eae2`): `og:image`/`twitter:image` kommen automatisch aus dem Startseiten-Hero
  (`hero.image` → sonst erstes Slideshow-Bild → sonst Fallback IMG_5904; via `normalizePath` + `Astro.site`).
  Pro-Seite-`ogImage`-Override entfällt. Eine Quelle, zieht mit dem Hero mit.
- **alt Klasse 1** (`d2c9a83`): Einzelbilder (Story-/Reise-Cover, Personen-Foto, Stations-Hero, „Aktuell"-Karte)
  bekommen `alt` aus vorhandenem Titel/Namen — kein neues Schema.
- **alt Klasse 3 / Sammel-alt** (`f8a067d`): Galerie-/Lightbox-/Momentaufnahmen-/Stations-Bilder bekommen ein
  kontextbezogenes Sammel-alt (DE/EN, „Foto aus Album {X}" o. ä.) via optionale `alt`/`photoAlt`-Props.
  Sichtbare Lightbox-Caption unverändert (nur `alt`-Attribut). Hero + Lightbox-Platzhalter bleiben bewusst `alt=""`.
- pro-Bild-`alt` für Bulk-Galerien (Objekt-Listen + Migration + Re-Index) bewusst **geparkt** → IDEEN.md W4.
- betroffene Dateien: BaseLayout.astro + 9 Komponenten + STATUS.md/CHANGELOG.md/IDEEN.md. esbuild grün.
- Commits: `d72eae2`, `d2c9a83`, `f8a067d` (+ Doku).

## 2026-06-18 23:01 — Charge 1 LIVE: SEO-Head + h1-Semantik + Security-Header (PR #5)
- `charge1-seo-head` → `main` gemergt (`6b76397`), live.
- **SEO-Head** (BaseLayout): per-Seite `meta description`, Open Graph + Twitter Card, `canonical`, `hreflang`
  de/en/x-default (nur indexierbare Seiten; DE/EN-Pendant pfadbasiert). Statische Seiten feste Description,
  dynamische aus vorhandenen Feldern (summary/excerpt/note; Story = `og:type article`).
- **h1-Semantik:** Hero-Headline `<p>`→`<h1>`, Reise-Titel `<h2>`→`<h1>` (+ Selektor `.tl-head h1`),
  Stationen `<h3>`→`<h2>` — Optik 1:1 (universeller Reset + klassenbasierte Styles). Genau ein h1/Seite.
- **Security-Header** (`web/public/_headers`, `/*`): `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`. `X-Frame-Options` bewusst weggelassen (Tina-iframe);
  Clickjacking-Schutz folgt als CSP `frame-ancestors` (MAENGEL S1).
- Commits: `1b1539c`, `bd25956`, `5de7495`, `340aea7` (Merge `6b76397`).

## 2026-06-18 20:30 — Cleanup: verwaiste /uploads-Bilddatei entfernt
- **/uploads-Inventur** (`59e21d5`): read-only-Referenz-Check aller 18 Bilder → genau eines verwaist:
  `IMG_6001.jpg` (3,6 MB, Original ohne Referenz; genutzt wird `IMG_6001.webp`, 250 KB) → entfernt.
  Restliche 17 Bilder referenziert. WebP-Variante + Album `2026-usa-2023.json` unberührt.
- IDEEN §4.1: `/uploads`-Punkt abgehakt; offen bleibt nur noch Detail-Analyse (`lib/`/CSS).
- Commit: `59e21d5` + dieser Eintrag

## 2026-06-18 20:23 — Cleanup: toter Prototyp-Code aus web/ entfernt
- **Code-Inventur (IDEEN §4.1 Fortsetzung)** (`2108861`, ~1285 Zeilen): read-only-Analyse → dann entfernt:
  verwaiste Komponenten `ProtoGallery.tsx` + `TripMapProto.tsx` (0 Referenzen) sowie die interne Vorschauroute
  **`/proto/reisen-timeline`** (`pages/proto/reisen-timeline.astro`, `components/proto/TripsTimelineProto.tsx`,
  `components/proto/alaskaTimelineDemo.ts`, `styles/proto-timeline.css`). War der Prototyp der jetzt live
  laufenden Reisen-Timeline (`TripTimeline.tsx`); nirgends verlinkt, noindex, nicht in der Sitemap.
- `TripTimeline.tsx`: Kommentar-Verweis auf den entfernten Prototyp angepasst. esbuild grün.
- **Offen** (in IDEEN §4.1 notiert): ungenutzte Funktionen/CSS auf Detail-Ebene, ungenutzte `/uploads`-Bilder.
- betroffene Dateien: 6 gelöscht + TripTimeline.tsx + IDEEN.md + CHANGELOG.md
- Commits: `2108861` + dieser Eintrag

## 2026-06-17 21:13 — Doku-Nachzug: Vorschau getrennt + veraltete Stellen korrigiert
- **Vorschau-Projekt von GitHub getrennt** (`fb927de`): `aandd-photography-astro` (baute von `astro-umbau`)
  ist am 17.06. von GitHub getrennt → kein Auto-Build mehr, stillgelegt. CLAUDE.md + STATUS.md + FAHRPLAN.md
  (inkl. Phase-3-Punkt 7) angeglichen; Widerspruch „läuft als Spielwiese weiter" entfernt. Branch `astro-umbau` bleibt.
- **Veraltete Stellen korrigiert** (`<dieser Commit>`): IDEEN.md §4.1 „Aufräumen" auf „teilweise erledigt"
  (Wurzel-Cleanup `8ca1bee` + Tag `legacy-singlefile` vermerkt; offen bleibt: toter Code in `web/`, ungenutzte
  `/uploads`-Assets); ABNAHME.md §8 + §9 W5: „Formular sendet noch NICHT" → **sendet echt** (Web3Forms getestet).
- betroffene Dateien: CLAUDE.md, STATUS.md, FAHRPLAN.md, IDEEN.md, ABNAHME.md, CHANGELOG.md
- Commits: `fb927de` + dieser Eintrag

## 2026-06-17 20:20 — Cleanup: Pre-Cutover-Altlasten aus Repo-Wurzel entfernt
- **Sicherung zuerst:** annotierter Tag **`legacy-singlefile`** auf `140eb59` gesetzt (letzter Stand
  mit der alten Single-File `index.html`). ⚠️ Tag muss separat gepusht werden (`git push origin legacy-singlefile`).
- **Cleanup** (`8ca1bee`, 55 Dateien / 27.831 Zeilen): `index.html`, `admin/` (altes Sveltia),
  `build-indexes.js`, `content/`, Wurzel-`_headers`/`_redirects` (abgelöst durch `web/public/_headers`),
  `prototype-astro/`, Wurzel-`package-lock.json` (verwaist) entfernt. Cloudflare baut nur aus `web/`,
  diese Wurzeldateien wurden nicht mehr ausgeliefert. **`/uploads/` unangetastet (tragend).**
- read-only-Analyse vorab: keine funktionalen Verweise aus `web/` auf die Alt-Dateien (nur Kommentare).
- *Lokaler Rest:* ungetrackte Artefakte in `prototype-astro/` (generiert) bleiben auf der Platte;
  optional per `git clean -fd prototype-astro/` entfernbar (nicht Teil des Commits).
- betroffene Dateien: 8 Wurzel-Einträge gelöscht + STATUS.md + CHANGELOG.md
- Commit: `8ca1bee` (+ Tag `legacy-singlefile`, + dieser Doku-Eintrag)

## 2026-06-17 20:05 — Hero-Performance + Geräte-Politur-Stand
- **Hero-Perf** (`ccbad1d`): Hero-Bild war das LCP-Element, lud aber unpriorisiert. Jetzt
  `fetchPriority="high"` + `decoding="async"` am Hero-`<img>` (HomeHeroLive.tsx) und ein
  `<link rel="preload" as="image" fetchpriority="high">` im `<head>` (BaseLayout-Prop `preloadImage`,
  von index.astro + en/index.astro durchgereicht, gleicher `normalizePath` wie im `<img>`).
  Rein additiv; Format/WebP-Pipeline war nie das Problem (Hero ist bereits WebP, 742 KB). esbuild grün.
- **Geräte-Politur eingeordnet** (Doku): G3 (iPad-Hochformat) **gestrichen** (alles okay);
  G1 (iOS safe-area) **zurückgestellt** (kein konkreter Mangel, `viewport-fit=cover` risikoreich);
  G2 (Reisen quer am iPhone) **zurückgestellt, aber diagnostiziert** (Desktop-Layout in ~390px Höhe;
  Orientierung sperren auf iOS nicht möglich; Fix B = Mobil-Layout im Landscape erzwingen).
- betroffene Dateien: HomeHeroLive.tsx, BaseLayout.astro, index.astro, en/index.astro, MAENGEL.md, STATUS.md, CHANGELOG.md
- Commits: `ccbad1d` (+ dieser Doku-Eintrag)

## 2026-06-17 19:34 — Nacharbeits-Fixes K1 + K7 (K8 geparkt)
- **K1** (`3e04c92`): `web/src/data/about.json` — `display`-URL von `assets.tina.io` auf das lokale
  `/uploads/a7406523.jpg` umgebogen. Live unverändert (Rendering nutzt `original` + CSS-`crop`),
  entfernt aber die letzte tina.io-Laufzeitabhängigkeit in den Repo-Daten. JSON validiert.
- **K7** (`3c1a8a9`): `web/src/components/ContactContent.tsx` — Kontaktformular-A11y: Name/E-Mail/Nachricht
  bekommen `id` + verknüpftes `htmlFor` + `name` (Muster wie Consent-Häkchen), Name/E-Mail zusätzlich
  `autoComplete`. Versandpfad unangetastet (kein `<form>`, `onSend` baut den Body aus React-State).
  esbuild-Check grün. **Offen für David:** nach Push einmal in der Browser-Konsole gegenchecken.
- **K8** (`b115fcb`): englischer `<title>` auf der DE-Startseite **bewusst geparkt** (Wortlaut hängt an
  der offenen Namensentscheidung) — Code unverändert, in MAENGEL als ⏸️ markiert.
- **Doku** (`816b8f1`): MAENGEL K1/K7 als erledigt abgehakt.
- betroffene Dateien: about.json, ContactContent.tsx, MAENGEL.md, CHANGELOG.md
- Commits: `3e04c92`, `3c1a8a9`, `b115fcb`, `816b8f1` (+ dieser Eintrag)

## 2026-06-16 20:56 — Doku auf Post-Cutover-Stand gebracht
- Gesamte Projekt-Doku vom pre-Cutover-Zustand auf den aktuellen Stand aktualisiert.
- **CLAUDE.md** (`8bff270`): Faktenkorrektur (CMS=TinaCMS statt Sveltia, Stack=Astro in `web/`,
  Build=`npm run build`, Fonts lokal); „main=Sicherheitsnetz/astro-umbau=Umbau"-Rahmen → Post-Cutover-Realität.
  Beibehalten: Live-Wahrheit zuerst, isolierte Edits, Diff-vor-Commit, dt. Commits, manueller Push, Capability-Lock.
- **STATUS.md** (`01b2122`): als Post-Cutover-Momentaufnahme neu gefasst (Architektur live, Inventur portiert,
  Abschnitt „Offene Nacharbeiten/kein Blocker").
- **FAHRPLAN.md** (`80e9e50`): Cutover als vollzogen (Phase 1–3), Tina-Token-pro-Branch-Lehre (403 → main-Token).
- **MAENGEL.md** (`64558cf`): R2 erledigt (🔴-Blocker alle weg), K8 (EN-`<title>` DE-Home), Geräte-Politur G1–G3.
- betroffene Dateien: CLAUDE.md, STATUS.md, FAHRPLAN.md, MAENGEL.md, CHANGELOG.md (+ ggf. IDEEN/CAPABILITIES/ABNAHME)
- Commit: dieser Eintrag + `8bff270`, `01b2122`, `80e9e50`, `64558cf`

## 2026-06-16 19:34 — 🚀 CUTOVER LIVE: Astro+Tina auf main
- **`astro-umbau` → `main` gemergt + gepusht** (`64a8263`). Die alte Single-File-`index.html` ist abgelöst;
  live ist jetzt die Astro+TinaCMS-Version.
- Cloudflare-Live-Projekt `aandd-photography` baut von `main` (Root `web`, `npm run build`, Output `dist`),
  mit neuem `TINA_TOKEN` nur für `main`. Tina Cloud hat `main` indexiert.
- Live-Smoke-Test bestanden: robots.txt erlaubt Crawling, kein noindex-Meta, `/admin`-Login geht,
  Kontaktformular sendet → Mail kommt an. Live = exakt der astro-umbau-Stand.
- Vorschau-Projekt `aandd-photography-astro` läuft weiter von `astro-umbau` (`PUBLIC_PREVIEW_NOINDEX=true`).
- ⚠️ Lehre: `TINA_TOKEN` ist branch-gebunden — alter astro-umbau-Token gab 403 beim ersten main-Build;
  Lösung war ein neuer Token mit main-Berechtigung.
- Commit: `64a8263` (Merge)

## 2026-06-15 23:40 — Regler-Editor: Lese-Anker tiefer (0.42 → 0.58) [kein Re-Index]
- Wechsel weiterhin zu spät → Anker von 42% auf **58%** der Kastenhöhe → nächste Station wird aktiv, während
  die aktuelle noch klar sichtbar ist. Eine Zahl (`*0.58`): höher = später, tiefer = früher. Commit: `8af332d`

## 2026-06-15 23:34 — Regler-Editor: Lese-Anker in die Mitte (~42%) — aktive Station nicht mehr zu spät [kein Re-Index]
- Anker lag bei 64px (zu weit oben) → die nächste Station wurde erst aktiv, wenn ihre Oberkante fast ganz oben
  war; die vorherige war da schon fast raus. Jetzt `anchor = boxTop + clientHeight*0.42` → die nächste schaltet
  früher frei, solange die aktuelle noch gut sichtbar ist. Reines UI. Commit: `91bf88f`

## 2026-06-15 23:26 — Regler-Editor: kompakte Vorschau-Karten (Spotlight reagiert, Schatten sichtbar) [kein Re-Index]
- Wurzel beider Restprobleme: **Karten zu groß** → Schatten clippte trotz Abstand UND man musste fast eine
  ganze Karte scrollen, bis die nächste aktiv wurde (wirkte wie „Station 1 fix").
- Fix: **Foto klein (50px statt 16:10) + kleinere Texte** → kurze Karten → mehrere Stationen mit Schatten
  gleichzeitig sichtbar, Spotlight wechselt beim Scrollen reagierend. **Innenabstand 16/34/44** (34px seitlich
  > Schatten-Radius) → Ring + Schatten ringsum nicht mehr abgeschnitten. Reines UI. Commit: `3a77f70`

## 2026-06-15 23:14 — Regler-Editor: Vorschau-Frame nicht mehr abgeschnitten + Scroll-Spy wirkt [kein Re-Index]
- **Frame abgeschnitten:** der Scroll-Container clippte (Overflow clippt auch x/oben) den Karten-Ring/-Schatten
  links/rechts/oben. Fix: Innenabstand `10px 26px 16px` → Rahmen + Schatten haben Platz.
- **Spotlight blieb auf Station 1:** `onPreviewScroll` nutzte `offsetTop` (falscher Bezug). Jetzt
  `getBoundingClientRect`-Anker (Viewport-Linie `boxTop+64`) → aktive Station folgt dem Scrollen wie live.
- Reines UI (`TripDesignsEditor`), kein Schema/Re-Index. Commit: `cd2630d`

## 2026-06-15 23:02 — Regler-Editor: Rahmen rendern im CMS + Spotlight-Scroll wie live [kein Re-Index]
- **Bug 1 (Rahmen unsichtbar außer luftig):** Tina-`/admin` lädt die Site-`global.css` nicht → `--c-line`
  undefiniert → Ring `0 0 0 2px var(--c-line)` (soft/strong) ungültig. Fix: WW-Farben (`--c-line`/`--c-bg-alt`/
  `--c-bg`/`--c-ink`/`--c-accent`) als Literale am Vorschau-Wrapper → none/soft/strong/luftig-Rahmen rendern korrekt.
- **Bug 2 (Vorschau statisch):** jetzt **Spotlight-Scroll wie live** — aktive Station folgt dem Scrollen
  (Lese-Anker oben, `onScroll` + Station-Refs), gedimmte Nachbarn wie auf der echten Seite.
- Reines UI (`TripDesignsEditor`), kein Schema/Re-Index. Commit: `60edb3a`

## 2026-06-15 22:48 — Regler-Editor: Live-Vorschau scrollbar (5 Beispiel-Stationen) [kein Re-Index]
- Vorschau im Editor jetzt scrollbarer Kasten mit 5 Beispiel-Stationen (1 aktiv mit Foto, 4 gedimmt) →
  Frame/Dimmung/Luft/Titel/Foto-Schatten über mehrere Stationen sichtbar + scrollbar. Reines UI (`b8ab1f0`).
- **Hinweis zur Nutzer-Frage „warum sind none/soft/strong identisch?":** Die 5 Regler (Dimmung/Luft/Titel/
  Inaktiv-Größe/Foto-Schatten) waren in den Originalen nie zwischen none/soft/strong verschieden — der EINZIGE
  Unterschied dieser drei ist der **Rahmen** (Ring+Schatten: none=keiner, soft=1px, strong=2px), der als fester
  „Character" (Code) je Vorlage faithfully übernommen ist und in der Vorschau beim Tab-Wechsel sichtbar wird.
  luftig ändert zusätzlich die Regler-Werte. (Optionale Erweiterung: Rahmen als 2 weitere Regler editierbar → Schema/Re-Index.)

## 2026-06-15 22:35 — Reisen-Design: Editor-Overflow-Fix + Design ZENTRAL (statt pro Reise) [SCHEMA → Re-Index]
- **Editor-Fix (`a469eb5`, kein Schema):** Regler-Editor war zweispaltig (Regler | 220px-Vorschau) und lief im
  schmalen CMS-Panel rechts raus (Slider abgeschnitten, Live-Vorschau außerhalb der Anzeige). Jetzt **einspaltig**:
  Regler oben (volle Breite), Live-Vorschau darunter (max 380px) → nichts läuft mehr raus, Vorschau sichtbar.
- **Design zentral (`74ebfff`, Schema):** Nutzer wünscht einheitlichen Stil ohne pro-Reise-Unterschied. Pro-Reise-
  Feld `design` **entfernt**; neues **zentrales** Feld `design` in `reisen_settings` („Design für alle Reisen") →
  gilt einheitlich für ALLE Reisen. `[slug].astro` (DE+EN): `resolveTripDesign(s.design)`. `trips-settings.json`:
  `"design": "strong"` (Default = byte-gleich). tina-lock `98e456f` (2× deterministisch).
- **⚠️ Noch EIN Re-Index** (für die zentrale Design-Umstellung, strukturell). Verifiziert: `reisen_settings.design`
  abfragbar; alaska/west/florida alle `data-trip-design="strong"` (einheitlich); Build grün (42 Seiten);
  `global.css`/andere Seiten unberührt.
- Commits: `a469eb5`, `74ebfff`

## 2026-06-15 22:09 — Reisen-Design-Schritt 3: Merge in Einstellungen + Regler-Editor + Cleanup [SCHEMA → Re-Index]
- **3a — Merge (`1eaf588`) [Schema]:** Design-Werte als Objekt `designs` (none/soft/strong/luftig) in die
  `reisen_settings`-Collection (`trips-settings.json`) verschoben → **eine** CMS-Seite statt zwei (Nutzer-Wunsch).
  `reisen_designs`-Collection + `src/data/trip-designs.json` **entfernt**. `[slug].astro` (DE+EN):
  `tripDesignsCss(mergeTuning(s.designs))`. Werte 1:1 übernommen; strong byte-gleich. tina-lock `e8c9449`.
- **3b — Regler-Editor (`2ce04bd`) [nur UI]:** `web/tina/fields/TripDesignsEditor.tsx` als `ui.component` auf dem
  `designs`-Objekt: Design-Umschalter + Slider (Dimmung/Luft/Titelgröße/Inaktiv-Größe/Foto-Schatten) + **Live-
  Vorschau im Feld** (zwei Beispiel-Stationskarten via `designToVars`, kein iframe → Safari-sicher). tina-lock
  `5af5c89` (nur `"ui":{}`-Marker, keine Feld-/Typ-Änderung).
- **Cleanup (`f76c5fb`):** verwaiste `TripsContent.tsx` entfernt (wird nirgends importiert; `/trips/<slug>` =
  TripTimeline). Build grün.
- **⚠️ EIN Re-Index** nötig (für 3a, strukturell — Felder von `reisen_designs` → `reisen_settings`, Collection
  weg). Deckt 3b/Cleanup mit ab. Verifiziert: Build grün (42 Seiten), strong byte-gleich, `global.css`/andere
  Seiten unberührt. Editor-Verhalten im CMS bitte nach Re-Index gegenprüfen.
- Commits: `1eaf588`, `2ce04bd`, `f76c5fb`

## 2026-06-15 21:53 — Reisen-Detail: höhenadaptive Aktivierung (kurze Stationen früher) — Punkt 2
- **Symptom (Nutzer):** bei kurzen Stationen schaltet der Fokus „ein Ticken zu spät" zur nächsten — die
  Aktivierung hing an der Block-Oberkante + festem Anker, kurze Blöcke waren schon fast unter dem Kopf.
- **Fix (smart, kein Regler):** Aktivierungspunkt je Block um einen höhenabhängigen **Lead** vorziehen.
  `READ = (vh − Sticky-Stapel)·READ_FRACTION`; `lead = max(0, READ − h)·LEAD_FACTOR`. Kurze Station (h<READ)
  → früher aktiv; lange (h≥READ) → **lead 0 = exakt wie bisher** (kein Regressionsrisiko). Höhen aus dem
  `measure()`-Cache. Faktoren intern (`READ_FRACTION 0.5`, `LEAD_FACTOR 0.55`) zum Nachjustieren. Safari-sicher.
- Build grün (42 Seiten). Kein Schema, kein Re-Index. Datei: `web/src/components/TripTimeline.tsx`. Commit: `53c3f71`

## 2026-06-15 21:12 — CMS-Klarheit: Darstellung-Beschreibung + Designs-Collection ohne /trips-Router (KEIN Re-Index)
- Nutzer-Feedback nach Re-Index: (1) „Reisen – Designs" wirkte wie die Einstellungsseite, (2) die globale
  „Bild-Rahmen & Schatten"-Beschreibung nannte noch „Stationen", obwohl Reisen abgekapselt sind.
- **Fix 1:** `reisen_designs` ohne `router` (vorher `() => '/trips'`, kollidierte mit `reisen_settings` → „Seite
  bearbeiten" auf /trips öffnete die **Einstellungen**, nicht die Designs). Die Designs-Collection wird jetzt
  klar über die **CMS-Seitenleiste** geöffnet (Live-Vorschau kommt in Schritt 3 im Feld selbst).
- **Fix 2:** globale `appearance.image_frame`-Beschreibung korrigiert — gilt **nicht** mehr für Reise-Stationen
  (eigenes Design seit Schritt 1); nur noch Karten/Kacheln/Fotos/Reise-Übersicht/Reise-Karte/Buttons.
- **Kein Re-Index:** tina-lock neu (`1c67497`, 2× deterministisch), Diff ist **nur** der Beschreibungstext —
  KEINE Feld-/Typ-Änderung. Build grün (42 Seiten). Push reicht (Cloudflare baut `/admin` neu).
- Datei: `web/tina/config.ts`, `web/tina/tina-lock.json`. Commit: `a813355`

## 2026-06-15 20:41 — Reisen-Design-Schritt 2: zentrale Werte + pro-Reise-Dropdown [SCHEMA → Re-Index]
- **Modell:** 4 zentrale Vorlagen (none/soft/strong/luftig); pro Reise nur **Auswahl** (Default strong =
  byte-gleich). Werte zentral pflegbar → Änderung wirkt global auf alle Reisen mit diesem Design.
- **2a (`db0e2fd`):** `lib/tripDesigns.ts` trennt **CHARACTER** (fest, Code: ring/shadow/cardBg) von **TUNING**
  (zentral editierbar: dimOp/gap/titlePx/scale/photoShadow). `photoShadowCss(stärke)` geeicht (40 = luftig-Wert
  `0 16px 42px -13px rgba(46,36,24,0.42)`). `mergeTuning(cms)` legt die CMS-Datei über die Defaults (fehlend →
  byte-gleich). Neue zentrale Datei `src/data/trip-designs.json` (4 Designs, Defaults befüllt) + neue Tina-
  Collection **`reisen_designs`** (Zahlenfelder). `[slug].astro` (DE+EN): `<style>` aus `tripDesignsCss(mergeTuning(…))`.
- **2b (`78c46b7`):** pro-Reise-Feld **`design`** (Dropdown none/soft/strong/luftig) in der `reisen`-Collection.
  Leer → strong. Wirkt nur auf die Stationen dieser Reise (Entkopplung aus Schritt 1).
- **tina-lock** deterministisch neu, je 2× unabhängig verifiziert: 2a `c36aac6`, 2b `0a923a3`.
- **⚠️ SCHEMA-Änderung (2 neue Schema-Teile) → nach Push Tina-Cloud-Re-Index nötig** (sonst Cloudflare-Build
  „local schema doesn't match remote").
- **Verifiziert (lokaler Build, 42 Seiten):** strong-Block byte-gleich; luftig-Block exakt aus der Datei;
  `design` per GraphQL abfragbar (alle Reisen null → strong); alaska2026 `data-trip-design="strong"`.
  `global.css` unberührt, keine anderen Seiten. **Hinweis:** strong setzt dim/scale jetzt explizit (= heutige
  Werte) → der globale `spotlight_strength`-Regler wird für Reisen vom per-Design-Wert abgelöst.
- **Offen (nach Re-Index, eigener Commit, KEIN Re-Index):** Schritt 3 = Regler-Editor (`ui.component`) auf
  `reisen_designs` mit Live-Vorschau.
- Dateien: `web/src/lib/tripDesigns.ts`, `web/src/data/trip-designs.json`, `web/tina/config.ts`,
  `web/src/pages/trips/[slug].astro`, `web/src/pages/en/trips/[slug].astro`, `web/tina/tina-lock.json`.
- Commits: `db0e2fd`, `78c46b7`

## 2026-06-15 20:11 — Reisen-Detail: Fortschritts-Füllung an aktiven Punkt koppeln (keine Vorfüllung beim Laden)
- **Problem (Nutzer):** Beim Laden war der erste Punkt schon ~⅓ „abgegrast". Ursache: `--fill` hing an der
  festen Anker-Linie (oberes Drittel) → `anker − ersterPunkt` beim Laden > 0; wuchs zudem mit der Fensterhöhe.
- **Fix (= „B"):** `--fill = centers[aktiv] − centers[0]` (an den **aktiven** Stations-Punkt gekoppelt). Beim
  Laden ist aktiv = Station 0 → Füllung **garantiert 0 auf jeder Fensterhöhe**; wächst beim Scrollen mit der
  aktiven Station; weiches stationsweises Wachsen via `transition: height 450ms` (reduced-motion schaltet ab).
- **Verifiziert (astro preview):** `--fill` = 0 bei vh 797 **und** vh 1200; Linie unter Punkt 1 komplett grau.
  Build grün (42 Seiten). Kein Schema, kein Re-Index. (Timeline-Schritt 2 hatte den Effekt auf 797 schon
  beseitigt; dieser Fix macht es **monitor-unabhängig** bulletproof.)
- Dateien: `web/src/components/TripTimeline.tsx`, `web/src/styles/trips-timeline.css`. Commit: `d807bc8`

## 2026-06-15 19:50 — Reisen-Detail: Kopf schrumpft beim Scrollen (nur Titel sticky, Summary scrollt weg)
- **Weg A (Safari-sicher):** reines `position: sticky` + Layout, **kein** Scroll-API, **kein Sprung**.
- Kopf in JSX aufgeteilt: schlanke **Titelleiste** (`.tl-head` = Meta + Titel) bleibt sticky; **Zusammenfassung**
  (+ Album-Link) in neuem nicht-klebendem **`.tl-intro`**-Block (Grid-Zeile 2). `.tl-stage` Grid →
  `grid-template-rows: auto auto 1fr` (Titel/Intro/Liste); Karte spannt 1/-1; `.tl-list` → Zeile 3; mobil
  `.tl-intro order:1`.
- Beim Lesen scrollt die Summary natürlich unter die **deckende** Titelleiste (bg + z4) und verschwindet →
  Titelleiste schrumpft auf **~61px** → Stationen sitzen beim Lesen **~19 %** statt ~32 %.
- **Weiche Kopf-Unterkante (`.tl-head::after`) nur beim Scrollen** (Klasse `.is-scrolled` via `update()`, `sy>8`,
  weiches `opacity`-Fade) → beim Laden wird die **erste Summary-Zeile nicht mehr ausgewaschen**. Reiner
  Klassen-Toggle (kein Scroll-API → Safari-sicher).
- **Load-Zustand unverändert** (Summary sichtbar, erster Punkt ~40 %) — so gewollt; Schritt 2 verbessert nur das
  **Lesen beim Scrollen**.
- Verifiziert (lokaler Tina-Build + astro preview): Titelleiste 61px sticky, saubere Summary, `--ww-snap-pad` =
  Nav+61px, Fade-Gating `::after` 0→1 bei `.is-scrolled`, Mobil-Ordering korrekt, luftig verträgt sich. Build grün
  (42 Seiten). Kein Schema, kein Re-Index. **Echter Scroll** (Tool blockiert programmatischen Scroll) → Nutzer live.
- Dateien: `web/src/components/TripTimeline.tsx`, `web/src/styles/trips-timeline.css`. Commit: `e3ab787`

## 2026-06-15 19:21 — Reisen-Detail: Vorspann straffen (erster Punkt ~44% → ~39% Höhe)
- **Diagnose Punkt 1 (gemeinsam mit Nutzer, Live-Wahrheit):** Die Fortschrittslinie ist **kein Bug** — sie
  beginnt rechnerisch korrekt am ersten Punkt (`--line-top` = erste Punkt-Mitte, `--fill` beim Laden nur ~34px).
  Der erste Stations-Punkt sitzt aber auf ~**44 %** der Bildschirmhöhe (Nutzer-Messung vh 797: firstDot 348px),
  weil der **Kopf** (Nav + Titel + 3-zeilige Zusammenfassung + Abstände) den oberen Bereich füllt → wirkt „mittig".
- **Fix (Layout, nur tote Luft, KEIN Inhalt entfernt):** `.tl-list` padding-top `4vh→2vh`; Section padding-top
  `20→8px` (DE+EN); `.trip-back` margin-bottom `14→6px`; `.tl-head` padding `4px 0 6px → 0 0 4px`; `.tl-summary`
  margin-top `4→2px`.
- **Gemessen (vh 797):** erster Punkt 348px (44 %) → **308px (39 %)**. Reine Tot-Luft bringt ~5 Prozentpunkte;
  die restliche Höhe steckt im Kopf-Inhalt → kommt über **Schritt 2** (Summary scrollt weg, Lesen bei ~18 %).
- **Luftig-Kompatibilität live geprüft:** stimmig — Trim wirkt über Station 1, luftig zwischen den Stationen,
  kein Konflikt. Build grün (42 Seiten). Kein Schema, kein Re-Index.
- Dateien: `web/src/styles/trips-timeline.css`, `web/src/pages/trips/[slug].astro`, `web/src/pages/en/trips/[slug].astro`.
- Commit: `48495dd`

## 2026-06-15 18:27 — Fix (Schritt 1): luftig-Karten-Schatten gültig (kein „none" in box-shadow-Liste)
- Beim End-to-End-Test (data-trip-design testweise auf „luftig") fiel auf: `--ww-trip-shadow: none` landet
  in der **Komma-Liste** `box-shadow: var(--ww-trip-ring,…), var(--ww-trip-shadow,…)` → `… , none` ist als
  Listeneintrag **ungültig** → der ganze box-shadow wird verworfen (luftig blieb optisch beim Strong-Schatten).
- Fix: `luftig.shadow` = `0 0 0 0 transparent` (gültige transparente Null-Ebene) statt `none`. Verifiziert
  (astro preview): luftig-Karte computed `rgba(0,0,0,0) 0 0 0 0, rgba(0,0,0,0) 0 0 0 0` + Füllung transparent
  (kein Kasten), Hero-Foto-Schatten `0 16px 42px -13px rgba(46,36,24,0.42)`, Map-Schatten unverändert. `strong`
  weiterhin byte-gleich. (photoShadow steht in einem Einzel-box-shadow → dort wäre `none` ok.)
- Datei: `web/src/lib/tripDesigns.ts`. Build grün (42 Seiten). Kein Schema, kein Re-Index.
- Commit: `4ff02d3`

## 2026-06-15 18:23 — Reisen-Design Schritt 1: Entkopplung (--ww-trip-* + data-trip-design)
- **Ziel-Modell** (in 3 Schritten): 4 zentrale Design-Vorlagen (none/soft/strong/luftig); pro Reise wird
  per Dropdown nur ausgewählt; Werte zentral pflegbar (Regler kommt in Schritt 3). **Dies ist Schritt 1:
  Entkopplung — rein additiv, kein Schema, kein Re-Index, allein deploybar.**
- **Neue geteilte Quelle** `web/src/lib/tripDesigns.ts`: `TRIP_DESIGN_DEFAULTS` (4 Vorlagen) + `designToVars`
  + `tripDesignsCss` + `resolveTripDesign`. EINE Quelle für den pro-Seite emittierten `<style>` UND später
  das Regler-Feld → **kein Drift**.
- **Stationskarte** liest jetzt reise-eigene Tokens mit Fallback auf die globalen:
  `box-shadow: var(--ww-trip-ring, var(--ww-ring)), var(--ww-trip-shadow, var(--ww-shadow))` — ebenso
  `--ww-trip-card-bg`, `--ww-trip-photo-shadow` (Hero **und** Thumb), `--ww-trip-gap`, `--ww-trip-title`,
  `--ww-trip-dim-op`, `--ww-trip-scale`. **none/soft/strong = exakt die heutigen Werte**; dim/scale dort
  NICHT überschrieben → globaler Spotlight-Regler bleibt wirksam. **luftig** = neue Vorlage (Startwerte:
  kein Ring/Schatten, schwebendes Foto `0 16px 42px -13px rgba(46,36,24,.42)`, Luft 50px, Titel 26px,
  dim 0.15, scale 0.80) — vorerst ungenutzt.
- **`[slug].astro` (DE+EN):** emittiert die 4 Design-Blöcke als gescopter `<style>` aus der Quelle und setzt
  `data-trip-design` auf `.tl-proto`. **Schritt 1: noch KEIN CMS-Feld → resolveTripDesign(undefined)='strong'.**
- **Karte (`.map-box`) bewusst auf den globalen Tokens** belassen (site-konsistent); nur Stations-Karten + Foto neu skinnbar.
- **Capability-Lock bewiesen:** `global.css` **unberührt**; keine andere Seite geändert → Portfolio/Alben/
  Stories/Statistik/Buttons lesen byte-identisch weiter die `<body>`-Tokens. Live-Computed (astro preview):
  aktive Karte `rgb(216,202,178) 0 0 0 2px, rgba(46,36,24,0.5) 0 18px 40px -12px` (= heutige Strong-Werte),
  Füllung `#ebe1d1`, `data-trip-design=strong`. Build grün (42 Seiten). **Kein Re-Index.**
- **IDEEN.md:** neuer offener Punkt Z1 — Design-/Regler-System später auch global (Portfolio/Alben/Stories)
  ausweiten; Reglersystem technisch wiederverwendbar bauen; großer Blast-Radius → eigenes Testing. Kein Cutover-Blocker.
- Dateien: `web/src/lib/tripDesigns.ts` (neu), `web/src/styles/trips-timeline.css`,
  `web/src/components/TripTimeline.tsx`, `web/src/pages/trips/[slug].astro`, `web/src/pages/en/trips/[slug].astro`, `IDEEN.md`.
- Commit: `eef7e19` (Doku separat)

## 2026-06-14 20:23 — Reisen: Ecke Station|Kopf|Karte smooth (Schicht-Layout + weiche Lücken-Unterkante)
- Anschluss an `00db05b`: die Ecke, wo **Station (links)**, **Reise-Kopf (oben)** und **Karte (rechts)**
  zusammentreffen, sah „hakelig" aus — die weiche Kopf-Unterkante (`::after`) reichte nur über die Textspalte,
  in der **36px-Lücke** daneben endete die Deckfläche (`::before`) mit **harter Unterkante** → sichtbarer Knick.
- **Fix 1 (Schicht-Layout wie vom Nutzer beschrieben):** `.tl-head::before` läuft jetzt als durchgehende
  Deck-Ebene **bis unter die Karte** (`width: calc(36px + 420px)`). Map liegt mit `z-index:5` darüber, ihr
  Schatten bleibt **über** der Deckfläche (Tiles opak → Deckfläche unter der Karte unsichtbar, aber robust).
- **Fix 2 (Ecke smooth):** `.tl-head::after` (weiche Unterkante) reicht jetzt über Textspalte **und** Lücke
  bis zur Karten-Kante (`right:-36px`) → der Deckrand läuft an der Ecke durchgehend weich aus statt auf die
  harte `::before`-Unterkante zu treffen.
- Höhe der Unterkante unverändert (`min(28px,3.4vh)` < 4vh) → CMS-Rahmen der ruhenden ersten Station wird
  **nicht** ausgewaschen. Live verifiziert (lokaler Tina-Build + astro preview): scrollY=0 erste Station mit
  vollem CMS-Rahmen; Mid-Transition (Denali aktiv, Anchorage taucht weich unter den Kopf) ohne harten Übergang;
  Map-Schatten über der Deckfläche. Build grün (42 Seiten). Kein Schema-Change.
- Dateien: `web/src/styles/trips-timeline.css`. Commit: `31070ea`

## 2026-06-13 — Reisen: Kopf deckt Spalten-Lücke rechts (Stations-Überstand verschwindet)
- Kern des „rechts lugt der Rahmen raus": der **2px-Ring + Schatten** der aktiven Station ragen ~28px über die
  Spaltenkante (750) in die **36px-Lücke** zur Karte (bis ~778) — dort, wo der Kopf endet, also unverdeckt.
- Lösung (Idee „Textfeld breiter"): Kopf deckt die Lücke rechts mit ab (`.tl-head::before`, 34px ab Kopf-
  Rechtskante, z4-Kontext) → der Überstand verschwindet auf Kopfhöhe **auch rechts** hinter der Überschrift.
  Damit der **Schatten der Karte (Map)** nicht mitverdeckt wird (das frühere Problem beim Kopf-Verbreitern):
  `.tl-map z-index: 5` → Map + ihr Schatten liegen **über** der Kopf-Deckfläche. Mobil aus (Kopf nicht sticky).
- Stationen + CMS-Rahmen unverändert. Erste Station + Map-Schatten live verifiziert. Build grün (42 Seiten).
- Commit: `00db05b`

## 2026-06-13 — Reisen: Rahmen zurück (CMS-Design) + kurze weiche Kopf-Unterkante
- **Rückbau:** der weiche Rahmen (`b80d027`) sah aus wie „kein Rahmen" → zurück auf exaktes CMS-Design
  (`var(--ww-ring), var(--ww-shadow)`, `ba54e70`). Meine Untertauch-Experimente (großes `head::after` + 84px
  padding-top) entfernt → Stationen wieder wie zuvor (`3099bfb`). Lade-Flacker-Fix + z-Index-Rahmenfix bleiben.
- **Erkenntnis (verifiziert):** der Kopf deckt auf seiner Höhe die ganze Spalte ab — **auch rechts** (`elementFromPoint`
  x730 = `tl-head`). Es „fliegt" also nichts durch den Kopf; sichtbar ist nur Inhalt **unter** der Kopf-Unterkante.
  Der harte Übergang dort (rechts, ohne Text) war das eigentliche Thema.
- **Fix (Nutzer-Wahl):** kurze **weiche Kopf-Unterkante** (`.tl-head::after`, volle Spaltenbreite, `min(28px,3.4vh)`,
  `32afdfc`) → Inhalt taucht weich unter die Überschrift. Höhe immer < 4vh (Abstand der ruhenden ersten Station)
  → CMS-Rahmen wird **nicht** ausgewaschen (live verifiziert: voller 2px-Ring + Schatten). Mobil ausgeblendet.
- Dateien: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commits: `ba54e70`, `3099bfb`, `32afdfc`

## 2026-06-13 — Reisen: weicher Rahmen der aktiven Karte (kein „Durchfliegen" der Ring-Kante)
- Das „Durchfliegen rechts" beim Hochscrollen war die **harte 1–2px-Ring-Linie** (`var(--ww-ring)`) der aktiven
  Karte — die weiche Kopf-Unterkante fadet nur die *waagerechte* Oberkante, nicht die *senkrechten* Ring-Kanten.
  (Kopf deckt die Karte voll ab, x=750 = x=750 → kein Coverage-Bug.)
- Lösung (Nutzer-Wunsch „bündig mit der weichen Kopfkante"): aktive Karte bekommt einen **weichen Rahmen** —
  gefederte, halbtransparente Kante (1px @0.38) + dezenter Schein (6px @0.22) + Schatten — statt der harten Linie.
  Rahmen bleibt erkennbar, gleitet aber ohne harte Kante unter die weiche Kopfkante. (Variante „ganze Karte
  ausblenden" hätte hohe Bild-Karten zu früh ausgeblendet → nicht bündig.)
- Datei: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `b80d027`

## 2026-06-13 — Reisen: kein Reveal-Flackern beim Laden
- Beim Neuladen flackerte die erste (bereits sichtbare, serverseitig gerenderte) Station — die Reveal-Animation
  startete sie von opacity 0, der Rahmen wirkte kurz „buggy", bis ein Scroll/Repaint kam.
- Fix: der IntersectionObserver beobachtet nur noch **off-screen**-Stationen; beim Laden sichtbare bleiben direkt
  sichtbar (kein Reveal von 0). Live verifiziert: erste Station sofort voll gerahmt.
- Datei: `web/src/components/TripTimeline.tsx`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `cb94879`

## 2026-06-13 — Reisen: weicher Untertauch-Übergang auf allen Kanten (auch rechts)
- Der harte Übergang beim Hochscrollen war nicht nur unten, sondern auch an der **rechten Kante** der Karte
  (Ring „fliegt" hart durch die Überschrift). Lösung: **weiche Kopf-Unterkante** (`.tl-head::after`, volle
  Spaltenbreite, 64px, z4 über der aktiven Karte z3) → die ganze Kartenoberkante (Ring/Bild/rechte Ecke)
  verblasst beim Untertauchen gleichmäßig statt mit hartem Schnitt. Endet an der Spalte (berührt die Karte nicht).
- Damit die **ruhende** erste Station nicht von dieser weichen Kante ausgewaschen wird: `padding-top: 84px`
  (erste Station sitzt knapp darunter, ~an der Fokus-Position). Live verifiziert (voller Rahmen bei scrollY=0).
  Aktive Karte bleibt z3 über den Fades (z2); zwischenzeitlicher 30px-`::after` (Commit `653e78d`) ersetzt.
- Datei: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `124151c`

## 2026-06-13 — Reisen: aktive Karte über die Fades (Rahmen nicht mehr ausgewaschen)
- Ursache der „buggy" Rahmen (erste Station oben nicht gefüllt; letzte Station: Ring hört auf + Schatten
  darunter; Inhalt schimmert beim Scrollen rechts neben dem Text): die **Fade-Overlays** (`.tl-fade-top/bottom`,
  z-index 3) lagen **über** der aktiven Karte und wuschen Ring + Füllung aus, während der Box-Schatten außerhalb
  blieb → wirkte abgehackt.
- Fix: Fades → z-index **2**, aktive Karte (`.is-active .tl-body`) → `position:relative; z-index:3`. Aktive Karte
  liegt damit **über** den Fades (immer sauberer, voller Rahmen), aber weiter **unter** dem Kopf (z4 → sauberer
  Schnitt beim Hochscrollen). Gedimmte Nachbarn faden weiter weich. Erste Station **live verifiziert** (`astro
  preview`): voller Rahmen bei scrollY=0.
- Datei: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `6ae8eaa`

## 2026-06-13 — Reisen: Revert Kopf-::before + weicheres Timeline-Ende (live verifiziert)
- **Revert `23837a2` (`9288e1a`):** die `::before`-Abdeckfläche schnitt den Karten-Schatten ab und erzeugte
  selbst eine harte Kante/„zu große Box". Kopf zurück auf box-shadow-nur-nach-oben (berührt die Karte nie).
  Per **Live-Vorschau** (`astro preview`, 1280 + 980px) verifiziert: der Kopf (z4, deckend, volle Spaltenbreite)
  überdeckt hochscrollende Titelbilder vollständig — kein Durchschimmern. Das gemeldete Durchschimmern kam
  von der `::before`-Box selbst.
- **Weicheres Ende (`1ed2fa2`):** „harter Cut" der letzten Station = die gerahmte aktive Karte schwebte über
  dem großen 42vh-Trailing-Leerraum. Auf **30vh** reduziert → letzte Station bleibt lesbar, der weiche
  Papierriss-Footer schließt direkt darunter an. Live verifiziert.
- Dateien: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commits: `9288e1a`, `1ed2fa2`

## 2026-06-13 — CMS-Vorschau: Button „Zum Reisemenü" (statt Stationen-Liste)
- Der Vorschau-Button zeigte auf `stops` → öffnete die verschachtelte Stationen-Liste, nicht das
  Reise-**Hauptformular**. Jetzt auf `title` (oberste Reise-Ebene) → landet im Haupt-Formular der Reise
  („Du bist hier: Reisen – Reise"), von dort zu den Stationen scrollen. Umbenannt **„↩ Zum Reisemenü"**
  (+ Hinweistext): zurück ins Hauptmenü der Reise, nicht „Station hinzufügen".
- Datei: `web/src/components/TripTimeline.tsx`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `35c6948`

## 2026-06-13 — Reisen-Timeline: weicherer Auslauf am Ende
- Beim Ganz-nach-unten-Scrollen endete die letzte Station mit hartem Cut. Bottom-Fade von 56px → 120px
  erhöht + mehrstufiger weicher Verlauf (statt hartem 2-Stop) → sanfter Auslauf.
- Datei: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `eacf5b1`

## 2026-06-13 — Reisen: sticky Kopf deckt rechts neben dem Text ab
- Rechts neben dem Kopf-Text (zur Karte hin) schimmerte beim Hochscrollen das Titelbild durch — der
  Kopf-Hintergrund deckte dort nicht. Deckende `::before`-Fläche unter dem Kopf: volle Spaltenbreite +
  nach oben (Lücke zur Nav) + 30px in die Spalten-Lücke zur Karte (bleibt in der 36px-Lücke, deckt die
  Karte nicht). Ersetzt den bisherigen Upward-`box-shadow`.
- Datei: `web/src/styles/trips-timeline.css`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `23837a2`

## 2026-06-13 — CMS-Vorschau: Button-Link-Fix + Karten-Abstand
- **„+ Station/sortieren"-Link gefixt (`d556387`):** Button trug `data-tina-field` für `stops_manager` —
  das in der 2-in-1-Umstellung entfernte Feld → Tina sprang generisch zur Collection („Reisen.Reise") statt
  zur Reise. Jetzt auf `stops` → öffnet die native Stationen-Liste **genau dieser Reise** (add/sortieren).
- **Karten-Abstand (`96e595f`):** Karte klebte ~8px unter der Nav → neue Variable `--ww-map-gap` (16px) gibt
  Luft; sticky Chips-Leiste zieht mit.
- Build grün (42 Seiten). Kein Schema-Change.
- Commits: `d556387`, `96e595f`

## 2026-06-13 — Reisen-Karte: Flug-Rauszoom erst an der Ankunft
- `mapFollow` zoomte raus, sobald die aktive **oder die nächste** Etappe ein Flug war (`depFlight`) → es
  zoomte schon beim Hinfahren zur **Abflugstation** (z. B. Lake Tahoe) heraus, die Station war nicht mehr
  gut sichtbar. Jetzt nur noch an der Flug-**Ankunft** (`arrFlight`): Rauszoom erst beim Flug Tahoe→Anchorage,
  der Abflug-Stop bleibt normal herangezoomt. Smooth (Flug-Animation wartet ohnehin ~700 ms auf den Zoom).
- Datei: `web/src/components/TripTimeline.tsx`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `9696f44`

## 2026-06-13 — CMS: 2-in-1 Stationen-Liste + sticky Chips-Leiste + Anreise-Emojis
- **Stationsleiste fix unter der Karte (`9a1d9ef`):** Chips waren im normalen Fluss → scrollten weg. Jetzt
  eigene **sticky**-Position direkt unter der Karte (`top = sticky-top + --ww-map-h`), Höhen-Deckel + Scroll
  bei vielen Stationen; mobil kompakte 1-Zeilen-Scrollleiste in der sticky Karten-Spalte.
- **2-in-1 (`24592bb`):** Separates Feld „Stationen schnell verwalten" (StopsManager) **entfernt**. Stattdessen
  zeigt die **native** „Stationen"-Liste die Anreise **diskret in jeder Zeile** (itemProps: ✈️/🚗 + Name
  [+ „· Zwischenstopp"]). Zusätzlich **Emojis in der Anreise-Auswahl** („🚗 Fahrt" / „✈️ Flug").
  `StopsManager.tsx` gelöscht. `tina-lock` deterministisch neu (`7e1ce5c6`, 2× verifiziert).
- **⚠️ David:** Schema-Änderung → nach Push **Tina-Cloud-Re-Index**. Build grün (42 Seiten).
- Commits: `9a1d9ef`, `24592bb`

## 2026-06-13 — CMS-Vorschau: Stationsleiste unter der Karte
- Beendet den „Hin-und-her-Tanz" beim Reise-Bauen. **Nur im Tina-Vorschau-Iframe** sichtbar
  (`window.self !== window.top`) → Besucher/Live unverändert, **kein Schema-Change, kein Re-Index**.
- **Chips** in Reisereihenfolge unter der Karte: Klick = genau diese Station bearbeiten (fokussiert das
  Feld im Formular über `data-tina-field`/`open` + scrollt die Vorschau dorthin). Aktiver Chip hervorgehoben,
  ✈/🚗-Symbol, Zwischenstopp gestrichelt.
- **„+ Station / sortieren"** trägt `data-tina-field` des `stops_manager` → springt in **einem Klick** zum
  flachen Manager (hinzufügen/ziehen/löschen), ohne Scrollen.
- **Belegte Grenze:** Add/Move/Delete **direkt** in der Vorschau ist mit Tina unmöglich — das
  Vorschau→Editor-Protokoll kennt nur `open`/`close`/`isEditMode` (kein Mutations-Kanal). Daher laufen die
  Änderungen stabil über den Manager, 1 Klick entfernt.
- Dateien: `web/src/components/TripTimeline.tsx`, `web/src/styles/trips-timeline.css`. Build grün (42 Seiten).
- Commit: `b3f7dec`

## 2026-06-13 20:30 — CMS: flacher Stationen-Manager im Reise-Formular
- Neue Reise bauen war umständlich (Stationen hinzufügen nur tief verschachtelt in Tinas nativer Liste).
  Neuer **flacher Manager** ganz oben im Reise-Formular (immer sichtbar): pro Zeile **Name** (editierbar)
  + **Art** (Haupt/Zwischenstopp) + **Anreise** (Fahrt/Flug), **Ziehen zum Sortieren**, **🗑 löschen**,
  **„+ Station hinzufügen"**. Detailfelder (Ort, Texte, Fotos) bleiben in Tinas nativer Liste darunter.
- **Stabil** über die offizielle Tina-Form-API (final-form): `form.mutators.push/move/remove` auf `stops`,
  `form.change('stops[i].feld')`. **Kein** Fernsteuern der Vorschau (wäre instabil/Update-bruchgefährdet).
- Dateien: `web/tina/fields/StopsManager.tsx` (neu), `web/tina/config.ts` (UI-only-Feld `stops_manager`).
  `tina-lock` deterministisch neu (`85b1115a`, 2× verifiziert). Build grün (42 Seiten).
- **⚠️ David:** Schema-Änderung → nach Push **Tina-Cloud-Re-Index** nötig.
- Commit: `af5da8c`

## 2026-06-13 20:15 — Reisen-Karte: kein Auto/Flugzeug-Geflacker an den Stops
- `placeVehicleAtStop` setzte das Symbol beim Halten/Landen **hart auf Auto** → bei aufeinanderfolgenden
  Flügen (z. B. Dresden→FRA→SF) flackerte es Flieger→Auto→Flieger. Jetzt richtet sich das Symbol am Stop
  nach der **Ankunftsart** (`legFlight[idx]`): nach einem Flug bleibt es Flugzeug, erst eine Fahretappe
  macht wieder ein Auto.
- Datei: `web/src/components/TripTimeline.tsx`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `df5097e`

## 2026-06-13 19:49 — Reisen-Karte: Kurven-Haken weg + Alaska-Flug gesetzt
- **Kurven-Haken behoben (`1368443`):** uniforme Catmull-Rom machte bei eng/spitzwinklig liegenden Stops
  einen „Haken"/Schlaufe (z. B. Yosemite↔Lake Tahoe) → ersetzt durch **zentripetale** Catmull-Rom
  (alpha=0.5, Knoten nach √Distanz, eps-geschützt) → keine Cusps/Selbstschnitte, kurze Etappen krümmen sanft.
- **Alaska-Flug (`217223c`):** Etappe **Lake Tahoe → Anchorage** auf `arriveBy: flight` gesetzt
  (`web/src/data/trips/alaska2026.json`). Ohne Wert wurde sie als Fahrt behandelt (schnippte ohne Flugzeug
  nach ANC). Jetzt: Flugzeug-Symbol + Bogen + Voll-Rauszoomen + langsame Flug-Animation. **`arriveBy` ist ein
  manuelles Pro-Station-Feld** (CMS „Anreise: Flug"); Verkabelung war ok, nur der Wert fehlte im Content.
- Build grün (42 Seiten). Kein Schema-Change.
- Commits: `1368443`, `217223c`

## 2026-06-13 19:27 — Reisen-Karte: sanfte Kurven + Apple-like Linie + langsamere Fluganimation
- **Sanfte Kurven (Radien):** Fahr-Linie als uniforme **Catmull-Rom-Spline** durch die Stops (`curveLeg`);
  Nachbar-Stops = Tangenten, über Flug-/Lückengrenzen nicht gekrümmt. **Eine** Punktquelle je Etappe
  (`buildRoute.legPts`) für Linie **und** Fahrzeug → Auto folgt exakt der Kurve, beide synchron.
- **Apple-like Optik statt Balken:** dezenter Schein (glow) + heller Rand (casing) + schlanke, **leicht
  durchsichtige** Linie (opacity .82), runde Enden; Flug = gestrichelter Bogen auf hellem Track.
- **Fluganimation:** Karte zoomt zuerst **voll heraus** (`fitBounds` padding 100, maxZoom 6, 1100ms),
  dann fliegt das Flugzeug mit ~700ms Verzögerung **deutlich langsamer & sanfter** (easeInOutSine, Dauer
  bis 3400ms) den Bogen entlang — statt so schnell wie das Auto. (Auswahl Nutzer: „sanfte Kurven", kein
  externes Routing.)
- Datei: `web/src/components/TripTimeline.tsx`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `5407d74`

## 2026-06-13 18:25 — Reisen-Karte: progressive Routenlinie + feineres Aussehen
- Statt die komplette Route vorab als dicken Balken zu zeigen, **wächst die Linie jetzt mit der Reise**
  (von Station zu Station synchron mit dem Fahrzeug; beim Zurückscrollen schrumpft sie). Gekoppelt an die
  Fahr-Animation (`baseDist + Richtung·want`) und an `placeVehicleAtStop`.
- **Schöner statt Balken:** durchgehende Gesamtlinie als Modell (`buildPath`: Punkte + kumulierte Distanz
  + Stop-Distanzen + Flug-Flag) → nur die gefahrene Strecke wird gezeichnet (`drawDoneUpTo`, im Segment
  interpoliert). Dünne Linie (2.4px) + weicher Halo (`line-blur`) + runde Enden; Flug = gestrichelter Bogen
  (eigene Quelle). Selbst-heilendes Neuzeichnen (`idle`) bleibt.
- Datei: `web/src/components/TripTimeline.tsx`. Build grün (42 Seiten). Kein Schema-Change.
- Commit: `0807cb5`

## 2026-06-13 17:50 — CMS-Komfort: Site-Nav im Vorschau-Iframe waagerecht (kein Burger)
- Im schmalen Tina-Vorschau-Fenster (<860px Breakpoint, 1:1 aus alter `index.html`) zeigte die Seite
  ihre **mobile Burger-Nav** → Seitenwechsel im CMS nur übers Burger-Menü. Keine Folge früherer Commits,
  sondern die responsive Nav, die auf die schmale Iframe-Breite reagiert (live unberührt).
- Fix: `SiteNav` setzt `html.ww-cms-preview` **nur**, wenn die Seite in einem Iframe läuft
  (`window.self !== window.top`); CSS hält die Nav dort waagerecht (scrollt notfalls horizontal).
  **Live-Seite = oberstes Fenster → Besucher/Live exakt wie bisher.** Kein Schema-Change.
- Dateien: `web/src/components/SiteNav.astro`, `web/src/styles/global.css`. Build grün (42 Seiten).
- Commit: `64951a2`

## 2026-06-13 17:43 — Reisen-Fix: Routenlinie verschwand (Auto fuhr ohne Linie)
- Route (Linien-Layer) wurde nur einmal beim `load` gezeichnet und bei `isStyleLoaded()===false`
  still verworfen. Im **CMS-Vorschau-Iframe** und direkt nach einem **Live-Kartenstil-Wechsel**
  (`setStyle` aus `reisen_settings`) löscht `setStyle` alle Quellen/Layer → Marker (DOM) überleben,
  die **Linie nicht** → „Auto fährt, aber keine Linie".
- Fix: `drawRoute` zeichnet sich **selbst-heilend** beim nächsten `idle` erneut, falls der Stil noch
  nicht geladen ist; Stilwechsel-Effekt nutzt `idle` statt `styledata`+Guard.
- Datei: `web/src/components/TripTimeline.tsx`. Offline-Build grün (42 Seiten).
- Commit: `28356fe`

## 2026-06-13 — CMS: Mediathek-Auswahl in Foto-Feldern + Auto/Flugzeug pro Station
- **Mediathek-Picker** (`c6758ab`): „🖼️ Aus Mediathek wählen" jetzt in **allen** Foto-Feldern
  (Titelbild/Crop, weitere Fotos/Bulk, Einzelfoto) — Raster aller vorhandenen `/uploads`-Bilder
  (`uploads-manifest.json`, wie im Story-Textfeld). Vorhandene WebPs **auswählen statt doppelt
  hochladen**; gemeinsamer `tina/fields/MediaPicker.tsx`. Kein Schema-Change.
- **Auto vs. Flugzeug** (`f2d44e5`): neues Stop-Feld **`arriveBy`** (Fahrt/Flug). „Flug" → gekrümmter
  gestrichelter Bogen + Flugzeug-Symbol + Raus-Zoom (aktiviert den bereits vorhandenen Flug-Code);
  leer = Fahrt (backward-kompatibel). `tina-lock` deterministisch neu (`7fbea65…`).
- **⚠️ David:** Push → **Tina-Cloud-Re-Index** (Schema-Änderung `arriveBy`).

## 2026-06-13 — Reisen-Umbau: Variante B live in /trips (Übersicht + Detail), capability-locked
Der große finale Umbau — der abgestimmte Timeline-Prototyp ist in die echte Reisen-Seite portiert.
`main`/Live unberührt; alles auf `astro-umbau`. **NICHT gepusht** (David pusht + re-indexiert).
- **Phase 1 (`db7423f`):** `/trips` (+ `/en/trips`) ist jetzt eine **Übersicht** (eine Karte pro Reise:
  Cover aus erstem Stop-Titelbild, Eyebrow=Meta, Stopp-Anzahl, 1 Satz, „bald"-Badge) → `/trips/<slug>`.
  Reise-Tabs entfallen. `tripCover()` in `lib/trips.ts`, `TripsOverview.astro`, EN-Detailroute ergänzt.
- **Phase 2 (`1a459b6`):** **`TripTimeline.tsx`** = Variante-B-Mechanik 1:1 (Single-Scroll, sticky Kopf+
  Karte, Fokus-Dimming mit aktiver = gerahmter Karte, Fortschrittslinie, mitlaufende Karte + station-
  treues Fahrzeug, Reveals, Mobile) **+ alle echten Fähigkeiten** (useTina + `data-tina-field` +
  Editor-Scroll-Sync, DE/EN, 5 Karten-Stile live, scrollZoom, Marker/flyTo/fitBounds/Sprach-Labels,
  CSS-Crop-Hero, Filmstreifen→Lightbox, Video+YouTube, verknüpftes Album, Reisefazit-Galerie).
  `lib/vehicles.ts` (Expedition/Pickup/Jeep), `trips-timeline.css`. Flug/Etappen = ruhender Code
  (nicht im Schema → reale Reisen = reine Fahrt).
- **Phase 3 (`63018b3`):** Tina-Schema backward-kompatibel: Station-`kind` (ohne = Hauptstation),
  Reise-`vehicle` (+ `vehicle_custom_svg`, ohne = Expedition), 4 globale Regler in `reisen_settings`
  (`spotlight_strength` 70, `dim_fade_ms` 800, `reveal_ms` 800, `snap_enabled` aus). Detailseiten lesen
  sie (Fallback = Defaults) → Props an TripTimeline.
- **Phase 4 (Media):** Befund — **keine Änderung nötig.** `media.tina.mediaRoot='uploads'`,
  `publicFolder='public'` (= ganze Repo-Mediathek), **keine einschränkenden `uploadDir`-Unterordner**;
  Foto-Felder speichern nach `directory:''` (Wurzel). (Offen/Folge: „Aus Mediathek wählen" in den
  Crop/Single/Bulk-Foto-Feldern — bisher nur StoryBody hat den Mediathek-Picker.)
- **Phase 5 (`626dcdc`):** `tina-lock.json` deterministisch neu (`tinacms dev --no-server`, 2× md5
  `6b52077…`). Offline-Build grün (42 Seiten). Alte `TripsContent.tsx` verwaist (bleibt bis Abnahme).
- **Fix (`80a84d9`):** aktive Station robust bei **kurzen** Stationen (ohne Titelbild / 2-Zeiler) — Lese-Anker
  ins obere Drittel + aktive Station = letzter Block, dessen Oberkante den Anker passiert hat (vorher war bei
  kurzen Blöcken oben schon eine spätere Station aktiv).
- **⚠️ David:** Push (GitHub Desktop) → **Tina-Cloud-Re-Index** (sonst Cloudflare „local schema doesn't
  match remote"). Danach live testen (Handy/iPad/Mac-Safari).

## 2026-06-12 — Prototyp Variante B: aktive Station als Karte + Defaults 800/800
- Reiner Prototyp (`/proto/reisen-timeline`); echte `/trips`-Seite, Tina-Schema, Content unberührt.
- **Reveal-Default 420→800** (`a853594`): beide eingefrorenen Defaults (Übergang + Reveal) jetzt 800 ms.
- **Aktive Station = gerahmte, angehobene Karte** (`52b3890`): die fokussierte Station bekommt Fläche +
  **Ring + Schatten** wie das globale Frame-Design (`--ww-ring` + `--ww-shadow`, folgt der gewählten Stufe
  none/soft/strong). Layout-stabil (Polster/Radius immer da, beim Aktivwerden nur `background` + `box-shadow`
  dazu → kein Sprung), fluffig über dieselbe Dim-Fade-Dauer. Die Zwischenstopp-Dauerbox entfällt →
  Karte/Schatten erscheint einheitlich nur im Fokus.

## 2026-06-12 — Prototyp Variante B: Mobile-Variante + Reveal-Regler
- Reiner Prototyp (`/proto/reisen-timeline`); echte `/trips`-Seite, Tina-Schema, Content unberührt.
- **Reveal-Dauer auf Proto-Regler** (`f0dff84`): Slider „Reveal (Erscheinen)" 0–900ms (Default 420);
  setzt `--ww-reveal-dur` live. **`DIM_FADE_MS` Default 650→800** (von David eingefroren).
- **Mobile-Variante < 768px** (`be22b62`) — **iPad/Desktop (≥768px) unverändert**:
  - **Breakpoint über BREITE** (`max-width:767px`), NICHT Touch → iPad (auch quer) behält das
    Desktop-Layout mit Karte daneben (Alexandras Hauptgerät).
  - **Gestapelt, ein Scroll-Kontext** (kein verschachteltes Scrollen): schlanke sticky **Nav-Zeile**
    (großer Kopf scrollt weg und **kollabiert** hinein — Titel blendet ein per `.is-collapsed`,
    scrollbasiert, ohne Re-Render) → darunter sticky **Mini-Karte** (volle Breite, niedrig) mit
    progressiver Route + Fahrzeug + flyTo → darunter die Timeline.
  - **Anker** rechnet mobil unter Nav + Nav-Zeile + Mini-Karte (`anchorViewportY`-Helper, auch fürs
    Snapping). **Dimming etwas schwächer** (Deckkraft ≥ 0.40 via CSS `max()`). **Filmstreifen →
    swipebare Galerie** (scroll-snap-x, größere Bilder).
- Offline-Build grün (37 Seiten). **Browser-/Safari-Test offen** (Sandbox blockt Server → David live:
  iOS-Handy + iPad + Mac/Safari; v. a. dass der Breakpoint sauber trennt).

## 2026-06-12 — Prototyp Variante B: Dimming-Timing, Karte sichtbar, Live-Regler
- Reiner Prototyp (`/proto/reisen-timeline`); echte `/trips`-Seite, Tina-Schema, Content unberührt.
- **Karte bleibt sichtbar** (`4fd1838`): Grid-Falle behoben — `.tl-list`/`.tl-head` (Spalte 1) hatten kein
  `min-width:0`, dadurch konnte die Timeline-Spalte nicht schrumpfen und schob die 420px-Kartenspalte
  aus dem Bild (Fahrzeug/Karte „nicht auffindbar"). `min-width:0` + `max-width:100%` auf der Bühne.
- **Dim-Timing block-basiert** (`5c32389`): aktive Station = die, in deren **Block** der Lese-Anker liegt
  (statt „nächster Punkt"). Große Hauptstationen bleiben aktiv, solange der Großteil sichtbar ist; kurze
  Zwischenstopps werden erst aktiv, wenn sie wirklich dran sind — behebt zu frühes Ein-/Ausblenden.
  Block-Messung layout-/offset-basiert → transform-stabil (kein Flackern).
- **Fluffigeres Ein-/Ausblenden** (`0396624`): Übergangsdauer `DIM_FADE_MS` (Default 650ms, vorher 380) +
  weiche Landung (easeOutQuint-artig).
- **On-page „Proto-Regler"** (`c7ddf26`): diskretes Panel unten links zum **Live-Vergleichen** ohne Rebuild —
  Toggle „Stationen einrasten" (Default aus), Slider „Spotlight-Stärke" (0–90, Default 70) und
  „Übergang/fluffig" (200–1200ms). Spiegelt die späteren globalen CMS-Felder; Konstanten oben = Defaults.
- Offline-Build grün (37 Seiten). **Browser-/Safari-Test offen** (Sandbox blockt Server → David live).

## 2026-06-12 — Prototyp Variante B: Scroll-Gefühl auf Fokus-Dimming (apple-like)
- Reiner Prototyp (`/proto/reisen-timeline`); echte `/trips`-Seite, Tina-Schema, Content unberührt.
  Leitbild: ruhig/editorial, nichts kapert die Leseposition.
- **Auto-Snapping standardmäßig AUS** (`d851190`): Konstante **`SNAP_ENABLED = false`** — Timeline
  scrollt frei, Snap-Logik bleibt hinter dem Schalter. Justier-Konstanten zentral oben gruppiert,
  mit CMS-Wording als Kommentar (später globale Felder „Stationen einrasten" + „Spotlight-Stärke").
- **Fokus-Dimming als Herzstück** (`666369a`): aktive Station (nächste zum Lese-Anker) voll präsent
  (Deckkraft 1, Skalierung 1), alle anderen gedimmt + minimal kleiner; Fokus **wandert weich mit**
  (is-active laufend per Scroll gesetzt, weiche CSS-Transition, kein Einrasten). Stärke über
  **`SPOTLIGHT_STRENGTH = 70`** (gedimmt 0.30), Skalierung **`DIM_SCALE = 0.975`**; als CSS-Vars.
  Skaliert nur der Inhalt (`.tl-body`) → Punkt-Messung bleibt stabil.
- **Reveals dezent** (`b1a0d7c`): einmaliges leichtes Aufsteigen + Einblenden je Station
  (`REVEAL_SHIFT=10px`, `REVEAL_DUR=420ms`), als CSS-Animation per IntersectionObserver; Ruhezustand
  sichtbar (kein Blank-Risiko); reduced-motion → keine Bewegung.
- **Fahrzeug prominenter** (`71f2be6`): Münzen-Größe über **`VEHICLE_SIZE = 42`** (vorher 34) + etwas
  stärkerer Schatten; Silhouette skaliert mit (Auto 0.74×, Flugzeug 0.6×). reduced-motion unverändert.
- Offline-Build grün (37 Seiten). **Browser-/Safari-Test offen** (Sandbox blockt Server → David live).

## 2026-06-11 — Prototyp Variante B: Desktop-Korrekturen nach Live-Test
- Reiner Prototyp (`/proto/reisen-timeline`), 5 Punkte aus Davids Test behoben; echte
  Reisen-Seite/Schema/Content unberührt.
- **Kopf bündig unter Nav** (`2f982ed`): Nav-Höhe gemessen → `--ww-sticky-top` = Nav-Höhe; Kopf
  klebt bündig darunter, `box-shadow` deckt den Spalt solide ab. Behebt: zwischen Überschrift und
  oberer Leiste schienen Stationen durch. **Fade** beginnt erst unter dem Kopf (+8px) und fadet nur
  kurz (52px) → Überschrift bleibt beim Snappen lesbar, Fade geht nicht zu weit ins Bild.
- **Snapping zuverlässig** (`b8c42bd`): CSS-scroll-snap raus, stattdessen **JS-Snap beim Ruhen**
  (`snapToNearest`, 150ms nach letztem Scroll → nächste Station sanft an den Anker). Robust, v. a. Safari.
- **Fortschrittsbalken gleitet** (`b8c42bd`): zieht kontinuierlich mit dem Scroll mit (Anker-Bezug),
  CSS-Transition raus → kein Schnippen zur nächsten Station mehr.
- **Fahrzeug gleitet station-treu** (`542c3f6`, `97fada7`): bei Stationswechsel gleitet es langsam
  (easing) entlang der echten Etappe zur neuen Station (Auto gerade, Flugzeug die Kurve) und ruht
  IMMER an einer Station (z. B. Flugzeug steht in FRA, nicht auf halbem Weg). Bei schnellem Scrollen
  ohne Rücksprung; `prefers-reduced-motion` → sofort am Stopp.
- **Nachschärfung (2. Feedback):** Snapping **fluffiger** (`f584c26`) — eigener easeInOut-rAF-Tween
  (460–900ms) statt nativem smooth-scroll (das „schnippte"); per Wheel/Touch/Tastatur unterbrechbar.
  **Fade-Lücke oben geschlossen** (`2c9a79b`) — Fade beginnt bündig direkt unter der Überschrift
  (Kopf-Unterabstand 12→6px, Fade-Start snap-pad−4px); keine ~3–4 mm Lücke mehr.
- Offline-Build grün (37 Seiten). **Browser-/Safari-Test offen** (Sandbox blockt Server → David).

## 2026-06-11 — Prototyp Variante B: Desktop-Feinschliff (Single-Scroll, Flüge, SUV)
- Reiner Prototyp-Feinschliff (`/proto/reisen-timeline`) nach Live-Test; echte Reisen-Seite/
  Schema/Content unberührt. Leitprinzip apple-like (ein Scroll-Kontext, ruhig).
- **Single-Scroll-Architektur** (`e43db2a`): kein innerer Scroll-Container mehr — Wurzel-Fix für
  beide Test-Bugs (überscrollter Kopf, Hängenbleiben am Anfang/Ende). Kopf + Karte `position:sticky`,
  lösen sich am Timeline-Ende. Fade jetzt als **Overlay-Verlauf** (Hintergrund→transparent) sticky
  an Ober-/Unterkante (negative Margins). Snapping auf dem **Dokument-Scroller**
  (`scroll-snap-type:y proximity`, `scroll-padding-top`=Nav+Kopf). Aktive Station, Balken-Ende und
  Snap nutzen **denselben Anker** (gemessene Punkt-Mitte) → Balken endet exakt an der aktiven Punkt-
  Mitte. Vorlauf kompakter; Karte gedeckelt auf `min(62vh,540px)`.
- **Zwei echte Flugetappen + Flughäfen** (`ef903cd`): Frankfurt→SF, LAX→Anchorage (je Ab-/Ankunft),
  18 Stopps, 4 Etappen-Trenner.
- **Gekrümmte Flugbögen** (`1ddcfd8`): Flüge als poleward gewölbte Bézier-Bögen (gestrichelt) statt
  gerader Luftlinie; Karte zoomt für den Flug per `fitBounds` auf den ganzen Bogen heraus und beim
  Weiterfahren wieder hinein; Flugzeug fliegt die Kurve scroll-gekoppelt ab.
- **Saubere Ford-Expedition-Silhouette** (`e1cecff`): Full-Size-SUV-Seitenprofil (kastig, hohe Dachlinie,
  3 Fenster als Aussparungen, große Radkästen); vorab gerendert/visuell geprüft.
- Offline-Build grün (37 Seiten); SSR/Bundle/CSS geprüft. **Browser-/Safari-Test offen** (Sandbox blockt
  Server → David lokal/online: sticky, Overlay-Fade, scroll-snap proximity, IO, Flug-Zoom/Bogen).

## 2026-06-11 — Prototyp Variante B: Desktop-Ausbau (Fade-Fenster, Route, Fahrzeug)
- Reiner Prototyp-Ausbau (`/proto/reisen-timeline`), DESKTOP-Fokus; echte Reisen-Seite/
  Schema/Content weiter unberührt. Mobiles Verhalten bewusst später.
- **Demo-Daten** auf **18 Stopps** erweitert (`e51d1e3`): 9 Haupt / 9 Zwischen, Felder
  `arriveBy` (drive/flight) + `stage` (Etappen-Trenner). Inhalte frei erfunden, Bilder = vorhandene /uploads.
- **Fixes Fade-Fenster** (`b71bf9a`): Kopf + Karte bleiben fix (Grid-Bühne), nur die Timeline
  scrollt in `.tl-scroll` mit weicher Ober-/Unterkante (`mask-image`); sanftes proximity-Snapping
  (snap-align center); mitscrollende Fortschrittslinie (JS-Var `--fill` aus gemessenen Punkt-Mitten);
  aktiver Punkt wächst (IntersectionObserver, root = Fade-Fenster); Karte folgt per `flyTo`;
  3 Etappen-Trenner (Kalifornien-Küste / Hoher Norden / Arktis & Polarkreis).
- **Routenlinie** (`dc82e1b`): Fahretappen durchgezogen, Flug Kalifornien→Alaska **gestrichelt**
  (keine Luftlinie übers Meer), warmer Akzent; dezente Karten-Legende Fahrt/Flug.
- **Fahrendes Fahrzeug** (`9dee0d3`): Expedition-**Silhouette** (kein Foto) gleitet scroll-gekoppelt
  zwischen den Stopps; auf der Flugetappe Flugzeug-Symbol (in Kursrichtung); `prefers-reduced-motion`
  → steht still am aktiven Stopp.
- Offline-Build grün (37 Seiten); SSR-Markup + Client-Bundle + CSS geprüft. **Browser-/Safari-Test
  offen** (Sandbox blockt Server → David lokal/online: sticky, mask-image, scroll-snap, flyTo, IO).

## 2026-06-11 — Prototyp: Reisen als vertikale Timeline (Variante B), isoliert
- **Reine Vorschau, nichts Bestehendes verändert.** Neue Route **`/proto/reisen-timeline`**
  (`noindex`, aus Sitemap gefiltert). Echte Reisen-Seite `/trips`, `TripsContent.tsx`,
  Tina-`reisen`-Schema und Content unberührt.
- Neue Dateien: `src/pages/proto/reisen-timeline.astro`, `src/components/proto/TripsTimelineProto.tsx`,
  `src/components/proto/alaskaTimelineDemo.ts` (Demo-Daten als TS → Tina scannt es nie),
  `src/styles/proto-timeline.css` (nur von der Proto-Seite importiert; `global.css` unberührt).
  `astro.config.mjs`: Sitemap-`filter` schließt `/proto/*` aus.
- **Inhalt:** vertikale Timeline mit zwei Stop-Klassen (Hauptstation: Titel/Datum/Hero/Text/
  Filmstreifen → bestehende **Lightbox** wiederverwendet; Zwischenstopp: schlank, 1 Satz, opt. 1 Thumb).
  MapLibre-Karte folgt per IntersectionObserver dem beim Scrollen aktiven Stopp (Desktop sticky
  daneben + flyTo; mobil Hero oben mit Gesamtroute).
- **Datenbasis:** längste reale Reise `alaska2026` (10 Stops, datengetrieben gewählt). Heuristik
  Haupt/Zwischen + klar markierte Demo-Füllung (`source:'demo'`: Yosemite/Denali/Coldfoot als
  Demo-Hauptstationen, Lake-Tahoe-Thumb). Details in `CAPABILITIES.md`.
- Commits: `fc8121b` (CAPABILITIES-Analyse), `f7b4f3d` (Demo-Daten), `3ab7838` (Komponente+CSS),
  `2d8c995` (Route + Sitemap-Filter). Offline-Build grün (37 Seiten). **Browser-/Safari-Test offen
  (Sandbox blockt Server → David prüft lokal).**

## 2026-06-10 — Doku: Vorschau-noindex gesetzt + Test-Mail bestätigt
- **Nur Doku** (keine Seitenänderung) — Commit zum Pushen, damit ein neuer Vorschau-Build
  läuft und die im Cloudflare-Vorschau-Projekt gesetzte Env-Var `PUBLIC_PREVIEW_NOINDEX=true` greift.
- `STATUS.md` + `FAHRPLAN.md`: **Vorschau-noindex aktiviert** (Var gesetzt; ⚠️ Live-Projekt
  bekommt sie NIEMALS → als Cutover-Merkposten in FAHRPLAN Phase 3/Schritt 5 + Phase 2 festgehalten).
- **Kontaktformular-Versand (Web3Forms)** von David real getestet → **Mail kommt an**: als erledigt vermerkt.
- STATUS: klarer „Offen – braucht David"-Block (Push · Safari/iPad-Konsole · iPad-Test Alexandra ·
  ggf. K2-Re-Index · dann Cutover).

## 2026-06-10 — K5: 4 verwaiste Upload-Testbilder entfernt
- `git rm` (`3010df0`) von 4 nicht referenzierten Uploads (~27 MB): `DJI_0769-HDR.jpg`,
  `IMG_5618.jpg`, `img_6027.jpg`, `IMG_5534.webp` (altes CMS-Testbild). Mit Davids
  Freigabe; über Git-Historie wiederherstellbar. Verbleibende 18 Uploads alle referenziert.

## 2026-06-10 — K4: EN-Album-Notiz + EN-Lücken-Scan
- **Album „Firsts" `note_en`** gefüllt (`6f73753`): englische Besucher sahen dort die
  deutsche Notiz (Alben haben kein `has_english`-Opt-out → Fallback DE). Reine Daten,
  kein Re-Index. `note_en` = „Our first album, with a few of our works".
- **Vollständiger EN-Scan** (`_de`/`_en` + `{de,en}`-Schema über `web/src/data` + Reisen +
  Stories): **keine weiteren echten Lücken.** Story `utah-drohne-kevin` hat
  `has_english:false` → absichtlich Deutsch auf EN (kein Mangel; Flag-Umschaltung wäre
  Autoren-Entscheidung). Album-Namen „Firsts"/„USA 2023" sprachneutral.
- **K5 präzisiert** (kein Code-Change): genau **4 verwaiste Uploads** (~27 MB) statt „~10"
  — wartet auf Freigabe zum Löschen (siehe `MAENGEL.md`).

## 2026-06-10 20:47 — P3: robots.txt (env-gesteuert) + Sitemap
- **Sitemap** (`ce0ef12`): `@astrojs/sitemap@3.2.1` (Astro-4-kompatibel — 3.7.x nutzt den
  Astro-5-Hook `astro:routes:resolved` → Build-Crash). Erzeugt `sitemap-index.xml` +
  `sitemap-0.xml` mit **allen 35 Seiten** (DE auf `/`, EN auf `/en/`).
- **`site`** in `astro.config.mjs` = `https://aandd-photography.pages.dev` (per Env
  `SITE_URL` überschreibbar, z. B. späterer Custom-Domain).
- **robots.txt als Endpoint** (`src/pages/robots.txt.ts`) mit derselben selbstkorrigierenden
  Logik wie das noindex: `PUBLIC_PREVIEW_NOINDEX=true` → `Disallow: /` (nur Vorschau-Projekt);
  Live (Var nicht gesetzt) → `Allow: /` + Sitemap-Verweis. **Kein Cutover-Eingriff nötig.**
- Sitemap-`i18n`-Option bewusst weggelassen (setzt Locale-Präfix auf JEDER Seite voraus;
  mit `prefixDefaultLocale:false` crasht der Build). hreflang-Alternates entfallen daher;
  alle Seiten bleiben vollständig enthalten.
- Dateien: `web/astro.config.mjs`, `web/package.json`, `web/package-lock.json`,
  `web/src/pages/robots.txt.ts`. Kein `tina/config` berührt → **kein Re-Index**.
  Offline-Build grün; beide robots-Varianten verifiziert.

## 2026-06-09 — UX: Footer-Logo klickbar + globaler „Nach oben"-Button (B)
- **Footer-Logo klickbar** (`bdf7efe`): Logo-Img in `<a href=linkHref('/')>` → Startseite sprachrichtig
  (DE `/`, EN `/en/`), `aria-label`. Dezenter Hover (Cursor-Pointer + Aufhellung 0.95→1), Footer-Look sonst unverändert.
- **Globaler Scroll-to-top-Button** (`a5ad983`): diskreter runder Button unten rechts in `BaseLayout` (alle Seiten),
  erscheint erst nach >400px Scrollen (JS `.is-visible`), weiches Opacity-Fade; sanftes Hochscrollen (smooth),
  respektiert `prefers-reduced-motion` (dann `behavior:auto` + kein Transform). Erdtöne + dezenter Schatten,
  Safe-Area unten/rechts, z-index 1090 (unter Mobil-Nav 1099 / Lightbox 1100 / Adminbar 1200 → kollisionsfrei).
- Beide rein Komponente/CSS/Inline-Skript → **kein Re-Index**. Offline-Build grün, Button auf allen Seitentypen verifiziert.

## 2026-06-09 — Fix: Safari-Repaint-Geist der Stationsreihe beim Reise-Wechsel (React-key je Reise)
- Symptom: Beim Anzeigen/Wechseln einer Reise erschienen die Stationen **zweier Reisen übereinander**
  (z. B. „Las Vegas Vegas", „Albıhoe" = west + birthday), erst ein Fenster-Resize räumte den „Geist" weg.
  Tritt bei mehreren Reisen auf (allgemein).
- Ursache (per Safari-Konsole eingegrenzt): SSR rendert `trips[0]` (Geburtstag); beim Wechsel tauschte
  React nur den **Text** der vorhandenen Pillen/Detail aus → Safari zeichnete die alte Beschriftung nicht
  sauber neu. **Reines Paint-Problem** (Geometrie war korrekt: stoplist `flexWrap=wrap`, `scrollW=clientW`,
  keine Seiten-Überlauf).
- Fix: zentraler `tripKey = trips[tripIdx]?.slug` als React-`key` an alle reise-spezifischen Blöcke
  (`.trip-summary`, `.trip-detail`, `.trip-stoplist`, Galerie) → React ersetzt beim Wechsel den DOM-Knoten
  komplett (frischer Anstrich) statt Text zu tauschen. **Dynamisch → gilt für alle (auch künftige) Reisen.**
  Die Karte bleibt bewusst montiert (kein key; wird per `flyTo` aktualisiert). TS + Offline-Build grün;
  Safari-Repaint headless nicht prüfbar → Nutzer-Gegentest. Commit: `15fc8b1`.

## 2026-06-09 — Fix: Reise-Tabs/Stations-Pillen brechen bei 641–860px um (statt Abschneiden + Hover-Pop)
- Befund: Bei Fensterbreite 641–860px standen die Pillen-Reihen auf `nowrap`/`overflow-x:auto` (seit jeher,
  `@media max-width:860px`), aber Fade/Pfeile erst ≤640px → Pillen wurden **abgeschnitten ohne Indikator**.
  Zusätzlich „poppten" sie beim Hover, weil `overflow-x:auto` automatisch `overflow-y:auto` erzwingt und die
  Hover-Anhebung (`translateY(-2px)` + Schatten, `.trip-*-button:hover`) oben/unten beschnitt.
- Fix: Scroll-Modus von ≤860px auf **≤640px** verschoben; bei 641–860px gilt die Basis `flex-wrap:wrap`
  (umbrechen, alles sichtbar, kein Overflow → Hover-Anhebung sauber). Scroll + Fade + Pfeile jetzt konsistent
  nur ≤640px. Nur CSS → kein Re-Index. Commit: `66df209`.

## 2026-06-09 — EN-Rechtstexte (K4) + P2 (Story-Bild) + P3 (404 + Vorschau-noindex)
- **K4** (`d7d52df`): `body_en` von Datenschutz + Impressum mit fachlicher EN-Übersetzung gefüllt
  (GDPR-Terminologie; DDG/MStV/TDDDG beibehalten; Dienste/Anschrift unverändert; YouTube-Link `hl=en`),
  `updated_en` = „June 2026". EN fällt nicht mehr auf DE zurück.
- **P2** (`6697937`): utah-Story-Inline-Bild `assets.tina.io` → `/uploads/DJI_0019_edit.webp` (letztes echtes Laufzeit-tina.io-Bild weg).
- **P3-a** (`e58d25e`): echte `404.astro` → `dist/404.html` (HTTP 404 für unbekannte Pfade statt Startseite/200), noindex.
- **P3-b** (`146dd72`): **env-gesteuertes** Vorschau-noindex — BaseLayout setzt `<meta robots noindex>` nur bei
  Build-Env `PUBLIC_PREVIEW_NOINDEX === 'true'`. Var **nur im Vorschau-Projekt** → Live-Projekt (ohne Var)
  indexiert normal, **kein Cutover-Code-Eingriff**, Live kann nicht versehentlich deindexiert werden.
  FAHRPLAN Phase 2/3 dokumentiert. Offline-Build verifiziert (Var an → noindex; Var aus → indexierbar).
- **Alle vier: KEIN `tina/config` berührt → KEIN Re-Index nötig.** (K1 bewusst gelassen — totes Restdatum.)

## 2026-06-08 — P1: Bild-Performance (Cache-Header + Sharp-Optimierung im Build)
- `web/public/_headers`: `/uploads/* → Cache-Control: public, max-age=604800` (vorher CF-Default
  `max-age=0` → Bilder bei jedem Aufruf neu geladen).
- `scripts/optimize-uploads.mjs` (sharp): optimiert **nur `dist/uploads`** NACH `astro build`
  (max 2400px, JPG/WebP q80, dateinamenstreu) → Repo-Originale (root/uploads + public/uploads)
  bleiben unberührt, kein Qualitätsverlust über Builds. `build`-Script um den Schritt erweitert,
  `sharp` als devDependency.
- **Test: `dist/uploads` 132 MB → 11 MB** (~113 MB / ~92 % gespart, 29 Bilder; `img_4101.jpg`
  12,8 MB → 0,73 MB, weiterhin valide). Reiner Build/Asset-Schritt → **kein Re-Index**. Commit: `7d1079c`.

## 2026-06-08 — K2: Instagram-Handles zentral aus der Kontaktseite (eine Pflegestelle)
- Home-Intro-Social-Reihe (`HomeIntroLive`) zieht die Insta-Links jetzt aus `contact.json` (`channels`,
  Typ ≠ email/phone) statt aus `home-settings.json`. **Build-Time-Import → funktioniert auch bei
  ausgeblendeter Kontaktseite** (`show_contact:false`). Einzelquelle = Kontakt.
- `social`-Feld aus der Startseite-CMS-Maske (`tina/config.ts`) entfernt; nur `social_show.intro`
  bleibt (Social-Reihe an/aus). `intro.social` aus `home-settings.json` entfernt.
- Korrekte Handles `@david.bastisch` + `@shot.by.alx_` (a3.flow raus, im Build verifiziert).
- Schema-Änderung → `tina-lock.json` neu generiert (deterministisch, 2× gleiche md5 `d23f79…`),
  Offline-Build grün (35 Seiten). **⚠️ Nach Push: Tina-Cloud-Re-Index nötig.** Commit: `d5ffe73`.

## 2026-06-08 — Scroll-Pfeile Politur: filigranerer Chevron + weiches Fade
- Chevron kleiner & dünner (16px statt 22px, `stroke-width` 2 statt 2.4) → näher am alten Text-Design.
- Rand-Fade von `mask-image` (nicht animierbar → wirkte „instant") auf **Opacity-Overlay** umgestellt
  (`.ww-scroller::before/::after`, Farbe `--c-bg`) → blendet in 320ms weich ein/aus. Pfeil-Opacity-Transition
  250ms → 320ms. Commit: `5a6ca03`.

## 2026-06-08 — Scroll-Pfeile: SVG-Chevron + gemessene Pillen-Mitte (Endlösung)
- Ursache des ganzen Hin und Her: `‹/›` waren **Text-Glyphen** mit font-abhängigem Versatz in der Zeilenbox.
  Ersetzt durch geometrisch zentrierten **SVG-Chevron** (`Chev`-Komponente, Pfad symmetrisch um die
  viewBox-Mitte → SVG-Mitte == Box-Mitte). JS misst die echte Pillen-Mitte je Reihe und setzt `--ww-arrow-y`
  auf den `.ww-scroller`; CSS pinnt den Pfeil per `top:var(--ww-arrow-y)/translateY(-50%)`.
  ⇒ Chevron-Mitte == Pillen-Mitte, **deterministisch** für beide Reihen, selbstkorrigierend
  (Scroll/Resize/Tab-Wechsel/Fonts). Box 30×40 = Tap-Ziel. `.stop-arrow` (Station vor/zurück) unverändert. TS sauber.
- betroffene Dateien: `web/src/components/TripsContent.tsx`, `web/src/styles/global.css`. Commit: `41d4be7`.

## 2026-06-08 — Scroll-Pfeile: Mess-Ansatz verworfen, zurück zu Pixel-Werten (Stationen 26 / Tabs 27)
- Der gemessene Ansatz (`6e4d1b9`) war live **schlechter**: Er zentriert die **Box** auf die Pillen-Mitte,
  aber die `‹/›`-**Text-Glyphe** sitzt in ihrer Zeilenbox tief → Chevron zu tief. Zurück zur bottom-Methode,
  pro Reihe, etwas höher: Stationen `26px`, Reise-Tabs `27px` (`:has(.trip-tabs)`); Messung aus `TripsContent` entfernt.
- **Erkenntnis:** Pfeil-Zentrierung ist headless **nicht pixelgenau** lösbar (Font-Metrik der Glyphe + kein Rendering).
  Exakt nur per Live-Messung im Browser; saubere Endlösung wäre ein **SVG-Chevron** (kein Font-Versatz). Commit: `74c2f84`.

## 2026-06-08 — Scroll-Pfeile: gemessene Pillen-Mitte statt Magic-Pixel (Schluss mit Raten)
- Nach mehreren Pixel-Iterationen (14→10→16→18→21/18→23/24) auf eine **robuste** Lösung umgestellt:
  JS (edge-fade-Effekt in `TripsContent.tsx`) misst die echte Pillen-Mitte je Reihe via
  `getBoundingClientRect` und setzt `--ww-arrow-y` auf den `.ww-scroller`; CSS pinnt den Pfeil per
  `top:var(--ww-arrow-y)/translateY(-50%)`. Selbstkorrigierend (Scroll/Resize/Tab-Wechsel/Fonts-Load),
  `:has(.trip-tabs)`-Sonderregel entfällt. Ursache war: Zentrierung gegen die Scroller-Box inkl.
  22–24px Scrollbar-Zone → geometrische Mitte ≠ Pillen-Mitte. TS-Check sauber.
- betroffene Dateien: `web/src/styles/global.css`, `web/src/components/TripsContent.tsx`. Commit: `6e4d1b9`.

## 2026-06-08 — Korrektur Scroll-Pfeile (vertikal mittig, bottom 10px→16px)
- Vorheriger Pfeil-Fix (`652b9db`, 14→10px) ging in die **falsche Richtung** (Annahme „‹/›-Glyphe sitzt
  optisch hoch" war falsch → Pfeile danach zu tief). Korrigiert auf `bottom:16px` = rechnerische Mitte
  `(H-16)/2 == 8 + Buttonhöhe/2` (button-höhen-unabhängig), bestätigt durch die Beobachtungen (14px leicht
  tief, 10px deutlich tief → Mitte 16px).
- betroffene Dateien: `web/src/styles/global.css`. Commit: `a808ad9`.
- **Feinschliff am Gerät:** `16px` war noch einen Hauch zu tief → `bottom:18px`. Commit: `da8f090`.
- **Pro Reihe getrennt:** Reise-Tabs (`.trip-tabs`, höher) und Stationen (`.trip-stoplist`) teilten sich
  den Wert; via `.ww-scroller:has(.trip-tabs)` jetzt Reise-Tabs `21px`, Stationen `18px`. Commit: `aef420f`.

## 2026-06-08 — Live-Check Astro-Vorschau (Audit) + MAENGEL.md/IDEEN.md + Pfeil-Fix
- **Read-only-Audit** der Vorschau (`aandd-photography-astro.pages.dev`, Stand `fd48c39`) + Quellcode.
  Kernergebnisse: Google-Fonts wirklich weg (deployte CSS 0× google, 11× lokale woff2 — Erst-Treffer
  war stale Edge-Cache); externe Hosts auf Besucherseiten nur umami/openfreemap-Kacheln/web3forms/instagram-Links;
  0 kaputte Bilder; keine Alaska-Hardcodes; Guards korrekt; Footer-Links ok. Mängel: Rechtstexte Platzhalter (🔴),
  Geräte-Smoke-Test offen (🔴), Bild-Performance (8–13 MB Roh-JPGs, kein Cache, 🟡), Tina-CDN-Bild im utah-Story-Body (🟡),
  Soft-404/kein robots/kein Sitemap (🟡), diverse Kleinpunkte.
- **MAENGEL.md** neu: priorisierte, abhakbare Mängelliste (🔴/🟡/⚪) inkl. Bild-Performance-Optionen (a–e)
  + Empfehlung (Cache-Header sofort + Sharp-Build-Schritt) + Geräte-Test-Checkliste.
- **IDEEN.md**: Analyse „Video-Clips" angehängt (Live-Wahrheit Hero/Stationen erwarten manuelles
  Vor-Komprimieren; iPhone=HEVC/.mov, „überall"=MP4/H.264; Browser-Transcoding auf iOS unzuverlässig;
  beste git+kostenlos = CI-ffmpeg, Vorbehalt Repo-Bloat; kein Cutover-Blocker → zurückstellen).
- **Fix:** Scroll-Pfeile der Reise-Tabs/Stationen (mobil) vertikal mittig (`.ww-scroll-arrow` bottom 14px→10px).
- betroffene Dateien: `MAENGEL.md` (neu), `IDEEN.md`, `web/src/styles/global.css`.
- Commits: `f5b238c` (MAENGEL.md), `f3126f5` (IDEEN.md Video), `652b9db` (Pfeil-Fix). **Nichts gebaut außer dem Pfeil-Fix; nichts gepusht.**

## 2026-06-07 — Schriften lokal selbst hosten (Fontsource) statt Google Fonts (DSGVO)
- **Live-Wahrheit:** Fraunces (Display: wght 400/500/600 + Kursiv, opsz-Achse 9..144) + Mulish
  (Body: wght 300–700, kein Kursiv) — in Astro **und** alter `index.html` identisch via Google-`<link>`.
- **Umgesetzt (`62e4e93`):** `@fontsource-variable/fraunces` (`full` + `full-italic` → opsz+wght+Kursiv)
  + `@fontsource-variable/mulish` lokal installiert, im `BaseLayout`-Frontmatter importiert; die zwei
  `preconnect` + der Google-Stylesheet-`<link>` aus dem `<head>` entfernt; CSS-Vars auf
  `'Fraunces Variable'`/`'Mulish Variable'` (Fallbacks `Fraunces`/`Mulish`/System). **Variable Fonts**
  → Fraunces' Optical-Size-Achse bleibt erhalten = 1:1-Rendering.
- **Bewusst (Option a):** `.pullquote` rendert jetzt echtes Kursiv 500 (Google lieferte nur Kursiv 400)
  → minimal kräftiger an genau dieser einen Stelle.
- **Datenschutz-Seite** Abschnitt „Schriftarten" aktualisiert: lokal, **keine Verbindung zu Google,
  keine IP-Übertragung**. (Alte `index.html`/`main` nutzt weiter Google Fonts — unangetastet.)
- Verifiziert: Build grün (35 Seiten), **0 Google-Font-Referenzen im `dist`**, 11 lokale woff2 gebündelt.
  Reiner Code/Assets → tina-lock unverändert, **kein Re-index**. *(Visueller 1:1-Vergleich im Browser
  steht noch aus — Sandbox blockt lokale Vorschau.)*

## 2026-06-07 — Fix: Lightbox-Absturz beim Öffnen (Namens-Konflikt) + Tab/Station zentrieren
- **DER Kern-Bug (`aaf073a`):** „Foto antippen → Galerie verschwindet, Footer rutscht hoch, leere
  Seite". Ursache: im `useEffect` der Lightbox überschattete ein lokales `const track = trackRef.current`
  (DOM-Element) die importierte Analytics-Funktion `track()`. Der `track('foto',…)`-Aufruf lief
  dadurch in die **Temporal Dead Zone** → ReferenceError beim Mount → React warf die ganze
  Galerie-Insel raus. Kam mit dem W5c-Event-Einbau rein; der Build merkt es nicht (Laufzeitfehler).
  Fix: DOM-Element → `trackEl` umbenannt. **Lightbox öffnet jetzt wieder.**
- **Einrasten/Zentrieren (`42babda`):** Klick auf Reise-Tab/Station scrollt das Element jetzt in die
  Mitte der Scroll-Reihe (`centerInRow`, nur wenn die Reihe scrollt = mobil).
- Reiner Komponenten-Code → tina-lock unverändert, **kein Re-index.** Build grün (35 Seiten).

## 2026-06-07 — Album direkt anklickbar + angeklicktes Element echt zentrieren (`45485d6`)
- **Album-Diashow:** zurück auf simplen `onClick` (wie die alte Seite) → Foto-Tipp öffnet die
  Lightbox direkt (nicht nur die Überschrift). Die Tipp-Erkennung war nur wegen des — jetzt
  behobenen — Lightbox-Absturzes nötig erschienen.
- **Tabs/Stations-Pills:** `scroll-snap-align: start` → `center`, damit das Einrasten in dieselbe
  Richtung wie das JS-Zentrieren zieht → angeklicktes Element landet sauber in der Bildschirmmitte.

## 2026-06-07 — Fix: leere Album-Unterseite (Galerie verschwand nach Hydration)
- **Eigentliche Ursache der „keine Lightbox"/„leeren Seite":** NICHT die Lightbox. Beim Klick aufs
  Album öffnet die Unterseite `/portfolio/<slug>` — die war leer. Serverseitig sind die Kacheln
  korrekt da (im Build verifiziert: `2024-erste-fotos` = 8 Kacheln), aber die useTina-Insel bekam
  **client-seitig leere Daten** → Galerie wurde nach der Hydration weggewischt.
- **Fix (`f9c3350`):** `AlbumContent` + `GalleryContent` fallen auf die server-gerenderten Daten
  (`props.data`) zurück, wenn die Live-Daten leer sind → Album-Unterseite + Portfolio-Übersicht
  bleiben gefüllt.
- Reiner Komponenten-Code → tina-lock unverändert, **kein Re-index.** Build grün (35 Seiten).

## 2026-06-07 — Mobil: Scroll-Reihen mit Fade + Pfeilen + Einrasten
- Auf Nutzer-Wunsch kombiniert (Reise-Tabs + Stations-Pills), **nur mobil** (≤640px) — Desktop/iPad
  brechen die Reihen um (kein H-Scroll → nicht nötig; daher auch kein CMS-Schalter):
  - **Fade:** scroll-abhängig (`ww-edge-l/-r`), nur auf der Seite mit mehr Inhalt.
  - **Pfeile ‹ ›:** jede Reihe in `.ww-scroller` gehüllt; Pfeile erscheinen via `:has(.ww-edge-*)`
    nur wenn es weitergeht, klickbar (`scrollBy ±200px`, smooth).
  - **Einrasten:** `scroll-snap-type: x proximity` + `scroll-snap-align: start`.
- Scrollbalken bleiben sichtbar (separat, vereinheitlicht). Reiner Komponenten/CSS-Code → kein
  Re-index. Build grün (35 Seiten); Pfeile/`:has`/Snap im Output verifiziert. Commit: `f65edd7`

## 2026-06-07 — Scrollbalken behalten/vereinheitlicht + Stations-Pills-Fade gefixt
- **Korrektur:** Scrollbalken NICHT mehr ausgeblendet (Nutzer wollte sie behalten). Stattdessen den
  hellen Default-Balken der Stations-Pills (`.trip-stoplist`) auf denselben dezenten Stil wie die
  Reise-Tabs gebracht (thin, `ink-soft`/`c-line`).
- **Stations-Pills harte Kante (mobil) gefixt:** Ursache war inline `justify-content:center` — bricht
  auf dem Handy das Scrollen-von-links → Fade/Indikator griff nicht. Zentrierung in CSS verlagert
  (Desktop zentriert, mobil `flex-start`) → Fade greift jetzt wie bei den Reise-Tabs. (`62dc8a1`)
- Reiner Komponenten/CSS-Code → kein Re-index. Build grün. *(Lightbox-Glitch-Fix `a8ff45a` ist noch
  ungepusht — muss deployt werden, bevor er greift.)*

## 2026-06-07 — Fix Lightbox-Glitch + Mobil-Scroll (Scrollbalken aus, Indikator-Fade)
- **Kritischer Fix (`a8ff45a`):** Auf dem Handy schloss sich die gerade geöffnete Lightbox sofort
  wieder — der Öffnen-Tipp erzeugt direkt danach einen `click`, der auf den frischen Hintergrund
  traf → „Hintergrund schließt"-Logik schloss sie → Flacker/„Foto verschwindet" + Body-Scroll
  blieb gesperrt (nicht mehr scrollbar). Jetzt ignoriert `bgClick` Hintergrund-Klicks 350 ms nach
  dem Öffnen (`readyRef`). Body-overflow-Reset bleibt im Cleanup.
- **Scrollbalken (`30df107`):** heller Balken unter Reise-Tabs + Stations-Pills entfernt
  (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`). Andere Scroll-Container
  (`album-track`/`trip-detail`/Lightbox) blendeten ihn schon aus → global sauber.
- **Indikator-Fade (`30df107`):** statisches beidseitiges Fade ersetzt durch scroll-abhängiges —
  JS (TripsContent) setzt `ww-edge-l/-r` je nach Scrollposition; Fade erscheint nur auf der Seite
  mit mehr Inhalt = „geht-noch-weiter"-Indikator, an den Enden weg. Schmaler/schicker (26 px).
- Reiner Komponenten/CSS-Code → tina-lock unverändert, **kein Re-index.** Build grün (35 Seiten);
  Guard + Edge-Logik + CSS im Bundle verifiziert.

## 2026-06-07 — UX: Lightbox-/Burger-Schließen, Album-Tipp mobil, Scroll-Reihen weicher
- **Lightbox:** Klick/Tipp **neben** das Foto (dunkler Hintergrund) schließt jetzt — `bgClick`
  schließt, außer das Ziel ist Foto, Pfeil, Schließen-Button oder Filmstreifen. (`Lightbox.tsx`)
- **Burger-Menü:** schließt bei Klick/Tipp **außerhalb** + per **ESC** (Listener in `SiteNav`).
- **Portfolio-Album-Diashow (mobil):** `onClick` → **Tipp-Erkennung** (pointerdown/up + Bewegungs-/
  Zeit-Schwelle). Der Scroll-Snap-Container schluckte auf dem Handy das `onClick` → Lightbox ging
  nicht auf. Jetzt öffnet ein echter Tipp die Lightbox zuverlässig. (`GalleryContent.tsx`)
- **Mobile schiebbare Reihen:** breiteres Ausfaden (`mask` 34 px) + mehr Innenabstand → kein
  „abgeschnitten"-Eindruck mehr.
- Reiner Komponenten/CSS-Code → tina-lock unverändert, **kein Re-index.** Build grün (35 Seiten).
  Commit: `b9d646f`. *(Lightbox-Bug konnte hier nicht im Browser gegengetestet werden — Sandbox
  blockt lokale Vorschau; Code-Pfade + Hydration geprüft, mobile Tap-Ursache adressiert.)*

## 2026-06-07 — Mobil: schiebbare Reihen weicher (Reise-Tabs + Stations-Pills)
- Auf dem iPhone werden Reise-Tabs (`.trip-tabs`) + Stations-Pills (`.trip-stoplist`) zu
  horizontalen Scroll-Leisten (`overflow-x:auto`). Dabei (1) schnitt der weiche Schatten unten
  **hart ab** (overflow klippt vertikal) und (2) liefen die Items **hart an den Bildschirmrand**.
- Fix nur im Mobile-Media-Query (`max-width:640px`): kompakterer Schatten (`0 4px 12px -4px`,
  passt in den Platz → keine harte Kante), `mask-image`-Verlauf links/rechts (Items faden weich
  aus statt harter Kante), etwas `padding` + `scroll-padding`. Desktop unverändert.
- Reines CSS → tina-lock unverändert, **kein Re-index.** Build grün; `mask-image`-Regel im
  gebauten CSS verifiziert. Commit: `553c252`

## 2026-06-07 — Logout: sauber zur Startseite statt Tina-Fehler
- Beim Abmelden warf Tina einen Fehler / ließ einen auf einer kaputten (Editier-)Seite zurück.
  Jetzt definierter Landeplatz = **Startseite** — über beide Wege:
  - **Banner** (`SiteAdminBar` „Abmelden"): löscht Tina-Tokens (localStorage **+** sessionStorage)
    und geht aufs **Top-Fenster `/`** (statt `location.reload`, das die Editier-Seite neu lud →
    Fehler; `window.top` bricht zusätzlich aus einem evtl. Editier-iframe aus).
  - **CMS:** neues Screen-Plugin **„Abmelden"** (Kategorie „Site", `tina/screens/LogoutScreen.tsx`)
    — löscht Tokens und leitet auf `/`. Sauberer Logout aus dem CMS ohne Tina-Fehler. Via
    `cmsCallback` registriert (wie „Zur Website").
- cmsCallback-Plugin = kein Schema → **tina-lock unverändert** (2× gleicher Hash `a9d0db8…`),
  **kein Re-index.** Build grün (35 Seiten). Commit: `ca20d23`
- **Nachtrag (`c5ff269`):** Auch Tinas **eingebauten** Logout abgefangen — `cmsCallback` patcht
  (abgesichert) `authProvider.logout`, sodass auch darüber auf `/` statt auf den /admin-Login-
  Screen weitergeleitet wird. Best-effort (try/catch + verzögerter Retry); greift Tinas Interna
  anders, passiert nichts. Lock unverändert, kein Re-index.
- **Nachtrag 2 (`01be3c3`):** authProvider-Patch griff in der eingesetzten Tina-Version nicht →
  zusätzlich ein capture-Click-Listener im `/admin`-Dokument, der Klicks auf „Log out/Logout/
  Sign out/Abmelden" erkennt, Tina-Tokens löscht und nach 150 ms hart auf `/` geht (text-basiert,
  unabhängig von Tina-Interna). Damit hängt man nicht mehr auf dem Login-Screen fest.

## 2026-06-07 — Admin-only „📊 Statistik"-Link (Nav + Admin-Leiste)
- In der Hauptnavigation ein Link **„📊 Statistik"** (sprachrichtig `/statistik` bzw. `/en/statistik`),
  standardmäßig `hidden`; ein clientseitiges Skript blendet ihn **nur ein, wenn im Tina-CMS angemeldet**
  (gleiche localStorage-Token-Erkennung wie die Admin-Leiste). Besucher sehen ihn nie; erscheint in
  Desktop-Nav **und** Burger-Menü.
- **Admin-Leiste** (`SiteAdminBar`): zusätzlicher „📊 Statistik"-Link neben „CMS öffnen".
- CSS `.ww-admin-only[hidden]{display:none!important}` → das `hidden` schlägt ein evtl. `display` der
  Nav-Links (Besucher-Sicherheit).
- Rein clientseitig → tina-lock unverändert, **kein Re-index.** Build grün (35 Seiten); Anker DE/EN
  mit `hidden` + korrektem Link verifiziert. Commit: `fe92a6f`

## 2026-06-07 — Umami aktiviert + Klick-Events (Foto/Reise) + Datenschutz-Abschnitt
- **Umami-Tracking aktiv** (`b66e15c`): `statistik.json` `enabled=true` + Umami-Snippet
  (cloud.umami.is, `data-website-id`, öffentlich) → BaseLayout lädt es site-weit, cookielos.
  (Merge-Konflikt mit einer älteren CMS-Version aufgelöst — Umami-Code behalten; Merge `92fe349`.)
- **Klick-Events W5c** (`b3f2be0`): neuer Helfer `lib/track.ts` (`umami.track`, No-op wenn Umami aus).
  `Lightbox.tsx` feuert beim Öffnen `foto` `{bild, album}` → erfasst zentral ALLE Foto-Ansichten
  (Galerie/Album/Reisen/Stories/Momentaufnahmen). `TripsContent.tsx` feuert `reise` `{reise}` beim
  Tab-Wechsel. Stories/Alben sind eigene URLs → über Seitenaufrufe abgedeckt.
- **Datenschutz:** Abschnitt „Reichweitenmessung (Umami) & Cookies" (cookielos, keine Cookies,
  Art. 6 Abs. 1 f; Anbieter-/AVV-Angaben noch zu ergänzen). Bleibt Platzhalter → prüfen.
- Reiner Code/Daten → tina-lock unverändert, **kein Re-index.** Build grün (35 Seiten); Events im
  Bundle + Datenschutz-Abschnitt verifiziert.
- **Offen (Nutzer):** Umami „Share"-Link → CMS-Feld „Dashboard-URL" für die Einbettung auf `/statistik`.

## 2026-06-06 — Statistik: versteckte Auswerte-Seite (/statistik) + cookielose Web-Analyse (CMS)
- **Befund (Live-Wahrheit):** Seite ist rein statisch (`output: 'static'`, kein Cloudflare-Adapter/
  keine Functions/KV). Eine Auswertung braucht daher zwingend einen externen cookielosen Dienst
  oder ein Backend → **anbieter-neutrale** Lösung gebaut (Konto/Setup macht David, kein Secret im Repo).
- Neue CMS-Collection **`statistik`** (`statistik.json`): Schalter `enabled`, `analytics_snippet`
  (Tracking-`<script>` des Diensts), `dashboard_url` (öffentlicher Einbett-Link), `intro_de/en`.
  Router → `/statistik`.
- **BaseLayout** bindet den Tracking-Code site-weit im `<head>` ein — **nur** wenn aktiviert UND
  Code hinterlegt (sonst nichts). Neue `noindex`-Prop für Seiten.
- Seiten **`/statistik` + `/en/statistik`** (versteckt: `noindex`, kein Nav-/Footer-Link). Insel
  `StatsContent` bettet das Dashboard per iframe ein; ohne URL eine kurze Einrichtungs-Anleitung.
  CSS für Embed + Setup-Box.
- **„Meistgeklickt":** Story/Reise/Album sind je eigene URLs → Top-Seiten des Diensts liefern das
  direkt. Per-Foto-Events (Lightbox) später, anbieterspezifisch.
- Empfehlung: Cloudflare Web Analytics (Zahlen, kein Embed) ODER Plausible/Umami (einbettbar).
  Cookielos → i. d. R. kein Cookie-Banner, aber Dienst in der Datenschutzerklärung nennen.
- ⚠️ Schema geändert (neue Collection) → `tina-lock` neu (`dev --no-server`, deterministisch, 2× Hash
  `a9d0db8…`) → nach Push **Tina-Cloud-Re-index + Rebuild.** Build grün (**35 Seiten**, +2);
  Seite/`noindex`/Setup-Box/„kein Tracking solange aus" im dist verifiziert. Commit: `a78259a`

## 2026-06-06 — Rechtsseiten überarbeitet: kleinere Schrift + Datenschutz an echten Stack angepasst
- **Schrift** der Rechtsseiten (`#page-legal`) bewusst klein/kompakt (Body `.78rem`, kleinere
  Überschriften) — Pflichttext, wird kaum gelesen. Gilt für Datenschutz + Impressum.
- **Datenschutz-Platzhalter** konkretisiert auf die im Code geprüften Dienste: Cloudflare
  (Hosting/IP), Google Fonts (IP an Google, Hinweis „lokal einbinden"), OpenFreeMap (Karte),
  YouTube-nocookie (Videos), Web3Forms (Kontakt) + Abschnitt „Cookies & Speicherung" (keine
  Tracking-Cookies/keine Web-Analyse; `localStorage` nur im Admin-Bereich). Bleibt Platzhalter
  → rechtlich prüfen. Befund nebenbei: **Seite setzt keine Tracking-Cookies** (kein
  `document.cookie`/gtag/Analytics; `localStorage` nur SiteAdminBar).
- Reiner Inhalt + CSS → tina-lock unverändert, **kein Re-index.** Build grün (33 Seiten);
  Datenschutz rendert 9 Abschnitte, kleine Schrift im CSS verifiziert. Commit: `d4cf3b6`

## 2026-06-06 — Datenschutz- + Impressum-Seite (CMS-pflegbar) + Footer-/Consent-Links
- Zwei neue, im CMS editierbare Rechtstext-Seiten als **Gerüst mit Platzhalter-Text** (zum
  Selbstbefüllen/Ersetzen — Rechtstext bewusst NICHT von mir erfunden, klar als Platzhalter markiert):
  - Collections `datenschutz` (`/datenschutz`) + `impressum` (`/impressum`), je DE/EN, mit Titel +
    Stand + Markdown-Body (nimmt auch fertiges HTML aus einem Generator). `ui.router` für CMS-Live-
    Vorschau; Inhalt rendert über den vorhandenen `mdToHtml`-Port in der neuen `LegalContent`-Insel
    (`.reader-body`-Prosa, lesbar begrenzt). Platzhalter nennen bereits die echten
    Auftragsverarbeiter (Web3Forms, Cloudflare) als Struktur.
  - **Footer:** nicht ausblendbare Links „Impressum" + „Datenschutz" (sprachabhängig, DE/EN).
  - **Kontakt-Häkchen:** Link auf die Datenschutzerklärung (DE → `/datenschutz`, EN → `/en/datenschutz`),
    ohne das Häkchen umzuschalten.
- ⚠️ Schema geändert (2 Collections) → `tina-lock` neu (`dev --no-server`, deterministisch, 2× Hash
  `20c960e…`) → nach Push **Tina-Cloud-Re-index + Rebuild.** Build grün (**33 Seiten**, +4); Seiten +
  Footer-/Consent-Links im dist verifiziert. Commit: `c6aab1e`
- **Offen (Nutzer):** echten Rechtstext einsetzen (Generator/anwaltlich); Web3Forms + Cloudflare als
  Auftragsverarbeiter ausformulieren.

## 2026-06-06 — Kontaktformular versendet echt (W5, Web3Forms) + Datenschutz-Häkchen
- Auf Nutzer-Wunsch W5 umgesetzt: die Kontaktbox sendet jetzt wirklich. `ContactContent.onSend`
  macht einen POST an `api.web3forms.com/submit` mit dem Access-Key aus dem CMS
  (`form_access_key`) → Mail landet im hinterlegten Postfach (Test: `davidbastisch@web.de`).
  Key `408e…` in `contact.json` gesetzt (öffentlicher Web3Forms-Key, kein Geheimnis). **Ohne
  Key** bleibt das Formular „Vorschau" (sendet nichts) → bricht nichts, falls Key fehlt.
- **Datenschutz:** Pflicht-Häkchen vor dem Senden (`form_consent_de/en`), sonst Absenden geblockt.
  **Spam:** verstecktes Honeypot-Feld. **UX:** Button-Lade-Zustand (deaktiviert + „Senden …"),
  Fehlermeldung (`form_error_de/en`) bei Misserfolg; Vorschau-Hinweis (`form_note`) nur noch
  sichtbar, solange kein Key gesetzt ist.
- Neue CMS-Felder in der Kontakt-Collection (Key/Consent/Fehler) + CSS (`.form-consent`,
  `.form-error`, `:disabled`). Im gerenderten `/contact` verifiziert: Häkchen da, Key da,
  web3forms im Bundle, Vorschau-Hinweis-Element weg. Build grün (29 Seiten).
- ⚠️ **Schema geändert → `tina-lock` neu erzeugt** (`dev --no-server`, deterministisch, 2× gleicher
  Hash `da2f425…`) → nach Push **Tina-Cloud-Re-index + Rebuild nötig.** Echtes Senden erst auf der
  deployten Seite testbar. Spätere Eigenlösung (Cloudflare-Function + Resend) als W5b in IDEEN.md
  vorgemerkt. Commit: `671a742`

## 2026-06-06 — Stories: Direktaufruf-Sperre (gleiche Lücke wie Kontakt)
- Dieselbe Lücke wie bei Kontakt, jetzt für Stories geschlossen: `show_stories` blendete nur
  Nav-/Footer-Link aus; `/stories`, `/en/stories` **und die Einzelbeiträge** `/stories/<slug>`
  (DE+EN) waren per Direkt-URL weiter erreichbar.
- **Fix:** Build-Zeit-Guard in allen vier Seiten (`stories/index.astro`, `en/stories/index.astro`,
  `stories/[slug].astro`, `en/stories/[slug].astro`): bei `show_stories !== true`
  `Astro.redirect` auf die Startseite (DE → `/`, EN → `/en/`). Logik = wie Nav/Footer (sichtbar
  NUR bei `show_stories === true`, Standard aus).
- Reiner Seiten-Code → **tina-lock unverändert, kein Re-index.** Build grün (29 Seiten); im dist
  verifiziert: alle vier Varianten = Meta-Refresh-Weiterleitung (+ `robots: noindex`), kein
  `page-story`. Commit: `3fe9e01`

## 2026-06-06 — Kontakt komplett ausblendbar: Direktaufruf-Sperre
- **Befund (Ist-Zustand geprüft):** Der Schalter `show_contact` (🎨 Darstellung →
  „Kontakt zeigen?", aus Teil 2D) blendet **Nav- + Footer-Link** sauber aus (BaseLayout →
  SiteNav/SiteFooter, Filter `!i.contactOnly || showContact`). **Lücke:** die Seiten
  `/contact` + `/en/contact` rendern beim **Direktaufruf** trotzdem (kein Guard) — wie
  Stories. Der Schalter-Text sagt das selbst („Nav-Link + Footer-Link").
- **Fix:** Build-Zeit-Guard in beiden `contact.astro`: bei `show_contact === false`
  `Astro.redirect` auf die Startseite (DE → `/`, EN → `/en/`). Logik = wie Nav/Footer
  (aus = `false`, fehlend = sichtbar). `output: 'static'` → Astro baut eine Meta-Refresh-
  Weiterleitung; das Kontaktformular wird nicht mehr ausgeliefert.
- **Hinweis:** Solange aus, leitet auch die CMS-Live-Vorschau der Kontakt-Seite auf „/" um
  (gleicher statischer Build). Zum Bearbeiten Schalter kurz an + bauen.
- Reiner Seiten-Code → **tina-lock unverändert, kein Re-index.** Build grün (29 Seiten);
  `dist/contact` = 248 B Refresh→`/`, `dist/en/contact` = Refresh→`/en/`, kein `page-contact`/
  `<form>` mehr. W5 (echter Versand + danach wieder einblenden) in `IDEEN.md` aktualisiert.
  Commit: `1c76a73`

## 2026-06-06 — Portfolio: Alben-Überschrift „freigestellt" (Schlagschatten)
- Auf Nutzer-Wunsch: Die Alben-Überschrift (`.gallery-group-title`, z. B. „USA 2023 → 5") wirkt
  jetzt **freigestellt/schwebend** durch einen Buchstaben-Schlagschatten (`text-shadow`, **nicht**
  box-shadow — der wirkt nur auf Kästchen).
- Neue Variable `--ww-text-shadow` (default `none` / *soft* / *strong*) analog zu `--ww-shadow`,
  an die bestehende Darstellungs-Stufe **gekoppelt** (CMS: keine/ausgewogen/kräftig) — kein Extra-Schalter.
  Das Badge `.album-go-count` per `text-shadow:none` ausgenommen (Pill bleibt clean), der Pfeil schwebt mit.
- Datei: `web/src/styles/global.css`. Reiner Code → tina-lock unverändert, **kein Re-index.**
  Build grün (29 Seiten); alle drei Stufen im gebauten CSS verifiziert. Commit: `155178a`

## 2026-06-06 — Bild-Zuschnitt auf CSS-Zuschnitt umgestellt (kein eingebranntes Bild)
- Auf Nutzer-Wunsch (nach „ewig"-Warten + „?" bei jedem Crop): Zuschnitt brennt **kein neues Bild**
  mehr ein. `CropPhotoField` → „Übernehmen" speichert **nur das crop-Rechteck** `{x,y,w,h}` (sofort,
  kein Upload, keine neue Datei). Upload des Originals bleibt Auto-WebP @2400px.
- Neuer Helfer `photoFrame(v)` in `lib/trips` → `{ src=Original, style=CSS-Positionierung }`; die
  Besucherseite schneidet das **Original per CSS** auf das Rechteck zu (Frame-Seitenverhältnis = cropRatio:
  Person 4/3, Station 16/10 = `--ar-media`). `AboutContent` (Personen) + `TripsContent`/`viewStops`
  (Stationen) nutzen es. Bestehende Crops rendern via Original+crop (alte `-crop-*.webp` = Waisen).
- **Folge:** nie wieder „?"/Deploy-Warten beim Zuschnitt, keine Extra-Dateien, keine Doppel-Kompression.
  Fotos bleiben WebP (das Original). Reiner Code → tina-lock unverändert, **kein Re-index.** Build grün
  (29 Seiten); CSS-Crop-Style im HTML verifiziert. Commit: `3505521`

## 2026-06-06 — Crop-Save-Fix + Riss-Übergang erweitert (Footer/Hero)
- **Crop speichern gefixt** (`6b25569`): CropPhotoField erzeugte immer `<base>-crop.webp` → Git-Medien
  überschreiben nicht → „File already exists" beim erneuten Zuschneiden. Jetzt eindeutiger Zeitstempel-
  Suffix (`<base>-crop-<ts>.webp`). (Alte Crop-Dateien bleiben als Waisen in /uploads.)
  - **Hinweis „?" auf der Live-Seite:** Git-Medien-Verzögerung — das zugeschnittene Bild wird ins
    Repo committet, aber erst nach dem nächsten Cloudflare-Build ausgeliefert (wie jeder frische Upload).
    Kein Pfad-Bug. Alternative ohne neue Datei (CSS-Zuschnitt aufs Original) bei Bedarf später.
- **Riss-Übergang** (`fbd6013`): `PaperRip` (geflippte Creme-Kante) zusätzlich am **Footer jeder Seite**
  (helle Seite reißt in den dunklen Footer) und an der **oberen Hero-Kante**. Globale Klasse
  `.band-rip.band-rip-top`, eindeutige SVG-Filter-IDs je Instanz. Reiner Code/CSS → kein Re-index.
  Build grün (29 Seiten).

## 2026-06-06 — TEIL 10: CMS-Orientierung „Du bist hier"-Banner (Sammel-Auftrag 1–10 komplett)
- Neue Info-Komponente `SectionBanner`: oben in jeder Sektion ein Klartext-Banner „📍 Du bist hier:
  📖 Stories – Beitrag" o. ä. Reines Info-Feld (kein Eingabefeld, ruft nie onChange) → **schreibt
  nichts in die Daten**, nur ein Schema-Feld fürs Rendern. Per Skript in alle 12 Collections als
  erstes Feld eingefügt (Label je Collection). Ergänzt Tinas native Breadcrumb + aktiven Menüpunkt.
- ⚠️ Schema (12× `ww_here`) → tina-lock neu (deterministisch) → **Re-index + Rebuild.** Build grün
  (29 Seiten); „Du bist hier" + 📍 im Admin-Bundle verifiziert. Commit: `42d90fb`
- **Damit ist der Sammel-Auftrag TEIL 1–10 vollständig.**

## 2026-06-06 — Fix TEIL 8: leere GraphQL-Abfrage („Unexpected <EOF>")
- Bug aus `afa1b80`: TripsContent rief eine 2. `useTina` mit `query:''` auf, wenn keine Settings-Props
  da waren (Detail-Route `/trips/<slug>`, die das CMS beim Öffnen einer Reise nutzt) → leere GraphQL-
  Abfrage → CMS-Fehler „Syntax Error: Unexpected <EOF>". Fix: Settings-`useTina` jetzt in eigener
  Kind-Komponente `<MapStyleWatcher>`, die NUR mit echtem Query gerendert wird (bedingtes Rendern statt
  bedingtem Hook); Live-Stil als State, sonst statischer Build-Prop. Kein Schema-Touch. Commit: `3ac99e3`

## 2026-06-06 — TEIL 8: Kartenstil-Sofortvorschau im CMS
- `TripsContent` liest den Kartenstil jetzt **live** aus `reisen_settings` (2. useTina, durchgereicht
  von `trips.astro` DE/EN). Bei Stilwechsel im CMS wird die bestehende Karte per `map.setStyle()`
  umgestylt (statt neu gebaut) → sofortige Vorschau. DOM-Marker überleben `setStyle`; danach nur
  `setMapLanguage` auf `styledata` neu. Fallback auf Build-Prop → statische Besucher-Seite unverändert.
- Reiner Komponenten-/Astro-Code → **tina-lock unverändert, KEIN Re-index.** Build grün (29 Seiten).
  Commit: `afa1b80`

## 2026-06-06 — Fix Build: tina-lock nach TEIL 7 neu generiert (war stale)
- Cloudflare-Builds brachen ab („local schema doesn't match remote", auch nach Re-index 11:39).
  Ursache: Das committete `tina-lock.json` war nach der TEIL-7-Änderung **nicht regeneriert**.
  Die Story-EN-Felder bekamen eigene `ui`-Komponenten (`excerpt_en`: `'textarea'` → custom;
  `title_en`/`category_en`: Komponente ergänzt) — **das ändert das Lock-Schema** (`ui.component`
  schlägt sich im Lock nieder, anders als angenommen). Lock via `tinacms dev --no-server` neu
  erzeugt (deterministisch, 2× gleicher Hash). Commit `010145a`.
- **Lehre (wichtig):** Lock NACH **jeder** `tina/config`-Änderung neu erzeugen — auch bei reinen
  `ui.component`-Änderungen. Nicht nur bei neuen Feldern/Typen.

## 2026-06-06 — TEIL 7: EN-Felder im CMS dezent in Erdtönen abheben
- `EnglishOnlyField`/`-TextField`: linker Akzentstreifen (`#b08a5e`) + zarte warme Tönung (`#f6efe1`)
  + 🌐-Label → englische Felder auf einen Blick von den deutschen unterscheidbar. Greift bei allen
  Collections mit EnglishOnlyField (Einstellungen, Equipment, Über uns, Kontakt, Alben, Startseite, Reisen).
- Story-Beiträge (eigener `has_english` statt Sprach-Schalter): neue Variante `EnglishStyledField`/
  `-TextField` (immer sichtbar + gleiche Markierung) auf Title/Category/Excerpt (EN). Body (EN) = Rich-Editor, unverändert.
- Rein kosmetisch → **tina-lock unverändert, KEIN Re-index.** Build grün (29 Seiten). Commit: `4f46ea3`

## 2026-06-06 — CMS: fehlendes Emoji vor „Stories"-Collection ergänzt
- Story-Collection-Label `Stories` → `📖 Stories` (Einstellungen hatte das 📖 schon, die Beiträge-
  Collection nicht). Reines Label → **kein Re-index**, tina-lock unverändert.

## 2026-06-06 13:13 — Gear: ganze Liste vs. Gruppe + Stationsfenster-Rahmen am Wrap (Clipping-Fix)
- **Gear-Reichweite:** neue CMS-Einstellung **`gear_scope`** (whole | groups) — EIN Block um die ganze
  Liste ODER je Kategorie ein Block. CSS scope-fähig (card + notes je Reichweite). **Field-Notes als
  EIN ganzer Zettel** (whole): ein Kraftpapier-Block um die ganze Liste, eine Rand-Linie, Häkchen je
  Eintrag. Standard auf Nutzer-Wunsch: `gear_style=notes` + `gear_scope=whole`.
- **Stationsfenster (äußerer Rahmen):** Ursache des „unfertigen" Rahmens war, dass `.trip-detail-wrap`
  (`overflow:hidden`) den Schatten der inneren `.trip-detail` **abschnitt**. Rahmen+Schatten daher auf
  den **Wrap** gelegt (eigener Schatten wird nicht geclippt) → sieht jetzt aus wie die anderen Boxen und
  hängt weiter am globalen Schalter (`--ww-ring/--ww-shadow`). Eigener Inset-Versuch wieder entfernt.
- ⚠️ Schema-Feld `gear_scope` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten).
- Commit: `c34ade0`
- **Klarstellung (online-Stand):** `origin/astro-umbau` war bei `c5241f9` — die große Überarbeitung +
  Feedback-Runde 1 (bis `edb4234`) waren bereits online. Frühere „Deploy ist veraltet"-Annahme war falsch
  (per `curl` korrigiert). Das Stationsfenster-Frame-im-Frame war der echte Live-Stand, nicht veraltet.

## 2026-06-06 12:49 — Stationsfenster = eine Karte + Gear-Listen-Stile (CMS-Option)
- **Stationsfenster (Reisen):** kein Rahmen-im-Rahmen mehr — das innere Stationsfoto (`.trip-detail .ph`)
  aus der Schatten-Liste genommen; nur das äußere Panel (`.trip-detail`) ist gerahmt+erhaben, das Foto
  darin schlicht. Wie Story-Card (Vorbild). (`40faf3a`)
- **Gear-Seite:** neuer CMS-Stil **`gear_style`** (plain | card | notes), Standard **card**.
  - **card:** jede Kategorie eine ruhige erhabene Karte · **notes:** Field-Notes/Notizzettel
    (Kraftpapier-Ton, Rand-Linie, Häkchen je Eintrag) · **plain:** bisheriger schlichter Listenstil.
  - Eigener Schatten (unabhängig vom globalen Rahmen-Schalter), CMS-Vorschau-Feld `GearStyleField`
    (Mini-Vorschau je Stil). `GearContent` setzt `.gear-list gear-style-<stil>`. (`40faf3a`)
- ⚠️ Schema-Feld `gear_style` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten).

## 2026-06-06 12:42 — Fix: Kontakt-Textfeld wächst wieder mit + Insta-Handle a3.flow
- **Kontakt-Nachrichtenfeld:** Auto-Wachstum (1:1-Port von `wwGrowMsg`/Live) in `ContactContent` —
  wächst mit dem Inhalt bis 300px, dann interner Scroll. War in der Astro-Version verloren.
- **Instagram-Handle** `a3_flow` → **`a3.flow`** in `home-settings.json` (Intro) + `contact.json`
  (Label + URL). Hinweis: `a3.flow` war nie im Repo (alte Live-Daten + neue trugen immer `a3_flow`)
  → nichts „zurückgerutscht", sondern erstmals korrekt gespeichert.
- Build grün. Commit: `d2eff59`

## 2026-06-06 11:53 — TEIL 6 Feedback-Runde: alle Kästchen + einheitliche Hover + Über-uns-Riss
- Weiteres Nutzer-Feedback (Story-Card = Vorbild für Hover/Rahmen):
  - **Entdecken-Kacheln** (`.teaser`): Rahmen+Schatten + Hover-Erhebung (vorher ohne).
  - **Instagram-/Social-Buttons** (`.insta-link`): Rahmen+Schatten (hell + dunkle Variante) + Hover.
  - **Momentaufnahmen/Portfolio-Kacheln-Hover** an Vorbild-Schatten angeglichen.
  - **Stations-Pills unten** (`.trip-stoplist button`) sehen jetzt aus wie die Reise-Tabs (Rahmen aus
    Stufe + Hover-Erhebung + aktiv).
  - **Stationsfenster** (`.trip-detail`): Alt-Rahmen raus, Rahmen+Schatten aus der Stufe.
  - **Hero-CTAs:** einheitliche Hover-Animation (auch der ghost-Button hebt sich gleich an).
  - **Portfolio-Album-Hover** als CMS-Schalter **`album_hover`** (Standard an; nur geschlossene Alben).
  - **Über uns:** neue `PaperRip`-Komponente (Hero-Riss 1:1, eindeutige Filter-IDs) — dunkle
    Profil-Box bekommt oben + unten die gerissene Papierkante (wie der Hero-Übergang).
- ⚠️ Schema-Feld `album_hover` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten);
  body-Klassen (strong/controls/album-hover), alle 7 CSS-Regeln + Über-uns-Risse verifiziert.
- Commit: `edb4234`
- **Hinweis:** Merge-Konflikt in `appearance-settings.json` aufgelöst (CMS-Wahl `image_frame: strong`
  behalten + `frame_controls` ergänzt; Tina-Commit `8677cbe`).

## 2026-06-06 10:45 — TEIL 6 überarbeitet: einheitliches Box-System (alle Kästchen) + CMS-Vorschau
- Nutzer-Feedback: nicht alle Felder hatten Rahmen/Schatten, Rahmendicken ungleich, dunkle
  Bereiche, Hover-Signal + CMS-Vorschau gewünscht. Umgesetzt:
  - **Einheitliches, stufengesteuertes System** (global.css am Datei-Ende → überschreibt Alt-Rahmen):
    EINE Quelle → **gleiche Rahmendicke pro Stufe** (0/1px/2px) + warmer Schatten. Variablen
    `--ww-ring/--ww-shadow` (hell) + `--ww-ring-d/--ww-shadow-d` (dunkel: helle Linie + weicher
    dunkler Schatten, für Über-uns/Hero/Footer).
  - **Reichweite jetzt ALLE Kästchen:** Aktuell-/Stories-Karten, Portfolio-/Album-/Moments-/
    Entdecken-Kacheln, Album-Diashow, Story-Album-Kacheln, Stations-/Beitragsbilder, **Reise-Tabs**,
    **Karten-Container** (`.map-box`), **Personen-Karten** (dunkle Variante).
  - **Hover-Erhebung** (Klick-Signal) auf Reise-Tabs + Kacheln.
  - **Buttons/CTAs + Kontakt-Eingabefelder** hinter neuem CMS-Schalter **`frame_controls`** (Standard
    an); **Hero-CTAs mit durchsichtigem Schatten** (Hero-Bild scheint durch).
  - Dekorative Alt-Rahmen (`.story-card/.person/.trip-tabs`) entfernt → Rahmen kommt einzig aus der
    Stufe (keine ungleichen Dicken mehr).
  - **CMS-Vorschau (iOS-Stil):** `image_frame` nutzt `ImageFrameField` — pro Stufe eine Mini-Vorschau
    (Foto-Kachel + Button) mit echten Rahmen/Schatten-Werten, klickbar.
- ⚠️ Schema-Feld `frame_controls` → tina-lock neu → **Re-index + Rebuild.** Build grün (29 Seiten);
  body-Klassen + alle CSS-Regeln (hell/dunkel/gate/hero/tabs/hover) verifiziert.
- Commit: `5c0cb50`

## 2026-06-06 10:06 — TEIL 6: Bild-Rahmen & Schatten (3-Stufen-CMS-Einstellung, global)
- Neue Darstellungs-Option **„Bild-Rahmen & Schatten"** (`darstellung.image_frame`:
  `none|soft|strong`), **Standard `soft` (ausgewogen)** — bewusste Abweichung von der Live-Seite
  (flach), nach dem Muster „Standard an, im CMS abschaltbar".
  - **Keine:** flach (wie Live) · **Ausgewogen:** zarte warme Linie + weicher Schatten ·
    **Kräftig:** deutliche Linie + tiefer Schatten.
- `BaseLayout` setzt `<body class="ww-frame-*">` aus dem Setting; `global.css` definiert je Stufe
  die warm getönte Variable `--ww-frame` (Inset-Ring als Rahmen ohne Layout-Sprung + Schlagschatten).
- Angewendet auf die gerundeten Foto-Wrapper: Story-/Latest-Cards, Portfolio-/Album-/Moments-Kacheln,
  Album-Diashow, Story-Album-Lightbox-Kacheln, Personen- + Stations-Fotos, Beitragsbilder.
  **Hero/Lightbox/Karte bewusst ausgenommen** (nicht in der Selektor-Liste).
- ⚠️ Schema-Feld → **tina-lock neu → Re-index + Rebuild nötig.** Offline-Build grün (29 Seiten);
  body-Klasse, beide Stufen-Variablen + Selektor-Liste (ohne Hero/Lightbox) im CSS verifiziert.
- Commit: `77bf13f`

## 2026-06-06 09:47 — TEIL 5: Karten-Scroll-Zoom als CMS-Schalter (Standard AN)
- Neuer Schalter **„Karte: Mit Mausrad zoomen"** in den Reisen-Einstellungen
  (`reisen_settings.map_scroll_zoom`), **Standard AN** — bewusste Abweichung von der Live-Seite
  (die Scroll-Zoom aus hat), auf Nutzer-Wunsch („Standard ein, im CMS abschaltbar").
  - **AN:** `cooperativeGestures:false` + `scrollZoom.enable()` → Mausrad zoomt die Karte direkt
    (am Handy bewegt 1 Finger die Karte).
  - **AUS:** `cooperativeGestures:true` + `scrollZoom.disable()` → Mausrad scrollt die Seite, am
    Handy 2 Finger für die Karte — exakt das bisherige/Live-Verhalten.
- `TripsContent` bekommt `scrollZoom`-Prop (aus `trips-settings.json`, Default `true`); `trips.astro`
  + `en/trips.astro` verdrahtet. (Der Prototyp `TripMapProto.tsx` bleibt unverändert.)
- ⚠️ Schema-Feld → **tina-lock neu → Re-index + Rebuild nötig.** Offline-Build grün (29 Seiten);
  enable/disable/cooperativeGestures + Default (`!== false`) im Bundle verifiziert.
- Commit: `2879c11`

## 2026-06-05 21:30 — Stories-Feedback: Album-Vorschau live, Mediathek, Inline-Lightbox
- Drei Punkte aus dem Nutzer-Test der Album-Funktion:
  1. **Album-Block in Live-Vorschau:** war nur beim Seitenbau aufgelöst → im Editor nur roher
     `[[album]]`-Marker sichtbar. Auflösung jetzt **direkt in der Insel** aus den useTina-Daten
     (`linked_album` ist im Tina-Fragment mit name/photos/_sys expandiert) → Block erscheint
     **sofort** in der Vorschau an der Marker-Stelle. `storyAlbum.ts` + `album`-Prop der
     Astro-Seiten entfernt (überflüssig).
  2. **Mediathek (wie Sveltia):** neuer Knopf „🖼️ Aus Mediathek wählen" in StoryBodyField →
     Raster ALLER vorhandenen `/uploads`-Bilder (build-generiertes `public/uploads-manifest.json`,
     `scripts/gen-uploads-manifest.mjs` im build-Script) → Klick fügt `![](pfad)` ein, **kein
     erneuter Upload**.
  3. **Inline-Bilder im Beitrag** öffnen jetzt als blätterbare Gruppe die bestehende **Lightbox**
     (1:1 wie Live `index.html` ~2883: alle `.reader-body img`). Album-Kacheln ausgenommen.
- **Kein Schema-Feld geändert → tina-lock unverändert, KEINE zusätzliche Re-index** (über die
  bereits offene vom Vor-Commit hinaus). Offline-Build grün (29 Seiten, Manifest 22 Bilder);
  Album-Positivfall verifiziert (Zitat → Album-Block → Absatz danach), Test zurückgesetzt.
- Commit: `1cc96fc`

## 2026-06-05 20:55 — Stories: Album verknüpfen + frei im Text als Lightbox einbetten
- **Neues Feature** (über Live hinaus, mit Nutzer-Freigabe; Live-Stories haben KEINE Galerie —
  nur Titelbild + Markdown-Fließtext mit Inline-`![](…)`). Ziel: 1–2 Bilder direkt im Text +
  ein bestehendes Album an frei wählbarer Stelle als Lightbox einbetten, **ohne Doppel-Upload**.
- **`StoryBodyField.tsx`** (neu): eigener Haupttext-Editor, laientauglich. Zwei Knöpfe über dem
  Textfeld — „📷 Bild einfügen" (Auto-WebP-Upload via jSquash an die Cursor-Stelle, kein
  Media-Manager/kein „?") + „📸 Album hier einfügen" (setzt `[[album]]`-Platzhalter an Cursor).
  Gespeichert bleibt **normales Markdown** → mdToHtml-Port unverändert (Capability-Lock-sicher).
- **Schema:** Story `body_de`/`body_en` auf StoryBodyField; neues **`linked_album`** (Tina-
  `reference` auf Sammlung `alben`, Dropdown); altes Story-**`gallery`**-Mehrfach-Upload-Feld
  **entfernt** (war der Doppel-Upload). Fotos kommen aus dem Album selbst.
- **`StoryAlbumBlock.tsx`** (neu): Vorschau-Kacheln (erste 4 + „+N") → öffnet die bestehende
  `Lightbox` mit allen Album-Fotos. **`StoryReaderContent`** teilt den Body am `[[album]]`-Marker
  und rendert den Block dort (ohne Marker, aber mit Album → ans Ende). **`storyAlbum.ts`** (neu)
  löst die Referenz robust auf; Astro DE/EN übergeben `album`. CSS für den Block im Reader-Stil.
- ⚠️ **Schema-Änderung → tina-lock + Codegen neu → Tina-Cloud-Re-index + Cloudflare-Rebuild nötig.**
  Offline-Build grün (29 Seiten); positiv getestet (Block an Marker-Stelle, 4 Kacheln + „+4",
  Album-Link, kein Marker-Leak, kein Block ohne Album), Test-Verknüpfung zurückgesetzt.
- Commit: `053ffeb`

## 2026-06-05 — TEIL D Slice 2/3 + Crop-Feld als String (Stationen, Fixes)
- **Slice 2:** CropPhotoField auf **Reise-Stations-Titelbild** (cropRatio 16:10); trip-JSONs +
  lib/trips (`photoDisplay`/`photoFull`) migriert. Commits `46eca37`, `25b363b`.
- **Crop-Feld Objekt → String** (`15bec1e`): Tina rendert Objekt-Felder als navigierbare Gruppe →
  beim Reinklicken erschienen rohe Unterfelder (Original/Anzeige/Crop) mit „?". Wert jetzt
  String (JSON-Blob oder reiner /uploads-Pfad) → Editor rendert **immer inline**, kein „?".
  Person- + Stations-Foto umgestellt; Daten + lib/trips angepasst.
- **Story-Titelbild** auf SinglePhotoField (`2cd1852`) — umgeht den Media-Manager („?").

## 2026-06-05 — TEIL D Slice 1: Zuschnitt-Foto-Feld (CropPhotoField)
- Option D (freies Zuschneiden, Original behalten), 1. Slice: `CropPhotoField.tsx` — gerahmtes
  Einzelbild mit Zoom + Verschieben (touch: Ziehen=pan, Pinch/Regler=zoom; WYSIWYG-Rahmen).
  „Übernehmen" brennt die Anzeige-WebP via jSquash. Wert = Objekt `{original, display, crop}`
  (Original bleibt für Lightbox/Neu-Zuschnitt; `display` = eingebrannter Zuschnitt → Besucher
  1:1 auf jedem Gerät). Ratio aus `field.cropRatio` (Default 4/3).
- Angewandt auf **Über-uns-Personen-Foto** (image→object, cropRatio 4/3); about.json migriert;
  AboutContent liest `display||original`. `.person .ph` = 4/3 ohne Mobile-Override → 1:1.
- ⚠️ Schema-Änderung → tina-lock neu → **Re-index + Rebuild**. Build grün. **Pilot — iPad-Test,
  dann Ausrollung auf Stationen/Hero/Stories.** Commit `e3564b3`.

## 2026-06-05 — Startseite live-editierbar + Equipment-Klickfix
- **Equipment:** `data-tina-field` saß auf der ganzen Ausrüstungs-Liste → Klick fokussierte das
  `items`-Feld (wirkte wie „+ hinzufügen"). Jetzt pro `gear-row` (`tinaField(it)` → `gear.items.N`),
  wie bei den Stationen → Klick öffnet genau diesen Eintrag. (`committed`)
- **Startseite live:** war als einzige „form-only". Neue useTina-Inseln `HomeHeroLive`,
  `HomeIntroLive`, `HomeSectionHead` (1:1-Port von HomeHero/HomeIntro.astro — gleiche Klassen/
  Markup/Effekte, Diashow per useEffect, Rip-SVG) + `data-tina-field` auf Headline/CTAs/Intro/
  Sektion-Köpfe. `index.astro` (+en) holen `client.queries.startseite`; startseite bekommt
  `ui.router: () => '/'`. Alte HomeHero/HomeIntro.astro entfernt. tina-lock unverändert (kein
  zusätzlicher Re-index). Build grün, HTML 1:1 DE+EN. (`a9f9303`)

## 2026-06-05 — Rollout: zweisprachige Felder flach (ganze Seite)
- Pilot-Ansatz (flache `*_de/*_en` statt `object{de,en}`) auf ALLE Inhalte ausgerollt: Reisen
  (Meta, Zusammenfassung, Stationen Titel/Datum/Text, Galerie-Caption), Über uns (Kopf, Personen
  Rolle/Bio/Gear, „Warum die USA?"), Kontakt (Kopf, Direkt-Block, Standort, Formular-Labels),
  Equipment (Kopf + neuer Sprach-Schalter), Startseite (Hero-Headline/CTAs, Intro, Sektion-
  Überschriften), Album-Notiz.
- Werkzeuge: `scripts/flatten-bilingual.mjs` (Daten, 166 Felder/11 Dateien, nested + Listen),
  `scripts/flatten-config.mjs` (30 einzeilige Schema-Felder); About/Equipment von Hand.
- Render: neuer Helfer `bi(obj,base,lang)` (lib/trips + lib/albums) + `tf()` je Insel →
  `data-tina-field` zeigt auf das Feld der aktiven Sprache (kein DE/EN-Untermenü mehr).
  Angepasst: TripsContent, AboutContent, ContactContent, GearContent, AlbumContent,
  GalleryContent, HomeHero, index/en-index, lib/home, lib/trips, Page-Titles, trips/[slug]
  (war seit Pilot leer → gefixt). EN-Felder via EnglishOnlyField (bei „Nur Deutsch" aus).
- ⚠️ Schema-Änderung → tina-lock neu → **Tina-Cloud-Re-index + Cloudflare-Rebuild nötig.**
  Offline-Build grün (29 Seiten); HTML DE+EN geprüft. **Wartet auf Live-Abnahme.**
- Commit: cd8383c

## 2026-06-05 — Fixes aus der Live-Prüfung: EN-Ausblenden, „?"-Thumbnails, Reise-Wechsel
- **EN-Felder bei „Nur Deutsch" ausblenden** (`ff0aa52`): die letzten immer-sichtbaren plain-EN-
  Felder „Album-Name (Englisch)" + „Reise-Titel (Englisch)" an `EnglishOnlyField` gehängt →
  verschwinden bei „Nur Deutsch". Nur UI, kein Re-index.
- **„?"-Thumbnails in den Foto-Feldern** (`186c35e`): Bearbeiten-Vorschau zeigte „?", weil Tina
  Cloud den /uploads-Pfad fürs Anzeigen auf `assets.tina.io/<id>/…` umschreibt (404, repo-basierte
  Bilder). Neuer Helfer `tina/fields/mediaPath.ts` (`toLocalMedia`) biegt nur für die ANZEIGE auf
  `/uploads/` zurück; in SinglePhotoField + BulkPhotoField (Kacheln + Drag-Overlay). Website war nie
  betroffen (nutzt normalizePath). Nur UI, kein Re-index.
- **Reise-Wechsel in der Live-Vorschau** (`c7324e1`): Tina fängt `click` auf data-tina-field per
  Capture + stopPropagation ab → der Reise-Tab-`onClick` feuerte nicht, Stationen blieben gleich.
  Tina fängt aber nur `click`, nicht `mousedown` → Tab-Wechsel im Editor zusätzlich per
  `onMouseDown` (nur inEditorRef; öffentliche Seite unverändert). Tinas paralleler Klick wählt das
  Reise-Titel-Feld → Formular folgt der Reise. Nur Insel, kein Re-index.

## 2026-06-05 — Teil B-Pilot: zweisprachige Settings-Felder flach (kein Klick-Untermenü)
- Problem (Live-Wahrheit): Klick in der Vorschau auf ein Objekt-Feld {de,en} öffnet bei Tina
  zwangsläufig ein Unterformular (`getActiveField` navigiert in die Gruppe). Lösung (Option 1):
  zweisprachige Felder flach machen → Klick springt direkt ins Freitextfeld.
- **Pilot** auf den drei „… – Einstellungen" (Portfolio/Stories/Reisen): kicker/title/intro je
  object{de,en} → flache Strings `kicker_de/kicker_en` usw. Neues Feld `EnglishOnlyField`/
  `EnglishOnlyTextField` (blendet sich bei „Nur Deutsch" komplett aus). Daten migriert,
  `SettingsHeader.tsx` + Seiten-`<title>` (DE+EN) auf flache Keys; data-tina-field → Feld der
  aktiven Sprache.
- **Schema-Änderung → tina-lock neu** (`npx tinacms dev --no-server`). **Braucht Tina-Cloud-
  Re-index + Cloudflare-Rebuild.** Offline-Build grün; SSR-HTML DE & EN ok.
- Dateien: `web/tina/fields/EnglishOnlyField.tsx` (neu), `web/tina/config.ts`, `tina-lock.json`,
  `web/src/data/{gallery,stories,trips}-settings.json`, `SettingsHeader.tsx`, 6 Settings-Seiten.
- Commit: 8850f59 — **Pilot, wartet auf Live-Abnahme** bevor Ausrollung auf Reisen/Über uns/
  Kontakt/Equipment/Startseite.

## 2026-06-05 — Teil 9: CMS-Benennung „Portfolio"
- Labels an Website-Nav angeglichen: „🖼️ Alben" → „🖼️ Portfolio Alben", „🖼️ Galerie –
  Einstellungen" → „🖼️ Portfolio". Nur Labels → tina-lock unverändert, kein Re-index.
- Commit: 79d4956

## 2026-06-05 — Teil 3B (richtig): Live-Vorschau für Galerie-/Stories-/Reisen-Einstellungen
- Statt nur Router: die Kopf-Blöcke (Kicker/Titel/Intro) dieser drei Settings-Seiten sind jetzt
  eine **useTina-Insel** (`SettingsHeader.tsx`, generisch via `docKey`-Prop, `t()` repliziert
  `tl()`-Fallback EN→DE). Dadurch registriert die Seite ein Tina-Formular → Bearbeiten +
  Live-Vorschau (Klick-zum-Feld via `data-tina-field`, Sofort-Update beim Tippen). Erst danach
  Router wieder gesetzt: galerie_settings→/portfolio, stories_settings→/stories,
  reisen_settings→/trips.
- Verdrahtet auf `/portfolio`, `/stories`, `/trips` **und** den `/en/`-Pendants (lang-Prop).
  Astro rendert die Insel vor → Besucher sehen identisches HTML (in dist verifiziert: Kopf-Text
  + data-tina-field, DE & EN).
- **Startseite/Highlights/Darstellung bleiben bewusst form-only OHNE Router** (Zielseite `/` ist
  Astro-Komposition Hero/Teaser/Toggles; echte Live-Vorschau = halber Homepage-React-Umbau).
- Dateien: `web/src/components/SettingsHeader.tsx` (neu), `web/src/pages/{portfolio,trips}.astro`,
  `web/src/pages/stories/index.astro`, `web/src/pages/en/{portfolio,trips}.astro`,
  `web/src/pages/en/stories/index.astro`, `web/tina/config.ts`. tina-lock unverändert → kein
  Re-index. Build grün (29 Seiten).
- Commit: 1acab68

## 2026-06-05 — Fix: Teil-3B-Router zurückgerollt (Settings-Editoren waren leer)
- Ursache: ein `ui.router` schaltet eine Collection in Tinas Visual-Editing-Modus; die
  Seitenleiste zeigt dann nur Formulare, die die Ziel-Seite per `useTina` registriert. Die
  Einstellungs-Seiten rendern statisch → kein useTina-Formular → „Looks like there's nothing
  to edit on this page", Bearbeiten-Formular verschwindet (Darstellung u. a.).
- Die sechs Settings-Router aus `2cb01d9` entfernt → Editoren wieder normal. Inhalts-Router
  (Gear/About/Kontakt/Alben/Reisen/Stories) unberührt. 3A („Zur Website") bleibt.
- Echtes 3B braucht useTina-Verdrahtung der Settings-Dokumente (separat). `tina-lock`
  unverändert, kein Re-index. Build grün (29 Seiten).
- Commit: fda8a94

## 2026-06-05 — Sammel-Auftrag Teil 3B + 3A: CMS-Vorschau überall + Zurück-Navigation
- **3B (Vorschau-Fenster auf jeder CMS-Seite):** allen Einstellungs-Collections (Startseite,
  Galerie-/Stories-/Reisen-Einstellungen, Highlights, Darstellung) einen `ui.router` auf die
  passende Live-Seite gegeben (→ `/`, `/portfolio`, `/stories`, `/trips`). Vorher hatten nur die
  Inhalts-Collections eine Vorschau. Router = reine UI-Funktionen → **kein** Schema-Eingriff,
  `tina-lock.json` unverändert, **kein** Tina-Cloud-Re-index nötig.
- **3A (Zurück-Navigation):** (a) edit→Übersicht via Tinas nativer Breadcrumb; (b) CMS→Website
  neuer Seitenleisten-Menüpunkt „Zur Website" (Kategorie „Site") — ScreenPlugin
  (`tina/screens/BackToSiteScreen.tsx`) per `cmsCallback`+`cms.plugins.add` registriert
  (createScreen ist nicht öffentlich exportiert → Objekt `__type:'screen'` selbst gebaut),
  leitet sofort nach „/" weiter (Fallback-Link inkl. „neuer Tab").
- Dateien: `web/tina/config.ts`, `web/tina/screens/BackToSiteScreen.tsx` (neu). Offline-Build
  grün (29 Seiten). (B) in `IDEEN.md` §5 dokumentiert.
- Commit: 2cb01d9 (3B), 5276b22 (3A)

## 2026-06-05 — Sammel-Auftrag Teil 3C: Admin-Leiste auf der Website (B)
- `SiteAdminBar.astro` (Vorbild Sveltia `.ww-admin-bar`): fixe Leiste oben (Erdtöne/dunkel),
  „Als Admin angemeldet · CMS öffnen · Abmelden". Erscheint **nur**, wenn (1) Schalter
  „🎨 Darstellung → Admin-Leiste" an **und** (2) im Tina-CMS angemeldet (localStorage-Token-
  Erkennung, gleiche Origin). **Standard AUS.** Abmelden löscht Tina-Token + Reload.
- `show_admin_bar` in `appearance-settings` + Darstellung; BaseLayout rendert die Bar nur bei
  Schalter an; CSS schiebt Header/Body bei aktiver Bar nach unten. `tina-lock` regeneriert.
- (B) in `IDEEN.md` §5 dokumentiert. Lokaler Build grün (29 Seiten); Default-aus + Toggle-an verifiziert.

## 2026-06-04 — Sammel-Auftrag Teil 2-Folge: ABNAHME-Punkte A–D
- **A:** Fehlendes `IMG_5618.webp` raus — die Test-Galerie der Story „Utah-Drohne-Kevin" ganz
  entfernt (`gallery: []`), da das Live-Original keine Galerie hat (2 von 3 Bildern fehlten).
- **B:** Test-Station „Anchorage" (`ANC`) + untracked `IMG_5534.webp` (auch in Station-1-Fotos)
  aus `alaska2026.json` entfernt.
- **C:** **Stories-Seitentitel ins CMS** (Einheitlichkeit) — `stories-settings.json` + Tina
  „📖 Stories – Einstellungen" (Kicker/Titel/Einleitung DE/EN); `/stories`(+`/en`) liest sie
  (vorher fest verdrahtet).
- **D:** **Kontakt-Seite an-/abschaltbar** wie Stories — `show_contact` in 🎨 Darstellung;
  Kontakt-Link in Nav + Footer gated (Standard an). Formular-Versand (W5) bleibt später.
- `ABNAHME.md` entsprechend abgehakt. Lokaler Build grün (29 Seiten), keine Leftover.

## 2026-06-04 — Sammel-Auftrag Teil 1: Alaska-Titel 1:1 wie Live
- **Befund (Live-Wahrheit):** Live hängt KEIN Tab-Suffix an (`buildTripTabs` nimmt den Titel
  wörtlich); „· bald ✦" steht dort im Titel-**Text** (CMS). `upcoming` steuert live nur
  Aktuell/Entdecken. Unsere Astro-Seite hatte eine **(B)-Abweichung** (auto-Suffix in
  `TripsContent`) → zusammen mit „· soon" im migrierten Titel ergab das „Alaska 2026 · soon · bald ✦".
- **Fix (Nutzer wählte Option a = 1:1 Live):** Auto-Suffix-Zeile in `TripsContent.tsx` entfernt
  (Tab zeigt exakt den CMS-Titel); Alaska-Titel auf saubere Basis „Alaska 2026" gesetzt
  (Zusatz tippt der Nutzer selbst im CMS). `upcoming`-Flag bleibt (nur Aktuell/Entdecken, wie Live).
  Lokaler Voll-Build grün (29 Seiten); Tab = „Alaska 2026" DE+EN verifiziert.

## 2026-06-04 — CMS aufgeräumt (Test-Reste, Reihenfolge, Anzeigenamen)
- **A (`cec1ee1`):** Test-Reste raus — `proto_ort`-Collection, `album-proto.json`/`trip-proto.json`,
  `src/content/proto/`, Seiten `proto-karte`/`proto-lightbox`/`stilprobe`.
- **B (`ed66655`):** Collections in **Nav-Reihenfolge** (links→rechts = oben→unten): Startseite →
  Alben → Galerie-Einstellungen → Stories → Reisen → Reisen-Einstellungen → Equipment → Über uns →
  Kontakt → Highlights → Darstellung.
- **C (`eb663e8`):** **Anzeigenamen** in der CMS-Liste — Reise-`title` & Album-`name` von
  `{de,en}`-Objekt auf **String** (DE, `isTitle`/`required`) + `*_en` umgestellt → Tina zeigt jetzt
  den echten Reise-/Album-Namen als Label (Dateiname klein darunter) statt überall „🧭 Reisen"/
  Dateiname. Daten migriert (5 Reisen + 2 Alben); Helfer `albName()`/`tripTitle()`; alle Lese-Stellen
  umgestellt. `astro build` grün (29 Seiten, 3 Test-Seiten entfernt).
- ⚠️ **Schema geändert** → nach dem Push **astro-umbau auf Tina Cloud neu indexieren** (Re-Index).

## 2026-06-04 — Startseite Etappe 4: Social-Links (Startseite komplett)
- **`8ea67c2`:** Social-Links im Intro-Block (1:1 aus `renderHeroSocial`): `insta-row` mit
  Alexandra/David (`@a3_flow`/`@davidbastisch`). `socialUrl()` in `socialIcons.ts`. CMS:
  Social-Liste (Plattform + Username) im „🏠 Startseite"-Intro. CSS 1:1. `astro build` grün.
- **Startseite damit vollständig** (Hero + Intro + Momentaufnahmen + Aktuell + Entdecken + Social).
  Alle großen Sektionen portiert → als Nächstes **Cutover/Audit**. `index.html` unberührt.
- **Social-Platzierung (`75ffe57`):** Insta-Links jetzt wahlweise in **Intro / Hero / Footer**,
  je per CMS-Schalter („🏠 Startseite → Social-Links anzeigen — wo?"). Standard: nur Intro (wie Live).

## 2026-06-04 — Startseite Etappe 3: Home-Teaser + Intro (+ Bilder-Fixes)
- **Bilder online (zwei Fixes):** `copy-uploads.mjs` im Build (Wurzel-`/uploads` → `web/dist`)
  + `normalizePath` biegt Tina-Cloud-URLs (`assets.tina.io/<id>/<datei>`) zurück auf `/uploads/<datei>`
  (Query-getriebene Inseln zeigten sonst `?`). 2 echt fehlende Dateien bleiben (IMG_5534/IMG_5618).
- **Etappe 3 (`2b369bb`, Capability-Lock T1–T7):** `lib/home.ts` (buildMoments/Latest/Discover am
  Build aus Alben/Reisen/Stories + Highlights). `HomeIntro.astro` (Zwischenüberschrift + ✦ + Text),
  `HomeMoments.tsx` (bis 6, Klick → Lightbox, mischt beim Laden), `HomeLatest.astro` (Top-3 nach
  Datum), `HomeDiscover.tsx` (3 Teaser, mischt beim Laden). `index.astro`/`en` zeigen alle Sektionen.
  CMS: „⭐ Highlights" (`highlights.json`) + Intro/Sektion-Texte ins „🏠 Startseite". Teaser-CSS 1:1.
- **Zufall = Client-Shuffle** (lebendig, vom Nutzer gewünscht). `astro build` grün (32 Seiten).
- **Offen:** Abnahme; **Etappe 4 (Intro-Social-Row + Footer-Feinschliff)**. `index.html` unberührt.

## 2026-06-04 — Startseite Etappe 2: Hero + Deploy-Fix (Uploads)
- **Deploy-Fix (`<vor Hero>`):** `web/scripts/copy-uploads.mjs` im `build`-Script kopiert das
  Wurzel-`/uploads` nach `web/public/uploads` → Bilder landen im Astro-`dist` und werden auf
  Cloudflare ausgeliefert (vorher 404, weil der lokale Symlink gitignored ist). Lokal bleibt
  der Symlink.
- **Hero (`793bd10`, Capability-Lock H1–H8):** `HomeHero.astro` 1:1 aus `renderHero`/`.hero`:
  Medien-Umschalter (Einzelbild / Diashow 5 s Überblenden / Video autoplay+muted+playsinline +
  Poster), Hero-Logo (nur bei `show_hero_logo`), Headline (DE/EN), 2 CTAs (Portfolio + Stories-
  ghost nur bei `show_stories`), Scroll-Pfeil (bob), Rip-SVG, fadeUp-Animationen. `index.astro`
  + `en/index.astro` = echte Startseite; Stories-Liste → `/stories` (+`/en`). `home-settings.json`
  + Tina „🏠 Startseite" (Medien + Hero-Texte). CSS 1:1 in `global.css`. `astro build` grün (32 Seiten).
- **Profi-Politur (Nutzer „alles, aber CMS-schaltbar"):** 4 Schalter unter „🏠 Startseite →
  Politur" (Standard an, abschaltbar → 1:1): Ken-Burns-Zoom, stärkerer Verlauf, edle Fraunces-
  Headline, animierter Scroll-Cue; `prefers-reduced-motion` respektiert. Dokumentierte, gewünschte
  Abweichung vom Live-Stand.
- **Offen:** Abnahme; Etappe 3 Home-Teaser, Etappe 4 Intro/Social.

## 2026-06-04 — Startseite Etappe 1: Nav-Shell (Header/Footer/DE-EN)
- **Capability-Lock 0/A/B (`<dieser>`):** N1–N10 aus Live-`<header>/<footer>` extrahiert +
  eingefroren. Nutzer-Entscheid: Stories **ausgeblendet** (`show_stories=false`, CMS-schaltbar),
  Footer-Admin-Link **→ `/admin`**. Startseite wird in 4 Etappen gebaut (Nav-Shell → Hero →
  Teaser → Intro/Social).
- **Bau (`6a0a717`):** `SiteNav.astro` + `SiteFooter.astro` in `BaseLayout` (Slot jetzt in
  `<main>`). Sticky Header (Logo→Home, 7 Links, aktiver markiert), **DE/EN-Umschalter** →
  gleiche Seite in `/en` (echte Routen statt Live-`applyLang`-JS), Burger-Slide-in (mobil).
  Footer (Logo + 7 Links + Copyright + Admin→`/admin`). `appearance-settings.json` migriert
  (logo/show_hero_logo/show_discover/show_stories) + Tina „🎨 Darstellung". Nav/Footer-CSS 1:1.
- **In-Page-Edit-Stifte bewusst NICHT portiert** (Tina-Visual-Editing ersetzt sie).
- **Capability-Lock D:** N1–N10 ✅ (aktiv/DE-EN/Stories-versteckt im HTML verifiziert).
  `astro build` grün (30 Seiten). `/` zeigt noch die Stories-Liste (Home-Inhalt folgt Etappe 2/3).
- **Offen:** Abnahme; Hero/Teaser/Intro+Social. `index.html` unberührt.

## 2026-06-04 — Galerie/Alben portiert (Stufe 6, 🔴 letzter großer Brocken)
- **Capability-Lock 0/A/B (`9c1e178`, `4418426`):** Soll-Liste **A1–A17** aus echtem Live-Code
  extrahiert + eingefroren; URL **`/portfolio`**; Home-Teaser (Momentaufnahmen/Neueste/Entdecken)
  bewusst der **Startseite** zugeordnet (vorab analysiert, in `CAPABILITIES.md` festgehalten).
- **Daten/CMS (`a689726`):** 2 Alben → `src/data/albums` ({de,en}, `photos` flach),
  `gallery-settings.json`. `lib/albums.ts` (paletteFromString 6 Paletten, albumPhotos, sortAlbums
  = build-indexes.js-Logik, linkedAlbumsByTrip). Tina: Collections **🖼️ Alben** + **🖼️ Galerie –
  Einstellungen** (je ein Menüpunkt). `tina-lock.json` aktualisiert.
- **Bau (`450e8cf`):** `GalleryContent.tsx` (useTina/albenConnection): Modus-Leiste +
  Sichtbarkeit, Album-Karten mit **Auto-Diashow** (Snap-Bahn, Autoplay 4 s, ‹/›-Pfeile,
  Klick→Lightbox), **Flach-Modi** (Neueste/A–Z), Kacheln (Platzhalter + Hover-Name), Lightbox.
  `AlbumContent.tsx` (Album-Unterseite). Seiten `/portfolio` (+`/en`) + `/portfolio/<slug>`
  (+`/en`), Router → Live-Vorschau. Galerie/Album-CSS 1:1 in `global.css` (toter In-Place-Toggle
  weggelassen). **A15** Reise→Album-Link → `/portfolio/<slug>` (⚠️ statt ganze Galerie wie Live —
  passt zum Link-Text, bewusste Verbesserung).
- **Capability-Lock D:** A1–A17 ✅ (A3/A15 ⚠️ dokumentiert). `astro build` grün (**30 Seiten**).
- **Offen:** Seite-an-Seite-Abnahme durch Nutzer; Startseiten-Teaser (Momentaufnahmen/Neueste/
  Entdecken) + Highlights-CMS = nächste Sektion. `index.html` unberührt.

## 2026-06-04 — Reisen: Live-Vorschau (Visual Editing) + Karte live
- **Router bei Reisen wieder aktiv** (vorher entfernt, weil ohne `useTina` „nothing
  to edit"): `reisen`-Collection → `/trips?trip=<slug>`. `tina/config.ts`. Commit folgt unten.
- **`/trips` + `/en/trips` auf `reisenConnection`** (Tina-Client) statt `import.meta.glob`
  umgestellt → Daten kommen live über `useTina`. `TripsContent.tsx`: leitet Reisen aus der
  Connection ab (sortiert), Tab-Vorauswahl per `?trip=` (im Effect → kein Hydration-Mismatch),
  `data-tina-field` auf Tabs/Meta/Summary/Stationen (Titel/Datum/Text/Foto)/Galerie →
  Klick auf der Seite springt zum Feld + Live-Update beim Tippen. Commit `e2048c9`.
- **Karte live:** zweiter Effekt zeichnet Marker neu, sobald sich karten-relevante
  Stop-Daten ändern (Ortssuche/Titel/Datum/Name, per Signatur erkannt) — ohne Bahn/aktive
  Station/Viewport zurückzusetzen. Commit `96a3e67`.
- **Tab- & Station-Sync (`87f4be5`, ersetzt durch `99be405`):** Erst über `?trip=`-Query +
  Polling — verworfen, weil **Tina Query-Strings im Router ignoriert** (Vorschau hing auf
  Tab 0). **Finale Lösung (`99be405`):** echte **Pfad-Route `/trips/<slug>`**
  (`src/pages/trips/[slug].astro`, `getStaticPaths` über `reisenConnection`); Router der
  `reisen`-Collection → `/trips/<slug>`. Tab kommt aus `initialSlug`-Prop (Hydration-sicher)
  → die im CMS gewählte Reise wird zuverlässig angezeigt. **Station-Sync:** `.trip-slide`
  trägt jetzt das **Item**-`data-tina-field` → Scrollen öffnet die **GANZE Station**
  (Titel/Datum/Text/Bilder), nicht nur das Titel-Unterfeld; debounced 200 ms, nur im
  Vorschau-Iframe. Öffentliche `/trips` unverändert (Tab 0, kein Sync).
- **Bekannt/Hosting (kein Code-Bug):** Frisch hochgeladene Bilder erscheinen in der
  **Online**-Vorschau erst nach Save+Deploy (repo-basierte Git-Medien, statisches Hosting);
  **lokal** (`npm run dev`) sofort sichtbar. Text/Karte sind überall live.
- **Gemerkt für später (Feinschliff):** Stations-Durchscrollen/Snap im schmalen
  Vorschau-Iframe muss noch geradegezogen werden.
- Inhaltliche CMS-Test-Edits des Nutzers (`alaska2026.json`: Foto + Station „Anchorage";
  `contact.json`) bewusst NICHT in diese Commits genommen — gehören dem Nutzer.
- `index.html` unberührt.

## 2026-06-04 — Reisen portiert (Stufe 5, 🔴🔴 größter Brocken)
- **5a (Gerüst, Besucher-Teil vom Nutzer abgenommen):** 5 Reisen migriert
  (`content/trips` → `web/src/data/trips`, sauberes `{de,en}`-Schema). `TripsContent.tsx`
  (Insel aus abgenommenem Prototyp ausgebaut): Reise-Tabs, Reise-Kopf, **MapLibre-Karte**
  (Marker/flyTo/fitBounds/Sprach-Labels/5-Stil-fähig), **Stationen-Snap-Bahn** + Observer +
  Pfeile (entkoppelt), volle Stations-Karten (Titelbild/Text/Fotos→**Lightbox**/Video/YouTube),
  Stop-Liste, „Reisefazit". `lib/trips.ts`. Seiten `/trips` + `/en/trips`. CSS 1:1 + Mobile.
  Commit `5796989`.
- **Fix:** Lightbox-CSS war nur in `proto-lightbox.astro` → auf `/trips` kein Overlay sichtbar,
  aber Body-Scroll gesperrt. Block **1:1 nach `global.css`** verschoben (global für Reisen/
  Galerie/Stories). Commit `d474bd4`.
- **5b (Tina-Anbindung):** Collection „🧭 Reisen" (jede Reise editierbar/anlegbar): order,
  Bilingual-Felder + Englisch-Schalter, `stops[]` mit **Ortssuche-Feld (Nominatim)** +
  Auto-WebP-Upload (Titelbild + weitere Fotos) + Video/YouTube, „Reisefazit"-Galerie. +
  „🧭 Reisen – Einstellungen" (Seitentexte + Karten-Stil-Select). Router → `/trips`. Commit `4dbf7b5`.
- **Offen:** verknüpftes Album (greift ab Galerie); ggf. In-Editor-Live-Vorschau später.
  `index.html` unberührt.

## 2026-06-04 — Kontakt 1:1 portiert (Stufe 4, konsolidiert + Live-Vorschau)
- Sektion 4 gebaut: `/contact` + `/en/contact` (`#page-contact`), `ContactContent.tsx`
  (`useTina` + `tinaField`). Kanal-Liste mit **Auto-Icon** (`socialIcons.ts`, 10 Typen)
  + Standort-Zeile. **Formular = Vorschau** (prüft Felder → Alert, Erfolgs-Meldung,
  leert; versendet nichts — 1:1 wie Live).
- CSS `contact-grid`/`form-field`/`form-success`/`.btn.dark` 1:1; Mobile 1-spaltig.
- **EIN** Tina-Eintrag „✉️ Kontakt" (Englisch-Schalter, auto-Felder, Kanal-Typ-Dropdown),
  Router → `/contact`. Capability-Lock D: 12/12 ✅. Lokal verifiziert. `index.html` unberührt.
- **Offen / eigener Schritt:** echtes Formular-Versenden (Dienst + Datenschutz, „W5").
- Commit: `2980036`

## 2026-06-04 — Über uns CMS: auto-wachsende Felder + globaler Englisch-Schalter
- Felder wachsen mit dem Text (auto-resize); Klapp-Konstrukt entfernt (behebt zu
  kleine Felder + nicht-scrollbares „Nirvana"). Neuer Apple-Schalter oben
  (`EnglishToggle`/`englishStore`): Standard NUR Deutsch; an → englische Felder
  global. Reiner Editor-Schalter (schreibt nichts in den Inhalt). Besucher-Seite
  1:1. Commit: `f948196`

## 2026-06-04 — Über uns CMS: DE/EN-Felder als inline aufklappbare Dropdowns
- Auf Nutzer-Wunsch: DE/EN-Felder klappen jetzt **inline auf** (Dropdown) statt eine
  Tina-**Unterseite** zu öffnen. Neues `BilingualField`/`BilingualTextField`
  (`ui.component` am object-Feld) — angewandt auf kicker/title/intro + persons.role/
  bio/gear. „why" flach zu `why_title`/`why_text` (je inline). Personen-Panel
  (Unterseite pro Person) bleibt wie gewünscht. **Besucher-Seite 1:1 unverändert.**
- Commit: `92b842a`

## 2026-06-04 — Über uns: Personen als aufklappbare Tina-Liste (Editier-Komfort)
- Auf Nutzer-Wunsch: Person 1/2 von zwei Einzel-Objekten zu **einer Liste „Personen"**
  zusammengefasst → im Tina-Editor **zwei zuklappbare Einträge** (Name als Titel) statt
  vieler Unterpunkte. **Besucher-Seite 1:1 unverändert** (Eintrag 1=links/desert,
  2=rechts/coast). `about.json` persons-Array; `AboutContent` liest `about.persons[idx]`.
- Commit: `d224cf4`

## 2026-06-04 — Über uns 1:1 portiert (Stufe 3, konsolidiert + Live-Vorschau)
- Sektion 3 gebaut: `/about` + `/en/about` (Wrapper `#page-about`), `AboutContent.tsx`
  (React-Insel, `useTina` + `tinaField` — auch verschachtelt `person1.name`).
- Daten `src/data/about.json` (verschachtelt: Kopf + 2 Personen + „Warum die USA?").
- CSS `.about-band`/`.person`/`.divider-orn`/`.home-intro` 1:1 in `global.css`,
  Mobile 1-spaltig; Foto-Fallback-Illustration (desert/coast) mit Original-Farben.
- **EIN** Tina-Eintrag „📄 Über uns" (Leitprinzip): Kopf, je Person Name (jetzt
  editierbar)/Rolle/Bio/Gear-Zeile/Foto, „Warum die USA?"; Router → `/about`.
- **Neues `SinglePhotoField`** (Einzelfoto, Auto-WebP); WebP-Logik in geteiltes
  `webpEncode.ts` ausgelagert → `BulkPhotoField` nutzt sie identisch weiter.
- Capability-Lock D: 12/12 ✅ (1× ⚠️ Foto-Fallback ohne Namens-Overlay, da Fotos da).
  Lokal verifiziert (`npm run dev`). `index.html` unberührt. Commit: `323b5b3`.

## 2026-06-03 — Gear: zwei CMS-Einträge zusammengelegt + Live-Vorschau
- Auf Nutzer-Wunsch: die zwei Gear-Menüpunkte (Liste + Seitentext) zu **einem**
  Eintrag „🎒 Equipment" zusammengeführt (`gear.json` enthält jetzt kicker/title/
  intro + items); `gear-text.json` + `GearList.astro` entfernt.
- **Tina-Live-Vorschau wie Stories**: `GearContent.tsx` (React-Insel, `useTina` +
  `tinaField`), Seiten holen Daten über den Tina-Client, Router → `/gear`.
- Lokal verifiziert (`npm run dev`): `/gear` + `/en/gear` rendern 1:1 mit
  `data-tina-field`. `tina-lock.json` neu generiert. `index.html` unberührt.
- Commit: `146d120`

## 2026-06-03 — Gear/Equipment 1:1 portiert (Stufe 2, Capability-Lock C+D)
- **Sektion 2 der Bau-Reihenfolge gebaut** (nach Stories). Live-Analyse (Schritt 0+A)
  → Nutzer bestätigt (B) → 1:1 nachgebaut (C) → Abhak-Vergleich (D): **21/21 ✅**,
  1× ⚠️ (Runtime-Fetch-Fallback entfällt — Astro backt Daten statisch ein).
- Neu: `src/data/gear.json` + `gear-text.json`, `src/lib/gear.ts` (`GEAR_CATS`/
  `groupGear`/`safeUrl`), `src/components/GearList.astro`, Seiten `/gear` + `/en/gear`;
  `.gear-*`-CSS 1:1 in `global.css`.
- Tina: Collections `gear` (**Kategorie = Dropdown**, 7 feste Werte, Hilfetexte C6/C7) +
  `gear_text` (DE/EN); `tina-lock.json` neu generiert (lokaler Modus).
- Lokal verifiziert: `/en/gear` rendert 1:1 (Reihenfolge, Link-vs-kein-Link, Escaping).
- `index.html` unberührt. Commit: `efb565e`. **Offen:** Nutzer-Abnahme (Seite-an-Seite).

## 2026-06-03 — Astro+Tina LIVE: erster grüner Deploy auf Cloudflare (Schritt 6 ✅)
- **Vorschau online:** `https://aandd-photography-astro.pages.dev` (eigenes Pages-
  Projekt, Branch `astro-umbau`; `main`/Live-Seite unberührt). Build grün:
  `tinacms build` → `astro build` (11 Seiten, Stories DE/EN), 63 Dateien deployed.
- **Cloudflare-Build-Hürden gelöst (langer Debug):**
  - `tinacms build` läuft auf Cloudflare als **pkg-Binary**, die Custom-Env beim
    Config-Laden nicht zuverlässig sieht → **clientId/branch fest verdrahtet**
    (öffentlich, kein Secret), Token weiter nur aus `TINA_TOKEN`. (`0a34462`)
  - **Build-Variablen** gehören in Cloudflare in den **Build**-Topf (nicht Runtime/
    Bindings), Typ **Plaintext**; `NODE_VERSION=22`.
  - **`tina/tina-lock.json` committet** (war gitignored) — Tina Cloud liest daraus
    das Schema. (`56cd720`) + Whitespace-Touch zum Re-Index. (`d3a8b2c`)
  - **Tina Cloud: „Path To Tina Folder = web"** (Monorepo-Unterordner) + Branch
    `astro-umbau` aktiv **indexiert** (grüner Haken) — sonst „Branch not on TinaCloud".
- Offen (Nutzer): `/admin`-Login live testen (Site-URL der Pages-Domain in Tina
  Cloud ergänzen), Edit-Test, iPad-Test (Alexandra).
- Commits: `0a34462`, `56cd720`, `d3a8b2c` (+ Sammel-Push `cac8b48` mit Inhalten/
  Uploads vom Nutzer)

## 2026-06-03 — Tina-Cloud-Anbindung via ENV vorbereitet (Schritt 6, Teil A)
- Vorab geprüft: Tina-Cloud-Free-Limits offiziell (tina.io/pricing + Repo-Media-Doku)
  → 2 Nutzer, unbegrenzte Dokumente, repo-basierte Bilder fallen NICHT unter das
  100-MB-Asset-Cap → dauerhaft gratis für 2 Personen. Dokumentiert in `SETUP-TinaCloud.md`.
- `web/tina/config.ts`: clientId/token/branch jetzt aus `process.env`
  (`TINA_CLIENT_ID`/`TINA_TOKEN`/`TINA_BRANCH`); ohne gesetzte Werte automatischer
  Rückfall in den lokalen Modus (Mac-dev bleibt nutzbar).
- `web/.env.example`: Vorlage nur mit Variablen-NAMEN (keine Werte).
- `web/.gitignore`: `.env`/`.env.*` gesperrt (nur `.env.example` getrackt) → keine
  Secrets im Repo. Konto/Tokens/Deploy macht David selbst.
- Betroffen: `web/tina/config.ts`, `web/.env.example`, `web/.gitignore`
- Commit: `06ba334` (SETUP-Doku vorab: `93a9a27`)

## 2026-06-02 22:40 — WebP auf jedem Browser via jSquash (Foto-Upload-Feld)
- Nach der neuen Regel zuerst Live-Wahrheit geprüft: Sveltia macht WebP auf Safari
  via **jSquash**; `admin/config.yml` = webp/Q85/Breite 2400. 1:1 nachgebaut.
- jSquash (@jsquash/webp) als primärer Encoder → WebP in jedem Browser inkl. Safari.
  WASM per `locateFile` vom CDN (unpkg) geladen (im Tina-Bundle 404te sie). Fallback:
  natives canvas-WebP → JPEG. Mount-Selbsttest; im Editor verifiziert.
- Betroffen: `web/tina/fields/BulkPhotoField.tsx`, `web/package.json` (+@jsquash/webp)
- Commit: `ebea477`

## 2026-06-02 22:10 — Regel „Live-Wahrheit zuerst" verankert (nur Doku)
- Neue verbindliche Regel: vor jedem Neubau UND vor jeder Machbarkeits-Aussage
  zuerst die echte Live-Umsetzung prüfen (Funktion + Inhalt; inkl. wie Sveltia es
  löst); nie aus Allgemeinwissen „geht nicht" behaupten. Anlass: falsche Behauptung
  „WebP geht in Safari nicht" (Sveltia macht es längst via jSquash).
- Verankert: eigener Abschnitt in `CLAUDE.md` + als Vorstufe **Schritt 0** im
  Capability-Lock (vor A). Kurzverweise in `CAPABILITIES.md` + `STATUS.md`.
- Betroffen: `CLAUDE.md`, `CAPABILITIES.md` (`3df0065`); `STATUS.md`, `CHANGELOG.md`
  (dieser Doku-Commit)

## 2026-06-02 20:00–22:00 — Stufe-1 Foto-Upload-Feld (Bulk + WebP/JPEG, dnd-kit)
- Eigenes Tina-Galerie-Feld `web/tina/fields/BulkPhotoField.tsx`: Mehrfach-Upload
  (Button / Drag-Ablage / ganzer Ordner), Auto-Verkleinern auf 2400px, Konvertierung
  (WebP, sonst JPEG-Fallback — Safari kann kein natives canvas-WebP), git-basiert
  nach `/uploads` (directory:'' aus Store-Quellcode verifiziert), apple-like
  Sortierung via @dnd-kit. WebP-Reduktion empirisch verifiziert (−91 %).
- Offen/freigegeben: jSquash (WASM) für WebP auf jedem Browser (wie Sveltia).
- Betroffen: `web/tina/**`, `web/package.json` (+@dnd-kit), `web/src/styles/global.css`
- Commits: `abdde39`, `e3eb729`, `511d300`, `e682811`

## 2026-06-02 19:30–20:00 — Stufe-1 Schritte 1–5: Stories auf Astro + TinaCMS
- **Schritt 1:** Astro-Grundgerüst in `web/` (Astro 4 + React, i18n DE=/ EN=/en/).
- **Schritt 2:** Design-System aus `index.html` 1:1 nach `web/src/styles/global.css`.
- **Schritt 3:** 3 Stories migriert (Option A: `body_de/body_en` im Frontmatter);
  utah aufgeräumt (Test-Text raus, langer Body als Haupttext).
- **Schritt 4:** Content-Collection + Liste/Reader, 1:1-`mdToHtml`-Port, Mountains-
  Illustration (ILLUS byte-identisch); vom Nutzer freigegeben (Design + DE/EN).
- **Schritt 5:** TinaCMS lokal angebunden (Live-Vorschau, kleine React-Insel,
  `gallery`-Feld). CAPABILITIES.md: Stories-Sektion + Schritt-4-Freigabe.
- Betroffen: `web/**` (neu), `CAPABILITIES.md`
- Commits: `b12c9f2`, `609b0df`, `17267e9`, `4da438a`, `3591a51`, `4558c39`,
  `d31f650`, `75a7e2f`

## 2026-06-02 19:23 — Capability-Lock-Verfahren verankert + Umbau-Branch gestartet
- Branch `astro-umbau` von `main` angelegt (Stufe-1-Umbau: Stories auf Astro+Tina;
  `main` bleibt unangetastet/live). Schritt 0 des Bauplans (Branch + Bestandsaufnahme,
  3 Stories, Feld-Inkonsistenzen erfasst) — kein Code, nur Branch + Analyse.
- Verbindliches **Capability-Lock**-Verfahren (4 Schritte: Extrahieren → Bestätigen →
  Bauen → Abhak-Vergleich) in `CLAUDE.md` verankert; `CAPABILITIES.md` neu angelegt
  (Kopf, Status-Legende, Funktions-Warteschlange, Sektions-Vorlage). Noch keine
  Funktion extrahiert.
- Betroffen: `CLAUDE.md`, `CAPABILITIES.md` (neu)
- Commit: `cfd7a69`  (Branch `astro-umbau`, nicht `main`)

## 2026-06-02 16:29 — Astro + TinaCMS Stories-Prototyp (isoliert)
- Eigenständiger Evaluierungs-Prototyp (Astro + React + TinaCMS lokal), **nur** Stories,
  zum Erleben von Live-Vorschau + Drag-&-Drop. Berührt die Live-Seite nicht.
- Betroffen: `prototype-astro/**` (neu)
- Commit: `9fbd78a`

## 2026-06-01 21:02–21:06 — CMS-Vereinfachung (Minimalismus) + Multi-Bild-Upload
- Foto-Listen auf `multiple:true`-Image-Widget (mehrere Bilder auf einmal/Drag&Drop);
  Karten-Feld der Station nach unten + Label/Hint gekürzt; Video-Hint präzisiert;
  `album_hint`-Pseudofeld entfernt, wortreiche Hints/Descriptions gekürzt.
- Betroffen: `admin/config.yml`
- Commit: `de2d591`, `63210d2`, `3bd5585`, `7236fb7`

## 2026-06-01 20:44–20:50 — Performance: Lazy-Loading + Bild-Cleanup
- `loading="lazy"` für restliche Below-the-fold-Bilder (Story-Body, Footer-Logo,
  About-Foto); 2 verwaiste Legacy-Monster-JPGs entfernt (~13,8 MB).
- Betroffen: `index.html`, `uploads/img_6111.jpg` + `uploads/a7406508.jpg` (gelöscht)
- Commit: `9091619`, `ed69c63`

## 2026-06-01 20:06–20:28 — Video + YouTube (Stationen & Stories) + Querformat-Lightbox
- CMS-Felder `video` + `youtube_url` für Stops/Stories; Frontend: Video-Loop +
  YouTube-Embed (nocookie); `@media (orientation:landscape)`-Layout für die Lightbox.
- Betroffen: `admin/config.yml`, `index.html`
- Commit: `ff3a9da`, `d1aee01`, `bb4734c`

## 2026-06-01 19:57 — Base64-Logos entfernt (~720 KB)
- Drei inline Base64-PNG-Logos durch transparenten Platzhalter ersetzt; Logo kommt zur
  Laufzeit aus dem CMS (`applyBranding`). `index.html` 1.0M → ~303K.
- Betroffen: `index.html`
- Commit: `f91fd33`

## 2026-06-01 19:31–19:44 — Mobile Reise-Tabs: Zentrierung, Scrollbar, Cleanup
- Aktiven Tab zuverlässig zentrieren (iOS), `justify-content:flex-start` (erster Tab
  erreichbar), smooth Scroll beim Klick, Scrollbar-Kontrast; toten `attachSwipe` entfernt.
- Betroffen: `index.html`
- Commit: `4f46f5b`, `dd643da`, `f839700`, `6c04bcc`

## 2026-05-31 20:38–23:24 — Lightbox-Filmstreifen (Desktop), Expand-Symbol, Marker
- Filmstreifen auf Desktop scrollbar (Flex-Spacer statt Padding), flüssiges Wandern wie
  iPhone-Mediathek, Trackpad nativ + entprellt; Lightbox-Marker mobil zentriert;
  Expand-Symbol auf Stations-/Galerie-/Album-Bildern; Lupen-Cursor → Hand;
  CMS „Zur Website"-Action-Button.
- Betroffen: `index.html`, `admin/index.html`
- Commit: `6781467`, `2ec6c95`, `cd98d25`, `9fa58ad`, `82e952f`, `7aa5ac8`, `42f34d6`,
  `e07ed35`, `e6c14a6`, `fb3468f`

> Zwischendrin liegen CMS-Inhalts-Saves von David (z. B. `7255ae4`, `59db11b`, `4b58f87`
> „Update Einstellungen/Reise") und Merge-Commits — keine Code-Änderungen, hier ausgelassen.
