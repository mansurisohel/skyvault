import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { trackTileHealth, BLANK_TILE } from './tileHealth';

// OpenWeather tiles are fetched through our own /api/tiles proxy so the API
// key never appears in a tile URL. Beyond zoom 9 Leaflet upscales tiles.
const TILE_URL = '/api/tiles?layer={layer}&z={z}&x={x}&y={y}';

export default function WeatherOverlay({ layerId, opacity = 0.65, onHealth }) {
  const map = useMap();
  const layerRef = useRef(null);
  const healthRef = useRef(onHealth);

  useEffect(() => {
    healthRef.current = onHealth;
  }, [onHealth]);

  useEffect(() => {
    const layer = L.tileLayer(TILE_URL, {
      layer: layerId, // custom option, substituted into {layer} by Leaflet
      opacity,
      maxNativeZoom: 9,
      maxZoom: map.getMaxZoom(),
      tileSize: 256,
      zIndex: 9,
      errorTileUrl: BLANK_TILE,
      attribution: 'Weather layers &copy; <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeather</a>',
    });
    layerRef.current = layer;
    const stop = trackTileHealth(layer, (failing) => healthRef.current?.(failing));
    layer.addTo(map);

    return () => {
      stop();
      map.removeLayer(layer);
      layerRef.current = null;
      healthRef.current?.(false);
    };
    // opacity is applied by the effect below; recreating the layer for each slider tick would refetch tiles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerId, map]);

  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);

  return null;
}
