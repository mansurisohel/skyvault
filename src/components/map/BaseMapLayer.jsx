import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { trackTileHealth } from './tileHealth';

const BASE_PANE = 'baseMapPane';

/**
 * Dark base map using free OpenStreetMap tiles with a CSS inversion filter.
 * No API key required. The filter gives a dark-mode appearance that blends
 * well with the app's dark UI, while keeping full tile coverage and reliability.
 *
 * Uses a custom Leaflet pane so the dark filter doesn't affect weather overlay
 * or radar tiles, which need to retain their original color palettes.
 */
export default function BaseMapLayer({ onHealth }) {
  const map = useMap();
  const healthRef = useRef(onHealth);

  useEffect(() => {
    healthRef.current = onHealth;
  }, [onHealth]);

  useEffect(() => {
    // Create a dedicated pane for the base map so the dark filter is isolated.
    if (!map.getPane(BASE_PANE)) {
      const pane = map.createPane(BASE_PANE);
      pane.style.zIndex = '200'; // below the default tilePane (200) — same level is fine
      pane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.7) contrast(1.1) saturate(0.3)';
    }

    const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      pane: BASE_PANE,
      maxZoom: map.getMaxZoom(),
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    });
    const stop = trackTileHealth(layer, (failing) => healthRef.current?.(failing));
    layer.addTo(map);
    return () => {
      stop();
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}

