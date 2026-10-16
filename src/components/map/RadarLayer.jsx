import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { radarTileUrl, RADAR_MAX_NATIVE_ZOOM } from '@/services/radarService';
import { trackTileHealth, BLANK_TILE } from './tileHealth';

const REVEAL_TIMEOUT_MS = 4000; // never wait forever on slow tiles
const CROSSFADE_MS = 250;

/**
 * Draws one RainViewer frame at a time.
 *
 * Old approach: remount a <TileLayer> per frame (flash + refetch on every tick).
 * Now: the next frame is created hidden, revealed once its tiles have loaded
 * (or after a timeout), then the previous frame is faded out and REMOVED. At
 * most two radar layers exist on the map at once, so memory and tile requests
 * stay bounded, and looping replays are served from the browser cache.
 *
 * Tiles are requested at RainViewer's real maximum zoom (7); Leaflet upscales
 * them when the map is zoomed in further.
 */
export default function RadarLayer({ host, frame, opacity = 0.7, onHealth }) {
  const map = useMap();
  const shown = useRef(null);   // { path, layer, stopTracking }
  const pending = useRef(null); // { path, layer, timer, stopTracking }
  const opacityRef = useRef(opacity);
  const healthRef = useRef(onHealth);

  useEffect(() => {
    opacityRef.current = opacity;
    shown.current?.layer.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    healthRef.current = onHealth;
  }, [onHealth]);

  const framePath = frame?.path;
  useEffect(() => {
    if (!host || !frame) return;
    if (shown.current?.path === frame.path || pending.current?.path === frame.path) return;

    // The latest requested frame wins: drop an unfinished preload.
    if (pending.current) {
      disposeEntry(map, pending.current);
      pending.current = null;
    }

    const layer = L.tileLayer(radarTileUrl(host, frame), {
      opacity: 0,
      maxNativeZoom: RADAR_MAX_NATIVE_ZOOM,
      maxZoom: map.getMaxZoom(),
      tileSize: 256,
      zIndex: 10,
      keepBuffer: 1,
      errorTileUrl: BLANK_TILE,
      attribution: 'Radar &copy; <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>',
    });
    const entry = { path: frame.path, layer, timer: null, stopTracking: null };
    pending.current = entry;
    entry.stopTracking = trackTileHealth(layer, (failing) => healthRef.current?.(failing));

    const reveal = () => {
      if (pending.current !== entry) return;
      window.clearTimeout(entry.timer);
      layer.setOpacity(opacityRef.current);
      const previous = shown.current;
      shown.current = entry;
      pending.current = null;
      if (previous) {
        previous.layer.setOpacity(0);
        window.setTimeout(() => disposeEntry(map, previous), CROSSFADE_MS);
      }
    };

    // trackTileHealth uses layer.off() as cleanup, so register the reveal
    // listener on the DOM-level 'load' event after tracking is set up.
    layer.on('load', reveal);
    entry.timer = window.setTimeout(reveal, REVEAL_TIMEOUT_MS);
    layer.addTo(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the frame's path, not object identity
  }, [host, framePath, map]);

  useEffect(() => () => {
    if (pending.current) disposeEntry(map, pending.current);
    if (shown.current) disposeEntry(map, shown.current);
    pending.current = null;
    shown.current = null;
    healthRef.current?.(false);
  }, [map]);

  return null;
}

function disposeEntry(map, entry) {
  window.clearTimeout(entry.timer);
  entry.stopTracking?.();
  map.removeLayer(entry.layer);
}
