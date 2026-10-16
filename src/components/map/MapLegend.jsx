import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** Collapsible so it never hides much of a small phone map; open by default on larger screens. */
export default function MapLegend({ legend }) {
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 640px)').matches,
  );
  if (!legend) return null;

  const bar = `linear-gradient(to right, ${legend.gradient.map((g) => `${g.color} ${g.pos.toFixed(1)}%`).join(', ')})`;

  return (
    <div className="absolute bottom-3 left-3 z-[400] max-w-[calc(100%-1.5rem)] rounded-2xl border border-white/10 bg-midnight-2/90 text-left backdrop-blur-md sm:bottom-4 sm:left-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="map-legend-body"
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-xs font-semibold text-mist-50"
      >
        <span>{legend.title} <span className="font-medium text-slate-400">({legend.unit})</span></span>
        {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronUp size={14} aria-hidden="true" />}
      </button>
      {open && (
        <div id="map-legend-body" className="w-52 px-3 pb-3 sm:w-60">
          <div className="h-2.5 w-full rounded-full ring-1 ring-white/15" style={{ background: bar }} role="img" aria-label={`${legend.title} color scale in ${legend.unit}`} />
          <div className="relative mt-1 h-4 text-[10px] font-medium text-slate-300">
            {legend.ticks.map((t, i) => (
              <span
                key={`${t.label}-${i}`}
                className="absolute top-0 whitespace-nowrap"
                style={{
                  left: `${t.pos}%`,
                  transform: t.pos <= 2 ? 'none' : t.pos >= 98 ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
          {legend.note && <p className="mt-1.5 text-[10px] leading-snug text-slate-400">{legend.note}</p>}
        </div>
      )}
    </div>
  );
}
