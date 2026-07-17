import { Card } from '@/components/common/Primitives';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition, CONDITION_LABELS } from '@/utils/weatherCondition';
import { formatDay, formatDate, formatTemp, unitSuffix, toCelsius } from '@/utils/format';
import { useWeatherContext } from '@/context/WeatherContext';
import { Droplets } from 'lucide-react';

export default function WeeklyForecast() {
  const { snapshot, unit } = useWeatherContext();
  const tz = snapshot.location.timezoneOffset;
  const weekMax = Math.max(...snapshot.daily.map((d) => d.temp.max));
  const weekMin = Math.min(...snapshot.daily.map((d) => d.temp.min));
  const range = weekMax - weekMin || 1;

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-mist-50">{snapshot.daily.length}-day forecast</h2>
        <span className="text-xs text-slate-500">°{unitSuffix('temp', unit)}</span>
      </div>
      <div className="flex flex-col divide-y divide-white/5">
        {snapshot.daily.map((d, i) => {
          const condition = resolveCondition(d.weather[0].id, d.weather[0].icon, toCelsius(d.temp.max, unit));
          const left = ((d.temp.min - weekMin) / range) * 100;
          const width = ((d.temp.max - d.temp.min) / range) * 100;
          return (
            <div
              key={d.dt}
              className="grid grid-cols-[70px_28px_1fr_auto_auto] items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/5 sm:grid-cols-[110px_28px_1fr_auto_auto]"
            >
              <div className="leading-tight">
                <p className="text-sm font-medium text-mist-100">{i === 0 ? 'Today' : formatDay(d.dt, tz, { short: true })}</p>
                <p className="hidden text-[11px] text-slate-500 sm:block">{formatDate(d.dt, tz)}</p>
              </div>
              <WeatherIcon condition={condition} size={22} className="shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="hidden truncate text-xs text-slate-400 md:block">{CONDITION_LABELS[condition]}</span>
                {d.pop > 0.1 && (
                  <span className="flex items-center gap-0.5 text-xs text-sky-300">
                    <Droplets size={12} /> {Math.round(d.pop * 100)}%
                  </span>
                )}
              </div>
              <span className="data-mono text-sm text-slate-400 w-8 text-right">{formatTemp(d.temp.min)}</span>
              <div className="relative h-1.5 w-16 rounded-full bg-white/10 sm:w-28">
                <div
                  className="absolute h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-amber-400 shadow-[0_0_8px_rgba(127,171,255,0.5)]"
                  style={{ left: `${left}%`, width: `${Math.max(width, 8)}%` }}
                />
              </div>
              <span className="data-mono text-sm font-semibold text-mist-50 w-8 text-right">{formatTemp(d.temp.max)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
