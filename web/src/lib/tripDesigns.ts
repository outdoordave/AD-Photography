// ════════════════════════════════════════════════════════════════════════════
// ZENTRALE QUELLE der Reise-Designs (Design-Schritt 1–3).
//
// EINE Quelle für (a) den pro-Seite emittierten <style> (Build) und (b) das zentrale
// Regler-Feld im CMS (Schritt 3) -> kein Drift zwischen Vorschau und echter Seite.
//
// Modell (final):
//  - 4 ZENTRALE Vorlagen: none / soft / strong / luftig. Pro Reise wird nur AUSGEWÄHLT
//    (Feld `design`, Default 'strong' = byte-gleich wie heute). Wirkt nur auf die Stationen
//    DIESER Reise (Entkopplung via --ww-trip-* mit Fallback auf die globalen Tokens).
//  - Jedes Design hat zwei Teile:
//      • CHARACTER (fest, Code): ring / shadow / cardBg — definiert WAS das Design ist
//        (none = kein Rahmen, strong = 2px-Ring, luftig = kein Kasten). NICHT im CMS.
//      • TUNING (zentral editierbar, Zahlen): dimOp / gap / titlePx / scale / photoShadow —
//        gepflegt in src/data/trip-designs.json (Regler-Editor in Schritt 3). Änderung wirkt
//        GLOBAL auf ALLE Reisen mit diesem Design. Fehlende Werte -> Defaults unten (byte-gleich).
//
// none/soft/strong-Defaults = die HEUTIGEN Werte -> 'strong' rendert byte-gleich wie bisher.
// ════════════════════════════════════════════════════════════════════════════

export type TripDesignId = 'none' | 'soft' | 'strong' | 'luftig';

export const TRIP_DESIGN_IDS: TripDesignId[] = ['none', 'soft', 'strong', 'luftig'];
export const TRIP_DESIGN_DEFAULT: TripDesignId = 'strong';

// Anzeigenamen (CMS-Dropdown + Editor-Tabs).
export const TRIP_DESIGN_LABELS: Record<TripDesignId, string> = {
  none: 'Ohne Rahmen',
  soft: 'Ausgewogen',
  strong: 'Kräftig (Standard)',
  luftig: 'Luftig (Apple-leicht)',
};

// ── CHARACTER (fest, nicht im CMS) ──────────────────────────────────────────
type DesignCharacter = { ring: string; shadow: string; cardBg: string | null };
// WICHTIG: ring + shadow als transparente Null-Ebenen (NICHT 'none') — beide landen in der
// Komma-Liste `box-shadow: var(--ww-trip-ring,…), var(--ww-trip-shadow,…)`; 'none' wäre als
// Listeneintrag ungültig und würde den ganzen box-shadow verwerfen.
const CHARACTER: Record<TripDesignId, DesignCharacter> = {
  none:   { ring: '0 0 0 0 transparent',     shadow: '0 0 0 0 transparent',                  cardBg: null },
  soft:   { ring: '0 0 0 1px var(--c-line)',  shadow: '0 8px 22px -10px rgba(46,36,24,0.30)',  cardBg: null },
  strong: { ring: '0 0 0 2px var(--c-line)',  shadow: '0 18px 40px -12px rgba(46,36,24,0.50)', cardBg: null },
  luftig: { ring: '0 0 0 0 transparent',     shadow: '0 0 0 0 transparent',                  cardBg: 'transparent' },
};

// ── TUNING (zentral editierbar) ─────────────────────────────────────────────
export type DesignTuning = {
  dimOp: number;       // Inaktiv-Deckkraft (0 = unsichtbar … 1 = voll). Heute/Standard 0.30.
  gap: number;         // Luft zwischen Stationen in px. Heute 14.
  titlePx: number;     // Titelgröße aktive Hauptstation in px. Heute 30 (= --fs-title-lg).
  scale: number;       // Inaktiv-Skalierung (0.70 … 1.00). Heute 0.975.
  photoShadow: number; // Foto-Schatten-Stärke 0 (keiner) … 100. Heute 0; luftig 40.
};

// Defaults = HEUTIGE Werte (none/soft/strong) -> byte-gleich; luftig = Nutzer-Startwerte.
export const TRIP_DESIGN_TUNING_DEFAULTS: Record<TripDesignId, DesignTuning> = {
  none:   { dimOp: 0.30, gap: 14, titlePx: 30, scale: 0.975, photoShadow: 0 },
  soft:   { dimOp: 0.30, gap: 14, titlePx: 30, scale: 0.975, photoShadow: 0 },
  strong: { dimOp: 0.30, gap: 14, titlePx: 30, scale: 0.975, photoShadow: 0 },
  luftig: { dimOp: 0.15, gap: 50, titlePx: 26, scale: 0.80,  photoShadow: 40 },
};

// Foto-Schatten-Stärke (0–100) -> box-shadow. 0 = 'none'. Geeicht: Stärke 40 == luftig-Startwert
// `0 16px 42px -13px rgba(46,36,24,0.42)`. Einzel-box-shadow (.tl-hero/.tl-thumb) -> 'none' ist ok.
export function photoShadowCss(strength: number): string {
  const s = Math.max(0, Math.min(100, Number(strength) || 0));
  if (s <= 0) return 'none';
  const y = Math.round(s * 0.4);
  const blur = Math.round(s * 1.05);
  const spread = -Math.round(s * 0.325);
  const op = Math.min(0.6, 0.30 + s * 0.003).toFixed(2);
  return `0 ${y}px ${blur}px ${spread}px rgba(46,36,24,${op})`;
}

const numOr = (v: unknown, def: number): number =>
  (typeof v === 'number' && !Number.isNaN(v)) ? v : def;

// CMS-Datei (partiell/fehlend) über die Defaults legen -> vollständige Tuning-Map.
export function mergeTuning(cms: any): Record<TripDesignId, DesignTuning> {
  const out = {} as Record<TripDesignId, DesignTuning>;
  for (const id of TRIP_DESIGN_IDS) {
    const d = TRIP_DESIGN_TUNING_DEFAULTS[id];
    const c = (cms && cms[id]) || {};
    out[id] = {
      dimOp: numOr(c.dimOp, d.dimOp),
      gap: numOr(c.gap, d.gap),
      titlePx: numOr(c.titlePx, d.titlePx),
      scale: numOr(c.scale, d.scale),
      photoShadow: numOr(c.photoShadow, d.photoShadow),
    };
  }
  return out;
}

// Ein Design (Character + Tuning) -> CSS-Custom-Properties.
export function designToVars(id: TripDesignId, t: DesignTuning): Record<string, string> {
  const c = CHARACTER[id];
  const out: Record<string, string> = {
    '--ww-trip-ring': c.ring,
    '--ww-trip-shadow': c.shadow,
    '--ww-trip-photo-shadow': photoShadowCss(t.photoShadow),
    '--ww-trip-gap': t.gap + 'px',
    '--ww-trip-title': t.titlePx + 'px',
    '--ww-trip-dim-op': String(t.dimOp),
    '--ww-trip-scale': String(t.scale),
  };
  if (c.cardBg != null) out['--ww-trip-card-bg'] = c.cardBg;
  return out;
}

// Gescopter CSS-Text für ALLE 4 Designs (eine Quelle -> kein Drift). Pro Trip-Seite als <style>.
export function tripDesignsCss(
  tuning: Record<TripDesignId, DesignTuning> = TRIP_DESIGN_TUNING_DEFAULTS,
): string {
  return TRIP_DESIGN_IDS.map((id) => {
    const body = Object.entries(designToVars(id, tuning[id]))
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
    return `.tl-proto[data-trip-design="${id}"]{${body}}`;
  }).join('\n');
}

// Guard für den pro-Reise-Wert: unbekannt/leer -> Default 'strong' (byte-gleich).
export function resolveTripDesign(value: unknown): TripDesignId {
  return (TRIP_DESIGN_IDS as string[]).includes(value as string)
    ? (value as TripDesignId)
    : TRIP_DESIGN_DEFAULT;
}
