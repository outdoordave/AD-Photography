// Responsive Bilder: baut das `srcset` fuer einen /uploads-Pfad.
//
// Warum hier und nicht per HTML-Nachbearbeitung: so wird das srcset IMMER im selben Render
// aus demselben src abgeleitet. Tauscht eine Insel das Bild (Startseite mischt z. B.), passt
// das srcset automatisch mit — es kann nie auf ein altes Bild zeigen.
//
// Sicherheitsnetz: angeboten werden NUR Breiten, die kleiner als das Original sind, und nur
// fuer Bilder, deren Breite wirklich gemessen wurde (src/data/image-widths.json, erzeugt von
// scripts/gen-uploads-manifest.mjs). Unbekanntes Bild -> kein srcset -> normales src. Damit
// kann kein Verweis auf eine nicht existierende Datei entstehen.
// Die Dateien `<name>-<breite>w.<ext>` legt scripts/optimize-uploads.mjs im Build an.
import WIDTHS from '../data/image-widths.json';
import LADDER from '../../scripts/lib/image-ladder.json';

const MAP = WIDTHS as Record<string, number>;

/** `srcset`-Wert fuer einen /uploads-Pfad — oder undefined, wenn es keine Varianten gibt. */
export function imgSrcSet(path?: string | null): string | undefined {
  // NUR im gebauten Stand: die Varianten-Dateien legt optimize-uploads erst NACH `astro build`
  // in dist/ an — im Dev-Server (npm run dev) gibt es sie nicht. Ohne diese Bremse zeigte das
  // srcset dort auf 404er und die Vorschau/CMS-Vorschau haette kaputte Bilder.
  if (!import.meta.env.PROD) return undefined;
  if (!path || path.charAt(0) !== '/') return undefined; // nur eigene Pfade, keine externen URLs
  const full = MAP[path];
  if (!full) return undefined;
  const m = /^(.*)\.([A-Za-z0-9]+)$/.exec(path);
  if (!m) return undefined;
  const base = m[1], ext = m[2];
  const parts = (LADDER.widths as number[])
    .filter((w) => w < full)
    .map((w) => `${base}-${w}w.${ext} ${w}w`);
  if (!parts.length) return undefined; // Bild ist schon klein -> nichts zu gewinnen
  parts.push(`${path} ${full}w`);
  return parts.join(', ');
}

/** Bequem fuer JSX/Astro: {...imgAttrs(src, '50vw')} liefert srcset+sizes (oder nichts). */
export function imgAttrs(path?: string | null, sizes = '100vw'): { srcset?: string; sizes?: string } {
  const srcset = imgSrcSet(path);
  return srcset ? { srcset, sizes } : {};
}
