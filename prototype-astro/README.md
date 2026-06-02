# AD-Photography — Prototyp: Astro + TinaCMS (NUR Stories)

Isolierter Prototyp, um das **Editier-Erlebnis** zu testen: Live-Vorschau +
Drag-&-Drop von Bildern. Bildet **nur die Stories-Sektion** ab.

> ⚠️ **Die echte Website (`../index.html`) wird hiervon NICHT berührt.**
> Dieser Ordner ist ein eigenständiges Projekt. Cloudflare Pages baut weiterhin
> nur das Repo-Root (`node build-indexes.js`) und ignoriert diesen Unterordner.

---

## Starten (auf deinem Mac)

Voraussetzung: **Node 18+** (prüfen mit `node -v`).

```bash
cd prototype-astro
npm install            # einmalig, lädt Astro + Tina + React
npm run dev            # startet Tina + Astro zusammen
```

Beim ersten `npm run dev` erzeugt Tina automatisch seinen Client
(`tina/__generated__/`) — das dauert ein paar Sekunden.

Dann im Browser:

| Was | URL |
|---|---|
| **Website-Vorschau** (Story-Liste) | http://localhost:4321/ |
| Eine Story | http://localhost:4321/stories/utah-drohne-kevin |
| **TinaCMS-Editor** | http://localhost:4321/admin/index.html |

### So testest du Live-Vorschau + Drag-&-Drop
1. Öffne den **Editor** (`/admin`), klick links auf **Stories → „Tacoma in der Wildnis"**.
2. Links erscheint die **Bearbeiten-Sidebar**, rechts die echte Seite.
3. Ändere oben den **Titel** → die Überschrift rechts aktualisiert sich **live beim Tippen**.
4. Scroll in der Sidebar zu **„Galerie (Demo)"** → fasse ein Bild am Griff an und
   **zieh es an eine andere Position** → die Reihenfolge rechts ändert sich sofort.
5. Klick auf der **Seite** auf einen Text → die Sidebar springt zum passenden Feld
   (sofern dein Tina das „Klick-zum-Feld" auf Astro unterstützt — siehe unten).

Stoppen: `Ctrl+C` im Terminal.

---

## Was dieser Prototyp zeigt (und was nicht)

**Enthalten:** Stories-Liste, Story-Reader im echten Design (CSS aus `index.html`
übernommen), Markdown-Body, Cover, YouTube-Embed, ein **Demo-Galerie-Feld**
(sortierbar per Drag & Drop — gibt es in der echten Website noch nicht),
DE/EN-Felder, Tina-Editor mit Live-Vorschau.

**Bewusst NICHT enthalten:** MapLibre-Karte, Lightbox/Filmstreifen, Reise-
Stationen, Galerie/Alben, Hero-Umschalter, In-Page-Admin-Overlay.

---

## Inhaltliche Anpassungen beim Migrieren (nur hier, Original unberührt)
- **Body normalisiert:** Der Story-Text liegt jetzt einheitlich im Markdown-Body
  (`isBody`). In der echten Seite war er mal im Frontmatter-Feld `body_de`, mal im
  Markdown-Body — bei `utah` sogar widersprüchlich (hier wurde der längere, echte
  Markdown-Body genommen).
- **Demo-Galerie** (`gallery`) zur Story `utah` hinzugefügt, nur um Drag-&-Drop zu
  zeigen.
- **YouTube-URL** bei `utah` als Beispiel gesetzt, damit der Embed sichtbar ist.

---

## Falls beim Setup etwas hakt
Die Versionen in `package.json` sind sinnvolle Stände, können aber veralten. Wenn
`npm install`/`npm run dev` zickt, ist der robusteste Weg, Tina frisch zu
initialisieren und die fünf Dateien hierüber zu kopieren:

```bash
# in einem LEEREN Test-Ordner:
npm create astro@latest
npx astro add react
npx @tinacms/cli@latest init
# dann tina/config.ts, src/components/StoryReader.tsx, src/pages/*,
# src/styles/reader.css und content/stories/* von hier übernehmen.
```

Die eigentliche Logik steckt in: `tina/config.ts` (Schema),
`src/components/StoryReader.tsx` (Live-Insel), `src/pages/stories/[slug].astro`.
