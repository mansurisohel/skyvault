import { Card } from '@/components/common/Primitives';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition } from '@/utils/weatherCondition';
import { buildInterpolatedTimeline } from '@/utils/timeline';
import { formatTemp, formatHour, toCelsius } from '@/utils/format';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';
import { Droplets } from 'lucide-react';

export default function HourlyForecast() {
  const { snapshot, unit } = useWeatherContext();
  const tz = snapshot.location.timezoneOffset;
  const nowUnix = useClock(60000);

  // Smoothed to 2-hour steps from the real 3-hour forecast data — see
  // utils/timeline.js for why this is interpolation, not fabrication.
  const timeline = buildInterpolatedTimeline(snapshot.hourly, {
    stepSeconds: 2 * 3600,
    count: 12,
    startAt: nowUnix,
  });

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-baseline justify-between px-5 pt-5 pb-4 md:px-6">
        <h2 className="text-base font-semibold text-mist-50">Upcoming forecast</h2>
        <span className="text-xs text-slate-500">Every 2 hours</span>
      </div>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-5 pb-5 md:px-6 scrollbar-none">
          {timeline.map((h, i) => {
            const condition = resolveCondition(h.weather[0].id, h.weather[0].icon, toCelsius(h.temp, unit));
            return (
              <div
                key={h.dt}
                className={`relative flex min-w-[82px] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-colors ${
                  i === 0 ? 'bg-sky-400/10 ring-1 ring-sky-400/30' : 'hover:bg-white/5'
                }`}
              >
                {i === 0 && (
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse-glow" />
                )}
                <span className="text-xs font-medium text-slate-400">{i === 0 ? 'Now' : formatHour(h.dt, tz)}</span>
                <WeatherIcon condition={condition} size={26} />
                <span className="data-mono text-sm font-semibold text-mist-50">{formatTemp(h.temp)}</span>
                <span className="flex h-4 items-center gap-0.5 text-[11px] text-sky-300">
                  {h.pop > 0.1 && (<><Droplets size={11} /> {Math.round(h.pop * 100)}%</>)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Edge fades hint that the strip scrolls further */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-midnight-2/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-midnight-2/60 to-transparent" />
      </div>
    </Card>
  );
}
