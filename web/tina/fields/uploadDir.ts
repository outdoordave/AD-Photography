// Zielordner für NEUE Uploads je nach Kontext (Sammlung + Feld), statt alles flach in /uploads.
// Struktur (David): reisen/<slug>/ · alben/<slug>/ · journal/ · stories/ · site/hero · site/logo ·
// site/highlights · site/personen · site/social-thumbs · allgemein/ (Auffang, wenn kein Kontext).
//
// STABILER SLUG (kein Titel-Slug): reisen/alben brauchen den technischen Dokumentnamen. Zuverlässigste
// Quelle im laufenden CMS: die Admin-URL beim Bearbeiten — `#/collections/[edit/]<collection>/~/<slug>`
// (Format aus dem gebauten Admin-Bundle belegt). Greift die URL nicht (z. B. visuelle Bearbeitung ohne
// diese Route), fällt es bewusst auf `allgemein` zurück — NIE auf einen aus dem Titel geratenen Slug.
// Bestehende Bilder bleiben, wo sie sind (keine Migration).

function ctxFromUrl(): { collection: string; slug: string } {
  try {
    const h = typeof location !== 'undefined' ? (location.hash || '') : '';
    const m = h.match(/#\/collections\/(?:edit\/)?([^/]+)\/~\/([^?/]+)/);
    if (m) return { collection: m[1], slug: decodeURIComponent(m[2]).replace(/\.[^.]+$/, '') };
  } catch (e) { /* egal */ }
  return { collection: '', slug: '' };
}

// fieldName = der Feldname (z. B. 'photos', 'thumbnail', 'logo') — nur nötig, um innerhalb eines
// Bereichs zu unterscheiden (Journal: 'thumbnail' -> Social-Thumb, sonst journal/).
export function resolveUploadDir(fieldName?: string): string {
  const { collection, slug } = ctxFromUrl();
  const isThumb = fieldName === 'thumbnail';
  switch (collection) {
    case 'reisen': return slug ? `reisen/${slug}` : 'allgemein';
    case 'alben': return slug ? `alben/${slug}` : 'allgemein';
    case 'journal': return isThumb ? 'site/social-thumbs' : 'journal';
    case 'story': return 'stories';
    case 'startseite': return 'site/hero';
    case 'darstellung': return 'site/logo';
    case 'highlights': return 'site/highlights';
    case 'ueber_uns': return 'site/personen';
    default: return 'allgemein';
  }
}
