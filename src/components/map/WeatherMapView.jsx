import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon, Maximize2, Minimize2, Play, Pause, Radar as RadarIcon, Loader2, Power,
} from 'lucide-react';
import MapFlyTo from './MapFlyTo';
import MapZoomControls from './MapZoomControls';
import MapResizeHandler from './MapResizeHandler';
import RadarLayer from './RadarLayer';
import { MAP_LAYERS } from './mapLayers';
import { useRadarFrames } from '@/hooks/useRadarFrames';
import { OPENWEATHER_API_KEY, DEMO_MODE } from '@/constants';
import { useWeatherContext } from '@/context/WeatherContext';
import { reverseGeocode } from '@/services/geocodingService';
import { locationLabel } from '@/utils/format';

const CITY_ZOOM = 10;
const MAX_ZOOM = 13; // beyond this, tile providers (esp. the radar) have no real data left to show

// A proper anchored map pin (not a plain divIcon) in the SkyVault brand
// blue — L.icon with a data-URI SVG avoids Leaflet's default divIcon white
// box/border, and anchoring at the tip means it actually points at its
// coordinate instead of floating over it.
const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
  <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.7 23.3 0 15 0z" fill="#5b8def" stroke="#f6f9ff" stroke-width="1.5"/>
  <circle cx="15" cy="15" r="6.5" fill="#f6f9ff"/>
</svg>`;

const markerIcon = L.icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(pinSvg)}`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

const pingIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:rgba(91,141,239,0.35);border:2px solid rgba(127,171,255,0.6);animation:map-ping 2.2s ease-out infinite"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function ClickToSelect({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function frameTime(frame) {
  if (!frame) return '';
  return new Date(frame.time * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function LayerTabs({ activeLayerId, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto scrollbar-none ${className}`}>
      {MAP_LAYERS.map((l) => {
        const Icon = l.icon;
        const active = activeLayerId === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/50'
                : 'text-slate-400 hover:bg-white/5 hover:text-mist-100'
            }`}
          >
            <Icon size={13} className={active ? 'text-sky-300' : 'text-slate-500'} />
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export default function WeatherMapView() {
  const { location, selectLocation } = useWeatherContext();
  const [activeLayerId, setActiveLayerId] = useState('precipitation_new');
  const [expanded, setExpanded] = useState(false);
  const [pinning, setPinning] = useState(false);
  // Radar is opt-in via its own button rather than fetching automatically
  // whenever the Precipitation tab happens to be selected.
  const [radarEnabled, setRadarEnabled] = useState(false);
  const radar = useRadarFrames({ playbackMs: 700, enabled: radarEnabled });

  const activeLayer = MAP_LAYERS.find((l) => l.id === activeLayerId);
  const isRadarTab = activeLayerId === 'precipitation_new';
  const showRadarOverlay = isRadarTab && radarEnabled;
  const currentFrame = radar.frames[radar.index];
  const firstFrame = radar.frames[0];
  const lastFrame = radar.frames[radar.frames.length - 1];

  const staticOverlayUrl = useMemo(() => {
    if (DEMO_MODE || isRadarTab) return null;
    return `https://tile.openweathermap.org/map/${activeLayerId}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;
  }, [activeLayerId, isRadarTab]);

  async function handlePick(lat, lon) {
    setPinning(true);
    try {
      const place = await reverseGeocode(lat, lon);
      selectLocation({ ...place, lat, lon });
    } finally {
      setPinning(false);
    }
  }

  // Fullscreen mode should behave like a proper modal: Escape closes it, and
  // the page underneath shouldn't scroll while it's open.
  useEffect(() => {
    if (!expanded) return undefined;

    function handleKey(e) {
      if (e.key === 'Escape') setExpanded(false);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [expanded]);

  return (
    <div className={expanded ? 'fixed inset-2 z-50 sm:inset-4' : 'relative'}>
      <div className="glass-panel relative flex h-full flex-col overflow-hidden p-0">
        {/* Header overlay */}
        <div className="relative z-[401] flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-midnight-2/70 px-4 py-3 backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-2 font-semibold text-mist-50">
            <MapIcon size={17} className="text-sky-400" />
            <span className="text-sm">Live Map</span>
            {showRadarOverlay && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-glow" /> RADAR
              </span>
            )}
          </div>

          <LayerTabs activeLayerId={activeLayerId} onChange={setActiveLayerId} className="hidden flex-1 sm:flex" />

          <span className="hidden items-center gap-1.5 text-xs text-slate-400 md:flex">
            {pinning && <Loader2 size={12} className="animate-spin" />}
            {location.name} &middot; {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
          </span>

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Exit fullscreen' : 'Expand map'}
            title={expanded ? 'Exit fullscreen' : 'Expand map'}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-mist-100 sm:ml-0"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden lg:inline">{expanded ? 'Exit' : 'Expand'}</span>
          </button>

          {/* Dedicated full-width row on mobile so layer tabs get proper
              room instead of competing with the title and buttons above. */}
          <LayerTabs activeLayerId={activeLayerId} onChange={setActiveLayerId} className="w-full sm:hidden" />
        </div>

        {/* Radar controls — a dedicated enable/disable button plus, once on,
            play/pause and a timeline scrubber. */}
        {isRadarTab && (
          <div className="relative z-[401] flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-white/10 bg-midnight-2/50 px-4 py-2 backdrop-blur-md sm:px-5">
            <button
              type="button"
              onClick={() => setRadarEnabled((e) => !e)}
              aria-pressed={radarEnabled}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                radarEnabled
                  ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                  : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
              }`}
            >
              <Power size={13} />
              {radarEnabled ? 'Disable radar' : 'Enable radar'}
            </button>

            {!radarEnabled && (
              <span className="text-[11px] text-slate-500">
                Turn on the live, animated precipitation radar (free — no account needed).
              </span>
            )}

            {radarEnabled && radar.status === 'loading' && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 size={13} className="animate-spin" /> Loading radar frames…
              </span>
            )}

            {radarEnabled && radar.status === 'ready' && radar.frames.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => radar.setPlaying((p) => !p)}
                  aria-label={radar.playing ? 'Pause radar animation' : 'Play radar animation'}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300"
                >
                  {radar.playing ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(radar.frames.length - 1, 0)}
                  value={radar.index}
                  onChange={(e) => { radar.setPlaying(false); radar.setIndex(Number(e.target.value)); }}
                  className="h-1.5 min-w-[100px] flex-1 cursor-pointer accent-sky-400"
                  aria-label="Radar timeline"
                />
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-300">
                  <RadarIcon size={12} className={radar.playing ? 'text-sky-300 animate-pulse-glow' : 'text-slate-500'} />
                  {frameTime(currentFrame)}
                  {currentFrame?.isForecast && <span className="text-violet-300">(forecast)</span>}
                </span>
                <span className="w-full shrink-0 text-[11px] text-slate-500 sm:w-auto">
                  {frameTime(firstFrame)} – {frameTime(lastFrame)} range
                </span>
              </>
            )}

            {radarEnabled && radar.status === 'error' && (
              <span className="text-xs text-amber-300">Live radar is temporarily unavailable — showing the base map only.</span>
            )}
          </div>
        )}
        {!isRadarTab && DEMO_MODE && (
          <div className="relative z-[401] bg-amber-400/10 px-4 py-1.5 text-center text-xs text-amber-200 sm:px-5">
            This layer needs a live OpenWeather API key — the base map and rain radar still work fully.
          </div>
        )}

        {/* Map */}
        <div className="relative flex-1" style={{ minHeight: expanded ? 0 : undefined }}>
          <MapContainer
            center={[location.lat, location.lon]}
            zoom={CITY_ZOOM}
            minZoom={3}
            maxZoom={MAX_ZOOM}
            scrollWheelZoom
            zoomControl={false}
            className="min-h-[50vh] sm:min-h-[58vh] lg:min-h-[65vh]"
            style={{ height: '100%', width: '100%', background: '#0b1224' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={MAX_ZOOM}
            />
            {showRadarOverlay && <RadarLayer host={radar.host} frame={currentFrame} maxZoom={MAX_ZOOM} />}
            {staticOverlayUrl && (
              <TileLayer url={staticOverlayUrl} opacity={0.65} maxNativeZoom={10} maxZoom={MAX_ZOOM} />
            )}
            <Marker position={[location.lat, location.lon]} icon={pingIcon} interactive={false} />
            <Marker position={[location.lat, location.lon]} icon={markerIcon}>
              <Popup>
                <strong>{locationLabel(location)}</strong>
                <br />
                {location.lat.toFixed(3)}°, {location.lon.toFixed(3)}°
              </Popup>
            </Marker>
            <MapFlyTo lat={location.lat} lon={location.lon} zoom={CITY_ZOOM} />
            <ClickToSelect onPick={handlePick} />
            <MapZoomControls lat={location.lat} lon={location.lon} zoom={CITY_ZOOM} />
            <MapResizeHandler />
          </MapContainer>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] w-40 rounded-2xl border border-white/10 bg-midnight-2/85 p-3 backdrop-blur-md sm:bottom-4 sm:left-4 sm:w-52 sm:p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-mist-50">{activeLayer.label}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">{activeLayer.unit}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {activeLayer.legend.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="shrink-0 font-medium" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {!expanded && (
        <p className="mt-2 text-xs text-slate-500">
          Tip: click anywhere on the map to load weather for that point, or press Esc to exit fullscreen.
        </p>
      )}
    </div>
  );
}
