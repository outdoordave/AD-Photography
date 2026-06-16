import React from 'react';
import { wrapFieldsWithMeta } from 'tinacms';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// PROTOTYP: eigenes Tina-Ortssuche-Feld (Tina hat kein Karten-Widget).
// Bildet Sveltias `widget: map` (Nominatim + Karte) nach und speichert EXAKT
// dasselbe Format: einen STRING `{"type":"Point","coordinates":[lon,lat]}`
// (lon zuerst, 6 Dezimalstellen) -> 1:1 kompatibel zu pickStopCoord (index.html).

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

type Pt = { lon: number; lat: number };
type Hit = { name: string; lon: number; lat: number };

function round6(x: number) {
  return Math.round(x * 1e6) / 1e6;
}
function toGeoJSON(lon: number, lat: number): string {
  return JSON.stringify({ type: 'Point', coordinates: [round6(lon), round6(lat)] });
}
function parsePoint(v: any): Pt | null {
  if (!v || typeof v !== 'string') return null;
  try {
    const g = JSON.parse(v);
    if (g && g.type === 'Point' && Array.isArray(g.coordinates) && typeof g.coordinates[0] === 'number') {
      return { lon: g.coordinates[0], lat: g.coordinates[1] };
    }
  } catch {}
  return null;
}

const LocationSearchInner = wrapFieldsWithMeta(({ input }: any) => {
  const value: string = typeof input.value === 'string' ? input.value : '';
  const point = parsePoint(value);

  const onChangeRef = React.useRef(input.onChange);
  onChangeRef.current = input.onChange;
  const setPoint = React.useCallback((lon: number, lat: number) => {
    onChangeRef.current(toGeoJSON(lon, lat));
  }, []);

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Hit[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const skipNextSearchRef = React.useRef(false); // nach Auswahl NICHT erneut suchen

  // --- Nominatim-Suche, debounced (~Policy: 1 Anfrage/s) + Abbruch laufender ---
  React.useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError('');
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=de&q=' +
          encodeURIComponent(q);
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Nominatim ' + res.status);
        const data: any[] = await res.json();
        setResults(
          data.map((d) => ({ name: d.display_name as string, lon: parseFloat(d.lon), lat: parseFloat(d.lat) }))
        );
        setOpen(true);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Suche fehlgeschlagen');
      } finally {
        setSearching(false);
      }
    }, 700); // debounce -> respektiert die Nominatim-Nutzungsrichtlinie
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  function choose(h: Hit) {
    setPoint(h.lon, h.lat);
    skipNextSearchRef.current = true; // verhindert Wieder-Aufploppen des Dropdowns
    setQuery(h.name.split(',')[0]);
    setResults([]);
    setOpen(false);
  }

  // --- MapLibre-Vorschau (verschiebbarer Marker + Klick-zum-Setzen) ---
  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const readyRef = React.useRef(false);
  const pointRef = React.useRef<Pt | null>(point);
  pointRef.current = point;

  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const start = pointRef.current;
    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: STYLE_URL,
      center: start ? [start.lon, start.lat] : [-98, 39],
      zoom: start ? 9 : 3,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      readyRef.current = true;
      const p = pointRef.current;
      if (p) placeMarker(p.lon, p.lat);
    });
    map.on('error', () => {});
    // Klick auf die Karte -> Punkt setzen (wie Sveltia "direkt auf die Karte tippen")
    map.on('click', (e) => setPoint(e.lngLat.lng, e.lngLat.lat));
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker(lon: number, lat: number) {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      const el = document.createElement('div');
      el.style.cssText =
        'width:18px;height:18px;background:#a7672f;border:2.5px solid #f4ede1;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.45);cursor:grab';
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center', draggable: true })
        .setLngLat([lon, lat])
        .addTo(map);
      // Marker verschieben -> Punkt fein justieren
      markerRef.current.on('dragend', () => {
        const ll = markerRef.current!.getLngLat();
        setPoint(ll.lng, ll.lat);
      });
    } else {
      markerRef.current.setLngLat([lon, lat]);
    }
  }

  // Wenn sich der gespeicherte Punkt ändert (Suche/Klick) -> Marker + Karte nachführen
  React.useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    if (point) {
      placeMarker(point.lon, point.lat);
      mapRef.current.easeTo({ center: [point.lon, point.lat], zoom: Math.max(mapRef.current.getZoom(), 9), duration: 500 });
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      {/* Suchfeld */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          placeholder="Ort suchen, z. B. „San Francisco“ …"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          style={{
            width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #d8cab2',
            background: '#fff', fontSize: 14, boxSizing: 'border-box',
          }}
        />
        {open && results.length > 0 && (
          <div
            style={{
              position: 'absolute', zIndex: 5, left: 0, right: 0, top: '100%', marginTop: 4,
              background: '#fff', border: '1px solid #d8cab2', borderRadius: 6,
              boxShadow: '0 8px 24px rgba(46,36,24,.18)', overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
            }}
          >
            {results.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => choose(h)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                  border: 'none', borderBottom: '1px solid #f0e8da', background: '#fff', cursor: 'pointer', fontSize: 13,
                }}
              >
                {h.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: searching ? '#6e5e49' : '#a7672f', marginTop: 6, minHeight: 16 }}>
        {searching ? 'Suche …' : error ? error : ''}
      </div>

      {/* Karten-Vorschau */}
      <div ref={mapElRef} style={{ width: '100%', height: 220, borderRadius: 8, overflow: 'hidden', border: '1px solid #e1ddd5', marginTop: 6 }} />

      {/* gespeicherter Wert (Format-Kontrolle) */}
      <div style={{ fontSize: 12, color: '#6e5e49', marginTop: 8 }}>
        {point
          ? <>Gespeichert: <code style={{ color: '#2d6a4f' }}>{value}</code></>
          : <>Noch kein Ort gewählt — suchen, Treffer wählen oder auf die Karte tippen.</>}
      </div>
    </div>
  );
});

export default LocationSearchInner;
