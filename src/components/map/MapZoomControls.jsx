import { useEffect, useRef } from 'react';
import { Plus, Minus, LocateFixed } from 'lucide-react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const buttonClass =
  'focus-ring flex h-10 w-10 items-center justify-center text-mist-100 transition-colors hover:bg-sky-400/20 hover:text-sky-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';

export default function MapZoomControls({ lat, lon, zoom }) {
  const map = useMap();
  const ref = useRef(null);

  // These controls live INSIDE the Leaflet container, so without this a click
  // on "+" would also bubble up as a map click and select a new location.
  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div ref={ref} className="absolute left-3 top-3 z-[400] flex flex-col gap-2">
      <div role="group" aria-label="Map zoom" className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-midnight/90 shadow-lg backdrop-blur-sm">
        <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in" title="Zoom in" className={buttonClass}>
          <Plus size={16} aria-hidden="true" />
        </button>
        <div className="h-px w-full bg-white/10" />
        <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out" title="Zoom out" className={buttonClass}>
          <Minus size={16} aria-hidden="true" />
        </button>
      </div>
      {lat !== undefined && lon !== undefined && (
        <button
          type="button"
          onClick={() => map.flyTo([lat, lon], zoom, { duration: 0.8 })}
          aria-label="Recenter on selected location"
          title="Recenter on selected location"
          className={`${buttonClass} rounded-xl border border-white/10 bg-midnight/90 shadow-lg backdrop-blur-sm`}
        >
          <LocateFixed size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
