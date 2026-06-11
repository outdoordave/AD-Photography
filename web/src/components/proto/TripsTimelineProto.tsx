import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Lightbox, { type LbPhoto } from '../Lightbox';
import { normalizePath } from '../../lib/stories';
import { ALASKA_TIMELINE_DEMO, type TLStop } from './alaskaTimelineDemo';

// PROTOTYP — Variante B (vertikale Timeline / Reise-Journal). NUR Vorschau.
// Renders eine vertikal scrollbare Timeline; die MapLibre-Karte (gleiche Technik wie
// TripsContent: Marker/flyTo/fitBounds/Sprach-Labels) läuft per IntersectionObserver
// dem beim Scrollen aktiven Stopp nach (Desktop sticky daneben, Mobil als Hero oben).
// Lightbox/Filmstreifen = bestehende Komponente, unverändert wiederverwendet.

type Lang = 'de' | 'en';
const STYLE = 'fiord'; // wie Live-Default-Bereich; OpenFreeMap-Stil

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

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 861px)').matches;

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

  const styleUrl = 'https://tiles.openfreemap.org/styles/' + STYLE;

  function drawMarkers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    stops.forEach((s, idx) => {
      if (s.lat == null || s.lon == null) return;
      const sel = idx === activeRef.current;
      const size = sel ? 18 : 14;
      const col = sel ? '#f0c9a8' : '#a7672f';
      const border = sel ? '#a7672f' : '#f4ede1';
      const el = document.createElement('div');
      el.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer';
      const dot = document.createElement('div');
      dot.style.cssText =
        'width:' + size + 'px;height:' + size + 'px;background:' + col + ';border:2.5px solid ' + border +
        ';border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.45)';
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
    if (pts.length === 1) { map.flyTo({ center: [pts[0].lon, pts[0].lat], zoom: 6, duration: 600 }); return; }
    const bounds = new maplibregl.LngLatBounds();
    pts.forEach((s) => bounds.extend([s.lon, s.lat]));
    map.fitBounds(bounds, { padding: 50, duration: 600 });
  }

  function activateStop(idx: number) {
    if (idx === activeRef.current) return;
    activeRef.current = idx;
    setActive(idx);
    drawMarkers();
    // Karte folgt nur auf Desktop dem aktiven Stopp; mobil bleibt die Gesamtroute (Hero) stehen.
    const map = mapRef.current;
    const s = stops[idx];
    if (isDesktop() && map && readyRef.current && s && s.lat != null && s.lon != null) {
      map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 5), duration: 600 });
    }
  }

  function scrollToStop(idx: number) {
    const el = document.getElementById('tl-stop-' + idx);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      drawMarkers();
      fitAll();
    });
    map.on('error', () => { /* Tile-/Style-Aussetzer schlucken */ });
    const onResize = () => { map.resize(); if (!isDesktop()) fitAll(); };
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

  // Scroll-Spy: aktiver Stopp = der Block, der die vertikale Bildschirmmitte kreuzt.
  // rootMargin schneidet oben/unten je 45% weg -> schmales Aktivierungs-Band in der Mitte.
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            const idx = parseInt((en.target as HTMLElement).getAttribute('data-idx') || '0', 10);
            activateStop(idx);
          }
        }
      },
      { root: null, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    document.querySelectorAll('.tl-stop').forEach((el) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openLightbox(s: TLStop, photoIndex: number) {
    const all = (s.hero ? [s.hero] : []).concat(s.photos || []).filter(Boolean);
    if (!all.length) return;
    setLb({ photos: all.map((p) => ({ photo: normalizePath(p) })), start: photoIndex });
  }

  const stepWord = lang === 'de' ? 'Station ' : 'Stop ';

  return (
    <>
      {/* Vorschau-Hinweis: ehrliche Kennzeichnung echt vs. Demo. */}
      <div className="tl-note">
        <strong>Prototyp · Variante B (vertikale Timeline).</strong> Datenbasis: echte Reise
        „{trip.title}" ({stops.length} Stopps). Hauptstationen mit Hero + Filmstreifen,
        Zwischenstopps schlank. Mit ✦ markierte Inhalte (Hero/Filmstreifen/Langtext) sind
        Demo-Füllung — echte Stopps haben nur kurzen Originaltext.
      </div>

      <div className="tl-head">
        <div className="tl-meta">{trip.meta}</div>
        <h2>{trip.title}</h2>
        <p className="tl-summary">{trip.summary}</p>
      </div>

      <div className="tl-layout">
        {/* Karte: im DOM zuerst -> mobil als Hero oben; auf Desktop per CSS in die rechte,
            sticky Spalte verschoben. */}
        <div className="tl-map-col">
          <div className="tl-map map-box">
            <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        <div className="tl-track">
          <ol className="tl-list">
            {stops.map((s, i) => {
              const isMain = s.kind === 'main';
              const isDemo = s.source === 'demo';
              return (
                <li
                  key={i}
                  id={'tl-stop-' + i}
                  data-idx={i}
                  className={'tl-stop ' + (isMain ? 'tl-main' : 'tl-inter') + (i === active ? ' is-active' : '')}
                >
                  <div className="tl-rail" aria-hidden="true"><span className="tl-dot" /></div>
                  <div className="tl-body">
                    <div className="tl-step">{stepWord}{i + 1}/{stops.length}{isMain ? '' : ' · Zwischenstopp'}</div>
                    <h3 className="tl-title">
                      {s.title}{isDemo ? <span className="tl-demo" title="Demo-Füllung"> ✦</span> : null}
                    </h3>
                    <div className="tl-date">{s.date}</div>

                    {isMain && s.hero ? (
                      <div className="tl-hero ph ww-photo" onClick={() => openLightbox(s, 0)}>
                        <img src={normalizePath(s.hero)} alt="" loading="lazy" />
                      </div>
                    ) : null}

                    {isMain ? (
                      s.text.split('\n\n').map((para, pi) => <p key={pi} className="tl-text">{para}</p>)
                    ) : (
                      <p className="tl-text tl-text-slim">{s.text}</p>
                    )}

                    {/* Hauptstation: Filmstreifen (Lightbox-Gruppe). */}
                    {isMain && s.photos && s.photos.length ? (
                      <div className="tl-strip">
                        {s.photos.map((p, pi) => (
                          <img key={pi} src={normalizePath(p)} alt="" loading="lazy"
                            onClick={() => openLightbox(s, (s.hero ? 1 : 0) + pi)} />
                        ))}
                      </div>
                    ) : null}

                    {/* Zwischenstopp: optional EIN kleines Thumbnail. */}
                    {!isMain && s.thumb ? (
                      <div className="tl-thumb ww-photo" onClick={() => setLb({ photos: [{ photo: normalizePath(s.thumb!) }], start: 0 })}>
                        <img src={normalizePath(s.thumb)} alt="" loading="lazy" />
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} loop onClose={() => setLb(null)} />}
    </>
  );
}
