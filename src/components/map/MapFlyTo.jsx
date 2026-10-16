import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Moves the map when the selected location changes.
 *  - Skips the move if the map is already centered there (e.g. on first render).
 *  - `preserveZoom` (used when the user clicked the map) pans without changing
 *    the zoom, so inspecting a storm at a wide zoom isn't undone by every click.
 */
export default function MapFlyTo({ lat, lon, zoom = 8, preserveZoom = false }) {
  const map = useMap();

  useEffect(() => {
    const center = map.getCenter();
    if (Math.abs(center.lat - lat) < 0.0005 && Math.abs(center.lng - lon) < 0.0005) return;
    if (preserveZoom) map.panTo([lat, lon], { duration: 0.6 });
    else map.flyTo([lat, lon], zoom, { duration: 1.1 });
    // preserveZoom is read at the moment the location changes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, zoom, map]);

  return null;
}
