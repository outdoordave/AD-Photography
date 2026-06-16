import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// PROTOTYP: MapLibre-Karte + Stationen-Snap-Bahn, 1:1-Port aus index.html
// (renderTrip 3259, wwDrawTrip 3355, wwSetMapLanguage 3338, wwActivateStop 3472,
//  renderStops 3534, wwScrollStopTo 3463, stepStop 3438). Liberty-Stil reicht
// fuer den Test. KEINE Tina-Anbindung, keine Galerie, kein DE/EN-Vollausbau.

export type ProtoStop = {
  name: string;
  lon: number;
  lat: number;
  title: string;
  text: string;
  date: string;
};

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Sprach-Labels wie live: coalesce(name:de, name:latin, name)
function setMapLanguage(map: maplibregl.Map) {
  if (!map.isStyleLoaded()) return;
  const expr: any = ['coalesce', ['get', 'name:de'], ['get', 'name:latin'], ['get', 'name']];
  try {
    const layers = map.getStyle().layers || [];
    for (const ly of layers as any[]) {
      if (ly.type === 'symbol' && ly.layout && ly.layout['text-field'] !== undefined) {
        map.setLayoutProperty(ly.id, 'text-field', expr);
      }
    }
  } catch {
    /* Stil noch nicht ganz bereit */
  }
}

export default function TripMapProto({ stops }: { stops: ProtoStop[] }) {
  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const readyRef = React.useRef(false);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const activeRef = React.useRef(0);
  const [active, setActiveState] = React.useState(0);

  // Marker zeichnen (aktiver Punkt groesser/heller) — wie wwDrawTrip
  function drawMarkers() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    stops.forEach((s, idx) => {
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
        '<p class="ww-popup-name">' + s.title + '</p>' + (s.date ? '<p class="ww-popup-date">' + s.date + '</p>' : '')
      );
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([s.lon, s.lat])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener('click', () => scrollToStop(idx, true)); // Klick scrollt Bahn; Observer fliegt
      markersRef.current.push(marker);
    });
  }

  // fitBounds ueber alle Stops (wie wwDrawTrip beim ersten Zeichnen)
  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    if (stops.length === 1) {
      map.flyTo({ center: [stops[0].lon, stops[0].lat], zoom: 6 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    stops.forEach((s) => bounds.extend([s.lon, s.lat]));
    map.fitBounds(bounds, { padding: 50, duration: 600 });
  }

  // Vom Observer aufgerufen: aktive Station setzen + Karte fliegt (ENTKOPPELT —
  // die Karte treibt die Bahn NICHT). Wie wwActivateStop.
  function activateStop(idx: number) {
    if (idx === activeRef.current) return; // schon aktiv -> kein erneutes Fliegen
    activeRef.current = idx;
    setActiveState(idx);
    drawMarkers();
    const map = mapRef.current;
    if (map && readyRef.current) {
      map.flyTo({ center: [stops[idx].lon, stops[idx].lat], zoom: Math.max(map.getZoom(), 5), duration: 600 });
    }
  }

  // Zur Station scrollen (offsetLeft, padding-sicher) — wie wwScrollStopTo
  function scrollToStop(idx: number, smooth: boolean) {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>('.trip-slide[data-sidx="' + idx + '"]');
    if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }

  // Welche Station steht mittig? (wie wwCenteredStopIndex)
  function centeredIndex(): number {
    const track = trackRef.current;
    if (!track) return 0;
    const slides = track.querySelectorAll<HTMLElement>('.trip-slide');
    const sl = track.scrollLeft;
    let best = 0;
    let bestD = Infinity;
    slides.forEach((sl2, i) => {
      const d = Math.abs(sl2.offsetLeft - sl);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  function stepStop(delta: number) {
    const target = Math.max(0, Math.min(stops.length - 1, centeredIndex() + delta));
    scrollToStop(target, true);
  }

  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: STYLE_URL,
      center: [-110, 40],
      zoom: 3,
      cooperativeGestures: true, // Touch: 2 Finger Karte, 1 Finger Seite
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.scrollZoom.disable(); // Scrollen scrollt die Seite, nicht die Karte
    map.on('load', () => {
      readyRef.current = true;
      setMapLanguage(map);
      drawMarkers();
      fitAll();
    });
    map.on('error', () => {
      /* OpenFreeMap-Aussetzer nicht hart werfen */
    });

    // Observer: zentrierte Station -> activateStop (Schwelle 0.6, wie live)
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && trackRef.current) {
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting && en.intersectionRatio >= 0.6) {
              activateStop(parseInt((en.target as HTMLElement).getAttribute('data-sidx') || '0', 10));
            }
          }
        },
        { root: trackRef.current, threshold: [0.6, 0.9] }
      );
      trackRef.current.querySelectorAll('.trip-slide').forEach((s) => io!.observe(s));
    }

    return () => {
      if (io) io.disconnect();
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="map-layout">
      <div className="map-box">
        <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="trip-detail-wrap">
        <div className="trip-detail" ref={trackRef}>
          {stops.map((s, i) => (
            <div className="trip-slide" data-sidx={i} key={i}>
              <div className="step">Station {i + 1}/{stops.length}</div>
              <h3>{s.title}</h3>
              <div className="date">{s.date}</div>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        {stops.length > 1 && (
          <>
            <button className="stop-arrow stop-arrow-prev" aria-label="Vorherige" onClick={() => stepStop(-1)}>‹</button>
            <button className="stop-arrow stop-arrow-next" aria-label="Nächste" onClick={() => stepStop(1)}>›</button>
          </>
        )}
      </div>
    </div>
  );
}
