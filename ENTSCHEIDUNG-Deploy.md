# Entscheidung: Wie wird Tina online betrieben? (Schritt 6)

> **Nur Entscheidungs-Grundlage. NICHTS deployt/gebaut.** David entscheidet.
> Stand: 2026-06-02.

## Unser Setup & Prioritäten
- Hosting **Cloudflare Pages**, Inhalte **git-basiert in GitHub** (bleiben so).
- **Kostenlos** ist wichtig. Inhalte sollen **in unserer Hand** bleiben.
- Editieren **überwiegend lokal vom Mac** (`tinacms dev`). 2 Editoren (David + Alexandra).

## Eine technische Wahrheit vorab (gilt für alle Optionen)
Die **öffentlichen Seiten sind in jedem Fall statisch** (schnell, gratis, kein
Besucher-Tracking durch Tina). Der Unterschied liegt nur darin, **wie/ob online
editiert wird**:
- Der **lokale** Editor (`tinacms dev`) läuft in **allen** Optionen gratis am Mac.
- **Online** im Browser editieren (z. B. Alexandra vom eigenen Gerät) braucht ein
  **Backend** (Tina Cloud ODER self-hosted). Ohne Backend = nur lokal editieren.
- **Inhalte bleiben in allen Optionen als Markdown/JSON in unserem GitHub-Repo** —
  Tina ist nur die Editier-/Auth-Schicht, nicht der Speicher. → **geringer Content-Lock-in überall.**

---

## Option (a) — Tina Cloud (kostenloser Tier)
| Frage | Antwort |
|---|---|
| **Konkret für uns** | Tina hostet das Editier-Backend (Auth + Content-API). Der deployte `/admin` ist online; David + Alexandra loggen sich im Browser ein und editieren von jedem Gerät. Tina committet die Änderungen in **unser** GitHub-Repo. |
| **Kosten** | **Free-Tier = bis 2 Nutzer, gratis** (David + Alexandra passen exakt). ⚠️ Aktuelle Tarif-Bedingungen vor dem Setup gegenprüfen — Anbieter kann Tarife ändern. |
| **Git-basiert / Inhalte unser?** | **Ja** — Inhalte bleiben als Dateien in unserem Repo. Verlassen wir Tina Cloud, bleibt alles da. |
| **Online editieren?** | **Ja**, beide, vom Browser (E-Mail-Login, kein GitHub nötig für Editoren). |
| **Einrichtungs-Aufwand** | **Niedrig–mittel:** Tina-Cloud-Konto, Repo verbinden, `clientId`/`token` als Cloudflare-Env-Vars, `tinacms build`. Unsere Reader-Seiten (nutzen schon den Tina-Client) bleiben wie sie sind. |
| **Abhängigkeit / Lock-in** | Online-Editing hängt am **Tina-Cloud-Dienst** (Verfügbarkeit + Free-Tier-Fortbestand). **Content** aber nicht (in git). |
| **Restrisiko** | Free-Tier-Bedingungen/2-Nutzer-Grenze könnten sich ändern; Online-Editing fällt aus, wenn der Dienst wegfällt (lokales Editieren + Inhalte bleiben aber sicher). |

## Option (b) — Self-hosted Tina-Backend
| Frage | Antwort |
|---|---|
| **Konkret für uns** | Wir betreiben das Backend **selbst**: GraphQL-API (Serverless-Funktion) + **Datenbank** (z. B. MongoDB Atlas / Vercel KV) + **Auth** (Auth.js o. ä.), z. B. auf Cloudflare. |
| **Kosten** | Tina-Software gratis, aber **mehrere Gratis-Tier-Dienste zusammenstecken** (DB/Auth/Funktion). Kann 0 € sein, mit Gratis-Limits — **mehr bewegliche Teile**. |
| **Git-basiert / Inhalte unser?** | **Ja**, Inhalte in git wie gehabt. |
| **Online editieren?** | **Ja**, beide, **ohne** 2-Nutzer-Grenze (wir kontrollieren alles). |
| **Einrichtungs-Aufwand** | **Hoch:** DB + Auth + API aufsetzen, absichern, **dauerhaft warten** (Updates, Ausfälle = unser Problem). Für eine kleine Fotoseite **viel Overhead**. |
| **Abhängigkeit / Lock-in** | Kein Tina-Cloud-Lock-in, aber **wir sind das Ops-Team**; Abhängigkeit von den gewählten DB-/Hosting-Diensten. |
| **Restrisiko** | Komplexität → mehr kann brechen, und **wir** müssen es fixen; Sicherheit der Auth liegt bei uns. |

## Option (c) — Statisch, Editieren nur lokal
| Frage | Antwort |
|---|---|
| **Konkret für uns** | Öffentliche Seite = **rein statisch** (`astro build`) auf Cloudflare. Editiert wird **nur lokal** am Mac via `tinacms dev` → committen/pushen → Cloudflare baut neu. **Kein** Online-Backend. |
| **Kosten** | **Komplett 0 €**, kein Dienst, keine DB. |
| **Git-basiert / Inhalte unser?** | **Ja, zu 100 %** — null Lock-in, alles in git. |
| **Online editieren?** | **Nein.** Editieren nur an einem Rechner mit `tinacms dev` (dem Mac). Alexandra vom eigenen Gerät nur, wenn sie das Repo klont + Dev-Server startet (technisch) — oder Rohdateien direkt auf GitHub bearbeitet (ohne die schöne Tina-Oberfläche). |
| **Einrichtungs-Aufwand** | **Deploy niedrig**, aber **kleiner Umbau nötig:** die Reader-Seiten ziehen aktuell die Daten über den Tina-Client → für einen reinen Static-Build auf **Astro-Content-Collections (`getCollection`)** umstellen; die Tina-Live-Vorschau bleibt als lokale Insel. (Das ist ohnehin die sauberere Architektur für git-basiert + statisch.) |
| **Abhängigkeit / Lock-in** | **Keine.** Robusteste, freieste, unabhängigste Variante. |
| **Restrisiko** | Einziger echter Nachteil: **kein Online-Editing** für Alexandra vom eigenen Gerät. Wenn „überwiegend lokal vom Mac" die Realität ist → unkritisch. |

---

## Vergleich auf einen Blick
| | (a) Tina Cloud Free | (b) Self-hosted | (c) Statisch / lokal |
|---|---|---|---|
| Kosten | 0 € (2 Nutzer) | 0 € möglich, Gratis-Limits | **0 €** |
| Inhalte in git / unser | ✅ | ✅ | ✅ |
| Online editieren (beide) | ✅ | ✅ | ❌ (nur lokal) |
| Aufwand Einrichtung | niedrig–mittel | **hoch** | niedrig + kleiner Umbau |
| Wartung/Ops bei uns | gering | **hoch** | **keine** |
| Lock-in / Abhängigkeit | mittel (Dienst) | mittel (eigene Infra) | **keine** |

---

## Meine Empfehlung (du entscheidest)

**Gestuft — (c) jetzt, (a) als billige Tür offen halten:**

1. **Jetzt mit (c) live gehen:** rein statisch auf Cloudflare, editieren lokal am Mac.
   Passt exakt zu „kostenlos + git-basiert + überwiegend lokal", **null Abhängigkeit/
   Lock-in**, robust. Kostet uns nur den **kleinen Reader-Umbau** (Tina-Client →
   `getCollection`), der ohnehin die sauberere Basis ist.
2. **(a) Tina Cloud Free bleibt jederzeit nachrüstbar**, **falls** Alexandra doch online
   vom eigenen Gerät editieren soll — `clientId`/`token` setzen, Build umstellen, fertig.
   Inhalte sind in git, also **kein Migrationsschmerz** beim Wechsel.

**(b) self-hosted würde ich uns ersparen** — der Ops-Aufwand lohnt für eine kleine
Fotoseite nicht, solange (a) gratis das Gleiche (online editieren) bietet.

> Kurz: **(c) ist die freieste/robusteste Basis und deckt „überwiegend lokal vom Mac"
> perfekt ab; (a) ist der einfache, gratis Schalter zu Online-Editing, wenn ihr ihn
> wollt.** Entscheidung liegt bei David.

---

# UPDATE (2026-06-02): Neue harte Anforderung → (c) raus, nur (a) vs. (b)

**Trennung Code vs. Inhalt:**
- **Code** (Website bauen/anpassen): David, lokal am Mac. Unkritisch.
- **Inhalt** (Stories, Reisen, Bilder): **David UND Alexandra**.

**Neue Pflicht:** Alexandra arbeitet überwiegend vom **iPad** (iPhone als Notfall, mal
ein Foto). → Der Editor **muss online im Browser** erreichbar sein. Ein iPad kann
**keine Dev-Umgebung** (`npm run dev`) starten. → **Option (c) scheidet aus.**

Verglichen werden nur noch die zwei **Online**-Wege.

## Zuerst die wichtigste Frage: liegen die Inhalte in einer fremden Cloud?
**Quelle der Wahrheit ist bei BEIDEN unser GitHub-Repo** — jede Änderung ist ein
**Commit in unser Repo** (Markdown/JSON + Bilder über repo-basierte Medien). Verlassen
wir den Anbieter, ist alles vollständig in git, mit Historie. **Aber ein ehrlicher
Unterschied:**
- **(a) Tina Cloud:** zusätzlich hält Tina auf **ihren Servern** eine **synchronisierte
  Index-/Arbeitskopie** der Inhalte (damit der Online-Editor schnell ist). Die
  **maßgebliche** Fassung + Historie bleibt in **unserem** git — aber eine **Kopie liegt
  bei einem Dritten.** Kein Lock-in (git ist kanonisch), aber es ist eine Kopie.
- **(b) Self-hosted:** der Index liegt in **unserer eigenen** Datenbank/Infra. **Nichts**
  liegt bei einem dritten Anbieter. Das ist die **strikteste** Auslegung von „in unserer Hand".

→ **Wenn „keine fremde Cloud" für dich bedeutet ‚gar keine Kopie irgendwo außer bei
uns', erfüllt das nur (b).** Wenn es bedeutet ‚Quelle + Historie in unserem git, eine
abgeleitete Index-Kopie beim Dienst ist ok', erfüllen es beide.

## (a) Tina Cloud (Free) vs. (b) Self-hosted — die Detailfragen

| Frage | (a) Tina Cloud Free | (b) Self-hosted |
|---|---|---|
| **Git-basiert (Commits in unser Repo)?** | ✅ ja | ✅ ja |
| **Kopie bei Drittem?** | ⚠️ ja (Index/Arbeitskopie auf Tina-Servern) | ✅ nein (alles bei uns) |
| **iPad-Browser-Editing** | ✅ Web-App, im iPad-Safari nutzbar (Sidebar+Vorschau; auf iPad ok, iPhone eng) | ✅ identisch (gleiche Web-App) |
| **Foto-Upload + WebP (jSquash-WASM) mobil** | ✅ läuft auch in iOS-Safari (WASM mobil unterstützt); **große Stapel sind mobil langsam/speicherhungrig → Bulk besser am Mac, einzelne vom iPad ok** | ✅ identisch (Encoding ist client-seitig, Backend-unabhängig) |
| **Kosten / Free-Tier-Grenzen** | **0 € bis 2 Nutzer** (David + Alexandra passen genau); Editorial-Workflow/Rollen/mehr Nutzer = kostenpflichtig | **0 € möglich**, aber aus **mehreren** Gratis-Tiers zusammengesteckt (DB z. B. MongoDB Atlas ~512 MB / Upstash; Auth; Cloudflare-Functions) — je eigene Limits |
| **Einrichtungs-Aufwand** | **niedrig–mittel:** Konto, Repo verbinden, `clientId`/`token` als Cloudflare-Env, `tinacms build`. Reader-Seiten bleiben (nutzen schon den Tina-Client) | **hoch:** DB + Auth + GraphQL-Funktion aufsetzen, absichern, **dauerhaft warten** |
| **Login (wer/wie)** | David = Eigentümer (GitHub-verknüpft); **Alexandra per E-Mail eingeladen, kein GitHub nötig**; beide im Browser unter `/admin` | wir konfigurieren die Auth selbst (z. B. **GitHub-OAuth** — beide haben GitHub — oder E-Mail/Passwort via Auth.js) |
| **Lock-in / Abhängigkeit** | Online-Editing hängt am Tina-Cloud-Dienst (Verfügbarkeit + Free-Tier-Fortbestand); Content nicht (git) | kein Tina-Cloud-Lock-in; dafür Abhängigkeit von **unserer** Infra, die **wir** betreiben |
| **Restrisiken** | Free-Tier-Bedingungen/2-Nutzer-Grenze könnten sich ändern; Dienst-Ausfall stoppt Online-Editing (Site + Inhalte bleiben sicher); **Kopie beim Dritten** | Komplexität → mehr kann brechen, **wir** müssen fixen; Auth-Sicherheit + DB-Free-Limits auf unserer Seite |

**Bestätigung:** Bei **beiden** bleiben die Inhalte als **Commits in unserem GitHub-Repo**
— niemand „besitzt" sie außer uns. Der **einzige** Unterschied: (a) hält zusätzlich eine
**Arbeitskopie auf Tina-Servern**, (b) nicht.

## Empfehlung (du entscheidest)

**Es hängt allein an deiner Auslegung von „keine fremde Cloud":**

- **Wenn eine abgeleitete Index-Kopie beim Dienst ok ist** (Quelle + Historie sicher in
  unserem git): **→ (a) Tina Cloud Free.** Erfüllt die iPad-Pflicht, ist **gratis für
  genau 2 Nutzer**, **niedriger Aufwand**, **keine Ops-Last**, Alexandra loggt sich per
  E-Mail ein. Für eine kleine 2-Personen-Fotoseite klar die pragmatischste Wahl.
- **Wenn „nichts darf außer bei uns liegen" eine harte Linie ist:** **→ (b) self-hosted.**
  Erfüllt das strikt, kostet aber **hohen Einrichtungs- + Dauer-Wartungsaufwand** (wir
  sind das Ops-Team). Vertretbar nur, wenn dir die „null Kopie woanders"-Eigenschaft
  **mehr wert ist** als die Einfachheit.

**Mein ehrlicher Rat:** Da iPad-Online-Editing jetzt Pflicht ist und **kostenlos +
einfach + zuverlässig** zählt, ist **(a) Tina Cloud Free** für euren Fall die sinnvollste
Wahl — **mit der klaren Einschränkung**, dass dann eine **synchronisierte Kopie eurer
Inhalte auf Tina-Servern** liegt (Quelle bleibt euer git). **Ist genau das für dich ein
No-Go**, ist **(b)** der Weg — dann plane ich einen möglichst schlanken, wartungsarmen
Self-Host-Stack (Cloudflare + MongoDB-Atlas-Free + GitHub-OAuth) und sage dir vorher
ehrlich, was an Dauer-Pflege auf uns zukommt.

> Noch **nichts gebaut/deployt.** Entscheidung: David.
