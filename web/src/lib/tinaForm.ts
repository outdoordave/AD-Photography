// Tina visuelles Editieren: Sidebar-Formular der geöffneten Vorschau-Seite folgen lassen.
//
// Problem (von David gemeldet): Beim Navigieren in der Live-Vorschau schaltete die Tina-Sidebar
// links NICHT automatisch auf das Dokument der neuen Seite um — erst ein Klick auf ein
// `data-tina-field`-Element schaltete um. Ursache (Tina-Doku + Quellcode `@tinacms/app`):
// Sind MEHRERE `useTina`-Formulare auf einer Seite registriert (hier u. a. das globale Logo
// in SiteNav/SiteFooter), nimmt Tina standardmäßig „das ERSTE angeforderte Query". Das ist das
// Logo-Formular, nicht der Seiteninhalt.
//
// Lösung (Tina-offiziell): `experimental___selectFormByFormId()` im `useTina`-Hook der jeweiligen
// INHALTS-Insel. Es schickt `postMessage({type:'user-select-form', formId})` ans Admin-Fenster,
// das daraufhin `forms:set-active-form-id` setzt. Die echte Form-ID ist laut Quelle
// `@tinacms/app/.../graphql-reducer.ts` der Dokument-Pfad `_internalSys.path` — in den Query-Daten
// als `_sys.path` enthalten (z. B. `src/content/stories/<datei>.md`).
//
// Dieser Helfer liefert genau diese ID aus den (initialen) Query-Daten:
//   • Einzeldokument-Query (z. B. story(relativePath)) -> `<doc>._sys.path`.
//   • Connection-Query (z. B. reisenConnection, alle Reisen) -> der Knoten, dessen
//     `_sys.filename` dem aktiven Slug entspricht. OHNE Slug bleibt es offen (undefined ->
//     Tina-Standardverhalten), damit Übersichts-Seiten nicht willkürlich ein Dokument wählen.

export function selectActiveFormId(data: any, slug?: string): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  for (const v of Object.values<any>(data)) {
    if (v && typeof v === 'object') {
      // Einzeldokument
      if (typeof v._sys?.path === 'string') return v._sys.path;
      // Connection (Liste) — nur mit aktivem Slug auflösen
      if (slug && Array.isArray(v.edges)) {
        const node = v.edges.map((e: any) => e?.node).find((n: any) => n?._sys?.filename === slug);
        if (typeof node?._sys?.path === 'string') return node._sys.path;
      }
    }
  }
  return undefined;
}
