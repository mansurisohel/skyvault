import { TileLayer } from 'react-leaflet';
import { radarTileUrl } from '@/services/radarService';

// RainViewer's radar tile pyramid doesn't extend to arbitrary zoom levels —
// requesting tiles past its native resolution is exactly what produced the
// "Zoom level not supported" error. `maxNativeZoom` tells Leaflet to keep
// using the highest real tile and scale it up visually beyond that point,
// which is the standard, correct way to handle a provider with limited zoom
// (the same technique browsers use for any tiled map layer), instead of
// requesting a tile that doesn't exist.
const RADAR_MAX_NATIVE_ZOOM = 9;

export default function RadarLayer({ host, frame, opacity = 0.65, maxZoom = 13 }) {
  if (!host || !frame) return null;
  return (
    <TileLayer
      key={frame.path}
      url={radarTileUrl(host, frame)}
      opacity={opacity}
      zIndex={10}
      maxNativeZoom={RADAR_MAX_NATIVE_ZOOM}
      maxZoom={maxZoom}
      errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    />
  );
}
