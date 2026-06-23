# DESIGN.md — Baustil / Design-Konsistenz (Davids Prinzip)

> Schwester-Dokument zu `CMS-UX.md` (das hält das **CMS-/Tina-Bauprinzip** fest).
> Hier steht das **visuelle Bauprinzip**: Die Seite soll **professionell** wirken →
> gleiche Design-Entscheidungen müssen **überall gleich** sein. Es gibt kanonische
> Bausteine/Tokens, die man **wiederverwendet**, statt pro Stelle neu zu erfinden.
> Claude liest dieses Dokument **vor** UI-/CSS-Änderungen und richtet sich danach.

## Leitprinzipien (gelten überall)
- **D1 — Wiederverwenden statt neu erfinden.** Vor neuem UI prüfen, ob es schon einen
  Baustein/Token gibt — und den nehmen. Kein Sonderstil pro Stelle.
- **D2 — Tokens, keine Magie-Werte.** Radien, Farben, Abstände über die CSS-Variablen
  in `web/src/styles/global.css` (`:root`). Token-Namen **nachschauen, nicht raten**.
- **D3 — „Gleich wirken" = gleicher Wert.** Sollen mehrere Elemente gleich aussehen,
  exakt **denselben** Wert nutzen (Radius, rgba-Transparenz, Padding-Rhythmus).
- **D4 — Erst belegen, dann bauen** (wie überall): echten CSS-Stand lesen, nicht annehmen.

## Kanonische Bausteine
### Pillen (Buttons / pillenförmige Elemente)
- **Standard-Pille primär:** `.btn` — solide, `background: var(--c-accent)`, `border-radius: var(--radius-pill)`.
- **Standard-Pille sekundär (Ghost):** `.btn.ghost` — creme Rand+Text, **Fill `rgba(28,24,18,0.32)`** + leichter Blur.
- **Neue pillenförmige Elemente übernehmen exakt diese Stile** (z. B. der Zurück-Button auf
  Story-Detailseiten = `.back-pill`/`.story-back` mit demselben Ghost-Look & `--radius-pill`).
  Kein eigener Look (Lehre: die erste Story-Pille war ein creme-Blob und musste neu gebaut werden).

### Radien (immer über Token)
- `--radius-sm` (8px): Karten, Bilder, Boxen (Story-Karten, Reise-Karten, Galerie, Reader-Bilder …).
- `--radius-pill` (999px): Pillen/Buttons.
- `--radius-lg` (16px): größere Boxen/Tabs. · `--radius-full` (50%): runde Icon-Buttons (Nach-oben-Button).
- Gleiche Elementtypen → **gleicher** Radius (Story-Karten & Reise-Karten = `--radius-sm`).

### Farb-/Transparenz-Werte
- Erdtöne über die `--c-*`-Tokens. Wenn zwei Elemente „gleich" wirken sollen: identischer rgba-Wert
  (z. B. Ghost-Pillen-Fill `rgba(28,24,18,0.32)` bei `.btn.ghost` **und** der Story-Zurück-Pille).

## Festgehaltene Entscheidungen
- **20./21.06.2026 — Zurück-Pille:** Der Story-Zurück-Button ist die **Standard-Ghost-Pille**
  (fixiert oben links, scrollt mit), **nicht** ein Sonderstil. `.btn.ghost`-Fill von `transparent`
  auf `rgba(28,24,18,0.32)` angehoben (weniger durchsichtig, auf Fotos lesbar) — **gleicher Wert** in beiden.
- **Reisen-Zurück (21.06.2026):** **EXAKT dieselbe** Stelle wie bei den Stories — fixe Standard-Ghost-Pille
  (`.story-back, .trip-back` gemeinsam, `position: fixed; top: 102px; left: 20px`). Story **und** Reise
  identisch in Optik **und** Position (keine Sonderplatzierung). *(Eine Titelleisten-Variante wurde
  verworfen — David wollte 1:1 dieselbe Stelle.)*
- **Reisen-Zurück MOBIL (21.06.2026):** Auf dem Handy (`<768px`) ist die fixe Pille **ausgeblendet**
  und „← Reisen" sitzt **in der ohnehin sticky `.tl-mininav`-Zeile** (Nav-Text-Link, Akzentfarbe).
  Grund (belegt): Die fixe Pille funktioniert bei Stories nur, weil deren Reader ein hohes Hero-Bild
  hat (`.reader-hero` 60vh), über das die Pille fällt. Reisen haben **kein Hero** → die Pille läge mobil
  direkt auf dem Titel + der Mini-Karte (gequetscht). Die Mininav ist für genau diesen Zweck schon da
  und von der Scroll-Spy (misst nur `.tl-head`) entkoppelt — Station-1-Verhalten bleibt unberührt.
  **Bewusste Ausnahme zur „gleiche Pille überall"-Regel:** anderer Kontext (heller Nav-Balken statt
  Foto-Overlay) → schlanker Nav-Link statt dunkler Ghost-Pille. **Desktop bleibt 1:1 die fixe Pille.**
- **Nav mobil (23.06.2026):** Auf `<=860px` (= Nav-Breakpoint) **Logo zentriert**, Zurück-Link links
  **nur** auf Detailseiten (Reise/Story, sprachabhängig), Burger rechts. **Desktop unverändert.** Der
  mobile Zurück-Link ersetzt dort die fixen Pillen **und** den früheren Mininav-Link — alles auf **einen**
  Breakpoint (860px) vereinheitlicht (sonst Lücke/Doppel-Link im Bereich 768–860px). Stolpersteine, die
  beachtet werden müssen: (1) **CMS-Vorschau** (`html.ww-cms-preview`) neutralisieren, sonst zentriert sich
  das Logo im Tina-Editor; (2) Sprachumschalter (`.lang-toggle`) bleibt unangetastet im Burger-Drawer.
- **safe-area (23.06.2026):** Seit `viewport-fit=cover` greifen `env(safe-area-inset-*)`. **Regel:** jedes
  **fixierte/sticky** Element bekommt das passende Inset mit **Fallback 0** (`env(safe-area-inset-x, 0px)`):
  Header `top`, untere fixierte Elemente (To-Top, Banner) `bottom`, seitliche `left/right`. Fixe Höhen-Tokens,
  die an der Notch hängen (z. B. `--ww-sticky-top`), als `calc(... + env(safe-area-inset-top, 0px))`. Inset
  ist im Hochformat meist 0 → kein Doppelabstand; relevant in Querformat/PWA → nur auf Gerät final testbar.
