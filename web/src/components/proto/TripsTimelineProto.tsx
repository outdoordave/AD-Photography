import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Lightbox, { type LbPhoto } from '../Lightbox';
import { normalizePath } from '../../lib/stories';
import { ALASKA_TIMELINE_DEMO, type TLStop } from './alaskaTimelineDemo';

// PROTOTYP — Variante B (vertikale Timeline / Reise-Journal), DESKTOP-Fokus.
// Fixes Fade-Fenster: Reise-Kopf + Karte bleiben stehen, NUR die Timeline scrollt in einem
// eigenen Fenster mit weicher Ober-/Unterkante (mask-image). Sanftes proximity-Snapping,
// mitscrollende Fortschrittslinie, aktiver Punkt (IntersectionObserver), Karte folgt per
// flyTo. Etappen-Trenner gliedern die Timeline. (Mobiles Verhalten kommt später.)

type Lang = 'de' | 'en';
const STYLE = 'fiord';

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

// Route aus den Stopps: Koordinaten in Reihenfolge + Etappen-Segmente getrennt nach
// Fahrt (durchgezogen) und Flug (gestrichelt). legFlight[i] = Etappe von i-1 -> i ist Flug.
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
  const ioRef = React.useRef<IntersectionObserver | null>(null);

  const routeRef = React.useRef(buildRoute(stops));             // Routen-Geometrie (Fahrt/Flug)
  const scrollRef = React.useRef<HTMLDivElement | null>(null);  // Fade-Fenster (scrollt)
  const listRef = React.useRef<HTMLOListElement | null>(null);  // Timeline-Inhalt
  const offsetsRef = React.useRef<number[]>([]);                // Punkt-Mitten (Content-Koordinate)
  const rafRef = React.useRef<number | null>(null);

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
    const pts = stops.filter((s) => s.lat != null && s.lon != null);
    if (!pts.length) return;
    const bounds = new maplibregl.LngLatBounds();
    pts.forEach((s) => bounds.extend([s.lon, s.lat]));
    map.fitBounds(bounds, { padding: 60, duration: prefersReduced() ? 0 : 600 });
  }

  // Routenlinie auf der Karte: Fahrt durchgezogen, Flug gestrichelt (warmer Akzent).
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
        id: id + '-layer',
        type: 'line',
        source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#a7672f',
          'line-width': dashed ? 2 : 2.5,
          'line-opacity': dashed ? 0.6 : 0.8,
          ...(dashed ? { 'line-dasharray': [1.6, 1.6] } : {}),
        },
      });
    };
    addLine('route-drive', driveSegs, false);
    addLine('route-flight', flightSegs, true);
  }

  function flyToStop(idx: number) {
    const map = mapRef.current;
    const s = stops[idx];
    if (!map || !readyRef.current || !s || s.lat == null || s.lon == null) return;
    if (prefersReduced()) {
      map.jumpTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 4.5) });
    } else {
      map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 4.5), duration: 800, essential: true });
    }
  }

  function activateStop(idx: number) {
    if (idx === activeRef.current) {
      // dennoch sicherstellen, dass Klassenstand stimmt (erstes Mal)
    }
    activeRef.current = idx;
    setActive(idx);
    drawMarkers();
    flyToStop(idx);
  }

  function scrollToStop(idx: number) {
    const el = document.getElementById('tl-stop-' + idx);
    if (el) el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'center' });
  }

  // --- Messen: Punkt-Mitten in Content-Koordinaten + Linien-Geometrie ---
  function measure() {
    const list = listRef.current;
    if (!list) return;
    const dots = Array.from(list.querySelectorAll<HTMLElement>('.tl-dot'));
    if (!dots.length) return;
    const listTop = list.getBoundingClientRect().top;
    offsetsRef.current = dots.map((d) => {
      const r = d.getBoundingClientRect();
      return r.top - listTop + r.height / 2;
    });
    const top = offsetsRef.current[0];
    const bottom = offsetsRef.current[offsetsRef.current.length - 1];
    list.style.setProperty('--line-top', top + 'px');
    list.style.setProperty('--line-h', bottom - top + 'px');
    updateProgress();
  }

  // --- Fortschrittslinie füllt sich kontinuierlich mit dem Scroll ---
  function updateProgress() {
    const scroller = scrollRef.current;
    const list = listRef.current;
    const offs = offsetsRef.current;
    if (!scroller || !list || !offs.length) return;
    const anchor = scroller.scrollTop + scroller.clientHeight / 2;
    const top = offs[0];
    const bottom = offs[offs.length - 1];
    const fill = Math.max(0, Math.min(bottom - top, anchor - top));
    list.style.setProperty('--fill', fill + 'px');
  }

  // Karte einmal erzeugen
  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: styleUrl,
      center: [-140, 52],
      zoom: 2,
      cooperativeGestures: false,
      attributionControl: { compact: true },
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
    });
    map.on('error', () => { /* Tile-/Style-Aussetzer schlucken */ });
    const onResize = () => { map.resize(); measure(); };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (ioRef.current) ioRef.current.disconnect();
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-Spy (root = Fade-Fenster): aktiver Stopp = Block, der das schmale Mittenband kreuzt.
  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            const idx = parseInt((en.target as HTMLElement).getAttribute('data-idx') || '0', 10);
            activateStop(idx);
          }
        }
      },
      { root: scroller, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    scroller.querySelectorAll('.tl-stop').forEach((el) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-Handler (rAF-gedrosselt): Fortschrittslinie kontinuierlich nachziehen.
  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateProgress();
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Vermessen nach Layout, Fonts und Bild-Ladevorgängen (Höhen ändern sich).
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

  // Render-Liste: Etappen-Trenner vor Stopps mit `stage`, dazwischen die Stopps.
  const items: React.ReactNode[] = [];
  stops.forEach((s, i) => {
    if (s.stage) {
      items.push(
        <li className="tl-divider" key={'div-' + i} aria-hidden="true">
          <span>{s.stage}</span>
        </li>
      );
    }
    const isMain = s.kind === 'main';
    items.push(
      <li
        key={i}
        id={'tl-stop-' + i}
        data-idx={i}
        className={'tl-stop ' + (isMain ? 'tl-main' : 'tl-inter') + (i === active ? ' is-active' : '')}
      >
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
        <strong>Prototyp · Variante B (Desktop).</strong> Kopf + Karte bleiben fix, die Timeline
        scrollt im weichen Fenster und dockt sanft an. Inhalte/Bilder sind Demo-Füllung
        ({stops.length} Stopps) — es geht um Optik &amp; Mechanik, nicht um Richtigkeit.
      </div>

      <div className="tl-stage">
        <div className="tl-head">
          <div className="tl-meta">{trip.meta}</div>
          <h2>{trip.title}</h2>
          <p className="tl-summary">{trip.summary}</p>
        </div>

        <div className="tl-scroll" ref={scrollRef}>
          <ol className="tl-list" ref={listRef}>
            <div className="tl-line" aria-hidden="true" />
            <div className="tl-line-fill" aria-hidden="true" />
            {items}
          </ol>
        </div>

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
