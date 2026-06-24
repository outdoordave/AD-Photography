import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTina, tinaField } from 'tinacms/dist/react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { normalizePath, wwYouTubeEmbed, mdToHtml } from '../lib/stories';
import { track } from '../lib/track';
import { viewStops, bi, tripTitle, sortTrips, type RawTrip, type ViewStop, type Lang } from '../lib/trips';
import { vehicleSvg, PLANE_SVG } from '../lib/vehicles';

// Reisen-DETAILSEITE — Variante B (vertikale Timeline / Reise-Journal), 1:1-Port aus dem
// damaligen Prototyp (entfernt 06/2026; alter Stand via Git-Tag legacy-singlefile), ERWEITERT um die echten /trips-Fähigkeiten:
// useTina-Live-Daten + data-tina-field + Editor-Scroll-Sync, DE/EN, 5 Karten-Stile (live),
// CSS-Crop-Hero, Filmstreifen->Lightbox, Video/YouTube, verknüpftes Album, „Reisefazit"-Galerie.
// Globale Tuning-Werte (Spotlight/Übergang/Reveal/Snap) kommen als Props (aus reisen_settings).
// Eingefrorene Defaults, falls Props fehlen. prefers-reduced-motion respektiert.

const STICKY_TOP = 96; // Fallback unter der globalen Nav (gemessen in measure())

// Punkt 2 (höhenadaptive Aktivierung): KURZE Stationen werden früher aktiv (solange sie noch tiefer/
// sichtbar sind), LANGE exakt wie bisher (lead=0 -> kein Regressionsrisiko). Zum Nachjustieren:
const READ_FRACTION = 0.5;  // ab welcher Höhe eine Station als „kurz" gilt (Anteil des Lesebands)
const LEAD_FACTOR   = 0.55; // wie stark kurze Stationen früher umschalten (0 = aus, höher = früher)

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

// Gekrümmter Flugbogen (Bézier, poleward). Nur aktiv, wenn ein Stop arriveBy:'flight' trägt
// (im aktuellen Schema nicht vorhanden -> reale Reisen sind reine Fahrt; Code bleibt zukunftssicher).
function arcPoints(a: [number, number], b: [number, number], bow: number, n: number): [number, number][] {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let perp: [number, number] = [dy, -dx];
  if (perp[1] < 0) perp = [-dy, dx];
  const cx = mx + perp[0] * bow, cy = my + perp[1] * bow;
  const pts: [number, number][] = [];
  for (let t = 0; t <= n; t++) { const u = t / n, v = 1 - u; pts.push([v * v * a[0] + 2 * v * u * cx + u * u * b[0], v * v * a[1] + 2 * v * u * cy + u * u * b[1]]); }
  return pts;
}
function bearingDeg(a: [number, number], b: [number, number]) {
  const dEast = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  return Math.atan2(dEast, b[1] - a[1]) * 180 / Math.PI;
}
// Sanfte Kurve für EINE Fahr-Etappe p1->p2; p0/p3 = Nachbar-Stops liefern die Tangenten.
// ZENTRIPETALE Catmull-Rom (alpha=0.5): verhindert die „Haken"/Schlaufen, die die uniforme
// Variante bei eng oder spitzwinklig liegenden Stops macht (z. B. Yosemite↔Lake Tahoe).
const CURVE_SAMPLES = 18;
function curveLeg(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], n: number): [number, number][] {
  const lerp = (a: [number, number], b: [number, number], u: number): [number, number] => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const knot = (ti: number, a: [number, number], b: [number, number]) => ti + Math.max(1e-9, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1]))); // dt^0.5
  const t0 = 0, t1 = knot(t0, p0, p1), t2 = knot(t1, p1, p2), t3 = knot(t2, p2, p3);
  const out: [number, number][] = [];
  for (let s = 0; s <= n; s++) {
    const t = t1 + (t2 - t1) * (s / n);
    const a1 = lerp(p0, p1, (t - t0) / (t1 - t0));
    const a2 = lerp(p1, p2, (t - t1) / (t2 - t1));
    const a3 = lerp(p2, p3, (t - t2) / (t3 - t2));
    const b1 = lerp(a1, a2, (t - t0) / (t2 - t0));
    const b2 = lerp(a2, a3, (t - t1) / (t3 - t1));
    out.push(lerp(b1, b2, (t - t1) / (t2 - t1)));
  }
  return out;
}

type GeoStop = { lon: number | null; lat: number | null; flight: boolean };
function buildRoute(geo: GeoStop[]) {
  const coords: ([number, number] | null)[] = geo.map((g) => (g.lon != null && g.lat != null ? [g.lon, g.lat] : null));
  const flightArcs: { i: number; pts: [number, number][] }[] = [];
  const legFlight: boolean[] = [false];
  for (let i = 1; i < coords.length; i++) {
    legFlight[i] = geo[i].flight;
    const a = coords[i - 1], b = coords[i];
    if (a && b && geo[i].flight) flightArcs.push({ i, pts: arcPoints(a, b, 0.15, 48) });
  }
  // Punktliste je Etappe (EINE Quelle für Linie + Fahrzeug): Fahrt = sanfte Kurve, Flug = Bogen.
  // Über Flug-/Lückengrenzen wird nicht gekrümmt (Tangente am Rand = Sehne).
  const legPts: ([number, number][] | null)[] = new Array(coords.length).fill(null);
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1], b = coords[i];
    if (!a || !b) continue;
    if (legFlight[i]) { const arc = flightArcs.find((x) => x.i === i); legPts[i] = arc ? arc.pts : [a, b]; continue; }
    const prev = (coords[i - 2] && !legFlight[i - 1]) ? (coords[i - 2] as [number, number]) : a;
    const next = (coords[i + 1] && !legFlight[i + 1]) ? (coords[i + 1] as [number, number]) : b;
    legPts[i] = curveLeg(prev, a, b, next, CURVE_SAMPLES);
  }
  return { coords, flightArcs, legFlight, legPts };
}

// Durchgehende Routen-Polylinie (Stop 0 -> N) für das PROGRESSIVE Zeichnen: jeder Punkt mit
// kumulierter Distanz (cum) und Flug-Flag des hinführenden Segments (segFlight); je Stop die
// Distanz, an der er auf der Linie sitzt (stopDist). Damit kann die „gefahrene" Linie exakt bis
// zur Fahrzeugposition gezeichnet werden, statt die ganze Route vorab als Balken zu zeigen.
type RoutePath = { pts: [number, number][]; segFlight: boolean[]; cum: number[]; stopDist: number[]; total: number };
function buildPath(route: ReturnType<typeof buildRoute>): RoutePath {
  const { coords, legFlight, legPts: routeLegPts } = route;
  const pts: [number, number][] = [];
  const segFlight: boolean[] = [];
  const cum: number[] = [];
  const stopDist: number[] = new Array(coords.length).fill(0);
  for (let i = 0; i < coords.length; i++) {
    const c = coords[i];
    if (!c) { stopDist[i] = cum.length ? cum[cum.length - 1] : 0; continue; }
    if (!pts.length) { pts.push(c); cum.push(0); stopDist[i] = 0; continue; }
    const flight = !!legFlight[i];
    const legPts = (routeLegPts[i] && routeLegPts[i]!.length) ? routeLegPts[i]! : [pts[pts.length - 1], c];
    for (let j = 1; j < legPts.length; j++) {
      const prev = pts[pts.length - 1], p = legPts[j];
      pts.push(p); cum.push(cum[cum.length - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1])); segFlight.push(flight);
    }
    stopDist[i] = cum[cum.length - 1];
  }
  return { pts, segFlight, cum, stopDist, total: cum.length ? cum[cum.length - 1] : 0 };
}

type LinkedAlbum = { slug: string; name: { de?: string; en?: string } };
type Props = {
  query: string; variables: object; data: any; lang: Lang;
  mapStyle?: string; scrollZoom?: boolean; autoPopup?: boolean; initialSlug?: string;
  linkedAlbums?: Record<string, LinkedAlbum>;
  settingsQuery?: string; settingsVariables?: object; settingsData?: any;
  // Globale Tuning-Werte (Phase 3: aus reisen_settings). Defaults = eingefroren.
  spotlight?: number; dimMs?: number; revealMs?: number; snap?: boolean;
  vehicleId?: string;
  // Reise-Design (none/soft/strong/luftig) — Schritt 1: Entkopplung. Steuert nur die
  // gescopten --ww-trip-* auf .tl-proto. Default 'strong' (byte-gleich wie bisher).
  design?: string;
};

// Live-Kartenstil aus reisen_settings (eigene useTina nur mit echtem Query, bedingt gerendert).
function MapStyleWatcher({ query, variables, data, onStyle }: { query: string; variables: object; data: any; onStyle: (s: string) => void }) {
  const { data: d } = useTina({ query, variables, data });
  const style = (d as any)?.reisen_settings?.map_style;
  React.useEffect(() => { if (style) onStyle(style); }, [style]);
  return null;
}

export default function TripTimeline(props: Props) {
  const { lang } = props;
  const spotlight = props.spotlight ?? 70;
  const dimMs = props.dimMs ?? 800;
  const revealMs = props.revealMs ?? 800;
  const snap = props.snap ?? false;
  const tf = (o: any, base: string) => tinaField(o, (lang === 'en' ? base + '_en' : base + '_de') as any);
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });

  // Reisen ableiten (live, sortiert) und die aktive Reise per initialSlug wählen.
  const trips = React.useMemo(() => {
    const edges = (data as any)?.reisenConnection?.edges || [];
    return sortTrips(edges.filter(Boolean).map((e: any) => ({ slug: e?.node?._sys?.filename || '', data: (e?.node || {}) as RawTrip })));
  }, [data]);
  const tripIdx = React.useMemo(() => {
    const i = trips.findIndex((t) => t.slug === props.initialSlug);
    return i >= 0 ? i : 0;
  }, [trips, props.initialSlug]);
  const trip: any = trips[tripIdx]?.data || {};
  const tripSlug = trips[tripIdx]?.slug || '';
  const rawStops: any[] = Array.isArray(trip.stops) ? trip.stops : [];
  const stops: ViewStop[] = React.useMemo(() => viewStops(trip, lang), [trip, lang]);
  const kindOf = (i: number) => ((rawStops[i]?.kind === 'intermediate') ? 'intermediate' : 'main');

  const [active, setActive] = React.useState(0);
  const [inEditor, setInEditor] = React.useState(false); // im Tina-Vorschau-Iframe? -> Editor-Stationsleiste zeigen
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);
  const [liveMapStyle, setLiveMapStyle] = React.useState<string>(props.mapStyle || 'liberty');

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const readyRef = React.useRef(false);
  const activeRef = React.useRef(0);
  const inEditorRef = React.useRef(false);
  const editSyncTimerRef = React.useRef<number | null>(null);

  const headRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const mapColRef = React.useRef<HTMLDivElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const headHRef = React.useRef(0);
  const navHRef = React.useRef(STICKY_TOP);
  const centersRef = React.useRef<number[]>([]);
  const blocksRef = React.useRef<{ top: number; bottom: number }[]>([]);
  const firstAbsRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const snapAnimRef = React.useRef<number | null>(null);
  // Kopf-Fortschritt, geglättet via rAF-Lerp:
  //  --tl-p = Desktop-Crossfade (groß -> Kompaktband).
  //  --tl-m = Mobil (<=767): EIN Titel wandert/schrumpft kontinuierlich von groß/tief nach klein/oben.
  const pTargetRef = React.useRef(0);
  const pSmoothRef = React.useRef(0);
  const mTargetRef = React.useRef(0);
  const mSmoothRef = React.useRef(0);
  const cfRafRef = React.useRef<number | null>(null);
  const cfPrevTRef = React.useRef(0);

  const carSvg = vehicleSvg(props.vehicleId);
  const routeRef = React.useRef(buildRoute(stops.map((s, i) => ({ lon: s.lon, lat: s.lat, flight: rawStops[i]?.arriveBy === 'flight' }))));
  const pathRef = React.useRef<RoutePath>(buildPath(routeRef.current));
  const vehicleRef = React.useRef<maplibregl.Marker | null>(null);
  const vehicleIconRef = React.useRef<HTMLSpanElement | null>(null);
  const vehicleModeRef = React.useRef<'car' | 'plane'>('car');
  const vehicleAtRef = React.useRef(0);
  const animRef = React.useRef<number | null>(null);

  const styleUrl = 'https://tiles.openfreemap.org/styles/' + liveMapStyle;

  React.useEffect(() => { let v = false; try { v = window.self !== window.top; } catch { v = true; } inEditorRef.current = v; setInEditor(v); }, []);

  // Im Tina-Editor: eine Station per Chip direkt bearbeiten (fokussiert das Feld im Formular via
  // data-tina-field/„open") UND scrollt die Vorschau dorthin. Kein Klick auf „fremden Text" mehr.
  function editStop(i: number) {
    scrollToStop(i);
    const el = document.querySelector<HTMLElement>('.tl-stop[data-sidx="' + i + '"]');
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  function drawMarkers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    let activeMarker: maplibregl.Marker | null = null; // index-sicher: Stationen ohne Koordinaten werden übersprungen
    stops.forEach((s, idx) => {
      if (s.lat == null || s.lon == null) return;
      const sel = idx === activeRef.current;
      const size = sel ? 18 : 13;
      const el = document.createElement('div');
      el.style.cssText = 'width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer';
      const dot = document.createElement('div');
      dot.style.cssText = 'width:' + size + 'px;height:' + size + 'px;background:' + (sel ? '#f0c9a8' : '#a7672f') + ';border:2.5px solid ' + (sel ? '#a7672f' : '#f4ede1') + ';border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.45);transition:width .2s,height .2s';
      el.appendChild(dot);
      const popup = new maplibregl.Popup({ offset: 14, closeButton: false, closeOnClick: false }).setHTML('<p class="ww-popup-name">' + (s.title || s.name) + '</p>' + (s.date ? '<p class="ww-popup-date">' + s.date + '</p>' : ''));
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([s.lon, s.lat]).setPopup(popup).addTo(map);
      el.addEventListener('click', () => scrollToStop(idx));
      markersRef.current.push(marker);
      if (sel) activeMarker = marker;
    });
    // Popup der AKTIVEN Station automatisch zeigen (ohne Klick) — Name + Datum. Greift beim Laden
    // (Station 1) und bei jedem Stationswechsel, da drawMarkers() in beiden Fällen läuft.
    // WICHTIG: über den Marker öffnen (togglePopup setzt die lnglat-Position) — popup.addTo(map)
    // allein hätte keine Position und würde NICHT am Stationspunkt erscheinen.
    if (props.autoPopup !== false && activeMarker) { const p = (activeMarker as maplibregl.Marker).getPopup(); if (p && !p.isOpen()) (activeMarker as maplibregl.Marker).togglePopup(); }
  }

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    const pts = stops.filter((s) => s.lat != null && s.lon != null);
    if (!pts.length) return;
    const b = new maplibregl.LngLatBounds();
    pts.forEach((s) => b.extend([s.lon!, s.lat!]));
    map.fitBounds(b, { padding: 60, duration: prefersReduced() ? 0 : 600 });
  }

  function drawRoute() {
    const map = mapRef.current;
    if (!map) return;
    // Robust gegen Race: Ist der Stil noch nicht fertig (passiert im CMS-Vorschau-Iframe und
    // direkt nach einem Live-Stilwechsel via setStyle), beim nächsten 'idle' erneut zeichnen.
    // Sonst verschwand die Route dauerhaft (Marker sind DOM-Elemente und überleben setStyle,
    // die Linien-Layer NICHT) -> „Auto fährt, aber keine Linie".
    if (!map.isStyleLoaded()) { map.once('idle', drawRoute); return; }
    // Progressive Route, Apple-like: gezeichnet wird nur die bereits „gefahrene" Strecke
    // (drawDoneUpTo). Statt dickem Balken -> dezenter Schein (glow) + heller Rand (casing) +
    // schlanke, leicht durchsichtige Linie, runde Enden. Flug = gestrichelter Bogen auf hellem Track.
    const empty = { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: [] } } as any;
    const round = { 'line-cap': 'round' as const, 'line-join': 'round' as const };
    if (!map.getSource('route-done')) map.addSource('route-done', { type: 'geojson', data: empty });
    if (!map.getSource('route-done-air')) map.addSource('route-done-air', { type: 'geojson', data: empty });
    if (!map.getLayer('route-done-glow')) map.addLayer({ id: 'route-done-glow', type: 'line', source: 'route-done', layout: round, paint: { 'line-color': '#a7672f', 'line-width': 9, 'line-opacity': 0.10, 'line-blur': 4 } });
    if (!map.getLayer('route-done-casing')) map.addLayer({ id: 'route-done-casing', type: 'line', source: 'route-done', layout: round, paint: { 'line-color': '#fbf7f0', 'line-width': 6, 'line-opacity': 0.5, 'line-blur': 0.5 } });
    if (!map.getLayer('route-done-line')) map.addLayer({ id: 'route-done-line', type: 'line', source: 'route-done', layout: round, paint: { 'line-color': '#a7672f', 'line-width': 3, 'line-opacity': 0.82 } });
    if (!map.getLayer('route-done-air-casing')) map.addLayer({ id: 'route-done-air-casing', type: 'line', source: 'route-done-air', layout: round, paint: { 'line-color': '#fbf7f0', 'line-width': 5, 'line-opacity': 0.32 } });
    if (!map.getLayer('route-done-air-line')) map.addLayer({ id: 'route-done-air-line', type: 'line', source: 'route-done-air', layout: round, paint: { 'line-color': '#a7672f', 'line-width': 2.6, 'line-opacity': 0.72, 'line-dasharray': [1.4, 1.7] } });
    drawDoneUpTo(pathRef.current.stopDist[activeRef.current] ?? 0);
  }

  // „Gefahrene" Strecke bis Distanz d als Linienzüge, getrennt nach Fahrt (drive) und Flug (air),
  // damit der Flug gestrichelt bleibt. Bricht im Segment, in dem d liegt, exakt ab (interpoliert).
  function donePolylineRuns(d: number): { drive: [number, number][][]; air: [number, number][][] } {
    const { pts, segFlight, cum } = pathRef.current;
    if (pts.length < 2 || d <= 0) return { drive: [], air: [] };
    const runs: { flight: boolean; line: [number, number][] }[] = [];
    let cur = { flight: segFlight[0], line: [pts[0]] as [number, number][] };
    for (let k = 1; k < pts.length; k++) {
      const fl = segFlight[k - 1];
      if (fl !== cur.flight) { runs.push(cur); cur = { flight: fl, line: [pts[k - 1]] }; }
      if (cum[k] <= d) { cur.line.push(pts[k]); }
      else {
        const segStart = cum[k - 1], segLen = (cum[k] - segStart) || 1, f = (d - segStart) / segLen;
        const a = pts[k - 1], b = pts[k];
        cur.line.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
        break;
      }
    }
    runs.push(cur);
    return {
      drive: runs.filter((r) => !r.flight && r.line.length >= 2).map((r) => r.line),
      air: runs.filter((r) => r.flight && r.line.length >= 2).map((r) => r.line),
    };
  }
  function drawDoneUpTo(d: number) {
    const map = mapRef.current;
    if (!map || !map.getSource('route-done')) return;
    const { drive, air } = donePolylineRuns(d);
    (map.getSource('route-done') as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: drive } });
    (map.getSource('route-done-air') as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: air } });
  }

  function mapFollow(idx: number) {
    const map = mapRef.current; const s = stops[idx];
    if (!map || !readyRef.current || !s || s.lat == null || s.lon == null) return;
    // Flug-Rauszoom NUR an der Flug-ANKUNFT (diese Station wurde geflogen) — NICHT schon am
    // Abflug-Stop davor. Sonst zoomt es bereits raus, sobald man zur Abflugstation (z. B. Lake
    // Tahoe) FÄHRT, und sieht sie nicht mehr. So zoomt es erst beim Flug Tahoe->Anchorage heraus.
    const arrFlight = !!routeRef.current.legFlight[idx];
    if (arrFlight) {
      const arc = routeRef.current.flightArcs.find((x) => x.i === idx);
      const pts = arc ? arc.pts : ([routeRef.current.coords[idx - 1], routeRef.current.coords[idx]].filter(Boolean) as [number, number][]);
      if (pts.length) { const b = new maplibregl.LngLatBounds(); pts.forEach((p) => b.extend(p)); map.fitBounds(b, { padding: 100, maxZoom: 6, duration: prefersReduced() ? 0 : 1100 }); if (prefersReduced()) placeVehicleAtStop(idx); return; }
    }
    if (prefersReduced()) { map.jumpTo({ center: [s.lon, s.lat] }); placeVehicleAtStop(idx); return; }
    map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 4.2), duration: 800, essential: true });
  }

  function scrollToStop(idx: number) {
    const el = document.getElementById('tl-stop-' + idx);
    if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
  }

  // Editor-Sync: aktive Station im Tina-Formular öffnen (nur im Vorschau-Iframe).
  function syncEditorToStop(idx: number) {
    if (!inEditorRef.current) return;
    if (editSyncTimerRef.current) window.clearTimeout(editSyncTimerRef.current);
    editSyncTimerRef.current = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.tl-stop[data-sidx="' + idx + '"]');
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }, 220);
  }

  function placeVehicle(lng: number, lat: number, flight: boolean, bearing: number, dx: number) {
    const m = vehicleRef.current, icon = vehicleIconRef.current;
    if (!m || !icon) return;
    m.setLngLat([lng, lat]);
    const mode = flight ? 'plane' : 'car';
    if (vehicleModeRef.current !== mode) { icon.innerHTML = flight ? PLANE_SVG : carSvg; icon.classList.toggle('is-plane', flight); vehicleModeRef.current = mode; }
    icon.style.transform = flight ? `rotate(${bearing}deg)` : `scaleX(${dx < 0 ? -1 : 1})`;
  }
  function placeVehicleAtStop(idx: number) {
    const c = routeRef.current.coords[idx];
    // Symbol am Stop nach der ANKUNFTSART richten (legFlight[idx]) statt hart auf Auto -> kein
    // Flieger->Auto->Flieger-Geflacker bei aufeinanderfolgenden Flügen (z. B. Dresden->FRA->SF).
    const flight = !!routeRef.current.legFlight[idx];
    // Ausrichtung im Ruhezustand nach der ANKUNFTSrichtung (Längengrad-Delta des letzten Legs),
    // nicht hart „rechts" -> kein Flip beim nächsten Abfahren in dieselbe Richtung.
    const prev = routeRef.current.coords[idx - 1];
    const dxArr = (prev && c) ? c[0] - prev[0] : 1;
    if (c) placeVehicle(c[0], c[1], flight, 0, dxArr);
    drawDoneUpTo(pathRef.current.stopDist[idx] ?? 0);
  }

  function legPoints(toIdx: number): { pts: [number, number][]; flight: boolean } {
    const { coords, legFlight, legPts } = routeRef.current;
    const lp = legPts[toIdx];
    if (lp && lp.length) return { pts: lp, flight: !!legFlight[toIdx] };
    const a = coords[toIdx - 1], b = coords[toIdx];
    return { pts: (a && b ? [a, b] : []) as [number, number][], flight: !!legFlight[toIdx] };
  }

  function animateVehicleTo(target: number) {
    if (!vehicleRef.current) return;
    let from = vehicleAtRef.current;
    if (animRef.current != null) {
      const cur = vehicleRef.current.getLngLat(); const cs = routeRef.current.coords;
      let nb = from, nd = Infinity;
      for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (!c) continue; const d = Math.hypot(c[0] - cur.lng, c[1] - cur.lat); if (d < nd) { nd = d; nb = i; } }
      from = nb;
    }
    if (target === from) { vehicleAtRef.current = target; drawDoneUpTo(pathRef.current.stopDist[target] ?? 0); return; }
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
    // Flug-Etappe? Dann deutlich LANGSAMER + sanfter (easeInOutSine) und mit kurzer Verzögerung,
    // damit die Karte zuerst herauszoomt (Start + Ziel sichtbar), bevor das Flugzeug losfliegt.
    const isFlightAnim = flat.some((f) => f.flight);
    const dur = isFlightAnim ? Math.min(3400, 1900 + 750 * Math.abs(target - from)) : Math.min(2000, 600 + 500 * Math.abs(target - from));
    const delay = isFlightAnim ? 700 : 0; // Zoom-out zuerst (siehe mapFollow-Dauer)
    const t0 = performance.now() + delay;
    const baseDist = pathRef.current.stopDist[from] ?? 0; // Distanz des Start-Stops auf der Gesamtlinie
    const easeCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const easeSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2; // gemächlich rein/raus
    const ease = isFlightAnim ? easeSine : easeCubic;
    // Auto-Spiegelung an der GESAMTrichtung der Etappe festmachen (Längengrad-Netto über den
    // ganzen animierten Pfad) statt am zittrigen Mini-Segment -> kein Links/Rechts-Flackern.
    const carDx = flat[flat.length - 1].p[0] - flat[0].p[0];
    const stepFn = (now: number) => {
      const u = Math.max(0, Math.min(1, (now - t0) / dur)); const want = ease(u) * total;
      let acc = 0, j = 1;
      while (j < flat.length && acc + segLen[j - 1] < want) { acc += segLen[j - 1]; j++; }
      j = Math.min(j, flat.length - 1);
      const a = flat[j - 1].p, b = flat[j].p; const sl = segLen[j - 1] || 1; const f = (want - acc) / sl;
      placeVehicle(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, flat[j].flight, bearingDeg(a, b), carDx);
      drawDoneUpTo(baseDist + dir * want); // Linie wächst/schrumpft synchron mit dem Fahrzeug
      if (u < 1) animRef.current = requestAnimationFrame(stepFn);
      else { animRef.current = null; vehicleAtRef.current = target; placeVehicleAtStop(target); }
    };
    animRef.current = requestAnimationFrame(stepFn);
  }

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
    const stopEls = Array.from(list.querySelectorAll<HTMLElement>('.tl-stop'));
    blocksRef.current = stopEls.map((el) => { const top = listAbsTop + el.offsetTop; return { top, bottom: top + el.offsetHeight }; });
    list.style.setProperty('--line-top', centers[0] - listAbsTop + 'px');
    list.style.setProperty('--line-h', centers[centers.length - 1] - centers[0] + 'px');
    const headH = headRef.current ? headRef.current.getBoundingClientRect().height : 0;
    headHRef.current = headH;
    const nav = document.querySelector('header');
    const navH = nav ? Math.round(nav.getBoundingClientRect().height) : STICKY_TOP;
    navHRef.current = navH;
    const r = document.documentElement.style;
    r.setProperty('--ww-sticky-top', navH + 'px');
    r.setProperty('--ww-snap-pad', navH + headH + 'px');
    update();
  }

  function anchorViewportY(): number {
    const vh = window.innerHeight;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    let stickyBottom = navHRef.current + headHRef.current;
    if (mobile && mapColRef.current) stickyBottom = Math.min(mapColRef.current.getBoundingClientRect().bottom, vh * 0.62);
    else if (headRef.current) stickyBottom = Math.min(Math.max(headRef.current.getBoundingClientRect().bottom, 0), vh);
    // Lese-Anker im OBEREN Drittel des sichtbaren Bands (nicht Mitte). Sonst stapeln sich bei
    // kurzen Stationen (ohne Titelbild / 2-Zeiler) mehrere über der Mitte und der Fokus „startet"
    // bei einer zu späten Station. Mind. 70px unter dem Sticky-Stapel.
    return stickyBottom + Math.max(70, (vh - stickyBottom) * 0.18);
  }

  function update() {
    const centers = centersRef.current, list = listRef.current;
    if (!centers.length || !list) return;
    const sy = window.scrollY;
    const anchorDoc = sy + anchorViewportY();
    // Hinweis: Aussehen des Kompaktbands (Frost + Titel-Einblendung) macht jetzt der separate
    // Crossfade-rAF (armCrossfade), NICHT diese Spy-Schleife — Aktivierungslogik bleibt unberührt.
    // Aktive Station = LETZTER Block, dessen Oberkante den Anker bereits passiert hat (klassisches
    // Scroll-Spy). Robust gegen Blockhöhe: kurze Stationen (kein Bild / 2-Zeiler) verschieben den
    // Fokus nicht mehr nach vorn. Vor der 1. Station bleibt Station 0 aktiv.
    const blocks = blocksRef.current;
    // Punkt 2: Aktivierungspunkt je Block um einen höhenabhängigen „Lead" vorziehen. READ = erwartete
    // Lesehöhe im Fokusband (vh minus Sticky-Stapel). Kurze Station (h < READ) -> lead > 0 -> wird
    // früher aktiv; lange Station (h >= READ) -> lead = 0 -> exakt wie bisher. Höhen aus measure()-Cache.
    const band = window.innerHeight - (navHRef.current + headHRef.current);
    const READ = band * READ_FRACTION;
    let best = 0;
    for (let i = 0; i < blocks.length; i++) {
      const h = blocks[i].bottom - blocks[i].top;
      let lead = Math.max(0, READ - h) * LEAD_FACTOR;
      // Lead so deckeln, dass der Aktivierungspunkt (top - lead) NIE über die UNTERKANTE der vorigen
      // Station steigt -> eine Station wird erst aktiv, wenn die vorige den Anker passiert hat. Sonst
      // schalten kurze Stationen bei grosser Viewport-Hoehe (grosser lead) schon beim Laden zu frueh um
      // (Bug: Reise oeffnet direkt auf Station 2). Getunte Frueh-Umschaltung bleibt, nur gedeckelt.
      if (i > 0) lead = Math.min(lead, blocks[i].top - blocks[i - 1].bottom);
      if (blocks[i].top - lead <= anchorDoc + 1) best = i; else break;
    }
    if (best !== activeRef.current) {
      activeRef.current = best; setActive(best); drawMarkers(); mapFollow(best); animateVehicleTo(best); syncEditorToStop(best);
    }
    // Fortschritts-Füllung an den AKTIVEN Punkt koppeln (nicht an die feste Anker-Linie). Damit ist
    // sie beim Laden GARANTIERT 0 (aktiv = Station 0) auf jedem Monitor — keine ~1/3-Vorfüllung mehr —
    // und folgt der Reise statt einer Bildschirmposition. Weiches Wachsen via CSS-transition (height).
    const lineH = centers[centers.length - 1] - firstAbsRef.current;
    const fillToActive = centers[best] - firstAbsRef.current;
    list.style.setProperty('--fill', Math.max(0, Math.min(lineH, fillToActive)) + 'px');
  }

  // ── Kopf-Fortschritte (eigener rAF, entkoppelt von der Spy-Schleife) ──
  // Beide als smoothstep aus der Scroll-Position, dann sanft eingerastet. --tl-p: Desktop-Crossfade.
  // --tl-m: Mobil-Titelwanderung (RANGE 90).
  //
  // Glättung: kein fester Lerp-Bruchteil mehr (der trailt bei schnellem Scrollen) — stattdessen
  //   (1) frame-raten-unabhängig über die echte Frame-Zeit dt (konsistent auf 60/120 Hz) und
  //   (2) der Pro-16.7ms-Faktor wächst stufenlos mit dem Rückstand: langsam -> sanft (smooth),
  //       schnell -> holt nahezu vollständig auf (kein Hinterherhinken). smoothstep glättet den
  //       Übergang zwischen beiden Regimen, damit es nie umschaltet/springt.
  const CF_START = 36, CF_LEN = 40, CF_BASE = 0.12;
  const M_RANGE = 90, M_BASE = 0.14, M_LAG_FULL = 0.4;
  // Unterstützt der Browser Scroll-Driven Animations, koppelt CSS den Mobil-Titel direkt an den Scroll
  // (kein JS-Lerp/Drift). Dann treibt JS --tl-m auf dem Handy NICHT (würde sonst gegen die CSS-Animation
  // schreiben). --tl-p ist Desktop-only. Fehlt der Support, bleibt der JS-Lerp als Fallback aktiv.
  const sdaSupported = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: scroll()');
  const smoothstep = (x: number) => { const r = Math.min(1, Math.max(0, x)); return r * r * (3 - 2 * r); };
  // Pro-Frame-Faktor aus Basis-k (pro 16.7ms) und Frame-Zeit dt — frame-raten-unabhängig.
  const frameF = (k: number, dt: number) => 1 - Math.pow(1 - k, dt / 16.7);
  function applyCrossfade(p: number, m: number) {
    const st = stageRef.current;
    if (!st) return;
    st.style.setProperty('--tl-p', String(Math.round(p * 1000) / 1000));
    st.style.setProperty('--tl-m', String(Math.round(m * 1000) / 1000));
  }
  function crossfadeStep(now: number) {
    cfRafRef.current = null;
    const prev = cfPrevTRef.current; cfPrevTRef.current = now;
    const dt = prev ? Math.min(48, Math.max(1, now - prev)) : 16.7; // 1. Frame: Baseline; Tab-Rückkehr gedeckelt
    const pt = pTargetRef.current, mt = mTargetRef.current;
    let pn = pSmoothRef.current + (pt - pSmoothRef.current) * frameF(CF_BASE, dt);
    // Mobil: Pro-Frame-k wächst mit dem Rückstand (smoothstep) — schnelles Scrollen holt nahezu
    // vollständig auf (kein Trailing), langsames bleibt sanft.
    const mLag = Math.abs(mt - mSmoothRef.current);
    const mk = M_BASE + (1 - M_BASE) * smoothstep(mLag / M_LAG_FULL);
    let mn = mSmoothRef.current + (mt - mSmoothRef.current) * frameF(mk, dt);
    if (Math.abs(pt - pn) < 0.001) pn = pt;
    if (Math.abs(mt - mn) < 0.001) mn = mt;
    pSmoothRef.current = pn; mSmoothRef.current = mn;
    applyCrossfade(pn, mn);
    if (pn !== pt || mn !== mt) cfRafRef.current = requestAnimationFrame(crossfadeStep);
    else cfPrevTRef.current = 0; // Loop endet -> nächster Start frisch (kein dt-Sprung)
  }
  function armCrossfade() {
    // Mobil + Scroll-Driven-Support: CSS koppelt den Titel direkt an den Scroll, --tl-p ist auf dem
    // Handy ungenutzt -> hier nichts zu treiben (spart rAF/Batterie, kein Konflikt mit der CSS-Anim).
    if (sdaSupported && window.matchMedia('(max-width: 767px)').matches) return;
    const sy = window.scrollY;
    pTargetRef.current = smoothstep((sy - CF_START) / CF_LEN);
    mTargetRef.current = smoothstep(sy / M_RANGE);
    if (prefersReduced()) {
      pSmoothRef.current = pTargetRef.current; mSmoothRef.current = mTargetRef.current;
      applyCrossfade(pSmoothRef.current, mSmoothRef.current); return;
    }
    if (cfRafRef.current == null) cfRafRef.current = requestAnimationFrame(crossfadeStep);
  }

  function cancelSnap() { if (snapAnimRef.current != null) { cancelAnimationFrame(snapAnimRef.current); snapAnimRef.current = null; } }
  function smoothScrollTo(target: number) {
    cancelSnap();
    const start = window.scrollY, dist = target - start;
    if (Math.abs(dist) < 2) return;
    const dur = Math.min(900, 460 + Math.abs(dist) * 0.55), t0 = performance.now();
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const stepFn = (now: number) => { const u = Math.min(1, (now - t0) / dur); window.scrollTo(0, start + dist * ease(u)); if (u < 1) snapAnimRef.current = requestAnimationFrame(stepFn); else snapAnimRef.current = null; };
    snapAnimRef.current = requestAnimationFrame(stepFn);
  }
  function snapToNearest() {
    if (prefersReduced() || !snap) return;
    const centers = centersRef.current;
    if (centers.length < 2) return;
    const sy = window.scrollY, anchorY = anchorViewportY();
    let best = 0, bestD = Infinity;
    for (let i = 0; i < centers.length; i++) { const d = Math.abs(centers[i] - sy - anchorY); if (d < bestD) { bestD = d; best = i; } }
    const target = Math.round(centers[best] - anchorY);
    if (Math.abs(target - sy) >= 3) smoothScrollTo(target);
  }

  // Karte einmal erzeugen
  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const scrollZoomOn = props.scrollZoom !== false;
    const map = new maplibregl.Map({ container: mapElRef.current, style: styleUrl, center: [-110, 40], zoom: 3, cooperativeGestures: !scrollZoomOn, attributionControl: { compact: true } });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    if (scrollZoomOn) map.scrollZoom.enable(); else map.scrollZoom.disable();
    map.on('load', () => {
      readyRef.current = true;
      setMapLanguage(map, lang); drawRoute(); drawMarkers(); fitAll();
      const el = document.createElement('div'); el.className = 'tl-vehicle'; el.style.pointerEvents = 'none';
      const icon = document.createElement('span'); icon.className = 'tl-vehicle-ic'; icon.innerHTML = carSvg;
      el.appendChild(icon); vehicleIconRef.current = icon;
      const c0 = routeRef.current.coords.find(Boolean) as [number, number] | undefined;
      vehicleRef.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(c0 || [-110, 40]).addTo(map);
      if (prefersReduced()) placeVehicleAtStop(activeRef.current); else update();
    });
    map.on('error', () => {});
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      markersRef.current.forEach((m) => m.remove());
      if (vehicleRef.current) { vehicleRef.current.remove(); vehicleRef.current = null; }
      map.remove(); mapRef.current = null; readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-Kartenstil-Wechsel (CMS): bestehende Karte umstylen, Marker überleben, Labels neu.
  const styleUrlRef = React.useRef(styleUrl);
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || styleUrlRef.current === styleUrl) return;
    styleUrlRef.current = styleUrl;
    map.setStyle(styleUrl);
    // 'idle' (statt 'styledata') feuert erst, wenn der neue Stil + erstes Rendering fertig sind ->
    // isStyleLoaded() ist dann zuverlässig true, Labels + Route werden sicher neu gezeichnet.
    map.once('idle', () => { setMapLanguage(map, lang); drawRoute(); });
  }, [styleUrl, lang]);

  // Scroll/Resize (rAF), Snap beim Ruhen (nur wenn aktiviert), Nutzer-Input bricht Snap ab.
  React.useEffect(() => {
    let snapTimer: number | undefined;
    const armSnap = () => { if (!snap) return; if (snapTimer) window.clearTimeout(snapTimer); snapTimer = window.setTimeout(snapToNearest, 150); };
    const onScroll = () => { armCrossfade(); armSnap(); if (rafRef.current != null) return; rafRef.current = requestAnimationFrame(() => { rafRef.current = null; update(); }); };
    const onResize = () => { if (mapRef.current) mapRef.current.resize(); measure(); };
    const onUserInput = () => cancelSnap();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('touchstart', onUserInput, { passive: true });
    window.addEventListener('keydown', onUserInput);
    armCrossfade(); // Anfangszustand (p=0 bei Scroll 0)
    return () => {
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onUserInput); window.removeEventListener('touchstart', onUserInput); window.removeEventListener('keydown', onUserInput);
      if (snapTimer) window.clearTimeout(snapTimer); cancelSnap();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (cfRafRef.current != null) cancelAnimationFrame(cfRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap]);

  // Reise-/Sprachwechsel: Route neu, Karte neu zeichnen, neu vermessen, Fahrzeug zurücksetzen.
  React.useEffect(() => {
    routeRef.current = buildRoute(stops.map((s, i) => ({ lon: s.lon, lat: s.lat, flight: rawStops[i]?.arriveBy === 'flight' })));
    pathRef.current = buildPath(routeRef.current);
    activeRef.current = 0; setActive(0); vehicleAtRef.current = 0;
    if (mapRef.current && readyRef.current) { drawRoute(); drawMarkers(); fitAll(); setMapLanguage(mapRef.current, lang); placeVehicleAtStop(0); }
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIdx, lang, stops.length]);

  // Vermessen nach Layout/Fonts/Bildern.
  React.useEffect(() => {
    measure();
    const t = window.setTimeout(measure, 350);
    const fonts = (document as any).fonts; if (fonts && fonts.ready) fonts.ready.then(measure).catch(() => {});
    let ro: ResizeObserver | null = null;
    if (listRef.current && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => measure()); ro.observe(listRef.current); }
    return () => { window.clearTimeout(t); if (ro) ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobil: Titel mit dem iOS-Overscroll (Gummiband am oberen Rand) mitfedern. Dort wird scrollY negativ
  // (Inhalt nach unten gefedert) — --tl-ov = max(0,-scrollY) schiebt den fixierten Titel exakt mit, sodass
  // er nicht „stehen bleibt", während der Hero darunter wegfedert. Greift in SDA- UND Fallback-Pfad
  // (translateY(var(--tl-ov)) steht in Regel + Keyframes). Desktop: scrollY wird nicht negativ -> no-op.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    let raf: number | null = null;
    const apply = () => { raf = null; const ov = Math.max(0, -(window.scrollY || 0)); root.style.setProperty('--tl-ov', ov ? ov + 'px' : '0px'); };
    const onScroll = () => { if (raf == null) raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf != null) cancelAnimationFrame(raf); };
  }, []);

  // Dezente Reveals (einmal, per IO).
  React.useEffect(() => {
    if (prefersReduced() || typeof IntersectionObserver === 'undefined') return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.tl-stop'));
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).classList.add('is-revealing'); io.unobserve(e.target); } }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    // Schon beim Laden sichtbare Stationen NICHT animieren (sonst Flackern: Reveal startet bei opacity 0,
    // obwohl die Station — auch serverseitig — bereits sichtbar ist). Nur off-screen-Stationen faden beim Scrollen ein.
    const vh = window.innerHeight;
    els.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) return; io.observe(el); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIdx]);

  // Tuning-Werte (aus Props/CMS) -> CSS-Variablen.
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--ww-dim-op', String(Math.max(0, Math.min(1, 1 - spotlight / 100))));
    r.setProperty('--ww-dim-scale', '0.975');
    r.setProperty('--ww-dim-fade', dimMs + 'ms');
    r.setProperty('--ww-reveal-dur', revealMs + 'ms');
    r.setProperty('--ww-reveal-shift', '10px');
    r.setProperty('--ww-vehicle-size', '42px');
  }, [spotlight, dimMs, revealMs]);

  function openStopLightbox(s: ViewStop, photoIndex: number) {
    const all = (s.photoFull ? [s.photoFull] : []).concat(s.photos).filter(Boolean);
    if (!all.length) return;
    setLb({ photos: all.map((p) => ({ photo: normalizePath(p) })), start: photoIndex });
  }

  const stepWord = lang === 'de' ? 'Station ' : 'Stop ';
  const interWord = lang === 'de' ? ' · Zwischenstopp' : ' · stopover';
  const la = props.linkedAlbums?.[tripSlug];
  const albName = la ? (lang === 'en' ? (la.name?.en || la.name?.de || '') : (la.name?.de || '')) : '';

  return (
    <div className="tl-proto" data-trip-design={props.design || 'strong'}>
      {props.settingsQuery ? (
        <MapStyleWatcher query={props.settingsQuery} variables={props.settingsVariables || {}} data={props.settingsData} onStyle={setLiveMapStyle} />
      ) : null}

      <div className="tl-stage" ref={stageRef}>
        {/* Sticky Kompaktband (headRef -> Spy misst dessen Höhe). Bei Scroll-0 transparent: nur die
            Zurück-Pille (Desktop) sichtbar, Titel ausgeblendet. Beim Scrollen frostet das Band ein
            (--tl-p) und der Titel blendet ein -> Crossfade mit der großen Überschrift darunter.
            Zurück-Pille mobil via CSS ausgeblendet (Nav-Zurück-Link übernimmt). */}
        <div className="tl-topbar" ref={headRef}>
          <a className="trip-back" href={lang === 'en' ? '/en/trips' : '/trips'}>{lang === 'en' ? '← Trips' : '← Reisen'}</a>
          <span className="tl-topbar-title" aria-hidden="true">{tripTitle(trip, lang)}</span>
        </div>

        {/* Große Überschrift (NICHT sticky): scrollt natürlich weg, blendet dabei per --tl-p aus +
            leicht unscharf. Trägt die echte <h1> (SEO/A11y) — der Band-Titel ist nur aria-hidden. */}
        <div className="tl-herohead">
          <div className="tl-meta" data-tina-field={tf(trip, 'meta')}>{bi(trip, 'meta', lang)}{trip.upcoming ? (lang === 'de' ? ' · bald ✦' : ' · soon ✦') : ''}</div>
          <h1 data-tina-field={tinaField(trip, 'title')}>{tripTitle(trip, lang)}</h1>
        </div>

        <div className="tl-intro">
          <div className="tl-summary ww-rich" data-tina-field={tf(trip, 'summary')} dangerouslySetInnerHTML={{ __html: mdToHtml(bi(trip, 'summary', lang)) }} />
          {la ? (
            <a className="trip-album-link" href={`${lang === 'en' ? '/en' : ''}/portfolio/${la.slug}`}>
              <span className="lbl">{lang === 'de' ? 'Mehr Fotos im Album' : 'More photos in album'}</span>
              <strong>{albName}</strong><span className="arrow">→</span>
            </a>
          ) : null}
        </div>

        <ol className="tl-list" ref={listRef}>
          <div className="tl-fade tl-fade-top" aria-hidden="true" />
          <div className="tl-line" aria-hidden="true" />
          <div className="tl-line-fill" aria-hidden="true" />
          {stops.map((s, i) => {
            const isMain = kindOf(i) === 'main';
            const rs = rawStops[i];
            const yt = wwYouTubeEmbed(s.youtube);
            return (
              <li key={i} id={'tl-stop-' + i} data-sidx={i} data-idx={i}
                className={'tl-stop ' + (isMain ? 'tl-main' : 'tl-inter') + (i === active ? ' is-active' : '')}
                data-tina-field={rs ? tinaField(rs) : undefined}>
                <div className="tl-rail" aria-hidden="true"><span className="tl-dot" /></div>
                <div className="tl-body">
                  <div className="tl-step">{stepWord}{i + 1}/{stops.length}{isMain ? '' : interWord}</div>
                  <h2 className="tl-title" data-tina-field={rs ? tf(rs, 'title') : undefined}>{s.title}</h2>
                  <div className="tl-date" data-tina-field={rs ? tf(rs, 'date') : undefined}>{s.date}</div>

                  {isMain && s.frame.src ? (
                    <div className="tl-hero ph ww-photo" style={{ aspectRatio: 'var(--ar-media)' }} data-tina-field={rs ? tinaField(rs, 'photo') : undefined} onClick={() => openStopLightbox(s, 0)}>
                      <img src={s.frame.src} alt={s.title} style={s.frame.style} />
                    </div>
                  ) : null}

                  <div data-tina-field={rs ? tf(rs, 'text') : undefined}>
                    <div className={'tl-text ww-rich' + (isMain ? '' : ' tl-text-slim')} dangerouslySetInnerHTML={{ __html: mdToHtml(s.text || '') }} />
                  </div>

                  {isMain && s.photos.length ? (
                    <div className="tl-strip">
                      {s.photos.map((p, pi) => (
                        <img key={pi} src={normalizePath(p)} alt={lang === 'en' ? `Photo: ${s.title}` : `Foto: ${s.title}`} loading="lazy" onClick={() => openStopLightbox(s, (s.photoFull ? 1 : 0) + pi)} />
                      ))}
                    </div>
                  ) : null}

                  {!isMain && s.frame.src ? (
                    <div className="tl-thumb ww-photo" data-tina-field={rs ? tinaField(rs, 'photo') : undefined} onClick={() => openStopLightbox(s, 0)}>
                      <img src={s.frame.src} alt={s.title} style={s.frame.style} />
                    </div>
                  ) : null}

                  {s.video ? <video className="ww-station-video" src={normalizePath(s.video)} autoPlay muted loop playsInline preload="metadata" /> : null}
                  {yt ? <div dangerouslySetInnerHTML={{ __html: yt }} /> : null}
                </div>
              </li>
            );
          })}
          <div className="tl-fade tl-fade-bottom" aria-hidden="true" />
        </ol>

        <div className="tl-map-col" ref={mapColRef}>
          <div className="tl-map map-box">
            <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {inEditor ? (
            <div className="tl-editbar" aria-hidden="true">
              <div className="tl-editbar-head">
                <span className="tl-editbar-title">Stationen</span>
                <button type="button" className="tl-editbar-manage" data-tina-field={tinaField(trip, 'title')}
                  title="Zurück ins Reise-Hauptformular dieser Reise — dort alle Felder + Stationen sortieren/hinzufügen/löschen">↩ Zum Reisemenü</button>
              </div>
              <div className="tl-editbar-chips">
                {stops.map((s, i) => {
                  const rs = rawStops[i];
                  const isFlight = rs?.arriveBy === 'flight';
                  return (
                    <button key={i} type="button"
                      className={'tl-chip' + (i === active ? ' is-active' : '') + (kindOf(i) === 'intermediate' ? ' is-inter' : '')}
                      data-tina-field={rs ? tinaField(rs) : undefined}
                      onClick={() => editStop(i)}
                      title={'Station ' + (i + 1) + ' bearbeiten'}>
                      <span className="tl-chip-no">{i + 1}</span>
                      <span className="tl-chip-name">{s.name || s.title || ('Station ' + (i + 1))}</span>
                      <span className="tl-chip-ic">{isFlight ? '✈' : '🚗'}</span>
                    </button>
                  );
                })}
              </div>
              <div className="tl-editbar-hint">Chip = diese Station bearbeiten · „Zum Reisemenü" = zurück ins Reise-Hauptformular (dort Stationen sortieren/hinzufügen/löschen & alle Reise-Felder).</div>
            </div>
          ) : null}
        </div>
      </div>

      {Array.isArray(trip.gallery) && trip.gallery.length ? (
        <div className="story-gallery tl-gallery">
          {trip.gallery.map((g: any, i: number) => (
            <img key={i} src={normalizePath(g.image)} alt={bi(g, 'caption', lang)} loading="lazy" data-tina-field={tinaField(g, 'image')}
              onClick={() => setLb({ photos: trip.gallery.map((x: any) => ({ photo: normalizePath(x.image) })), start: i })} />
          ))}
        </div>
      ) : null}

      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} photoAlt={lang === 'en' ? `Photo from trip ${tripTitle(trip, lang)}` : `Foto aus der Reise ${tripTitle(trip, lang)}`} loop onClose={() => setLb(null)} />}
    </div>
  );
}
