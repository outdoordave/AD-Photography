import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Lightbox, { type LbPhoto } from '../Lightbox';
import { normalizePath } from '../../lib/stories';
import { ALASKA_TIMELINE_DEMO, type TLStop } from './alaskaTimelineDemo';

// PROTOTYP — Variante B (vertikale Timeline / Reise-Journal), DESKTOP-Feinschliff.
// EIN Scroll-Kontext: die ganze Seite scrollt normal; Reise-Kopf + Karte sind sticky und
// kleben nur, solange der Timeline-Abschnitt läuft. KEIN innerer Scroll-Container.
// Fade = Overlay-Verlauf (Hintergrund -> transparent) an Ober-/Unterkante. Snap-Anker,
// Balken-Ende und aktive Station nutzen denselben Referenzpunkt (gemessene Punkt-Mitte).

type Lang = 'de' | 'en';
const STYLE = 'fiord';
const STICKY_TOP = 96; // unter der globalen Nav (Höhe 88px) — = CSS --ww-sticky-top

// ─────────────────────────────────────────────────────────────────────────────────────────
// JUSTIER-KONSTANTEN (Proto). Hier zentral drehen und live vergleichen.
// HINWEIS: SNAP_ENABLED und SPOTLIGHT_STRENGTH werden beim echten /trips-Umbau zu GLOBALEN
// CMS-Feldern (NICHT pro Reise). In dieser Runde bleiben es nur Konstanten (kein Tina-Schema).
// ─────────────────────────────────────────────────────────────────────────────────────────

// CMS später → Toggle „Stationen einrasten" (global), Default AUS.
// false = Timeline scrollt frei, die Position wird NIE gekapert (Lesen wird nicht gestört).
const SNAP_ENABLED = false;

// CMS später → Regler „Spotlight-Stärke" (global), Default 70, Schritte 10, Bereich 0–90.
//   Hilfetext: „Spotlight-Stärke – wie stark Stationen abseits des Lesefokus zurücktreten.
//   Empfohlen: 70 %. Höher = klarer Spotlight, niedriger = ruhiger/gleichmäßiger."
// gedimmte Deckkraft = 1 − SPOTLIGHT_STRENGTH/100  (70 → 0.30).
const SPOTLIGHT_STRENGTH = 70;

// Dezente Verkleinerung der gedimmten Stationen (bei voller Stärke). Separat justierbar.
const DIM_SCALE = 0.975;

// Ein-/Ausblend-Dauer des Fokus-Dimmings (ms). Höher = fluffiger/weicher.
const DIM_FADE_MS = 650;

// Fahrzeug-Marker: Münzen-Durchmesser in px (Bewegungs-Anker, „wir sind unterwegs").
const VEHICLE_SIZE = 42;

// Reveal (erstes Erscheinen): nur ein Hauch — kleiner Versatz + kurze Dauer.
const REVEAL_SHIFT = 10; // px
const REVEAL_DUR = 420;  // ms

function setMapLanguage(map: maplibregl.Map, lang: Lang) {
  if (!map.isStyleLoaded()) return;
  const expr: any = ['coalesce', ['get', 'name:' + lang], ['get', 'name:latin'], ['get', 'name']];
  try {
    for (const ly of (map.getStyle().layers || []) as any[]) {
      if (ly.type === 'symbol' && ly.layout && ly.layout['text-field'] !== undefined) {
        map.setLayoutProperty(ly.id, 'text-field', expr);
      }
    }
  } catch { /* Stil noch nicht bereit */ }
}

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Gekrümmter Flugbogen (quadratische Bézier): Kontrollpunkt = Mitte + Senkrechte (poleward),
// damit Flüge als Bogen statt gerader Luftlinie verlaufen. Liefert n+1 Punkte entlang der Kurve.
function arcPoints(a: [number, number], b: [number, number], bow: number, n: number): [number, number][] {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let perp: [number, number] = [dy, -dx];        // senkrecht zur Strecke
  if (perp[1] < 0) perp = [-dy, dx];             // Bogen nach Norden (poleward) ausrichten
  const cx = mx + perp[0] * bow, cy = my + perp[1] * bow;
  const pts: [number, number][] = [];
  for (let t = 0; t <= n; t++) {
    const u = t / n, v = 1 - u;
    pts.push([v * v * a[0] + 2 * v * u * cx + u * u * b[0], v * v * a[1] + 2 * v * u * cy + u * u * b[1]]);
  }
  return pts;
}

// Route: Koordinaten + Fahretappen (gerade) + Flugetappen (gekrümmte Bögen).
function buildRoute(stops: TLStop[]) {
  const coords: [number, number][] = stops.map((s) => [s.lon, s.lat]);
  const driveSegs: [number, number][][] = [];
  const flightArcs: { i: number; pts: [number, number][] }[] = [];
  const legFlight: boolean[] = [false];
  for (let i = 1; i < coords.length; i++) {
    const isFlight = stops[i].arriveBy === 'flight';
    legFlight[i] = isFlight;
    if (isFlight) flightArcs.push({ i, pts: arcPoints(coords[i - 1], coords[i], 0.15, 48) });
    else driveSegs.push([coords[i - 1], coords[i]]);
  }
  return { coords, driveSegs, flightArcs, legFlight };
}

// Reduzierte Silhouetten (kein Foto): Full-Size-SUV im Stil eines Ford Expedition (langer
// kastiger Körper, hohe gerade Dachlinie über die ganze Länge, 3 Seitenfenster als
// Aussparungen via fill-rule evenodd, große Radkästen, aufrechte Front) + Flugzeug (Draufsicht).
const CAR_SVG =
  '<svg viewBox="0 0 96 34" width="30" height="11" fill="currentColor" fill-rule="evenodd" aria-hidden="true">' +
  '<path d="M5 28 L5 10 L7 8 L52 8 L60 16 L85 16 Q88 16 88 18 L88 28 L81 28 A6.5 6.5 0 0 0 68 28 L32 28 A6.5 6.5 0 0 0 19 28 L5 28 Z ' +
  'M10 9.4 h13 v5 h-13 z M25 9.4 h13 v5 h-13 z M40 9.4 h11 v5 h-11 z"/>' +
  '<circle cx="25.5" cy="28.5" r="6.5"/><circle cx="74.5" cy="28.5" r="6.5"/></svg>';
const PLANE_SVG =
  '<svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">' +
  '<path d="M16 2 Q18 2 18 7 L18 13 L29 20 L29 23 L18 19 L18 26 L22 29 L22 31 L16 29 L10 31 L10 29 L14 26 L14 19 L3 23 L3 20 L14 13 L14 7 Q14 2 16 2 Z"/></svg>';

function bearingDeg(a: [number, number], b: [number, number]) {
  const dEast = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  const dNorth = b[1] - a[1];
  return Math.atan2(dEast, dNorth) * 180 / Math.PI;
}

export default function TripsTimelineProto({ lang = 'de' as Lang }: { lang?: Lang }) {
  const trip = ALASKA_TIMELINE_DEMO;
  const stops = trip.stops;

  const [active, setActive] = React.useState(0);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const readyRef = React.useRef(false);
  const activeRef = React.useRef(0);

  const headRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const headHRef = React.useRef(0);
  const navHRef = React.useRef(STICKY_TOP);        // gemessene Höhe der globalen Sticky-Nav
  const centersRef = React.useRef<number[]>([]);   // Punkt-Mitten, absolute Dokument-Y (Balken)
  const blocksRef = React.useRef<{ top: number; bottom: number }[]>([]); // Stations-Blöcke (Dokument-Y, layout-basiert)
  const firstAbsRef = React.useRef(0);             // Mitte des 1. Punkts (für Balken-Bezug)
  const rafRef = React.useRef<number | null>(null);
  const snapAnimRef = React.useRef<number | null>(null); // laufender Snap-Tween

  const routeRef = React.useRef(buildRoute(stops));
  const vehicleRef = React.useRef<maplibregl.Marker | null>(null);
  const vehicleIconRef = React.useRef<HTMLSpanElement | null>(null);
  const vehicleModeRef = React.useRef<'car' | 'plane'>('car');
  const vehicleAtRef = React.useRef(0);            // Station, an der das Fahrzeug ruht/animiert-von
  const animRef = React.useRef<number | null>(null);

  const styleUrl = 'https://tiles.openfreemap.org/styles/' + STYLE;

  function drawMarkers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    stops.forEach((s, idx) => {
      if (s.lat == null || s.lon == null) return;
      const sel = idx === activeRef.current;
      const size = sel ? 18 : 13;
      const col = sel ? '#f0c9a8' : '#a7672f';
      const border = sel ? '#a7672f' : '#f4ede1';
      const el = document.createElement('div');
      el.style.cssText = 'width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer';
      const dot = document.createElement('div');
      dot.style.cssText =
        'width:' + size + 'px;height:' + size + 'px;background:' + col + ';border:2.5px solid ' + border +
        ';border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.45);transition:width .2s,height .2s';
      el.appendChild(dot);
      const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
        '<p class="ww-popup-name">' + (s.title || s.name) + '</p>' + (s.date ? '<p class="ww-popup-date">' + s.date + '</p>' : '')
      );
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([s.lon, s.lat])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener('click', () => scrollToStop(idx));
      markersRef.current.push(marker);
    });
  }

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    const b = new maplibregl.LngLatBounds();
    stops.forEach((s) => b.extend([s.lon, s.lat]));
    map.fitBounds(b, { padding: 60, duration: prefersReduced() ? 0 : 600 });
  }

  function drawRoute() {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const { driveSegs } = routeRef.current;
    const addLine = (id: string, segs: [number, number][][], dashed: boolean) => {
      if (!segs.length) return;
      const data = { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: segs } } as any;
      if (map.getSource(id)) { (map.getSource(id) as any).setData(data); return; }
      map.addSource(id, { type: 'geojson', data });
      map.addLayer({
        id: id + '-layer', type: 'line', source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#a7672f', 'line-width': dashed ? 2 : 2.5, 'line-opacity': dashed ? 0.6 : 0.8,
          ...(dashed ? { 'line-dasharray': [1.6, 1.6] } : {}),
        },
      });
    };
    addLine('route-drive', driveSegs, false);
    addLine('route-flight', routeRef.current.flightArcs.map((a) => a.pts), true);
  }

  // Karte folgt dem aktiven Stopp.
  function mapFollow(idx: number) {
    const map = mapRef.current;
    const s = stops[idx];
    if (!map || !readyRef.current || !s) return;
    // Flug beteiligt? (aktiver Stopp = Ankunft ODER Abflug einer Flugetappe) -> ganzen Bogen zeigen.
    const arrFlight = stops[idx].arriveBy === 'flight';
    const depFlight = !!(stops[idx + 1] && stops[idx + 1].arriveBy === 'flight');
    if (arrFlight || depFlight) {
      const j = arrFlight ? idx : idx + 1; // Ankunfts-Index der Flugetappe
      const arc = routeRef.current.flightArcs.find((x) => x.i === j);
      const pts = arc ? arc.pts : [routeRef.current.coords[j - 1], routeRef.current.coords[j]];
      const b = new maplibregl.LngLatBounds();
      pts.forEach((p) => b.extend(p as [number, number]));
      map.fitBounds(b, { padding: 70, duration: prefersReduced() ? 0 : 900 });
      if (prefersReduced()) placeVehicleAtStop(idx);
      return;
    }
    if (prefersReduced()) { map.jumpTo({ center: [s.lon, s.lat] }); placeVehicleAtStop(idx); return; }
    map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 4.2), duration: 800, essential: true });
  }

  function scrollToStop(idx: number) {
    const el = document.getElementById('tl-stop-' + idx);
    if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
  }

  // Fahrzeug positionieren (Auto/Flugzeug, gespiegelt/gedreht).
  function placeVehicle(lng: number, lat: number, flight: boolean, bearing: number, dx: number) {
    const m = vehicleRef.current; const icon = vehicleIconRef.current;
    if (!m || !icon) return;
    m.setLngLat([lng, lat]);
    const mode = flight ? 'plane' : 'car';
    if (vehicleModeRef.current !== mode) { icon.innerHTML = flight ? PLANE_SVG : CAR_SVG; icon.classList.toggle('is-plane', flight); vehicleModeRef.current = mode; }
    icon.style.transform = flight ? `rotate(${bearing}deg)` : `scaleX(${dx < 0 ? -1 : 1})`;
  }
  function placeVehicleAtStop(idx: number) {
    const c = routeRef.current.coords[idx];
    if (c) placeVehicle(c[0], c[1], false, 0, 1);
  }

  // Punkte einer Etappe (toIdx-1 -> toIdx): Fahrt = Gerade, Flug = gekrümmter Bogen.
  function legPoints(toIdx: number): { pts: [number, number][]; flight: boolean } {
    const { coords, legFlight, flightArcs } = routeRef.current;
    if (legFlight[toIdx]) { const arc = flightArcs.find((x) => x.i === toIdx); return { pts: arc ? arc.pts : [coords[toIdx - 1], coords[toIdx]], flight: true }; }
    return { pts: [coords[toIdx - 1], coords[toIdx]], flight: false };
  }

  // Fahrzeug sanft (langsam, easing) zur aktiven Station gleiten lassen — entlang der echten
  // Etappen (Auto gerade, Flugzeug die Kurve). Station-treu: ruht immer AN einer Station.
  function animateVehicleTo(target: number) {
    if (!vehicleRef.current) return;
    // Bei laufender Animation von der AKTUELLEN Fahrzeugposition (nächster Stopp) weiter,
    // statt zur ursprünglichen Start-Station zurückzuspringen.
    let from = vehicleAtRef.current;
    if (animRef.current != null) {
      const cur = vehicleRef.current.getLngLat();
      const cs = routeRef.current.coords;
      let nb = from, nd = Infinity;
      for (let i = 0; i < cs.length; i++) { const d = Math.hypot(cs[i][0] - cur.lng, cs[i][1] - cur.lat); if (d < nd) { nd = d; nb = i; } }
      from = nb;
    }
    if (target === from) { vehicleAtRef.current = target; return; }
    if (animRef.current != null) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (prefersReduced()) { vehicleAtRef.current = target; placeVehicleAtStop(target); return; }
    const dir = target > from ? 1 : -1;
    const flat: { p: [number, number]; flight: boolean }[] = [];
    for (let k = from; k !== target; k += dir) {
      const toIdx = dir > 0 ? k + 1 : k;
      const lp = legPoints(toIdx);
      const pts = dir < 0 ? lp.pts.slice().reverse() : lp.pts;
      pts.forEach((p, j) => { if (flat.length && j === 0) return; flat.push({ p, flight: lp.flight }); });
    }
    if (flat.length < 2) { vehicleAtRef.current = target; placeVehicleAtStop(target); return; }
    const segLen: number[] = []; let total = 0;
    for (let j = 1; j < flat.length; j++) { const a = flat[j - 1].p, b = flat[j].p; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); segLen.push(d); total += d; }
    const dur = Math.min(2000, 600 + 500 * Math.abs(target - from)); // langsam „hinterher"
    const t0 = performance.now();
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const stepFn = (now: number) => {
      const u = Math.min(1, (now - t0) / dur);
      const want = ease(u) * total;
      let acc = 0, j = 1;
      while (j < flat.length && acc + segLen[j - 1] < want) { acc += segLen[j - 1]; j++; }
      j = Math.min(j, flat.length - 1);
      const a = flat[j - 1].p, b = flat[j].p; const sl = segLen[j - 1] || 1; const f = (want - acc) / sl;
      placeVehicle(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, flat[j].flight, bearingDeg(a, b), b[0] - a[0]);
      if (u < 1) { animRef.current = requestAnimationFrame(stepFn); }
      else { animRef.current = null; vehicleAtRef.current = target; placeVehicleAtStop(target); }
    };
    animRef.current = requestAnimationFrame(stepFn);
  }

  // --- Vermessung: Punkt-Mitten (absolute Dokument-Y) + Linien-Geometrie + Snap-Padding ---
  function measure() {
    const list = listRef.current;
    if (!list) return;
    const dots = Array.from(list.querySelectorAll<HTMLElement>('.tl-dot'));
    if (!dots.length) return;
    const sy = window.scrollY;
    const listAbsTop = list.getBoundingClientRect().top + sy;
    const centers = dots.map((d) => { const r = d.getBoundingClientRect(); return r.top + sy + r.height / 2; });
    centersRef.current = centers;
    firstAbsRef.current = centers[0];
    // Stations-Blöcke (Ober-/Unterkante) layout-basiert (offsetTop/Height) -> unbeeinflusst von
    // den Dimm-/Reveal-Transforms, damit die aktive Station nicht flackert.
    const stopEls = Array.from(list.querySelectorAll<HTMLElement>('.tl-stop'));
    blocksRef.current = stopEls.map((el) => { const top = listAbsTop + el.offsetTop; return { top, bottom: top + el.offsetHeight }; });
    const firstRel = centers[0] - listAbsTop;
    const lastRel = centers[centers.length - 1] - listAbsTop;
    list.style.setProperty('--line-top', firstRel + 'px');
    list.style.setProperty('--line-h', lastRel - firstRel + 'px');
    const headH = headRef.current ? headRef.current.getBoundingClientRect().height : 0;
    headHRef.current = headH;
    // Globale Nav messen -> Kopf klebt bündig darunter (kein Spalt, in dem Stationen durchscheinen).
    const nav = document.querySelector('header');
    const navH = nav ? Math.round(nav.getBoundingClientRect().height) : STICKY_TOP;
    navHRef.current = navH;
    document.documentElement.style.setProperty('--ww-sticky-top', navH + 'px');
    document.documentElement.style.setProperty('--ww-snap-pad', navH + headH + 'px');
    update();
  }

  // --- Pro Frame: Anker bestimmen -> aktive Station + Balken-Ende + Fahrzeug (gleicher Bezug) ---
  function update() {
    const centers = centersRef.current;
    const list = listRef.current;
    if (!centers.length || !list) return;
    const vh = window.innerHeight;
    const sy = window.scrollY;
    let headBottom = navHRef.current + headHRef.current;
    if (headRef.current) headBottom = Math.min(Math.max(headRef.current.getBoundingClientRect().bottom, 0), vh);
    const anchorY = (headBottom + vh) / 2; // Anker = Mitte des sichtbaren Timeline-Bandes
    const anchorDoc = sy + anchorY;

    // aktive Station = die, in deren BLOCK der Lese-Anker liegt (sonst der nächstgelegene Block).
    // -> große Hauptstationen bleiben aktiv, solange der Großteil sichtbar ist; kurze
    //    Zwischenstopps werden erst aktiv, wenn sie wirklich am Anker sind (kein zu frühes Ein/Aus).
    const blocks = blocksRef.current;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const d = anchorDoc < b.top ? b.top - anchorDoc : anchorDoc > b.bottom ? anchorDoc - b.bottom : 0;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best !== activeRef.current) {
      activeRef.current = best; setActive(best); drawMarkers(); mapFollow(best);
      animateVehicleTo(best); // sanftes, station-treues Gleiten zur neuen aktiven Station
    }
    // Fortschrittsbalken zieht KONTINUIERLICH mit dem Scroll mit (gleitet, schnippt nicht),
    // geklemmt zwischen erstem und letztem Punkt. Bezug = derselbe Anker.
    const lineH = centers[centers.length - 1] - firstAbsRef.current;
    list.style.setProperty('--fill', Math.max(0, Math.min(lineH, anchorDoc - firstAbsRef.current)) + 'px');
  }

  function cancelSnap() { if (snapAnimRef.current != null) { cancelAnimationFrame(snapAnimRef.current); snapAnimRef.current = null; } }

  // Sanft (fluffig) zu einer Ziel-Scrollposition gleiten — eigener Tween statt nativem
  // smooth-scroll (das „schnippt"). easeInOut, distanzabhängige Dauer, weicher Ausklang.
  function smoothScrollTo(target: number) {
    cancelSnap();
    const start = window.scrollY;
    const dist = target - start;
    if (Math.abs(dist) < 2) return;
    const dur = Math.min(900, 460 + Math.abs(dist) * 0.55);
    const t0 = performance.now();
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const stepFn = (now: number) => {
      const u = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, start + dist * ease(u));
      if (u < 1) snapAnimRef.current = requestAnimationFrame(stepFn);
      else snapAnimRef.current = null;
    };
    snapAnimRef.current = requestAnimationFrame(stepFn);
  }

  // Magnetisches Snapping per JS (zuverlässiger als CSS-scroll-snap, v. a. Safari):
  // wenn das Scrollen ruht, fluffig die nächstgelegene Station an den Anker rücken.
  function snapToNearest() {
    if (prefersReduced()) return;
    const centers = centersRef.current;
    if (centers.length < 2) return;
    const vh = window.innerHeight, sy = window.scrollY;
    let headBottom = navHRef.current + headHRef.current;
    if (headRef.current) headBottom = Math.min(Math.max(headRef.current.getBoundingClientRect().bottom, 0), vh);
    const anchorY = (headBottom + vh) / 2;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < centers.length; i++) { const d = Math.abs(centers[i] - sy - anchorY); if (d < bestD) { bestD = d; best = i; } }
    const target = Math.round(centers[best] - anchorY);
    if (Math.abs(target - sy) < 3) return; // schon angedockt
    smoothScrollTo(target);
  }

  // Karte einmal erzeugen
  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapElRef.current, style: styleUrl, center: [-40, 55], zoom: 1.6,
      cooperativeGestures: false, attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.scrollZoom.enable();
    map.on('load', () => {
      readyRef.current = true;
      setMapLanguage(map, lang);
      drawRoute();
      drawMarkers();
      fitAll();
      const el = document.createElement('div');
      el.className = 'tl-vehicle'; el.style.pointerEvents = 'none';
      const icon = document.createElement('span'); icon.className = 'tl-vehicle-ic'; icon.innerHTML = CAR_SVG;
      el.appendChild(icon); vehicleIconRef.current = icon;
      vehicleRef.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(routeRef.current.coords[0]).addTo(map);
      if (prefersReduced()) placeVehicleAtStop(activeRef.current); else update();
    });
    map.on('error', () => { /* Tile-/Style-Aussetzer schlucken */ });
    return () => {
      if (animRef.current != null) { cancelAnimationFrame(animRef.current); animRef.current = null; }
      markersRef.current.forEach((m) => m.remove());
      if (vehicleRef.current) { vehicleRef.current.remove(); vehicleRef.current = null; }
      map.remove(); mapRef.current = null; readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single-Scroll: auf window-Scroll + resize hören (rAF-gedrosselt). Beim Ruhen -> Snap.
  React.useEffect(() => {
    let snapTimer: number | undefined;
    // Auto-Snapping nur, wenn aktiviert (Default AUS) -> sonst scrollt die Timeline frei,
    // die Position wird beim Ruhen nie gekapert.
    const armSnap = () => { if (!SNAP_ENABLED) return; if (snapTimer) window.clearTimeout(snapTimer); snapTimer = window.setTimeout(snapToNearest, 150); };
    const onScroll = () => {
      armSnap();
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => { rafRef.current = null; update(); });
    };
    const onResize = () => { if (mapRef.current) mapRef.current.resize(); measure(); };
    // Eigene Nutzer-Eingaben brechen den laufenden Snap-Tween ab (man kann übernehmen).
    const onUserInput = () => cancelSnap();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('touchstart', onUserInput, { passive: true });
    window.addEventListener('keydown', onUserInput);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onUserInput);
      window.removeEventListener('touchstart', onUserInput);
      window.removeEventListener('keydown', onUserInput);
      if (snapTimer) window.clearTimeout(snapTimer);
      cancelSnap();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vermessen nach Layout, Fonts und Bild-Ladevorgängen.
  React.useEffect(() => {
    measure();
    const t = window.setTimeout(measure, 350);
    const fonts = (document as any).fonts;
    if (fonts && fonts.ready) fonts.ready.then(measure).catch(() => {});
    let ro: ResizeObserver | null = null;
    if (listRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(listRef.current);
    }
    return () => { window.clearTimeout(t); if (ro) ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dezente Reveals: jede Station blendet beim ersten Erscheinen EINMAL leicht auf (IO).
  // Ruhezustand bleibt sichtbar; bei reduced-motion oder ohne IO passiert nichts (einfach da).
  React.useEffect(() => {
    if (prefersReduced() || typeof IntersectionObserver === 'undefined') return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.tl-stop'));
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).classList.add('is-revealing'); io.unobserve(e.target); }
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Justier-Konstanten -> CSS-Variablen (einmal). So steuern die Konstanten oben das Aussehen.
  React.useEffect(() => {
    const r = document.documentElement.style;
    const dimOp = Math.max(0, Math.min(1, 1 - SPOTLIGHT_STRENGTH / 100)); // 70 -> 0.30
    r.setProperty('--ww-dim-op', String(dimOp));
    r.setProperty('--ww-dim-scale', String(DIM_SCALE));
    r.setProperty('--ww-dim-fade', DIM_FADE_MS + 'ms');
    r.setProperty('--ww-vehicle-size', VEHICLE_SIZE + 'px');
    r.setProperty('--ww-reveal-shift', REVEAL_SHIFT + 'px');
    r.setProperty('--ww-reveal-dur', REVEAL_DUR + 'ms');
  }, []);

  function openLightbox(s: TLStop, photoIndex: number) {
    const all = (s.hero ? [s.hero] : []).concat(s.photos || []).filter(Boolean);
    if (!all.length) return;
    setLb({ photos: all.map((p) => ({ photo: normalizePath(p) })), start: photoIndex });
  }

  const stepWord = lang === 'de' ? 'Station ' : 'Stop ';

  const items: React.ReactNode[] = [];
  stops.forEach((s, i) => {
    if (s.stage) items.push(<li className="tl-divider" key={'div-' + i} aria-hidden="true"><span>{s.stage}</span></li>);
    const isMain = s.kind === 'main';
    items.push(
      <li key={i} id={'tl-stop-' + i} data-idx={i}
        className={'tl-stop ' + (isMain ? 'tl-main' : 'tl-inter') + (i === active ? ' is-active' : '')}>
        <div className="tl-rail" aria-hidden="true"><span className="tl-dot" /></div>
        <div className="tl-body">
          <div className="tl-step">{stepWord}{i + 1}/{stops.length}{isMain ? '' : ' · Zwischenstopp'}</div>
          <h3 className="tl-title">{s.title}</h3>
          <div className="tl-date">{s.date}</div>
          {isMain && s.hero ? (
            <div className="tl-hero ph ww-photo" onClick={() => openLightbox(s, 0)}>
              <img src={normalizePath(s.hero)} alt="" loading="lazy" />
            </div>
          ) : null}
          {isMain
            ? s.text.split('\n\n').map((para, pi) => <p key={pi} className="tl-text">{para}</p>)
            : <p className="tl-text tl-text-slim">{s.text}</p>}
          {isMain && s.photos && s.photos.length ? (
            <div className="tl-strip">
              {s.photos.map((p, pi) => (
                <img key={pi} src={normalizePath(p)} alt="" loading="lazy"
                  onClick={() => openLightbox(s, (s.hero ? 1 : 0) + pi)} />
              ))}
            </div>
          ) : null}
          {!isMain && s.thumb ? (
            <div className="tl-thumb ww-photo" onClick={() => setLb({ photos: [{ photo: normalizePath(s.thumb!) }], start: 0 })}>
              <img src={normalizePath(s.thumb)} alt="" loading="lazy" />
            </div>
          ) : null}
        </div>
      </li>
    );
  });

  return (
    <div className="tl-proto">
      <div className="tl-note">
        <strong>Prototyp · Variante B (Desktop).</strong> Ein Scroll-Kontext: Seite scrollt normal,
        Kopf &amp; Karte bleiben sticky. {stops.length} Demo-Stopps, 2 Flugetappen. Inhalte erfunden.
      </div>

      <div className="tl-stage">
        <div className="tl-head" ref={headRef}>
          <div className="tl-meta">{trip.meta}</div>
          <h2>{trip.title}</h2>
          <p className="tl-summary">{trip.summary}</p>
        </div>

        <ol className="tl-list" ref={listRef}>
          <div className="tl-fade tl-fade-top" aria-hidden="true" />
          <div className="tl-line" aria-hidden="true" />
          <div className="tl-line-fill" aria-hidden="true" />
          {items}
          <div className="tl-fade tl-fade-bottom" aria-hidden="true" />
        </ol>

        <div className="tl-map-col">
          <div className="tl-map map-box">
            <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
            <div className="tl-legend" aria-hidden="true">
              <span><i className="tl-leg-drive" />Fahrt</span>
              <span><i className="tl-leg-flight" />Flug</span>
            </div>
          </div>
        </div>
      </div>

      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} loop onClose={() => setLb(null)} />}
    </div>
  );
}
