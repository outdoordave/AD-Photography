import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTina, tinaField } from 'tinacms/dist/react';
import Lightbox, { type LbPhoto } from './Lightbox';
import { normalizePath, wwYouTubeEmbed } from './../lib/stories';
import { track } from '../lib/track';
import { viewStops, bi, tripTitle, sortTrips, type RawTrip, type Lang, type ViewStop } from '../lib/trips';

// Reisen-Insel (Vollausbau, 1:1 aus index.html): Reise-Tabs, Reise-Kopf, MapLibre-
// Karte (Marker/flyTo/fitBounds/Sprach-Labels), Stationen-Snap-Bahn + Observer +
// Pfeile (entkoppelt), volle Stations-Karten (Titelbild/Text/Fotos→Lightbox/Video/
// YouTube), Stop-Liste, „Reisefazit"-Galerie. Karte/Stationen aus dem abgenommenen
// Prototyp (TripMapProto), erweitert auf mehrere Reisen.
// Daten via useTina (reisenConnection) -> LIVE-Vorschau: Edits im CMS erscheinen
// sofort; data-tina-field = Klick auf der Seite springt zum passenden Feld.

type LinkedAlbum = { slug: string; name: { de?: string; en?: string } };
type Props = { query: string; variables: object; data: any; lang: Lang; mapStyle?: string; scrollZoom?: boolean; initialSlug?: string; linkedAlbums?: Record<string, LinkedAlbum>;
  // TEIL 8: reisen_settings live (Kartenstil-Sofortvorschau im CMS)
  settingsQuery?: string; settingsVariables?: object; settingsData?: any };

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

// TEIL 8: liest map_style LIVE aus reisen_settings und meldet Änderungen nach oben.
// Eigene Komponente, damit die useTina NUR mit echtem Query läuft (bedingt gerendert).
function MapStyleWatcher({ query, variables, data, onStyle }: { query: string; variables: object; data: any; onStyle: (s: string) => void }) {
  const { data: d } = useTina({ query, variables, data });
  const style = (d as any)?.reisen_settings?.map_style;
  React.useEffect(() => { if (style) onStyle(style); }, [style]);
  return null;
}

export default function TripsContent(props: Props) {
  const { lang, mapStyle } = props;
  // tinaField auf das flache Feld der aktiven Sprache (…_de bzw. …_en) -> Klick
  // springt direkt ins Freitextfeld statt in ein DE/EN-Unterformular.
  const tf = (o: any, base: string) => tinaField(o, (lang === 'en' ? base + '_en' : base + '_de') as any);
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  // TEIL 8: Kartenstil LIVE aus den Reisen-Einstellungen (Sofortvorschau im CMS).
  // WICHTIG: Die Settings-useTina läuft NUR in der Kind-Komponente <MapStyleWatcher>,
  // und die wird nur gerendert, wenn ein echtes Query vorliegt — sonst würde
  // useTina({query:''}) eine leere GraphQL-Abfrage absetzen ("Unexpected <EOF>").
  // Ohne Settings-Query (z. B. Detail-Route ohne Props) bleibt der Build-Prop-Stil.
  const [liveMapStyle, setLiveMapStyle] = React.useState<string>(mapStyle || 'liberty');

  // Reisen aus der Connection ableiten (live), nach order/Datum sortiert.
  const trips = React.useMemo(() => {
    const edges = (data as any)?.reisenConnection?.edges || [];
    return sortTrips(
      edges
        .filter(Boolean)
        .map((e: any) => ({ slug: e?.node?._sys?.filename || '', data: (e?.node || {}) as RawTrip }))
    );
  }, [data]);

  // Aktiver Tab aus initialSlug (Editor-Vorschauroute /trips/<slug> bzw. Deeplink).
  // initialSlug ist ein Prop (gleich auf Server + Client) -> Hydration-sicher als
  // useState-Initialwert. Ohne initialSlug (oeffentliche /trips) startet Tab 0.
  const initialTab = React.useMemo(() => {
    if (!props.initialSlug) return 0;
    const i = trips.findIndex((t) => t.slug === props.initialSlug);
    return i >= 0 ? i : 0;
  }, [trips, props.initialSlug]);

  const [tripIdx, setTripIdx] = React.useState(() => initialTab);
  const [active, setActive] = React.useState(0);
  const [lb, setLb] = React.useState<{ photos: LbPhoto[]; start: number } | null>(null);

  // Laeuft die Seite in Tinas Vorschau-Iframe? Dann ist der Editor-Sync (Scroll ->
  // Station im Formular) aktiv; die oeffentliche Seite bleibt voellig unberuehrt.
  const inEditorRef = React.useRef(false);
  React.useEffect(() => {
    try { inEditorRef.current = window.self !== window.top; } catch { inEditorRef.current = true; }
  }, []);

  const trip: any = trips[tripIdx]?.data || {};
  const rawStops: any[] = Array.isArray(trip.stops) ? trip.stops : [];
  const stops: ViewStop[] = React.useMemo(() => viewStops(trip, lang), [trip, lang]);

  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const readyRef = React.useRef(false);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const activeRef = React.useRef(0);
  const stopsRef = React.useRef<ViewStop[]>(stops);
  const ioRef = React.useRef<IntersectionObserver | null>(null);
  const coordSigRef = React.useRef('');
  const editSyncTimerRef = React.useRef<number | null>(null);
  // Refs der schiebbaren Reihen (Reise-Tabs + Stations-Pills) für die Rand-Fade-Indikatoren.
  const tabsElRef = React.useRef<HTMLDivElement | null>(null);
  const stopsElRef = React.useRef<HTMLDivElement | null>(null);
  // Rand-Fade als „geht-noch-weiter"-Indikator: Klasse ww-edge-l/-r je nach Scrollposition.
  // Fade erscheint nur auf der Seite mit mehr Inhalt; an den Enden verschwindet es.
  React.useEffect(() => {
    const els = [tabsElRef.current, stopsElRef.current].filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const update = (el: HTMLElement) => {
      const more = el.scrollWidth - el.clientWidth;
      el.classList.toggle('ww-edge-l', more > 2 && el.scrollLeft > 4);
      el.classList.toggle('ww-edge-r', more > 2 && el.scrollLeft < more - 4);
    };
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const h = () => update(el);
      el.addEventListener('scroll', h, { passive: true });
      cleanups.push(() => el.removeEventListener('scroll', h));
      update(el);
      const r = requestAnimationFrame(() => update(el)); // nach Layout (Schrift/Bilder) nochmal
      cleanups.push(() => cancelAnimationFrame(r));
    });
    const onResize = () => els.forEach(update);
    window.addEventListener('resize', onResize);
    cleanups.push(() => window.removeEventListener('resize', onResize));
    return () => cleanups.forEach((c) => c());
  }, [tripIdx, trips, lang]);

  // Signatur der karten-relevanten Stop-Daten (Koordinaten + Marker-/Popup-Texte).
  // Aendert sie sich (Ortssuche, Titel, Datum, Name), werden in der Live-Vorschau die
  // Marker neu gezeichnet; reine Fliesstext-Edits lassen die Karte in Ruhe.
  function stopSig(list: ViewStop[]): string {
    return list.map((s) => s.lon + ',' + s.lat + ',' + s.title + ',' + s.date + ',' + s.name).join('|');
  }

  const styleUrl = 'https://tiles.openfreemap.org/styles/' + liveMapStyle;

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

  // Im Editor: aktive Station als Klick an Tina melden -> das Formular oeffnet genau
  // diese Station als GANZES Item (Titel, Datum, Text, Bilder ...), nicht nur ein
  // Unterfeld. Dafuer traegt die .trip-slide selbst das Item-`data-tina-field`.
  // Debounce: nur die Station, auf der man landet, nicht jede beim Vorbeiscrollen.
  // Auf der Live-Seite passiert nichts (nur im Vorschau-Iframe aktiv).
  function syncEditorToStop(idx: number) {
    if (!inEditorRef.current) return;
    if (editSyncTimerRef.current) window.clearTimeout(editSyncTimerRef.current);
    editSyncTimerRef.current = window.setTimeout(() => {
      const track = trackRef.current;
      if (!track) return;
      const el = track.querySelector<HTMLElement>('.trip-slide[data-sidx="' + idx + '"]');
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }, 200);
  }

  function activateStop(idx: number) {
    if (idx === activeRef.current) return;
    activeRef.current = idx;
    setActive(idx);
    drawMarkers();
    syncEditorToStop(idx);
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
    // TEIL 5: Mausrad-Zoom per CMS-Schalter (map_scroll_zoom). Standard AN.
    //  AN  -> cooperativeGestures aus: Mausrad zoomt direkt (Handy: 1 Finger bewegt Karte).
    //  AUS -> wie Live: Mausrad scrollt die Seite, am Handy zwei Finger (cooperativeGestures an).
    const scrollZoomOn = props.scrollZoom !== false;
    const map = new maplibregl.Map({
      container: mapElRef.current,
      style: styleUrl,
      center: [-110, 40],
      zoom: 3,
      cooperativeGestures: !scrollZoomOn,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    if (scrollZoomOn) map.scrollZoom.enable(); else map.scrollZoom.disable();
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

  // TEIL 8: Kartenstil-Sofortvorschau — bei Stilwechsel (CMS) die bestehende Karte live
  // umstylen statt neu zu bauen. DOM-Marker überleben setStyle; nur die Sprach-Labels
  // müssen nach dem neuen Style erneut gesetzt werden. Auf der statischen Seite ändert
  // sich styleUrl nie -> Effekt läuft faktisch nicht (Karte bleibt wie gebaut).
  const styleUrlRef = React.useRef(styleUrl);
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;        // erst nach erstem 'load'
    if (styleUrlRef.current === styleUrl) return; // unverändert -> nichts tun
    styleUrlRef.current = styleUrl;
    map.setStyle(styleUrl);
    map.once('styledata', () => { if (map.isStyleLoaded()) setMapLanguage(map, lang); });
  }, [styleUrl, lang]);

  // Reise-/Sprachwechsel: Stops neu, Karte neu zeichnen + Bahn zuruecksetzen + neu beobachten
  React.useEffect(() => {
    stopsRef.current = stops;
    activeRef.current = 0;
    setActive(0);
    drawMarkers();
    fitAll();
    coordSigRef.current = stopSig(stops);
    if (mapRef.current && readyRef.current) setMapLanguage(mapRef.current, lang);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: 0, behavior: 'auto' });
    observeSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIdx, lang]);

  // Live-Vorschau: CMS-Edit an Stop-Daten -> Marker neu zeichnen, OHNE Bahn/aktive
  // Station/Viewport zurueckzusetzen (kein Sprung beim Tippen). Nur bei echter
  // Aenderung der karten-relevanten Felder (Signatur), nicht bei reinem Fliesstext.
  React.useEffect(() => {
    stopsRef.current = stops;
    const sig = stopSig(stops);
    if (sig !== coordSigRef.current) {
      coordSigRef.current = sig;
      if (mapRef.current && readyRef.current) drawMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  // Lightbox-Gruppe einer Station: Titelbild (falls da) + weitere Fotos.
  function openStopLightbox(s: ViewStop, photoIndex: number) {
    // Cover in der Lightbox = volles Original (nicht der gerahmte Zuschnitt).
    const all = (s.photoFull ? [s.photoFull] : []).concat(s.photos).filter(Boolean);
    if (!all.length) return;
    setLb({ photos: all.map((p) => ({ photo: normalizePath(p) })), start: photoIndex });
  }

  const stepWord = lang === 'de' ? 'Station ' : 'Stop ';

  return (
    <>
      {props.settingsQuery ? (
        <MapStyleWatcher
          query={props.settingsQuery}
          variables={props.settingsVariables || {}}
          data={props.settingsData}
          onStyle={setLiveMapStyle}
        />
      ) : null}
      <div className="trip-tabs" id="tripTabs" ref={tabsElRef}>
        {trips.map((tp, i) => {
          // 1:1 wie Live: Tab zeigt exakt den CMS-Titel, KEIN automatisches Suffix.
          // (upcoming steuert nur Aktuell/Entdecken, nicht das Tab-Label.)
          const label = tripTitle(tp.data, lang) || tp.slug;
          return (
            <button key={tp.slug} className={i === tripIdx ? 'active' : ''} data-tina-field={tinaField(tp.data as any, 'title')}
              // Im Tina-Editor fängt Tina den `click` auf data-tina-field-Elemente in der
              // Capture-Phase ab (stopPropagation) -> React-onClick feuert nicht, der Tab
              // würde die Reise nicht wechseln. Tina fängt aber NUR `click` ab, nicht
              // `mousedown` -> dort den Wechsel zusätzlich auslösen (nur im Editor; die
              // öffentliche Seite nutzt weiter onClick). Tinas Klick wählt parallel das
              // Feld dieser Reise -> das Formular folgt mit.
              onMouseDown={() => { if (inEditorRef.current) setTripIdx(i); }}
              onClick={() => { setTripIdx(i); track('reise', { reise: label }); }}>{label}</button>
          );
        })}
      </div>

      <div className="trip-summary">
        <div className="meta" data-tina-field={tf(trip, 'meta')}>{bi(trip, 'meta', lang)}</div>
        <p data-tina-field={tf(trip, 'summary')}>{bi(trip, 'summary', lang)}</p>
        {/* Verknüpftes Album (linked_trip === aktuelle Reise) -> Link zur Album-Unterseite. */}
        {(() => {
          const la = props.linkedAlbums?.[trips[tripIdx]?.slug || ''];
          if (!la) return null;
          const albName = lang === 'en' ? (la.name?.en || la.name?.de || '') : (la.name?.de || '');
          return (
            <a className="trip-album-link" href={`${lang === 'en' ? '/en' : ''}/portfolio/${la.slug}`}>
              <span className="lbl">{lang === 'de' ? 'Mehr Fotos im Album' : 'More photos in album'}</span>
              <strong>{albName}</strong>
              <span className="arrow">→</span>
            </a>
          );
        })()}
      </div>

      <div className="map-layout">
        <div className="map-box">
          <div ref={mapElRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div className="trip-detail-wrap">
          <div className="trip-detail" ref={trackRef}>
            {stops.map((s, i) => {
              const cover = s.frame.src; // CSS-Zuschnitt: Original + s.frame.style
              const yt = wwYouTubeEmbed(s.youtube);
              const rs = rawStops[i];
              return (
                <div className="trip-slide" data-sidx={i} key={i} data-tina-field={rs ? tinaField(rs) : undefined}>
                  <div className="step">{stepWord}{i + 1}/{stops.length}</div>
                  <h3 data-tina-field={rs ? tf(rs, 'title') : undefined}>{s.title}</h3>
                  <div className="date" data-tina-field={rs ? tf(rs, 'date') : undefined}>{s.date}</div>
                  {cover ? (
                    <div className="ph ww-photo" style={{ aspectRatio: 'var(--ar-media)' }} data-tina-field={rs ? tinaField(rs, 'photo') : undefined} onClick={() => openStopLightbox(s, 0)}>
                      <img src={cover} alt="" style={s.frame.style} />
                    </div>
                  ) : (
                    <div className="ph" style={{ aspectRatio: 'var(--ar-media)' }} data-tina-field={rs ? tinaField(rs, 'photo') : undefined} />
                  )}
                  <p data-tina-field={rs ? tf(rs, 'text') : undefined}>{s.text}</p>
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

      <div className="trip-stoplist" ref={stopsElRef}>
        {stops.map((s, i) => (
          <button key={i} className={i === active ? 'active' : ''} onClick={() => scrollToStop(i, true)}>{s.title || s.name}</button>
        ))}
      </div>

      {Array.isArray(trip.gallery) && trip.gallery.length ? (
        <div className="story-gallery" style={{ marginTop: 30 }}>
          {trip.gallery.map((g: any, i: number) => (
            <img key={i} src={normalizePath(g.image)} alt={bi(g, 'caption', lang)} loading="lazy"
              data-tina-field={tinaField(g, 'image')}
              onClick={() => setLb({ photos: trip.gallery.map((x: any) => ({ photo: normalizePath(x.image) })), start: i })} />
          ))}
        </div>
      ) : null}

      {lb && <Lightbox photos={lb.photos} startIndex={lb.start} loop onClose={() => setLb(null)} />}
    </>
  );
}
