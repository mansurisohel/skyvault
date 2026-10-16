import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon, Maximize2, Minimize2, Play, Pause, Radar as RadarIcon, Loader2, Power,
  SkipBack, SkipForward, RefreshCw, TriangleAlert,
} from 'lucide-react';
import MapFlyTo from './MapFlyTo';
import MapZoomControls from './MapZoomControls';
import MapResizeHandler from './MapResizeHandler';
import RadarLayer from './RadarLayer';
import WeatherOverlay from './WeatherOverlay';
import BaseMapLayer from './BaseMapLayer';
import ClickToSelect from './ClickToSelect';
import MapLegend from './MapLegend';
import { MAP_LAYERS, getLegend } from './mapLayers';
import { useRadarFrames } from '@/hooks/useRadarFrames';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { useWeatherContext } from '@/context/WeatherContext';
import { reverseGeocode } from '@/services/geocodingService';
import { isDemoStatus } from '@/services/serviceStatus';
import { locationLabel } from '@/utils/format';

const CITY_ZOOM = 10;
const MAX_ZOOM = 12; // RainViewer serves tiles to zoom 7; beyond ~12 they would only look blocky

// Anchored map pin in the SkyVault brand blue.
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
  html: '<div class="map-ping-dot"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function frameTime(frame) {
  if (!frame) return '';
  return new Date(frame.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function LayerTabs({ activeLayerId, onChange, className = '' }) {
  return (
    <div role="group" aria-label="Map layer" className={`flex items-center gap-1.5 overflow-x-auto scrollbar-none ${className}`}>
      {MAP_LAYERS.map((l) => {
        const Icon = l.icon;
        const active = activeLayerId === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            aria-pressed={active}
            className={`focus-ring flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
              active ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/50' : 'text-slate-400 hover:bg-white/5 hover:text-mist-100'
            }`}
          >
            <Icon size={13} className={active ? 'text-sky-300' : 'text-slate-500'} aria-hidden="true" />
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

function Notice({ children, onRetry, tone = 'amber' }) {
  const tones = {
    amber: 'bg-amber-400/10 text-amber-100',
    red: 'bg-red-500/10 text-red-100',
  };
  return (
    <div role="status" className={`relative z-[401] flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 text-xs sm:px-5 ${tones[tone]}`}>
      <TriangleAlert size={14} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium hover:bg-white/20">
          <RefreshCw size={12} aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  );
}

const iconButton =
  'focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 transition-colors hover:bg-sky-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';

export default function WeatherMapView() {
  const { location, selectLocation, unit } = useWeatherContext();
  const services = useServiceStatus();

  const [activeLayerId, setActiveLayerId] = useState('precipitation_new');
  const [expanded, setExpanded] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [radarEnabled, setRadarEnabled] = useState(false); // radar is opt-in
  const [opacity, setOpacity] = useState(0.7);
  const [baseFailing, setBaseFailing] = useState(false);
  const [overlayFailing, setOverlayFailing] = useState(false);
  const [radarTilesFailing, setRadarTilesFailing] = useState(false);
  const [overlayKey, setOverlayKey] = useState(0);
  const [lastPick, setLastPick] = useState(null); // coordinates of the most recent map click

  const isRadarTab = activeLayerId === 'precipitation_new';
  const radar = useRadarFrames({ playbackMs: 700, enabled: radarEnabled && isRadarTab });

  const activeLayer = MAP_LAYERS.find((l) => l.id === activeLayerId);
  const currentFrame = radar.frames[radar.index];
  const radarActive = isRadarTab && radarEnabled && radar.status === 'ready';
  const owmConfigured = services.openweather === 'ok';
  const owmUnavailable = isDemoStatus(services.openweather);
  // OpenWeather overlay: any non-radar tab, or the precipitation tab while radar is off/unavailable.
  const overlayId = !radarActive && owmConfigured ? activeLayerId : null;
  const legend = useMemo(
    () => (radarActive ? getLegend('radar', unit) : overlayId ? getLegend(overlayId, unit) : null),
    [radarActive, overlayId, unit],
  );

  async function handlePick(lat, lon) {
    if (pinning) return;
    setPinning(true);
    try {
      const place = await reverseGeocode(lat, lon);
      setLastPick({ lat, lon });
      selectLocation({ ...place, lat, lon });
    } finally {
      setPinning(false);
    }
  }

  const pickedOnMap = Boolean(lastPick)
    && Math.abs(lastPick.lat - location.lat) < 1e-6
    && Math.abs(lastPick.lon - location.lon) < 1e-6;

  // Fullscreen behaves like a modal: Escape closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!expanded) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [expanded]);

  const showOpacity = radarActive || Boolean(overlayId);

  return (
    <>
      {expanded && <div className="fixed inset-0 z-40 bg-black/70" aria-hidden="true" onClick={() => setExpanded(false)} />}
      <div
        className={expanded ? 'fixed inset-2 z-50 sm:inset-4' : 'relative'}
        {...(expanded ? { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Weather map (fullscreen)' } : {})}
      >
        <div className="glass-panel relative flex h-full flex-col overflow-hidden p-0">
          {/* Header */}
          <div className="relative z-[401] flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-midnight-2/70 px-4 py-3 backdrop-blur-md sm:px-5">
            <div className="flex items-center gap-2 font-semibold text-mist-50">
              <MapIcon size={17} className="text-sky-400" aria-hidden="true" />
              <span className="text-sm">Live Map</span>
              {radarActive && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-glow" aria-hidden="true" /> RADAR
                </span>
              )}
            </div>

            <LayerTabs activeLayerId={activeLayerId} onChange={setActiveLayerId} className="hidden flex-1 sm:flex" />

            <span className="hidden items-center gap-1.5 text-xs text-slate-400 md:flex" aria-live="polite">
              {pinning && <Loader2 size={12} className="animate-spin" aria-label="Looking up place" />}
              {location.name} &middot; {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
            </span>

            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? 'Exit fullscreen map' : 'Expand map to fullscreen'}
              title={expanded ? 'Exit fullscreen' : 'Expand map'}
              className="focus-ring ml-auto flex min-h-9 items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-mist-100 active:scale-95 sm:ml-0"
            >
              {expanded ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
              <span className="hidden lg:inline">{expanded ? 'Exit' : 'Expand'}</span>
            </button>

            <LayerTabs activeLayerId={activeLayerId} onChange={setActiveLayerId} className="w-full sm:hidden" />
          </div>

          {/* Radar / opacity controls */}
          {(isRadarTab || showOpacity) && (
            <div className="relative z-[401] flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 bg-midnight-2/50 px-4 py-2 backdrop-blur-md sm:px-5">
              {isRadarTab && (
                <button
                  type="button"
                  onClick={() => setRadarEnabled((e) => !e)}
                  aria-pressed={radarEnabled}
                  className={`focus-ring flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 ${
                    radarEnabled ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25' : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                  }`}
                >
                  <Power size={13} aria-hidden="true" />
                  {radarEnabled ? 'Disable radar' : 'Enable radar'}
                </button>
              )}

              {isRadarTab && !radarEnabled && (
                <span className="text-[11px] text-slate-400">Animated precipitation radar for the past 2 hours (free, no account needed).</span>
              )}

              {isRadarTab && radarEnabled && radar.status === 'loading' && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400" role="status">
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" /> Loading radar frames…
                </span>
              )}

              {radarActive && (
                <>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => radar.step(-1)} disabled={radar.index === 0} aria-label="Previous radar frame" className={iconButton}>
                      <SkipBack size={13} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => radar.setPlaying((p) => !p)} aria-label={radar.playing ? 'Pause radar animation' : 'Play radar animation'} className={iconButton}>
                      {radar.playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={() => radar.step(1)} disabled={radar.index >= radar.frames.length - 1} aria-label="Next radar frame" className={iconButton}>
                      <SkipForward size={13} aria-hidden="true" />
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(radar.frames.length - 1, 0)}
                    value={radar.index}
                    onChange={(e) => { radar.setPlaying(false); radar.setIndex(Number(e.target.value)); }}
                    className="h-1.5 min-w-[96px] flex-1 cursor-pointer accent-sky-400"
                    aria-label="Radar timeline"
                    aria-valuetext={frameTime(currentFrame)}
                  />
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-300">
                    <RadarIcon size={12} className={radar.playing ? 'text-sky-300 animate-pulse-glow' : 'text-slate-500'} aria-hidden="true" />
                    {frameTime(currentFrame)}
                    {currentFrame?.isForecast && <span className="text-violet-300">(forecast)</span>}
                  </span>
                </>
              )}

              {showOpacity && (
                <label className="ml-auto flex shrink-0 items-center gap-2 text-[11px] text-slate-400">
                  Opacity
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="h-1.5 w-20 cursor-pointer accent-sky-400 sm:w-28"
                    aria-label="Overlay opacity"
                  />
                </label>
              )}
            </div>
          )}

          {/* Honest status notices: the base map always stays usable */}
          {!isRadarTab && owmUnavailable && (
            <Notice>This layer needs the OpenWeather API key to be configured on the server. The base map and rain radar still work.</Notice>
          )}
          {isRadarTab && radarEnabled && radar.status === 'error' && (
            <Notice onRetry={radar.retry}>Live radar is unavailable ({radar.error?.message}) The base map still works.</Notice>
          )}
          {radarActive && radar.stale && (
            <Notice>Radar data looks out of date; the newest frame is from {new Date(radar.newestTime * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.</Notice>
          )}
          {radarActive && radarTilesFailing && (
            <Notice onRetry={radar.retry}>Some radar tiles could not be loaded. They may have expired or your connection dropped.</Notice>
          )}
          {overlayId && overlayFailing && (
            <Notice onRetry={() => { setOverlayFailing(false); setOverlayKey((k) => k + 1); }}>
              Could not load the {activeLayer.label.toLowerCase()} layer. The base map still works.
            </Notice>
          )}
          {baseFailing && <Notice tone="red">Base map tiles failed to load. Check your connection.</Notice>}

          {/* Map */}
          <div className="relative flex-1" style={{ minHeight: expanded ? 0 : undefined }} role="region" aria-label="Interactive weather map">
            <MapContainer
              center={[location.lat, location.lon]}
              zoom={CITY_ZOOM}
              minZoom={3}
              maxZoom={MAX_ZOOM}
              scrollWheelZoom
              zoomControl={false}
              className="min-h-[50dvh] sm:min-h-[58dvh] lg:min-h-[65vh]"
              style={{ height: '100%', width: '100%', background: '#0b1224' }}
            >
              <BaseMapLayer onHealth={setBaseFailing} />
              {radarActive && <RadarLayer host={radar.host} frame={currentFrame} opacity={opacity} onHealth={setRadarTilesFailing} />}
              {overlayId && <WeatherOverlay key={`${overlayId}-${overlayKey}`} layerId={overlayId} opacity={opacity} onHealth={setOverlayFailing} />}
              <Marker position={[location.lat, location.lon]} icon={pingIcon} interactive={false} keyboard={false} />
              <Marker position={[location.lat, location.lon]} icon={markerIcon} alt={`Selected location: ${locationLabel(location)}`}>
                <Popup>
                  <strong>{locationLabel(location)}</strong>
                  <br />
                  {location.lat.toFixed(3)}°, {location.lon.toFixed(3)}°
                </Popup>
              </Marker>
              <MapFlyTo lat={location.lat} lon={location.lon} zoom={CITY_ZOOM} preserveZoom={pickedOnMap} />
              <ClickToSelect onPick={handlePick} />
              <MapZoomControls lat={location.lat} lon={location.lon} zoom={CITY_ZOOM} />
              <MapResizeHandler />
            </MapContainer>

            <MapLegend key={legend ? legend.title : 'none'} legend={legend} />
          </div>
        </div>
        {!expanded && (
          <p className="mt-2 text-xs text-slate-500">
            Tip: click the map to load weather for that point. Double-click or use the buttons to zoom.
          </p>
        )}
      </div>
    </>
  );
}
