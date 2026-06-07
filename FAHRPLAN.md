# FAHRPLAN — Astro-Umbau: benutzen → reifen → Cutover

Stand: 2026-06-07. Beschluss mit David.

## Aktueller Stand
- **Astro + TinaCMS-Version** ist funktional komplett auf Branch `astro-umbau`,
  Vorschau-Domain: `https://aandd-photography-astro.pages.dev`.
- **Live/echt** ist weiterhin die alte Single-File-`index.html` auf `main`
  (`https://aandd-photography.pages.dev`) — **unangetastet, Sicherheitsnetz**.
- Beide sind getrennte Cloudflare-Pages-Projekte. Nichts an der Live-Seite ändert sich,
  solange wir an der Astro-Version arbeiten.

## Beschluss: NICHT jetzt auf `main` schieben / nicht jetzt cutovern
Begründung:
1. Erst **im echten Gebrauch** benutzen → dort fallen die meisten Bugs/Wünsche auf.
2. `main`/alt bleibt als **erprobtes Netz** live — kein Risiko für Besucher.
3. **Rechtstexte (Datenschutz/Impressum) sind noch Platzhalter** → harter Blocker vor Publikum.
4. Keine Seite-an-Seite-Abnahme + **iPad-Test** (Alexandra) bisher.

> Hinweis: Ein bloßer Merge `astro-umbau → main` macht die Astro-Seite NICHT live —
> `main` wird von Cloudflare mit dem alten Build (Root + `build-indexes.js`) gebaut, die
> Astro-Version liegt in `web/`. Der echte Umstieg ist ein bewusster **Cutover** (s. u.).

## Phase 1 — JETZT: benutzen & reifen
- Astro-Version auf der Vorschau-Domain im Alltag nutzen (Fotos/Reisen/Stationen pflegen, durchklicken).
- Auffälligkeiten **sammeln** (Notiz) → gebündelt fixen, statt vieler Einzelrunden.
- `main`/alt bleibt live.

## Phase 2 — VOR „öffentlich" (Pflicht vor echtem Publikum)
- [ ] **Datenschutzerklärung** mit echtem Text füllen (CMS „⚖️ Datenschutz"); Web3Forms +
      Cloudflare + Umami + Google Fonts als Verarbeiter nennen (Generator e-recht24 / anwaltlich).
- [ ] **Impressum** mit echten Angaben füllen (CMS „⚖️ Impressum").
- [ ] Test-Mail `davidbastisch@web.de` ggf. auf die „richtige" Adresse umstellen (CMS „✉️ Kontakt").
- [ ] **iPad-Test** mit Alexandra (CMS-Bedienung + Besucher-Ansicht).
- [ ] Optional: Google Fonts lokal einbinden (vermeidet IP-Übertragung an Google).

## Phase 3 — CUTOVER (wenn David „los" sagt) — Checkliste
Ziel: Die Astro-Version wird die echte Seite unter der kanonischen URL.

1. [ ] **Branch:** `astro-umbau` → `main` mergen (oder `main` auf den Astro-Stand bringen).
       Alten Stand vorher als Backup-Branch sichern (z. B. `legacy-singlefile`).
2. [ ] **Cloudflare-Pages-Projekt (live):** Build-Einstellungen auf Astro umstellen:
       - Root-Verzeichnis/Build-Ordner: `web`
       - Build-Command: `npm run build` (= copy-uploads + gen-uploads-manifest + `tinacms build -c "astro build"`)
       - Output: `web/dist`
       - **Env (Build, Plaintext):** `TINA_CLIENT_ID`, `TINA_TOKEN`, `TINA_BRANCH=main`, `NODE_VERSION=22`
       (Alternative: eigene Domain auf das bestehende Astro-Pages-Projekt zeigen lassen.)
3. [ ] **Tina Cloud:** Branch `main` aktiv **indexieren** (Lock muss zum Branch passen);
       „Path To Tina Folder = web"; Site-URL der Live-Domain in Tina ergänzen (OAuth/Preview).
4. [ ] **Build grün** auf der Live-Domain prüfen (Hard-Reload, Strg/Cmd+F5).
5. [ ] **Redirects/SEO:** alte Pfade prüfen; `noindex` der Vorschau-Domain bedenken; Sitemap.
6. [ ] **Funktions-Smoke-Test** live: Lightbox, Karte, Kontaktformular-Versand (echte Mail kommt an?),
       Statistik (Umami zählt), Datenschutz/Impressum verlinkt.
7. [ ] **Vorschau-Domain** danach optional abschalten oder auf die Live-Domain weiterleiten.

## Offene Einzelthemen (kein Eile)
- Snap-Stärke (`proximity`) bei Bedarf nachregeln.
- Weitere Per-Inhalt-Events (W5c-Ausbau) / Cloudflare-eigene Mail-Lösung (W5b) — siehe IDEEN.md.
- Bug-Sammlung aus dem echten Gebrauch.

## Wichtige Lehre (siehe STATUS.md)
„Build grün" fängt **keine Laufzeitfehler** (z. B. Variablen-Shadowing/TDZ in einer React-Insel).
Interaktive Insel-Änderungen (Klick/Lightbox/Scroll) möglichst im echten Browser gegentesten.
