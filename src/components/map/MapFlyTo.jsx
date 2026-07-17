import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapFlyTo({ lat, lon, zoom = 8 }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], zoom, { duration: 1.1 });
  }, [lat, lon, zoom, map]);
  return null;
}
