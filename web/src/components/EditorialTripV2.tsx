import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
import { viewStops, type RawTrip, type ViewStop } from '../lib/trips';
import { normalizePath } from '../lib/stories';
import { vehicleSvg, PLANE_SVG } from '../lib/vehicles';
import {
  buildRoute, buildPath, bearingDeg, setMapLanguage, prefersReduced,
  type RoutePath,
} from './TripTimeline';
import RichText, { richIsEmpty } from './RichText';
import Lightbox, { type LbPhoto } from './Lightbox';

// Reise-Detail „v2" (Editorial): Etappen-Liste mit Fade-in/-out + sticky MapLibre-Karte mit
// Caption + Nummern-Dots + pulsierendem Halo — 1:1 aus „Reise Tennessee Winter v2".
// Die KARTE nutzt bewusst die BESTEHENDE Fahrzeug-Engine (Auto fährt / Flugzeug fliegt, flyTo,
// mitwachsende Route) aus TripTimeline — nur die Linien/Marker sind gold auf dunkel eingefärbt.
// Inhalte = echte Reise-Stationen (CMS), data-tina-field bleibt.

const GOLD = '#d4a45a';

type Props = {
  query: string; variables: object; data: any; lang: 'de' | 'en';
  initialSlug: string; mapStyle?: string; scrollZoom?: boolean;
};

export default function EditorialTripV2(props: Props) {
  const { lang } = props;
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    experimental___selectFormByFormId: () => selectActiveFormId(props.data, props.initialSlug),
  });
  const node = ((data as any)?.reisenConnection?.edges || [])
    .map((e: any) => e?.node).find((n: any) => n?._sys?.filename === props.initialSlug) as (RawTrip & Record<string, any>) | undefined;
  const trip: any = node || {};
  const rawStops: any[] = Array.isArray(trip.stops) ? trip.stops : [];
  const stops: ViewStop[] = React.useMemo(() => (node ? viewStops(trip, lang) : []), [trip, lang, node]);

  const [active, setActive] = React.useState(0);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<{ marker: maplibregl.Marker; dot: HTMLElement; idx: number }[]>([]);
  const haloRef = React.useRef<maplibregl.Marker | null>(null);
  const readyRef = React.useRef(false);
  const activeRef = React.useRef(0);
  const legRefs = React.useRef<Array<HTMLElement | null>>([]);
  const capIdxRef = React.useRef<HTMLSpanElement | null>(null);
  const capNameRef = React.useRef<HTMLSpanElement | null>(null);

  const carSvg = vehicleSvg((trip as any).vehicle);
  const routeRef = React.useRef(buildRoute(stops.map((s, i) => ({ lon: s.lon, lat: s.lat, flight: rawStops[i]?.arriveBy === 'flight' }))));
  const pathRef = React.useRef<RoutePath>(buildPath(routeRef.current));
  const vehicleRef = React.useRef<maplibregl.Marker | null>(null);
  const vehicleIconRef = React.useRef<HTMLSpanElement | null>(null);
  const vehicleModeRef = React.useRef<'car' | 'plane'>('car');
  const vehicleAtRef = React.useRef(0);
  const animRef = React.useRef<number | null>(null);

  const styleUrl = 'https://tiles.openfreemap.org/styles/' + (props.mapStyle || 'liberty');
  const geoCount = stops.filter((s) => s.lat != null && s.lon != null).length;

  // ---- Karte / Route / Fahrzeug (portiert aus TripTimeline, gold auf dunkel) ----
  function fitAll() {
    const map = mapRef.current; if (!map) return;
    const pts = stops.filter((s) => s.lat != null && s.lon != null);
    if (!pts.length) return;
    const b = new maplibregl.LngLatBounds();
    pts.forEach((s) => b.extend([s.lon!, s.lat!]));
    map.fitBounds(b, { padding: 64, duration: prefersReduced() ? 0 : 600 });
  }

  function drawRoute() {
    const map = mapRef.current; if (!map) return;
    if (!map.isStyleLoaded()) { map.once('idle', drawRoute); return; }
    const round = { 'line-cap': 'round' as const, 'line-join': 'round' as const };
    const empty = { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: [] } } as any;
    // Gesamte Route: dünn, gestrichelt, gedimmt (gold).
    const fullCoords = pathRef.current.pts;
    if (!map.getSource('v2-route-full')) map.addSource('v2-route-full', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: fullCoords } } as any });
    else (map.getSource('v2-route-full') as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: fullCoords } });
    if (!map.getLayer('v2-route-full')) map.addLayer({ id: 'v2-route-full', type: 'line', source: 'v2-route-full', layout: round, paint: { 'line-color': GOLD, 'line-width': 1.5, 'line-opacity': 0.32, 'line-dasharray': [2, 3.5] } });
    // Gefahrene Strecke: solide Gold-Linie (Fahrt) + gestrichelt (Flug), wächst mit dem Fahrzeug.
    if (!map.getSource('v2-done')) map.addSource('v2-done', { type: 'geojson', data: empty });
    if (!map.getSource('v2-done-air')) map.addSource('v2-done-air', { type: 'geojson', data: empty });
    if (!map.getLayer('v2-done-glow')) map.addLayer({ id: 'v2-done-glow', type: 'line', source: 'v2-done', layout: round, paint: { 'line-color': GOLD, 'line-width': 8, 'line-opacity': 0.16, 'line-blur': 4 } });
    if (!map.getLayer('v2-done')) map.addLayer({ id: 'v2-done', type: 'line', source: 'v2-done', layout: round, paint: { 'line-color': GOLD, 'line-width': 2.6, 'line-opacity': 0.95 } });
    if (!map.getLayer('v2-done-air')) map.addLayer({ id: 'v2-done-air', type: 'line', source: 'v2-done-air', layout: round, paint: { 'line-color': GOLD, 'line-width': 2.2, 'line-opacity': 0.8, 'line-dasharray': [1.4, 1.7] } });
    drawDoneUpTo(pathRef.current.stopDist[activeRef.current] ?? 0);
  }

  function donePolylineRuns(d: number): { drive: [number, number][][]; air: [number, number][][] } {
    const { pts, segFlight, cum } = pathRef.current;
    if (pts.length < 2 || d <= 0) return { drive: [], air: [] };
    const runs: { flight: boolean; line: [number, number][] }[] = [];
    let cur = { flight: segFlight[0], line: [pts[0]] as [number, number][] };
    for (let k = 1; k < pts.length; k++) {
      const fl = segFlight[k - 1];
      if (fl !== cur.flight) { runs.push(cur); cur = { flight: fl, line: [pts[k - 1]] }; }
      if (cum[k] <= d) { cur.line.push(pts[k]); }
      else { const segStart = cum[k - 1], segLen = (cum[k] - segStart) || 1, f = (d - segStart) / segLen; const a = pts[k - 1], b = pts[k]; cur.line.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); break; }
    }
    runs.push(cur);
    return { drive: runs.filter((r) => !r.flight && r.line.length >= 2).map((r) => r.line), air: runs.filter((r) => r.flight && r.line.length >= 2).map((r) => r.line) };
  }
  function drawDoneUpTo(d: number) {
    const map = mapRef.current; if (!map || !map.getSource('v2-done')) return;
    const { drive, air } = donePolylineRuns(d);
    (map.getSource('v2-done') as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: drive } });
    (map.getSource('v2-done-air') as any).setData({ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: air } });
  }

  function drawMarkers() {
    const map = mapRef.current; if (!map || !readyRef.current) return;
    markersRef.current.forEach((m) => m.marker.remove());
    markersRef.current = [];
    stops.forEach((s, idx) => {
      if (s.lat == null || s.lon == null) return;
      const el = document.createElement('div');
      el.style.cssText = 'width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer';
      const dot = document.createElement('div');
      dot.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#0d0e0c;border:2px solid ' + GOLD + ';box-shadow:0 1px 4px rgba(0,0,0,.5);transition:all .3s';
      el.appendChild(dot);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([s.lon, s.lat]).addTo(map);
      el.addEventListener('click', () => scrollToLeg(idx));
      markersRef.current.push({ marker, dot, idx });
    });
    styleMarkers();
  }
  function styleMarkers() {
    const a = activeRef.current;
    markersRef.current.forEach(({ dot, idx }) => {
      const isA = idx === a, past = idx < a;
      dot.style.width = isA ? '18px' : '14px';
      dot.style.height = isA ? '18px' : '14px';
      dot.style.background = isA ? GOLD : (past ? 'rgba(212,164,90,.55)' : '#0d0e0c');
      dot.style.borderColor = isA || past ? GOLD : 'rgba(212,164,90,.7)';
    });
  }

  function mapFollow(idx: number) {
    const map = mapRef.current; const s = stops[idx];
    if (!map || !readyRef.current || !s || s.lat == null || s.lon == null) return;
    const arrFlight = !!routeRef.current.legFlight[idx];
    if (arrFlight) {
      const arc = routeRef.current.flightArcs.find((x) => x.i === idx);
      const pts = arc ? arc.pts : ([routeRef.current.coords[idx - 1], routeRef.current.coords[idx]].filter(Boolean) as [number, number][]);
      if (pts.length) { const b = new maplibregl.LngLatBounds(); pts.forEach((p) => b.extend(p)); map.fitBounds(b, { padding: 90, maxZoom: 6, duration: prefersReduced() ? 0 : 1100 }); if (prefersReduced()) placeVehicleAtStop(idx); return; }
    }
    if (prefersReduced()) { map.jumpTo({ center: [s.lon, s.lat] }); placeVehicleAtStop(idx); return; }
    map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 4.2), duration: 1300, essential: true });
  }

  function placeVehicle(lng: number, lat: number, flight: boolean, bearing: number, dx: number) {
    const m = vehicleRef.current, icon = vehicleIconRef.current; if (!m || !icon) return;
    m.setLngLat([lng, lat]);
    const mode = flight ? 'plane' : 'car';
    if (vehicleModeRef.current !== mode) { icon.innerHTML = flight ? PLANE_SVG : carSvg; icon.classList.toggle('is-plane', flight); vehicleModeRef.current = mode; }
    icon.style.transform = flight ? `rotate(${bearing}deg)` : `scaleX(${dx < 0 ? -1 : 1})`;
  }
  function placeVehicleAtStop(idx: number) {
    const c = routeRef.current.coords[idx];
    const flight = !!routeRef.current.legFlight[idx];
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
    const isFlightAnim = flat.some((f) => f.flight);
    const dur = isFlightAnim ? Math.min(3400, 1900 + 750 * Math.abs(target - from)) : Math.min(2000, 600 + 500 * Math.abs(target - from));
    const delay = isFlightAnim ? 700 : 0;
    const t0 = performance.now() + delay;
    const baseDist = pathRef.current.stopDist[from] ?? 0;
    const easeCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const easeSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
    const ease = isFlightAnim ? easeSine : easeCubic;
    const carDx = flat[flat.length - 1].p[0] - flat[0].p[0];
    const stepFn = (now: number) => {
      const u = Math.max(0, Math.min(1, (now - t0) / dur)); const want = ease(u) * total;
      let acc = 0, j = 1;
      while (j < flat.length && acc + segLen[j - 1] < want) { acc += segLen[j - 1]; j++; }
      j = Math.min(j, flat.length - 1);
      const a = flat[j - 1].p, b = flat[j].p; const sl = segLen[j - 1] || 1; const f = (want - acc) / sl;
      placeVehicle(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, flat[j].flight, bearingDeg(a, b), carDx);
      drawDoneUpTo(baseDist + dir * want);
      if (u < 1) animRef.current = requestAnimationFrame(stepFn);
      else { animRef.current = null; vehicleAtRef.current = target; placeVehicleAtStop(target); }
    };
    animRef.current = requestAnimationFrame(stepFn);
  }

  function scrollToLeg(i: number) {
    const el = legRefs.current[i]; if (!el) return;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.32, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }

  // Auf eine Station wechseln: Karte + Fahrzeug + Marker + Halo + Caption + Dots + Dimmen.
  const goActive = React.useCallback((idx: number) => {
    if (idx === activeRef.current) return;
    activeRef.current = idx; setActive(idx);
    styleMarkers();
    if (haloRef.current) { const s = stops[idx]; if (s && s.lat != null && s.lon != null) haloRef.current.setLngLat([s.lon, s.lat]); }
    if (capIdxRef.current) capIdxRef.current.textContent = 'Station ' + String(idx + 1).padStart(2, '0') + ' / ' + String(stops.length).padStart(2, '0');
    if (capNameRef.current) capNameRef.current.textContent = stops[idx]?.title || stops[idx]?.name || '';
    mapFollow(idx);
    animateVehicleTo(idx);
  }, [stops]);

  const sync = React.useCallback(() => {
    const mid = window.innerHeight * 0.5;
    let best = -1;
    legRefs.current.forEach((el, i) => { if (!el) return; const r = el.getBoundingClientRect(); if (r.top < mid && r.bottom > mid * 0.4) best = i; });
    legRefs.current.forEach((el, i) => { if (el) el.classList.toggle('dim', best !== -1 && i !== best); });
    if (best !== -1) goActive(best);
  }, [goActive]);

  // Karte erzeugen
  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current || !geoCount) return;
    const scrollZoomOn = props.scrollZoom !== false;
    const map = new maplibregl.Map({ container: mapElRef.current, style: styleUrl, center: [-110, 40], zoom: 3, cooperativeGestures: !scrollZoomOn, attributionControl: { compact: true } });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    if (scrollZoomOn) map.scrollZoom.enable(); else map.scrollZoom.disable();
    map.on('load', () => {
      readyRef.current = true;
      setMapLanguage(map, lang); drawRoute(); drawMarkers(); fitAll();
      // Fahrzeug
      const el = document.createElement('div'); el.className = 'tl-vehicle'; el.style.pointerEvents = 'none';
      const icon = document.createElement('span'); icon.className = 'tl-vehicle-ic'; icon.innerHTML = carSvg;
      el.appendChild(icon); vehicleIconRef.current = icon;
      const c0 = routeRef.current.coords.find(Boolean) as [number, number] | undefined;
      vehicleRef.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(c0 || [-110, 40]).addTo(map);
      // Pulsierender Halo auf der aktiven Station (v2)
      const hEl = document.createElement('div'); hEl.className = 'ed-v2-halo'; hEl.style.pointerEvents = 'none';
      if (c0) haloRef.current = new maplibregl.Marker({ element: hEl, anchor: 'center' }).setLngLat(c0).addTo(map);
      placeVehicleAtStop(activeRef.current);
      sync();
    });
    map.on('error', () => {});
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      markersRef.current.forEach((m) => m.marker.remove());
      if (vehicleRef.current) { vehicleRef.current.remove(); vehicleRef.current = null; }
      if (haloRef.current) { haloRef.current.remove(); haloRef.current = null; }
      map.remove(); mapRef.current = null; readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialSlug, geoCount]);

  React.useEffect(() => {
    const onScroll = () => sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [sync]);

  if (!node) return null;

  const dayLabel = (i: number) => {
    const raw = rawStops[i] || {};
    const d = lang === 'en' ? (raw.date_en || raw.date_de) : (raw.date_de || raw.date_en);
    const st = 'Station ' + String(i + 1).padStart(2, '0');
    return d ? `${d} · ${st}` : st;
  };

  return (
    <>
      <div className="ed-v2-grid">
        <div className="ed-v2-legs">
          {stops.map((s, i) => {
            const photo = s.photo ? normalizePath(s.photo) : '';
            const legPhotos = (s.photos && s.photos.length ? s.photos : (s.photoFull ? [s.photoFull] : [])).map((p) => ({ photo: normalizePath(p) })) as LbPhoto[];
            const raw = rawStops[i] || {};
            const textVal = lang === 'en' ? (richIsEmpty(raw.text_en) ? raw.text_de : raw.text_en) : raw.text_de;
            return (
              <article className="ed-v2-leg" key={i} ref={(el) => (legRefs.current[i] = el)}>
                <p className="ed-v2-leg-kicker">{dayLabel(i)}</p>
                <h2 className="ed-v2-leg-title" data-tina-field={rawStops[i] ? tinaField(rawStops[i], (lang === 'en' ? 'title_en' : 'title_de') as any) : undefined}>{s.title || s.name}</h2>
                {!richIsEmpty(textVal) ? <div className="ed-v2-leg-text ww-rich" data-tina-field={rawStops[i] ? tinaField(rawStops[i], (lang === 'en' ? 'text_en' : 'text_de') as any) : undefined}><RichText value={textVal} /></div> : null}
                {s.name && s.name !== s.title ? <p className="ed-v2-leg-spot">{lang === 'en' ? 'Spot' : 'Foto-Spot'}: {s.name}</p> : null}
                {photo ? (
                  <button type="button" className="ed-v2-leg-photo" onClick={() => legPhotos.length && setLb({ photos: legPhotos, start: 0 })} data-tina-field={rawStops[i] ? tinaField(rawStops[i], 'photo') : undefined}>
                    <img src={photo} alt={s.title || s.name} loading="lazy" decoding="async" />
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
        <div className="ed-v2-mapcol">
          <div className="ed-v2-map" ref={mapElRef} />
          <div className="ed-v2-caption">
            <div className="ed-v2-cap-txt">
              <span className="ed-v2-cap-idx" ref={capIdxRef}>Station 01 / {String(stops.length).padStart(2, '0')}</span>
              <span className="ed-v2-cap-name" ref={capNameRef}>{stops[0]?.title || stops[0]?.name || ''}</span>
            </div>
            <div className="ed-v2-dots">
              {stops.map((s, i) => (
                <button type="button" key={i} className={`ed-v2-dot${i === active ? ' on' : ''}`} title={s.title || s.name} onClick={() => scrollToLeg(i)}>{i + 1}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {lb ? <Lightbox photos={lb.photos} startIndex={lb.start} albumName={trip.title || ''} onClose={() => setLb(null)} /> : null}
    </>
  );
}
