import { Sunrise, Sunset, Clock } from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';
import { formatTime, formatDuration } from '@/utils/format';

const W = 320;
const H = 168;
const CX = W / 2;
const BASELINE = 142;
const R = 118;

function arcPoint(t) {
  const angle = Math.PI - t * Math.PI; // PI (left/sunrise) -> 0 (right/sunset)
  return {
    x: CX + R * Math.cos(angle),
    y: BASELINE - R * Math.sin(angle),
  };
}

export default function SunriseSunsetCard() {
  const { snapshot } = useWeatherContext();
  const { current } = snapshot;
  const tz = snapshot.location.timezoneOffset;

  const sunrise = current.sunrise;
  const sunset = current.sunset;
  const nowUtc = useClock(30000);
  const dayLength = sunset - sunrise;
  const solarNoon = sunrise + dayLength / 2;
  const daylightPct = Math.round((dayLength / 86400) * 100);
  const isDaytime = nowUtc >= sunrise && nowUtc <= sunset;
  const progress = isDaytime ? Math.min(1, Math.max(0, (nowUtc - sunrise) / dayLength)) : (nowUtc > sunset ? 1 : 0);

  const sunPos = arcPoint(progress);
  const noonPos = arcPoint(0.5);
  const golden = 0.055; // ~ last/first ~6% of daylight approximates golden hour band
  const goldenStart = arcPoint(1 - golden);
  const goldenEnd = arcPoint(golden);

  const secondsToSunset = sunset - nowUtc;
  const secondsToSunrise = sunrise - nowUtc + (nowUtc > sunset ? 86400 : 0);

  const path = `M ${arcPoint(0).x} ${arcPoint(0).y} A ${R} ${R} 0 0 1 ${arcPoint(1).x} ${arcPoint(1).y}`;
  const progressPath = `M ${arcPoint(0).x} ${arcPoint(0).y} A ${R} ${R} 0 0 1 ${sunPos.x} ${sunPos.y}`;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-mist-50">Sunrise &amp; sunset</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={13} /> Day length {formatDuration(dayLength)}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-sm">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id="arcTrack" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f7b955" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#a9c9ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#9a8cf5" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="arcProgress" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f7b955" />
              <stop offset="100%" stopColor="#f5a623" />
            </linearGradient>
          </defs>

          <path d={path} fill="none" stroke="url(#arcTrack)" strokeWidth="3" strokeLinecap="round" />
          {isDaytime && (
            <path d={progressPath} fill="none" stroke="url(#arcProgress)" strokeWidth="3.5" strokeLinecap="round" />
          )}

          <circle cx={goldenStart.x} cy={goldenStart.y} r="3" fill="#f7b955" opacity="0.7" />
          <circle cx={goldenEnd.x} cy={goldenEnd.y} r="3" fill="#f7b955" opacity="0.7" />
          <circle cx={noonPos.x} cy={noonPos.y} r="2.5" fill="#e9f1ff" opacity="0.5" />

          <line x1="6" y1={BASELINE} x2={W - 6} y2={BASELINE} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" />

          {isDaytime ? (
            <g style={{ transition: 'transform 0.6s ease' }}>
              <circle cx={sunPos.x} cy={sunPos.y} r="12" fill="#f7b955" opacity="0.25" />
              <circle cx={sunPos.x} cy={sunPos.y} r="7" fill="#f7b955" />
            </g>
          ) : null}

          <g>
            <circle cx={arcPoint(0).x} cy={arcPoint(0).y} r="4" fill="#a9c9ff" />
            <circle cx={arcPoint(1).x} cy={arcPoint(1).y} r="4" fill="#9a8cf5" />
          </g>
        </svg>

        <div className="mt-1 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15 text-amber-400">
              <Sunrise size={16} />
            </span>
            <div>
              <p className="data-mono text-sm font-semibold text-mist-50">{formatTime(sunrise, tz)}</p>
              <p className="text-[11px] text-slate-400">Sunrise</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="data-mono text-sm font-semibold text-mist-50">{formatTime(sunset, tz)}</p>
              <p className="text-[11px] text-slate-400">Sunset</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
              <Sunset size={16} />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 sm:grid-cols-4">
        <div className="text-center">
          <p className="data-mono text-sm font-semibold text-mist-50">
            {isDaytime
              ? formatDuration(Math.max(secondsToSunset, 0))
              : formatDuration(Math.max(secondsToSunrise, 0))}
          </p>
          <p className="text-[11px] text-slate-400">{isDaytime ? 'Until sunset' : 'Until sunrise'}</p>
        </div>
        <div className="text-center">
          <p className="data-mono text-sm font-semibold text-mist-50">{formatTime(solarNoon, tz)}</p>
          <p className="text-[11px] text-slate-400">Solar noon</p>
        </div>
        <div className="text-center">
          <p className="data-mono text-sm font-semibold text-mist-50">{daylightPct}%</p>
          <p className="text-[11px] text-slate-400">Of the day is light</p>
        </div>
        <div className="text-center">
          <p className="data-mono text-sm font-semibold text-amber-300">~{Math.round(dayLength * golden / 60)}m</p>
          <p className="text-[11px] text-slate-400">Golden hour</p>
        </div>
      </div>
    </Card>
  );
}
