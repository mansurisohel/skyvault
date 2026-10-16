import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition } from '@/utils/weatherCondition';
import { formatTemp, formatHour, toCelsius } from '@/utils/format';
import { useWeatherContext } from '@/context/WeatherContext';
import { useHourlyTimeline } from '@/hooks/useHourlyTimeline';

const scrollButton =
  'focus-ring absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-midnight/90 text-mist-100 shadow-lg transition-colors hover:bg-sky-400/20 active:scale-95 md:flex';

export default function HourlyForecast() {
  const { snapshot, unit } = useWeatherContext();
  const tz = snapshot.location.timezoneOffset;
  const scroller = useRef(null);

  // First tile is the current observation; the rest are 2-hour steps smoothed
  // from the real 3-hour forecast (see utils/timeline.js).
  const timeline = useHourlyTimeline(snapshot);

  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });

  return (
    <Card className="overflow-hidden !p-0">
      <div className="flex items-baseline justify-between px-5 pb-4 pt-5 md:px-6">
        <h2 className="text-base font-semibold text-mist-50">Upcoming forecast</h2>
        <span className="text-xs text-slate-400">Every 2 hours</span>
      </div>
      <div className="relative">
        <ul
          ref={scroller}
          aria-label="Hourly forecast"
          className="m-0 flex list-none gap-3 overflow-x-auto px-5 pb-5 md:px-6 scrollbar-none"
        >
          {timeline.map((h, i) => {
            const condition = resolveCondition(h.weather[0].id, h.weather[0].icon, toCelsius(h.temp, unit));
            return (
              <li
                key={h.isNow ? 'now' : h.dt}
                className={`relative flex min-w-[82px] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-colors ${
                  i === 0 ? 'bg-sky-400/10 ring-1 ring-sky-400/30' : 'hover:bg-white/5'
                }`}
              >
                {i === 0 && <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />}
                <span className="text-xs font-medium text-slate-300">{i === 0 ? 'Now' : formatHour(h.dt, tz)}</span>
                <WeatherIcon condition={condition} size={26} />
                <span className="data-mono text-sm font-semibold text-mist-50">{formatTemp(h.temp)}</span>
                <span className="flex h-4 items-center gap-0.5 text-[11px] text-sky-300">
                  {h.pop > 0.1 && (<><Droplets size={11} aria-hidden="true" /> {Math.round(h.pop * 100)}%</>)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-midnight-2/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-midnight-2/60 to-transparent" />
        <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll forecast earlier" className={`${scrollButton} left-2`}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll forecast later" className={`${scrollButton} right-2`}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
