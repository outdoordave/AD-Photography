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

// Route: Koordinaten in Reihenfolge + Etappen nach Fahrt/Flug getrennt.
function buildRoute(stops: TLStop[]) {
  const coords: [number, number][] = stops.map((s) => [s.lon, s.lat]);
  const driveSegs: [number, number][][] = [];
  const flightSegs: [number, number][][] = [];
  const legFlight: boolean[] = [false];
  for (let i = 1; i < coords.length; i++) {
    const seg = [coords[i - 1], coords[i]] as [number, number][];
    const isFlight = stops[i].arriveBy === 'flight';
    legFlight[i] = isFlight;
    (isFlight ? flightSegs : driveSegs).push(seg);
  }
  return { coords, driveSegs, flightSegs, legFlight };
}

// Reduzierte Silhouetten (kein Foto): SUV (Seitenansicht) + Flugzeug (Draufsicht).
const CAR_SVG =
  '<svg viewBox="0 0 64 30" width="26" height="13" fill="currentColor" aria-hidden="true">' +
  '<path d="M3 20 V14.5 Q3 13.5 4 13.5 L13.5 13.5 L19 8 Q19.6 7.5 20.5 7.5 L40 7.5 Q41 7.5 41.7 8.2 L47 13.5 L59 14.5 Q61 14.8 61 16.5 L61 20 Q61 21 60 21 L55.5 21 A4.2 4.2 0 0 0 47 21 L21.5 21 A4.2 4.2 0 0 0 13 21 L4 21 Q3 21 3 20 Z"/>' +
  '<circle cx="17" cy="21.5" r="3.6"/><circle cx="51" cy="21.5" r="3.6"/></svg>';
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
  const centersRef = React.useRef<number[]>([]);   // Punkt-Mitten, absolute Dokument-Y
  const firstAbsRef = React.useRef(0);             // Mitte des 1. Punkts (für Balken-Bezug)
  const rafRef = React.useRef<number | null>(null);

  const routeRef = React.useRef(buildRoute(stops));
  const vehicleRef = React.useRef<maplibregl.Marker | null>(null);
  const vehicleIconRef = React.useRef<HTMLSpanElement | null>(null);
  const vehicleModeRef = React.useRef<'car' | 'plane'>('car');

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
    const { driveSegs, flightSegs } = routeRef.current;
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
    addLine('route-flight', flightSegs, true);
  }

  // Karte folgt dem aktiven Stopp.
  function mapFollow(idx: number) {
    const map = mapRef.current;
    const s = stops[idx];
    if (!map || !readyRef.current || !s) return;
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
    if (vehicleModeRef.current !== mode) { icon.innerHTML = flight ? PLANE_SVG : CAR_SVG; vehicleModeRef.current = mode; }
    icon.style.transform = flight ? `rotate(${bearing}deg)` : `scaleX(${dx < 0 ? -1 : 1})`;
  }
  function placeVehicleAtStop(idx: number) {
    const c = routeRef.current.coords[idx];
    if (c) placeVehicle(c[0], c[1], false, 0, 1);
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
    const firstRel = centers[0] - listAbsTop;
    const lastRel = centers[centers.length - 1] - listAbsTop;
    list.style.setProperty('--line-top', firstRel + 'px');
    list.style.setProperty('--line-h', lastRel - firstRel + 'px');
    const headH = headRef.current ? headRef.current.getBoundingClientRect().height : 0;
    headHRef.current = headH;
    document.documentElement.style.setProperty('--ww-snap-pad', STICKY_TOP + headH + 'px');
    update();
  }

  // --- Pro Frame: Anker bestimmen -> aktive Station + Balken-Ende + Fahrzeug (gleicher Bezug) ---
  function update() {
    const centers = centersRef.current;
    const list = listRef.current;
    if (!centers.length || !list) return;
    const vh = window.innerHeight;
    const sy = window.scrollY;
    let headBottom = STICKY_TOP + headHRef.current;
    if (headRef.current) headBottom = Math.min(Math.max(headRef.current.getBoundingClientRect().bottom, 0), vh);
    const anchorY = (headBottom + vh) / 2; // Anker = Mitte des sichtbaren Timeline-Bandes

    // aktive Station = Punkt am nächsten zum Anker
    let best = 0, bestD = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = Math.abs(centers[i] - sy - anchorY);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best !== activeRef.current) {
      activeRef.current = best; setActive(best); drawMarkers(); mapFollow(best);
    }
    // Balken endet EXAKT an der Mitte des aktiven Punkts (kein Überscrollen)
    list.style.setProperty('--fill', Math.max(0, centers[best] - firstAbsRef.current) + 'px');

    // Fahrzeug scroll-gekoppelt (kontinuierlich) zwischen den Punkten
    if (!prefersReduced() && vehicleRef.current && centers.length > 1) {
      const vy = (k: number) => centers[k] - sy;
      let i = 0, frac = 0;
      if (anchorY <= vy(0)) { i = 0; frac = 0; }
      else if (anchorY >= vy(centers.length - 1)) { i = centers.length - 2; frac = 1; }
      else { for (let k = 0; k < centers.length - 1; k++) { if (vy(k) <= anchorY && anchorY <= vy(k + 1)) { i = k; frac = (anchorY - vy(k)) / ((vy(k + 1) - vy(k)) || 1); break; } } }
      const { coords, legFlight } = routeRef.current;
      const a = coords[i], b = coords[i + 1];
      if (a && b) {
        const lng = a[0] + (b[0] - a[0]) * frac;
        const lat = a[1] + (b[1] - a[1]) * frac;
        placeVehicle(lng, lat, !!legFlight[i + 1], bearingDeg(a, b), b[0] - a[0]);
      }
    }
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
      markersRef.current.forEach((m) => m.remove());
      if (vehicleRef.current) { vehicleRef.current.remove(); vehicleRef.current = null; }
      map.remove(); mapRef.current = null; readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single-Scroll: auf window-Scroll + resize hören (rAF-gedrosselt).
  React.useEffect(() => {
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => { rafRef.current = null; update(); });
    };
    const onResize = () => { if (mapRef.current) mapRef.current.resize(); measure(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
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
