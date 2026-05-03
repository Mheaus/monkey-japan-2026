import * as React from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { DayPlan } from '~/data/trip';

// ~30 points d'intérêt emblématiques du Japon
const POIS = [
  // ── TOKYO ──────────────────────────────────────────────────────────
  { id: 'tokyo-tower', name: 'Tokyo Tower', emoji: '🗼', lat: 35.6586, lon: 139.7454 },
  { id: 'skytree', name: 'Tokyo Skytree', emoji: '📡', lat: 35.7101, lon: 139.8107 },
  { id: 'meiji', name: 'Meiji Jingu', emoji: '⛩️', lat: 35.6763, lon: 139.6993 },
  { id: 'shibuya-cross', name: 'Shibuya Crossing', emoji: '🚦', lat: 35.6595, lon: 139.7005 },
  { id: 'akihabara', name: 'Akihabara', emoji: '🎮', lat: 35.7022, lon: 139.7741 },
  { id: 'odaiba', name: 'Odaiba Gundam', emoji: '🤖', lat: 35.6275, lon: 139.7715 },
  { id: 'ghibli', name: 'Musée Ghibli', emoji: '🌿', lat: 35.6962, lon: 139.5706 },
  { id: 'ueno', name: 'Ueno Park', emoji: '🌸', lat: 35.7126, lon: 139.7742 },
  { id: 'asakusa', name: 'Senso-ji', emoji: '⛩️', lat: 35.7148, lon: 139.7967 },
  { id: 'shinjuku', name: 'Shinjuku', emoji: '🏙️', lat: 35.6938, lon: 139.7036 },
  { id: 'harajuku', name: 'Harajuku', emoji: '🎸', lat: 35.6702, lon: 139.7024 },
  { id: 'tsukiji', name: 'Tsukiji', emoji: '🍣', lat: 35.6651, lon: 139.7708 },
  { id: 'shimokita', name: 'Shimokitazawa', emoji: '👕', lat: 35.6617, lon: 139.6663 },
  { id: 'pokemon-center', name: 'Pokémon Center', emoji: '⚡', lat: 35.6591, lon: 139.702 },
  // ── OSAKA ──────────────────────────────────────────────────────────
  { id: 'osaka-castle', name: "Château d'Osaka", emoji: '🏯', lat: 34.6873, lon: 135.5262 },
  { id: 'dotonbori', name: 'Dotonbori', emoji: '🦞', lat: 34.6687, lon: 135.5013 },
  { id: 'shinsekai', name: 'Shinsekai', emoji: '🗽', lat: 34.6514, lon: 135.5063 },
  { id: 'namba', name: 'Namba', emoji: '🛍️', lat: 34.6686, lon: 135.4984 },
  { id: 'umeda', name: 'Umeda Sky Building', emoji: '🌆', lat: 34.7059, lon: 135.4941 },
  { id: 'universal', name: 'Universal Studios', emoji: '🎡', lat: 34.6654, lon: 135.4323 },
  // ── KYOTO ──────────────────────────────────────────────────────────
  { id: 'kinkaku', name: "Temple d'Or", emoji: '✨', lat: 35.0394, lon: 135.7292 },
  { id: 'fushimi', name: 'Fushimi Inari', emoji: '🏮', lat: 34.9671, lon: 135.7727 },
  { id: 'arashiyama', name: 'Forêt de bambous', emoji: '🎋', lat: 35.0094, lon: 135.6722 },
  { id: 'gion', name: 'Gion', emoji: '👘', lat: 35.0037, lon: 135.7785 },
  { id: 'kiyomizu', name: 'Kiyomizudera', emoji: '⛩️', lat: 34.9948, lon: 135.7851 },
  { id: 'nijo', name: 'Château Nijo', emoji: '🏯', lat: 35.0142, lon: 135.7482 },
  { id: 'philosopher', name: 'Chemin du Philosophe', emoji: '🌸', lat: 35.0272, lon: 135.7938 },
  // ── QUELQUES INCONTOURNABLES NATIONAL ──────────────────────────────
  { id: 'fuji', name: 'Mont Fuji', emoji: '🗻', lat: 35.3607, lon: 138.7274 },
  { id: 'nara', name: 'Cerfs de Nara', emoji: '🦌', lat: 34.6851, lon: 135.8049 },
  { id: 'hiroshima', name: 'Hiroshima', emoji: '☮️', lat: 34.3853, lon: 132.4553 },
  { id: 'sapporo', name: 'Sapporo', emoji: '🍺', lat: 43.0618, lon: 141.3545 },
] as const;

// Base : appartement à Wakaba, Shinjuku
const HOME = { lat: 35.6876, lon: 139.723 };
const VILLA = { lat: 34.7963, lon: 138.9986 };

// Override des couleurs par layer — mer bleu nuit, terre verte, axes rouge foncé
function applyCustomColors(map: MaplibreMap) {
  const { layers } = map.getStyle();
  for (const layer of layers) {
    const id = layer.id.toLowerCase();
    try {
      // Fond terre — vert clair soft
      if (layer.type === 'background') {
        map.setPaintProperty(layer.id, 'background-color', '#d4e8c2');
      }
      // Mer / eau
      else if (
        layer.type === 'fill' &&
        (id.includes('water') || id === 'sea') &&
        !id.includes('label') &&
        !id.includes('name')
      ) {
        map.setPaintProperty(layer.id, 'fill-color', '#a0d8ec');
      } else if (layer.type === 'line' && id.startsWith('water')) {
        map.setPaintProperty(layer.id, 'line-color', '#a0d8ec');
      }
      // Végétation / parcs / forêts — vert un poil plus soutenu mais soft
      else if (
        layer.type === 'fill' &&
        (id.includes('park') ||
          id.includes('forest') ||
          id.includes('wood') ||
          id.includes('grass') ||
          id.includes('meadow') ||
          id.includes('scrub') ||
          id.includes('garden') ||
          id.includes('vegetation') ||
          id.includes('landcover'))
      ) {
        map.setPaintProperty(layer.id, 'fill-color', '#b8d99a');
      }
      // Bâtiments — beige neutre
      else if (layer.type === 'fill' && id.includes('building')) {
        map.setPaintProperty(layer.id, 'fill-color', '#c8bfa8');
        try {
          map.setPaintProperty(layer.id, 'fill-outline-color', '#b8af98');
        } catch {
          /* skip */
        }
      }
      // Seulement autoroutes + nationales en ocre/rouille, les secondaires cachées
      else if (layer.type === 'line' && (id.includes('motorway') || id.includes('trunk'))) {
        map.setPaintProperty(layer.id, 'line-color', '#b8621a');
      } else if (layer.type === 'line' && id.includes('primary')) {
        map.setPaintProperty(layer.id, 'line-color', '#c8860a');
      } else if (
        layer.type === 'line' &&
        (id.includes('secondary') ||
          id.includes('tertiary') ||
          id.includes('residential') ||
          id.includes('service') ||
          id.includes('unclassified') ||
          id.includes('path') ||
          id.includes('track') ||
          id.includes('footway') ||
          id.includes('cycleway') ||
          id.includes('link'))
      ) {
        // masquer toutes les petites voiries
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    } catch {
      // certains layers ne supportent pas la propriété, on ignore
    }
  }
}

interface JapanMapProps {
  days: DayPlan[];
  activeDay: number | null;
  onDayClick: (day: number) => void;
}

export default function JapanMap({ days, activeDay, onDayClick }: JapanMapProps) {
  const mapRef = React.useRef<MapRef>(null);
  const [hoveredPoi, setHoveredPoi] = React.useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(5);
  const [bounds, setBounds] = React.useState<{ minLon: number; maxLon: number; minLat: number; maxLat: number } | null>(
    null,
  );

  const activeData = days.find((d) => d.day === activeDay) ?? null;

  React.useEffect(() => {
    if (activeData && mapRef.current) {
      mapRef.current.flyTo({
        center: [activeData.lon, activeData.lat],
        zoom: 13,
        duration: 800,
      });
    }
  }, [activeData]);

  const updateViewport = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setZoom(map.getZoom());
    const b = map.getBounds();
    if (b) {
      setBounds({ minLon: b.getWest(), maxLon: b.getEast(), minLat: b.getSouth(), maxLat: b.getNorth() });
    }
  }, []);

  // POIs visibles uniquement si zoom >= 9, dans le viewport, et pas trop proches d'un pin
  const visiblePois = React.useMemo(() => {
    if (zoom < 9 || !bounds) return [];
    // Seuil de proximité en degrés (~400m à ces latitudes)
    const THRESHOLD = 0.004;
    return POIS.filter((p) => {
      if (p.lon < bounds.minLon || p.lon > bounds.maxLon) return false;
      if (p.lat < bounds.minLat || p.lat > bounds.maxLat) return false;
      // Exclure si un pin est trop proche
      const tooClose = days.some((d) => Math.abs(d.lat - p.lat) < THRESHOLD && Math.abs(d.lon - p.lon) < THRESHOLD);
      return !tooClose;
    });
  }, [zoom, bounds, days]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-kraft shadow-md">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 139.68, latitude: 35.52, zoom: 10 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        onLoad={(e) => {
          applyCustomColors(e.target as unknown as MaplibreMap);
          // Fit sur tous les pins au chargement
          const lats = days.map((d) => d.lat);
          const lons = days.map((d) => d.lon);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          e.target.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            { padding: 60, duration: 0 },
          );
          updateViewport();
        }}
        onMove={updateViewport}
      >
        <NavigationControl position="top-right" />

        {/* Marqueur maison — très visible, toujours devant */}
        <Marker longitude={HOME.lon} latitude={HOME.lat} anchor="bottom" style={{ zIndex: 50 }}>
          <div style={{ filter: 'drop-shadow(0 3px 8px rgba(255,200,0,0.7)) drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
            <div
              style={{
                background: '#FFD600',
                border: '2.5px solid #e6a800',
                borderRadius: 10,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                fontSize: 13,
                color: '#2c1810',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              🏠 Base
            </div>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #e6a800',
                margin: '-1px auto 0',
              }}
            />
          </div>
        </Marker>

        {/* Marqueur villa de rêve — Kawazu, Izu */}
        <Marker longitude={VILLA.lon} latitude={VILLA.lat} anchor="bottom" style={{ zIndex: 50 }}>
          <div style={{ filter: 'drop-shadow(0 3px 8px rgba(80,180,60,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.45))' }}>
            <div
              style={{
                background: '#7ed321',
                border: '2.5px solid #3a7a10',
                borderRadius: 10,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Caveat', cursive",
                fontWeight: 800,
                fontSize: 13,
                color: '#1a3a06',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              🌿 Villa de rêve
            </div>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #3a7a10',
                margin: '-1px auto 0',
              }}
            />
          </div>
        </Marker>

        {/* POIs — visibles uniquement si zoom ≥ 9 et dans le viewport */}
        {visiblePois.map((poi) => (
          <Marker key={poi.id} longitude={poi.lon} latitude={poi.lat} anchor="bottom" style={{ zIndex: 5 }}>
            <div
              className="cursor-default select-none relative"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
              onMouseEnter={() => setHoveredPoi(poi.id)}
              onMouseLeave={() => setHoveredPoi(null)}
            >
              {/* Bulle blanche */}
              <div
                style={{
                  background: '#fff',
                  border: '1.5px solid rgba(0,0,0,0.12)',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  lineHeight: 1,
                  transition: 'transform 0.15s',
                }}
                className="hover:scale-125"
              >
                {poi.emoji}
              </div>
              {/* Pointe de bulle */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '5px solid #fff',
                  margin: '-1px auto 0',
                }}
              />
              {hoveredPoi === poi.id && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 paper-card rounded-md px-2 py-1 whitespace-nowrap pointer-events-none"
                  style={{
                    fontSize: 11,
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    color: '#2c1810',
                    zIndex: 999,
                    boxShadow: '1px 2px 6px rgba(44,24,16,0.18)',
                  }}
                >
                  {poi.name}
                </div>
              )}
            </div>
          </Marker>
        ))}

        {/* Pins jours de l'itinéraire — toujours prioritaires */}
        {days.map((day) => {
          const isActive = day.day === activeDay;
          const bg = isActive ? '#e8230a' : '#ffffff';
          const border = isActive ? '#b81c08' : '#e8230a';
          const color = isActive ? '#fff' : '#e8230a';
          return (
            <Marker
              key={day.day}
              longitude={day.lon}
              latitude={day.lat}
              anchor="bottom"
              style={{ zIndex: 20 }}
              onClick={() => onDayClick(day.day)}
            >
              <div
                className="cursor-pointer relative"
                style={{
                  filter: 'drop-shadow(0 2px 6px rgba(232,35,10,0.55)) drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
                }}
                onMouseEnter={() => setHoveredDay(day.day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {hoveredDay === day.day && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 paper-card rounded-md px-2 py-1 whitespace-nowrap pointer-events-none"
                    style={{
                      fontSize: 11,
                      fontFamily: "'Caveat', cursive",
                      fontWeight: 700,
                      color: '#2c1810',
                      zIndex: 999,
                      boxShadow: '1px 2px 6px rgba(44,24,16,0.18)',
                    }}
                  >
                    {day.emoji} {day.location}
                  </div>
                )}
                <div
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    color,
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    fontSize: 11,
                    padding: '3px 7px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {day.date}
                </div>
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `7px solid ${border}`,
                    margin: '-1px auto 0',
                  }}
                />
              </div>
            </Marker>
          );
        })}
      </Map>

      <div className="absolute bottom-2 right-12 z-20 text-[9px] text-ink/30 font-handwritten pointer-events-none">
        © OpenStreetMap · OpenFreeMap
      </div>
    </div>
  );
}
