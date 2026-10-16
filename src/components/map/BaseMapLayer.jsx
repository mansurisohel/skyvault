import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { trackTileHealth } from './tileHealth';
import { getBaseMapConfig } from './baseMap';

// The only variable intended to be public: a restrictable CARTO basemap key.
const CARTO_KEY = import.meta.env.VITE_PUBLIC_CARTO_API_KEY;

/** Base map with failure reporting; the rest of the map stays usable if it errors. */
export default function BaseMapLayer({ onHealth }) {
  const map = useMap();
  const healthRef = useRef(onHealth);

  useEffect(() => {
    healthRef.current = onHealth;
  }, [onHealth]);

  useEffect(() => {
    const config = getBaseMapConfig(CARTO_KEY);
    const layer = L.tileLayer(config.url, { maxZoom: map.getMaxZoom(), ...config.options });
    const stop = trackTileHealth(layer, (failing) => healthRef.current?.(failing));
    layer.addTo(map);
    return () => {
      stop();
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}
