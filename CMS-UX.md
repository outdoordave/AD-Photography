# CMS-UX.md — Wie sich das CMS anfühlen soll (Davids Intent)

> Hier halten wir **fest, wie das Bearbeiten im CMS aussehen/funktionieren soll** —
> nicht das *Was* (Inhalte), sondern das *Wie* (Bedien-Gefühl). Damit es nicht jedes
> Mal neu erklärt werden muss. Ergänzen, wenn ein neuer Wunsch klar wird.

## Wie ich (David) einen CMS-Wunsch festhalte
1. **In Worten** hier eintragen (ein Abschnitt pro Funktion, s. u.).
2. **Optional mit Bild:** Screenshot/Skizze in ein **GitHub-Issue oder einen PR-Kommentar** ziehen
   (GitHub hostet das Bild) und hier verlinken. So ist „so soll es aussehen" dokumentiert.
3. Claude liest dieses Dokument vor CMS-Änderungen und richtet sich danach.

---

## Leitprinzipien (gelten überall)
- **P1 — Bearbeiten dort, wo es hingehört.** Einstellungen/Listen gehören in das **Formular der
  passenden Seite** (mit Live-Vorschau), nicht in separate Collections/Datei-Listen — außer eine
  eigene Collection ergibt inhaltlich klar Sinn (z. B. Stories, Alben, Reisen).
- **P2 — Klick-zum-Bearbeiten in der Vorschau.** Was man rechts in der Vorschau sieht, soll man
  **anklicken können und direkt im passenden CMS-Feld landen** (Tina `data-tina-field`). Das gilt
  für Inhalte **und** für Überschriften/Kategorien.
- **P3 — Schalter sind sichtbar & verständlich.** An/Aus-Optionen mit klarer Beschriftung + kurzer
  Erklärung (AN/AUS), auf der Seite, zu der sie gehören.
- **P4 — Kein Fachjargon, keine Kennungen ohne Not.** Wo eine technische „Kennung" nötig ist,
  klar erklären, dass sie einmal vergeben und nicht mehr geändert wird.
- **P5 — Immer eine visuelle Vorschau im CMS.** Wann immer im CMS etwas gebaut/bearbeitet/neu
  hinzugefügt wird, ein **Vorschau-Feld** mitliefern, das das Ergebnis zeigt (reines Anzeige-Feld,
  schreibt nichts; liest die Geschwisterwerte live via `useFormState`). Text/Beschreibung sind gut,
  aber **visuell erklärt mehr als tausend Worte.** Muster: `tina/fields/SprachBannerPreview.tsx`
  (Mini-Mockup mit Live-Werten) bzw. `tina/fields/SectionBanner.tsx` (reines Info-Feld).

---

## Festgehaltene Entscheidungen

### Equipment — Kategorien (Stand 20.06.2026)
- **So gewollt:** Kategorien (Kameras, Objektive, …) werden **direkt im Equipment-Formular**
  gepflegt — Abschnitt **„Kategorien"**: hinzufügen, umbenennen, per Drag&Drop sortieren.
  **Kein** eigener Menüpunkt / keine separate Datei-Liste.
- Beim einzelnen Gerät: Kategorie per **Dropdown** aus dieser Liste.
- **Klick-zum-Bearbeiten (P2):** Klick auf eine **Kategorie-Überschrift** in der Vorschau
  (z. B. „Kameras") springt direkt zu dieser Kategorie im CMS — **genau wie** der Klick auf ein
  einzelnes Gerät schon zum Gerät springt.

### Über uns — Profile-Hover (Stand 20.06.2026)
- **So gewollt:** Der Schalter „**Profile beim Drüberfahren anheben?**" sitzt **im „Über uns"-Formular**
  (unter „Personen") — nicht in „Darstellung". Effekt = Profile heben sich an wie die Story-Karten.

### Logo — überall anklickbar (Stand 20.06.2026, P2)
- **So gewollt:** Das Logo ist **an allen Stellen (Nav, Footer, Hero) anklickbar** → Klick in der
  CMS-Vorschau springt direkt ins **Logo-Feld unter 🎨 Darstellung**.
- Umgesetzt via Insel `LogoLink` (liest `darstellung` per `useTina`, `data-tina-field` am `<img>`).
- 🎨 Darstellung + ⭐ Highlights haben jetzt einen Vorschau-Router (`/`) → auffindbar + Live-Vorschau.
