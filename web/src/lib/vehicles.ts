// Kuratierte Fahrzeug-Silhouetten (reine SVG-Seitenprofile, einfarbig via currentColor) für
// den fahrenden Karten-Marker. Auswahl pro Reise über das Tina-Feld `vehicle` (Phase 3);
// Default = expedition. Mapping Auswahl -> SVG hier zentral. Optionales eigenes SVG: ein
// String, der mit '<svg' beginnt, wird direkt verwendet.

const EXPEDITION =
  '<svg viewBox="0 0 96 34" width="30" height="11" fill="currentColor" fill-rule="evenodd" aria-hidden="true">' +
  '<path d="M5 28 L5 10 L7 8 L52 8 L60 16 L85 16 Q88 16 88 18 L88 28 L81 28 A6.5 6.5 0 0 0 68 28 L32 28 A6.5 6.5 0 0 0 19 28 L5 28 Z ' +
  'M10 9.4 h13 v5 h-13 z M25 9.4 h13 v5 h-13 z M40 9.4 h11 v5 h-11 z"/>' +
  '<circle cx="25.5" cy="28.5" r="6.5"/><circle cx="74.5" cy="28.5" r="6.5"/></svg>';

// Pickup: Kabine (1 Fenster) vorne, offene niedrige Ladefläche hinten.
const PICKUP =
  '<svg viewBox="0 0 96 34" width="30" height="11" fill="currentColor" fill-rule="evenodd" aria-hidden="true">' +
  '<path d="M5 28 L5 18 L48 18 L48 10 L52 9 L66 9 L72 16 L88 16 Q90 16 90 18 L90 28 L82 28 A6.5 6.5 0 0 0 69 28 L31 28 A6.5 6.5 0 0 0 18 28 L5 28 Z ' +
  'M53 10.6 h11 v4.6 h-11 z"/>' +
  '<circle cx="24.5" cy="28.5" r="6.5"/><circle cx="75.5" cy="28.5" r="6.5"/></svg>';

// Jeep / kompakter SUV: kastig, hohe gerade Dachlinie, 2 große Fenster, große Räder.
const JEEP =
  '<svg viewBox="0 0 96 34" width="30" height="11" fill="currentColor" fill-rule="evenodd" aria-hidden="true">' +
  '<path d="M7 28 L7 9 L60 9 L65 14 L86 14 Q88 14 88 16 L88 28 L80 28 A7 7 0 0 0 66 28 L30 28 A7 7 0 0 0 16 28 L7 28 Z ' +
  'M12 10.6 h22 v4.6 h-22 z M37 10.6 h21 v4.6 h-21 z"/>' +
  '<circle cx="23" cy="28.5" r="7"/><circle cx="73" cy="28.5" r="7"/></svg>';

export const VEHICLES: Record<string, string> = { expedition: EXPEDITION, pickup: PICKUP, jeep: JEEP };

// Optionen fürs Tina-Auswahlfeld (Phase 3).
export const VEHICLE_OPTIONS = [
  { value: 'expedition', label: 'Ford Expedition (Standard)' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'jeep', label: 'Jeep / SUV' },
];

// Auswahl -> SVG. Eigenes SVG (beginnt mit '<svg') wird direkt genutzt. Fallback: Expedition.
export function vehicleSvg(id?: string): string {
  if (id && id.trim().slice(0, 4) === '<svg') return id;
  return VEHICLES[id || 'expedition'] || EXPEDITION;
}

// Flugzeug (Draufsicht, dreht in Kursrichtung) — für etwaige Flugetappen.
export const PLANE_SVG =
  '<svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">' +
  '<path d="M16 2 Q18 2 18 7 L18 13 L29 20 L29 23 L18 19 L18 26 L22 29 L22 31 L16 29 L10 31 L10 29 L14 26 L14 19 L3 23 L3 20 L14 13 L14 7 Q14 2 16 2 Z"/></svg>';
