import { Wind, Gauge } from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import GaugeDial from '@/components/common/GaugeDial';
import { useWeatherContext } from '@/context/WeatherContext';
import { windDirection, unitSuffix } from '@/utils/format';
import { getBeaufortScale, mphToKmh } from '@/utils/wind';

const COMPASS_MARKS = ['N', 'E', 'S', 'W'];

function beaufortColor(force) {
  if (force <= 2) return { text: 'text-sky-300', bg: 'bg-sky-400/15' };
  if (force <= 5) return { text: 'text-amber-300', bg: 'bg-amber-400/15' };
  return { text: 'text-red-300', bg: 'bg-red-400/15' };
}

export default function WindCard() {
  const { snapshot, unit } = useWeatherContext();
  const { current } = snapshot;

  const windKmh = unit === 'metric' ? current.wind_speed : mphToKmh(current.wind_speed);
  const beaufort = getBeaufortScale(windKmh);
  const colors = beaufortColor(beaufort.force);

  return (
    <Card className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-base font-semibold text-mist-50">Wind</h2>
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          <Gauge size={12} /> Force {beaufort.force} &middot; {beaufort.label}
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tracking-wide text-slate-500">
          <span className="absolute -top-1">{COMPASS_MARKS[0]}</span>
          <span className="absolute -right-1">{COMPASS_MARKS[1]}</span>
          <span className="absolute -bottom-1">{COMPASS_MARKS[2]}</span>
          <span className="absolute -left-1">{COMPASS_MARKS[3]}</span>
        </div>
        <GaugeDial
          value={0}
          sublabel={windDirection(current.wind_deg)}
          color="#7fabff"
          needleDeg={current.wind_deg}
          size={110}
        />
      </div>

      <div className="flex w-full items-center justify-around border-t border-white/5 pt-3 text-center">
        <div>
          <p className="data-mono text-lg font-semibold text-mist-50">{Math.round(current.wind_speed)}</p>
          <p className="text-[11px] text-slate-400">{unitSuffix('wind', unit)} wind</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div>
          <p className="data-mono text-lg font-semibold text-mist-50">
            {current.wind_gust ? Math.round(current.wind_gust) : '—'}
          </p>
          <p className="text-[11px] text-slate-400">Gusts {current.wind_gust ? unitSuffix('wind', unit) : ''}</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div>
          <p className="data-mono text-lg font-semibold text-mist-50">{windDirection(current.wind_deg)}</p>
          <p className="text-[11px] text-slate-400">{current.wind_deg}°</p>
        </div>
      </div>

      <p className="flex items-start gap-2 border-t border-white/5 pt-3 text-xs leading-relaxed text-slate-400">
        <Wind size={13} className="mt-0.5 shrink-0 text-sky-300" />
        {beaufort.description}
      </p>
    </Card>
  );
}
