import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    function handleResize() {
      map.invalidateSize();
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let observer;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(map.getContainer());
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}
