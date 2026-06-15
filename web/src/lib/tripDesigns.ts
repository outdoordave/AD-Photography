// ════════════════════════════════════════════════════════════════════════════
// ZENTRALE QUELLE der Reise-Designs (Schritt 1: Entkopplung).
//
// EINE Quelle für (a) den pro-Seite emittierten <style> (Build) und – ab Schritt 3 –
// (b) das Regler-Feld im CMS. Damit kein Drift zwischen Vorschau und echter Seite.
//
// Modell: 4 ZENTRALE Vorlagen (none/soft/strong/luftig). Pro Reise wird später nur
// AUSGEWÄHLT, welche Vorlage gilt (Default 'strong'). Ändert man hier zentral einen
// Wert, ändern sich beim nächsten Build ALLE Reisen, die diese Vorlage nutzen.
//
// Schritt 1 ist rein additiv: Die Werte werden als gescopte CSS-Variablen unter
// `.tl-proto[data-trip-design="…"]` ausgegeben; die Stationskarte liest sie mit
// Fallback auf die bestehenden globalen Tokens (var(--ww-trip-*, var(--ww-*))).
// none/soft/strong = EXAKT die heutigen globalen Rahmen-Stufen → 'strong' (Default)
// rendert byte-gleich wie bisher. 'luftig' ist die neue „Apple-leicht"-Vorlage.
// ════════════════════════════════════════════════════════════════════════════

export type TripDesignId = 'none' | 'soft' | 'strong' | 'luftig';

export type TripDesignValues = {
  ring: string;           // --ww-trip-ring        : Karten-Ring (box-shadow-Inset-Ring)
  shadow: string;         // --ww-trip-shadow      : Karten-Schlagschatten
  cardBg: string | null;  // --ww-trip-card-bg     : Karten-Füllung (null = global --c-bg-alt)
  photoShadow: string;    // --ww-trip-photo-shadow: eigener Foto-Schatten ('none' = keiner)
  gap: string;            // --ww-trip-gap         : vertikaler Abstand zwischen Stationen
  titlePx: string | null; // --ww-trip-title       : aktive Hauptstation-Titelgröße (null = global --fs-title-lg)
  dimOp: number | null;   // --ww-trip-dim-op      : Inaktiv-Deckkraft (null = global/Spotlight-Regler)
  scale: number | null;   // --ww-trip-scale       : Inaktiv-Skalierung (null = global 0.975)
};

// none/soft/strong = die HEUTIGEN globalen Rahmen-Stufen (global.css :root / body.ww-frame-*).
// dimOp/scale bei none/soft/strong = null -> bewusst NICHT überschrieben, damit der globale
// Spotlight-Regler (reisen_settings.spotlight_strength) erhalten bleibt (byte-gleich).
export const TRIP_DESIGN_DEFAULTS: Record<TripDesignId, TripDesignValues> = {
  none: {
    ring: '0 0 0 0 transparent', shadow: '0 0 0 0 transparent',
    cardBg: null, photoShadow: 'none', gap: '14px', titlePx: null, dimOp: null, scale: null,
  },
  soft: {
    ring: '0 0 0 1px var(--c-line)', shadow: '0 8px 22px -10px rgba(46,36,24,0.30)',
    cardBg: null, photoShadow: 'none', gap: '14px', titlePx: null, dimOp: null, scale: null,
  },
  strong: {
    ring: '0 0 0 2px var(--c-line)', shadow: '0 18px 40px -12px rgba(46,36,24,0.50)',
    cardBg: null, photoShadow: 'none', gap: '14px', titlePx: null, dimOp: null, scale: null,
  },
  // „Apple-leicht": Karte ohne Ring/Schatten/Füllung, Foto SCHWEBT mit eigenem Schatten,
  // mehr Luft, kleinerer aktiver Titel, stärker zurücktretende inaktive Stationen.
  // Startwerte vom Nutzer (Schritt 1).
  luftig: {
    ring: '0 0 0 0 transparent', shadow: 'none',
    cardBg: 'transparent', photoShadow: '0 16px 42px -13px rgba(46,36,24,0.42)',
    gap: '50px', titlePx: '26px', dimOp: 0.15, scale: 0.80,
  },
};

export const TRIP_DESIGN_IDS: TripDesignId[] = ['none', 'soft', 'strong', 'luftig'];
export const TRIP_DESIGN_DEFAULT: TripDesignId = 'strong';

// Wert -> CSS-Custom-Properties. null = bewusst weglassen, damit der Fallback
// (var(--ww-trip-*, var(--ww-*))) auf den globalen Token/Default greift.
export function designToVars(v: TripDesignValues): Record<string, string> {
  const out: Record<string, string> = {
    '--ww-trip-ring': v.ring,
    '--ww-trip-shadow': v.shadow,
    '--ww-trip-photo-shadow': v.photoShadow,
    '--ww-trip-gap': v.gap,
  };
  if (v.cardBg != null) out['--ww-trip-card-bg'] = v.cardBg;
  if (v.titlePx != null) out['--ww-trip-title'] = v.titlePx;
  if (v.dimOp != null) out['--ww-trip-dim-op'] = String(v.dimOp);
  if (v.scale != null) out['--ww-trip-scale'] = String(v.scale);
  return out;
}

// Erzeugt den gescopten CSS-Text für ALLE Designs (eine Quelle -> kein Drift).
// Wird pro Trip-Seite als <style> ausgegeben.
export function tripDesignsCss(
  designs: Record<TripDesignId, TripDesignValues> = TRIP_DESIGN_DEFAULTS,
): string {
  return TRIP_DESIGN_IDS.map((id) => {
    const body = Object.entries(designToVars(designs[id]))
      .map(([k, val]) => `${k}:${val}`)
      .join(';');
    return `.tl-proto[data-trip-design="${id}"]{${body}}`;
  }).join('\n');
}

// Guard für den (späteren) pro-Reise-Wert: unbekannt/leer -> Default 'strong' (byte-gleich).
export function resolveTripDesign(value: unknown): TripDesignId {
  return (TRIP_DESIGN_IDS as string[]).includes(value as string)
    ? (value as TripDesignId)
    : TRIP_DESIGN_DEFAULT;
}
