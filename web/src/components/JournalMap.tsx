import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Schlanke Einzelpunkt-Karte fürs Journal-Detail — gleiche MapLibre-Bündelung + OpenFreeMap-
// Kacheln wie die Reisen-Karte (TripTimeline), aber nur EIN Marker, Pan/Zoom, keine Route.
// cooperativeGestures = an: die Seite scrollt normal, die Karte zoomt erst mit Zusatzgeste
// (Strg+Rad bzw. zwei Finger) — so „schluckt" die Karte das Seiten-Scrollen nicht.
export default function JournalMap({ lon, lat, styleName = 'liberty' }: { lon: number; lat: number; styleName?: string }) {
  const elRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);

  React.useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: elRef.current,
      style: 'https://tiles.openfreemap.org/styles/' + styleName,
      center: [lon, lat],
      zoom: 9,
      cooperativeGestures: true,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    new maplibregl.Marker({ color: '#a7672f' }).setLngLat([lon, lat]).addTo(map);
    mapRef.current = map;
    return () => { try { map.remove(); } catch (e) { /* ignore */ } mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Punkt-Änderung (CMS-Live-Vorschau) -> Karte nachziehen.
  React.useEffect(() => {
    const m = mapRef.current;
    if (m) m.easeTo({ center: [lon, lat], duration: 400 });
  }, [lon, lat]);

  return <div className="ww-journal-map" ref={elRef} aria-label="Karte" />;
}
