# Setup-Plan: Stories online via Tina Cloud (Free) — Schritt 6

> **Nur Plan + geprüfte Limits. NICHTS gebaut/deployt, keine Secrets im Repo.**
> Erst nach Davids „ok, Plan passt" baue ich die ENV-Anbindung; Konto/Tokens/Deploy
> macht David. Stand: 2026-06-02. Quelle: tina.io/pricing + Tina-Doku (offiziell geprüft).

## Teil 1 — Free-Tier-Limits (offiziell verifiziert)

**Tina Cloud „Free" laut tina.io/pricing:**
- **$0 Forever**, **2 Nutzer**, 2 Rollen, Community-Support, **1 Projekt**.
- **Unbegrenzte Dokumente/Collections.**
- **100 MB Asset-Größe** (pro Datei) — bezieht sich auf **Tina-gehostete** Medien.

**Bleiben wir sicher im kostenlosen Rahmen? → JA.**
- **2 Nutzer = David + Alexandra** (passt exakt).
- **Unbegrenzte Dokumente** → ein paar hundert Stories/Reisen/Alben unkritisch.
- **Bilder:** wir nutzen **repo-basierte Medien** → Bilder liegen in **unserem Git-Repo**,
  **nicht** in Tinas Speicher. → Das **100-MB-Asset-Cap betrifft uns nicht** (und unsere
  WebPs sind ohnehin <1 MB pro Bild).

**Ehrliche Watch-Points:**
- **2-Nutzer-Grenze:** ein **dritter** Editor wäre kostenpflichtig. (Für uns nicht relevant.)
- **„API access = Business-Plan"** klingt alarmierend, meint aber **externen Headless-API-
  Zugriff** (Tina als API für Fremd-Apps). **Unser Editieren + unsere Seite sind im Free
  abgedeckt** — kein Problem.
- **Editorial Workflow** (Entwürfe/Review-Queue) ist Paid — **brauchen wir nicht.**
- **Sehr langfristig:** GitHub-**Repo-Größe**, falls irgendwann **tausende große** Bilder.
  GitHub empfiehlt <1 GB, warnt >5 GB; Einzeldatei-Limit 100 MB (wir weit drunter).
  Unsere WebPs (~200–500 KB) → **hunderte Bilder ≈ 50–150 MB = völlig unkritisch.**
  Falls je riesig: Git-LFS/externer Speicher — späteres Thema, nicht jetzt. **Das ist
  ein GitHub-Thema, kein Tina-Free-Limit.**

→ **Fazit: Für unser kleines 2-Personen-Foto-/Reise-Projekt bleiben wir dauerhaft gratis.**

## Teil 2 — Einrichtungs-Plan

### A) Was ICH (Claude) im Code vorbereite — **keine Secrets**
1. **`web/tina/config.ts`**: `clientId` + `token` aus **Umgebungsvariablen** lesen
   (statt leer/lokal) + `branch` konfigurierbar. Der **lokale Modus** (Mac, `npm run dev`)
   bleibt weiter nutzbar.
2. **`.env.example`** mit den benötigten **Variablen-NAMEN** (keine Werte) + kurzer Erklärung.
3. **Build/Config-Hinweise für Cloudflare** (Root = `web/`, Build = `npm run build`,
   Output = `dist`) als Doku.
4. Alles **isoliert auf `astro-umbau`**; `main`/`index.html` **unberührt**; **niemals**
   Tokens ins Repo.

### B) Was DU selbst machst — Konto/Tokens/Deploy (ich führe nur an)
1. **Tina-Cloud-Konto:** auf **app.tina.io** mit **GitHub** einloggen.
2. **Projekt anlegen** → **GitHub-Repo `outdoordave/AD-Photography` verbinden**
   (Tina-GitHub-App autorisieren, **auf dieses eine Repo beschränken**).
3. **Branch wählen: `astro-umbau`** (für die Vorschau — `main` bleibt live/unberührt).
4. **`clientId`** (öffentlich) + **Token** (geheim, read-only) im Tina-Dashboard kopieren.
5. **Alexandra einladen** (per E-Mail) als 2. Nutzer.
6. **Cloudflare Pages** — Pages-Projekt (oder Branch-Deploy) für `astro-umbau`:
   - **Root directory:** `web`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Env-Variablen setzen** (clientId + Token + Branch — exakte Namen gebe ich beim Bau vor).
7. **Deploy auslösen** → Vorschau-URL. `/admin` ist online → einloggen, editieren (auch vom iPad).

### C) Sicherheit / Reihenfolge
- **Secrets bleiben bei dir.** Ich committe **keine** Tokens; die `clientId` ist
  technisch öffentlich (im Browser-Bundle), wird aber **auch** über ENV gesetzt, damit
  nichts hartkodiert im Repo steht.
- **Reihenfolge:** erst dein **„ok, Plan passt"** → dann baue ich A) (ENV-Anbindung +
  `.env.example`). **Du** legst Konto/Tokens an und deployst.

### Was sich NICHT ändert
- Inhalte bleiben **Commits in unserem GitHub-Repo** (Quelle + Historie bei uns).
- Die **öffentlichen Seiten** sind weiter statisch (schnell). Tina Cloud ist nur die
  **Editier-/Auth-Schicht** + hält eine synchronisierte Arbeitskopie (von dir akzeptiert).
- **`main` + alte `index.html` bleiben unberührt** — das hier ist nur die `astro-umbau`-Vorschau.
