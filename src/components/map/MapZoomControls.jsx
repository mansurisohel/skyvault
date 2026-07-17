import { Plus, Minus, LocateFixed } from 'lucide-react';
import { useMap } from 'react-leaflet';

export default function MapZoomControls({ lat, lon, zoom }) {
  const map = useMap();

  return (
    <div className="absolute left-3 top-3 z-[400] flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-midnight/90 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
          title="Zoom in"
          className="flex h-9 w-9 items-center justify-center text-mist-100 transition-colors hover:bg-sky-400/20 hover:text-sky-300 active:scale-95"
        >
          <Plus size={16} />
        </button>
        <div className="h-px w-full bg-white/10" />
        <button
          type="button"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
          title="Zoom out"
          className="flex h-9 w-9 items-center justify-center text-mist-100 transition-colors hover:bg-sky-400/20 hover:text-sky-300 active:scale-95"
        >
          <Minus size={16} />
        </button>
      </div>
      {lat !== undefined && lon !== undefined && (
        <button
          type="button"
          onClick={() => map.flyTo([lat, lon], zoom, { duration: 0.8 })}
          aria-label="Recenter on selected location"
          title="Recenter on selected location"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-midnight/90 text-mist-100 shadow-lg backdrop-blur-sm transition-colors hover:bg-sky-400/20 hover:text-sky-300 active:scale-95"
        >
          <LocateFixed size={15} />
        </button>
      )}
    </div>
  );
}
