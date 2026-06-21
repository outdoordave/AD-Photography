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
