import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTina, tinaField } from 'tinacms/dist/react';
import { selectActiveFormId } from '../lib/tinaForm';
import { viewStops, type RawTrip } from '../lib/trips';
import { normalizePath } from '../lib/stories';
import RichText, { richIsEmpty } from './RichText';
import Lightbox, { type LbPhoto } from './Lightbox';

// Editorial-Reise-Detail (Route-Sektion): Etappen-Liste links + sticky MapLibre-Karte rechts.
// 1:1 aus „Reise Tennessee Winter.html" — aber mit der ECHTEN Karten-Technik der Seite
// (MapLibre + OpenFreeMap statt Leaflet+OSM). Beim Scrollen folgt die Karte der aktiven
// Etappe (flyTo), inaktive Etappen werden abgedunkelt, der aktive Marker hebt sich hervor.
// Foto-Klick öffnet die gleiche Lightbox wie sonst. data-tina-field bleibt (inline editierbar).

type Props = {
  query: string; variables: object; data: any;
  initialSlug: string; lang: 'de' | 'en';
  mapStyle?: string; scrollZoom?: boolean;
};

export default function EditorialTrip(props: Props) {
  const { data } = useTina({
    query: props.query, variables: props.variables, data: props.data,
    experimental___selectFormByFormId: () => selectActiveFormId(props.data),
  });
  const lang = props.lang;
  const node = ((data as any)?.reisenConnection?.edges || [])
    .map((e: any) => e?.node).find((n: any) => n?._sys?.filename === props.initialSlug) as (RawTrip & Record<string, any>) | undefined;
  const rawStops = Array.isArray(node?.stops) ? (node!.stops as any[]) : [];
  const stops = node ? viewStops(node, lang) : [];

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<Array<{ el: HTMLElement; idx: number }>>([]);
  const legRefs = React.useRef<Array<HTMLElement | null>>([]);
  const activeRef = React.useRef<number>(-1);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  // Karte, auf die Stationen mit Koordinaten bezogen.
  const geo = stops.map((s, i) => ({ i, lon: s.lon, lat: s.lat })).filter((g) => typeof g.lon === 'number' && typeof g.lat === 'number') as { i: number; lon: number; lat: number }[];

  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current || !geo.length) return;
    const styleUrl = 'https://tiles.openfreemap.org/styles/' + (props.mapStyle || 'dark');
    const map = new maplibregl.Map({
      container: mapElRef.current, style: styleUrl,
      center: [geo[0].lon, geo[0].lat], zoom: 5,
      cooperativeGestures: props.scrollZoom === false, attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const drawn = () => {
      try {
        // Route-Linie (gestrichelt, gold) über die Stationen.
        if (geo.length >= 2 && !map.getSource('ed-route')) {
          map.addSource('ed-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: geo.map((g) => [g.lon, g.lat]) } } });
          map.addLayer({ id: 'ed-route', type: 'line', source: 'ed-route', paint: { 'line-color': '#d4a45a', 'line-width': 2, 'line-opacity': 0.7, 'line-dasharray': [2, 3] } });
        }
      } catch { /* Layer-Konflikt ignorieren */ }
      // Marker.
      markersRef.current = geo.map((g) => {
        const el = document.createElement('div');
        el.className = 'ed-map-marker';
        el.addEventListener('click', () => scrollToLeg(g.i));
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([g.lon, g.lat]).addTo(map);
        return { el, idx: g.i };
      });
      // Auf alle Stationen einpassen.
      const b = new maplibregl.LngLatBounds();
      geo.forEach((g) => b.extend([g.lon, g.lat]));
      map.fitBounds(b, { padding: 70, maxZoom: 9, duration: 0 });
      sync();
    };
    map.on('load', drawn);

    return () => { map.remove(); mapRef.current = null; markersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialSlug, geo.length]);

  const scrollToLeg = (i: number) => {
    const el = legRefs.current[i];
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.4, behavior: 'smooth' });
  };

  const sync = React.useCallback(() => {
    const map = mapRef.current;
    const mid = window.innerHeight * 0.5;
    let best = -1;
    legRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < mid && r.bottom > mid * 0.4) best = i;
    });
    // Dimmen: nur aktive Etappe voll sichtbar.
    legRefs.current.forEach((el, i) => { if (el) el.classList.toggle('dim', best !== -1 && i !== best); });
    if (best === -1 || best === activeRef.current) return;
    activeRef.current = best;
    markersRef.current.forEach((m) => m.el.classList.toggle('active', m.idx === best));
    if (map) {
      const g = geo.find((x) => x.i === best);
      if (g) map.flyTo({ center: [g.lon, g.lat], zoom: Math.max(map.getZoom(), 8.5), duration: 1300, essential: true });
    }
  }, [geo]);

  React.useEffect(() => {
    const onScroll = () => sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sync]);

  if (!node) return null;

  const dayLabel = (s: any, i: number) => {
    const raw = rawStops[i] || {};
    const d = lang === 'en' ? (raw.date_en || raw.date_de) : (raw.date_de || raw.date_en);
    const st = `${lang === 'en' ? 'Stop' : 'Station'} ${String(i + 1).padStart(2, '0')}`;
    return d ? `${d} · ${st}` : st;
  };

  return (
    <>
      <div className="ed-route-grid">
        <div className="ed-legs" id="ed-legs">
          {stops.map((s, i) => {
            const photo = s.photo ? normalizePath(s.photo) : '';
            const legPhotos = (s.photos && s.photos.length ? s.photos : (s.photoFull ? [s.photoFull] : [])).map((p) => ({ photo: normalizePath(p) })) as LbPhoto[];
            const raw = rawStops[i] || {};
            const textVal = lang === 'en' ? (richIsEmpty(raw.text_en) ? raw.text_de : raw.text_en) : raw.text_de;
            return (
              <article className="ed-leg" data-reveal key={i} ref={(el) => (legRefs.current[i] = el)}>
                <p className="ed-leg-kicker">{dayLabel(s, i)}</p>
                <h2 className="ed-leg-title" data-tina-field={rawStops[i] ? tinaField(rawStops[i], (lang === 'en' ? 'title_en' : 'title_de') as any) : undefined}>{s.title}</h2>
                {!richIsEmpty(textVal) ? <div className="ed-leg-text ww-rich" data-tina-field={rawStops[i] ? tinaField(rawStops[i], (lang === 'en' ? 'text_en' : 'text_de') as any) : undefined}><RichText value={textVal} /></div> : null}
                {s.name && s.name !== s.title ? <p className="ed-leg-spot">{lang === 'en' ? 'Spot' : 'Foto-Spot'}: {s.name}</p> : null}
                {photo ? (
                  <button type="button" className="ed-leg-photo" onClick={() => legPhotos.length && setLb({ photos: legPhotos, start: 0 })} data-tina-field={rawStops[i] ? tinaField(rawStops[i], 'photo') : undefined}>
                    <img src={photo} alt={s.title} loading="lazy" decoding="async" />
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
        <div className="ed-map-sticky">
          <div className="ed-map" ref={mapElRef} />
        </div>
      </div>
      {lb ? <Lightbox photos={lb.photos} startIndex={lb.start} albumName={node.title || ''} onClose={() => setLb(null)} /> : null}
    </>
  );
}
