import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Lightbox, { type LbPhoto } from './Lightbox';
import { normalizePath, wwYouTubeEmbed } from './../lib/stories';
import { viewStops, tl, type RawTrip, type Lang, type ViewStop } from '../lib/trips';

// Reisen-Insel (Vollausbau, 1:1 aus index.html): Reise-Tabs, Reise-Kopf, MapLibre-
// Karte (Marker/flyTo/fitBounds/Sprach-Labels), Stationen-Snap-Bahn + Observer +
// Pfeile (entkoppelt), volle Stations-Karten (Titelbild/Text/Fotos→Lightbox/Video/
// YouTube), Stop-Liste, „Reisefazit"-Galerie. Karte/Stationen aus dem abgenommenen
// Prototyp (TripMapProto), erweitert auf mehrere Reisen.

type TripEntry = { slug: string; data: RawTrip };
type Props = { trips: TripEntry[]; lang: Lang; mapStyle?: string };

function setMapLanguage(map: maplibregl.Map, lang: Lang) {
  if (!map.isStyleLoaded()) return;
  const expr: any = ['coalesce', ['get', 'name:' + lang], ['get', 'name:latin'], ['get', 'name']];
  try {
    for (const ly of (map.getStyle().layers || []) as any[]) {
      if (ly.type === 'symbol' && ly.layout && ly.layout['text-field'] !== undefined) {
        map.setLayoutProperty(ly.id, 'text-field', expr);
      }
    }
  } catch {
    /* Stil noch nicht ganz bereit */
  }
}

export default function TripsContent({ trips, lang, mapStyle }: Props) {
  const [tripIdx, setTripIdx] = React.useState(0);
  const [active, setActive] = React.useState(0);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  const trip = trips[tripIdx]?.data || {};
  const stops: ViewStop[] = React.useMemo(() => viewStops(trip, lang), [tripIdx, lang]);

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const readyRef = React.useRef(false);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const activeRef = React.useRef(0);
  const stopsRef = React.useRef<ViewStop[]>(stops);
  const ioRef = React.useRef<IntersectionObserver | null>(null);

  const styleUrl = 'https://tiles.openfreemap.org/styles/' + (mapStyle || 'liberty');

  function drawMarkers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    stopsRef.current.forEach((s, idx) => {
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
      el.addEventListener('click', () => scrollToStop(idx, true));
      markersRef.current.push(marker);
    });
  }

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    const pts = stopsRef.current.filter((s) => s.lat != null && s.lon != null);
    if (!pts.length) return;
    if (pts.length === 1) {
      map.flyTo({ center: [pts[0].lon!, pts[0].lat!], zoom: 6, duration: 600 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    pts.forEach((s) => bounds.extend([s.lon!, s.lat!]));
    map.fitBounds(bounds, { padding: 50, duration: 600 });
  }

  function activateStop(idx: number) {
    if (idx === activeRef.current) return;
    activeRef.current = idx;
    setActive(idx);
    drawMarkers();
    const map = mapRef.current;
    const s = stopsRef.current[idx];
    if (map && readyRef.current && s && s.lat != null && s.lon != null) {
      map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 5), duration: 600 });
    }
  }

  function scrollToStop(idx: number, smooth: boolean) {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>('.trip-slide[data-sidx="' + idx + '"]');
    if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }

  function centeredIndex(): number {
    const track = trackRef.current;
    if (!track) return 0;
    const slides = track.querySelectorAll<HTMLElement>('.trip-slide');
    const sl = track.scrollLeft;
    let best = 0;
    let bestD = Infinity;
    slides.forEach((s2, i) => {
      const d = Math.abs(s2.offsetLeft - sl);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function stepStop(delta: number) {
    scrollToStop(Math.max(0, Math.min(stopsRef.current.length - 1, centeredIndex() + delta)), true);
  }

  function observeSlides() {
    if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null; }
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting && en.intersectionRatio >= 0.6) {
            activateStop(parseInt((en.target as HTMLElement).getAttribute('data-sidx') || '0', 10));
          }
        }
      },
      { root: track, threshold: [0.6, 0.9] }
    );
    track.querySelectorAll('.trip-slide').forEach((s) => io.observe(s));
    ioRef.current = io;
  }

  // Karte einmal erzeugen
  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: styleUrl,
      center: [-110, 40],
      zoom: 3,
      cooperativeGestures: true,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.scrollZoom.disable();
    map.on('load', () => {
      readyRef.current = true;
      setMapLanguage(map, lang);
      drawMarkers();
      fitAll();
    });
    map.on('error', () => { /* Tile-/Style-Aussetzer schlucken */ });
    return () => {
      if (ioRef.current) ioRef.current.disconnect();
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reise-/Sprachwechsel: Stops neu, Karte neu zeichnen + Bahn zuruecksetzen + neu beobachten
  React.useEffect(() => {
    stopsRef.current = stops;
    activeRef.current = 0;
    setActive(0);
    drawMarkers();
    fitAll();
    if (mapRef.current && readyRef.current) setMapLanguage(mapRef.current, lang);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: 0, behavior: 'auto' });
    observeSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIdx, lang]);

  // Lightbox-Gruppe einer Station: Titelbild (falls da) + weitere Fotos.
  function openStopLightbox(s: ViewStop, photoIndex: number) {
    const all = (s.photo ? [s.photo] : []).concat(s.photos).filter(Boolean);
    if (!all.length) return;
    setLb({ photos: all.map((p) => ({ photo: normalizePath(p) })), start: photoIndex });
  }

  const stepWord = lang === 'de' ? 'Station ' : 'Stop ';

  return (
    <>
      <div className="trip-tabs" id="tripTabs">
        {trips.map((tp, i) => {
          let label = tl(tp.data.title, lang) || tp.slug;
          if (tp.data.upcoming && label.indexOf('✦') === -1) label += lang === 'de' ? ' · bald ✦' : ' · soon ✦';
          return (
            <button key={tp.slug} className={i === tripIdx ? 'active' : ''} onClick={() => setTripIdx(i)}>{label}</button>
          );
        })}
      </div>

      <div className="trip-summary">
        <div className="meta">{tl(trip.meta, lang)}</div>
        <p>{tl(trip.summary, lang)}</p>
        {/* Verknüpftes Album: kommt mit der Galerie/Alben-Sektion (linked_trip). */}
      </div>

      <div className="map-layout">
        <div className="map-box">
          <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div className="trip-detail-wrap">
          <div className="trip-detail" ref={trackRef}>
            {stops.map((s, i) => {
              const cover = s.photo ? normalizePath(s.photo) : '';
              const yt = wwYouTubeEmbed(s.youtube);
              return (
                <div className="trip-slide" data-sidx={i} key={i}>
                  <div className="step">{stepWord}{i + 1}/{stops.length}</div>
                  <h3>{s.title}</h3>
                  <div className="date">{s.date}</div>
                  {cover ? (
                    <div className="ph ww-photo" style={{ aspectRatio: 'var(--ar-media)' }} onClick={() => openStopLightbox(s, 0)}>
                      <img src={cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                  ) : (
                    <div className="ph" style={{ aspectRatio: 'var(--ar-media)' }} />
                  )}
                  <p>{s.text}</p>
                  {s.photos.length ? (
                    <div className="ww-station-photos">
                      {s.photos.map((p, pi) => (
                        <img key={pi} src={normalizePath(p)} alt="" loading="lazy" style={{ cursor: 'pointer' }}
                          onClick={() => openStopLightbox(s, (s.photo ? 1 : 0) + pi)} />
                      ))}
                    </div>
                  ) : null}
                  {s.video ? (
                    <video className="ww-station-video" src={normalizePath(s.video)} autoPlay muted loop playsInline preload="metadata" />
                  ) : null}
                  {yt ? <div dangerouslySetInnerHTML={{ __html: yt }} /> : null}
                </div>
              );
            })}
          </div>
          {stops.length > 1 && (
            <>
              <button className="stop-arrow stop-arrow-prev" type="button" aria-label="Vorherige Station" onClick={() => stepStop(-1)}>‹</button>
              <button className="stop-arrow stop-arrow-next" type="button" aria-label="Nächste Station" onClick={() => stepStop(1)}>›</button>
            </>
          )}
        </div>
      </div>

      <div className="trip-stoplist" style={{ justifyContent: 'center' }}>
        {stops.map((s, i) => (
          <button key={i} className={i === active ? 'active' : ''} onClick={() => scrollToStop(i, true)}>{s.title || s.name}</button>
        ))}
      </div>

      {Array.isArray(trip.gallery) && trip.gallery.length ? (
        <div className="story-gallery" style={{ marginTop: 30 }}>
          {trip.gallery.map((g, i) => (
            <img key={i} src={normalizePath(g.image)} alt={tl(g.caption, lang)} loading="lazy"
              onClick={() => setLb({ photos: trip.gallery!.map((x) => ({ photo: normalizePath(x.image) })), start: i })} />
          ))}
        </div>
      ) : null}

      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} loop onClose={() => setLb(null)} />}
    </>
  );
}
