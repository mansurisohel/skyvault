import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, RefreshCw, FlaskConical } from 'lucide-react';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition, CONDITION_LABELS } from '@/utils/weatherCondition';
import {
  formatTemp, unitSuffix, locationLabel, toCelsius, relativeTime,
} from '@/utils/format';
import { formatPrecip, formatVisibility } from '@/utils/units';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';

function formatLocalDateTime(nowUnix, tzOffsetSeconds) {
  const date = new Date((nowUnix + tzOffsetSeconds) * 1000);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  return `${weekday}, ${monthDay} · ${time}`;
}

const pct = (v) => (typeof v === 'number' ? `${Math.round(v)}%` : '--');

export default function CurrentWeatherCard() {
  const {
    snapshot, location, unit, toggleFavorite, isFavorite, refresh, refreshing,
  } = useWeatherContext();
  const { current, daily, hourly } = snapshot;
  const today = daily?.[0];
  const weather = current.weather[0];
  const condition = resolveCondition(weather.id, weather.icon, toCelsius(current.temp, unit));
  const favorite = isFavorite(location);
  const nowUnix = useClock(30000);
  const localDateTime = formatLocalDateTime(nowUnix, snapshot.location.timezoneOffset);
  const [manual, setManual] = useState(false);
  const spinning = refreshing || manual;

  async function handleRefresh() {
    if (spinning) return;
    setManual(true);
    try {
      await refresh();
    } finally {
      setManual(false);
    }
  }

  const rainChance = hourly?.[0] ? Math.round(hourly[0].pop * 100) : null;
  const updated = snapshot.isDemo ? '' : relativeTime(new Date(snapshot.fetchedAt).toISOString());

  const stats = [
    { label: 'Humidity', value: pct(current.humidity) },
    { label: 'Wind', value: `${Math.round(current.wind_speed)} ${unitSuffix('wind', unit)}` },
    { label: 'Pressure', value: typeof current.pressure === 'number' ? `${current.pressure} hPa` : '--' },
    { label: 'Visibility', value: formatVisibility(current.visibility, unit) },
    { label: current.uviEstimated ? 'UV Index (est.)' : 'UV Index', value: current.uvi.toFixed(1) },
    { label: 'Cloud Cover', value: pct(current.clouds) },
    { label: 'Rain chance', value: rainChance === null ? '--' : `${rainChance}%`, hint: 'Probability of precipitation in the next forecast period' },
    { label: 'Rain (last hour)', value: formatPrecip(current.rainVolume, unit) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden p-5 sm:p-6 md:p-10"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {snapshot.isDemo ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <FlaskConical size={12} aria-hidden="true" /> Sample data
            </span>
          ) : (
            updated && <span className="text-xs text-slate-500">Updated {updated}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={spinning}
            aria-label="Refresh weather data"
            title="Refresh weather data"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-mist-100 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={spinning ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(location)}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 active:scale-95"
          >
            <Star size={18} className={favorite ? 'fill-amber-400 text-amber-400' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="min-w-0">
          <h2 className="break-words text-sm font-medium uppercase tracking-wide text-slate-300">{locationLabel(location)}</h2>
          <p className="data-mono mt-0.5 text-xs text-slate-400">{localDateTime}</p>
          <div className="mt-3 flex items-center justify-center gap-4 md:justify-start">
            <span className="font-display text-7xl font-semibold leading-none text-mist-50 md:text-8xl">
              {formatTemp(current.temp)}
              <span className="text-4xl font-medium text-slate-300 md:text-5xl">{unitSuffix('temp', unit)}</span>
            </span>
            <WeatherIcon condition={condition} size={72} />
          </div>
          <p className="mt-2 text-lg capitalize text-slate-300">{CONDITION_LABELS[condition]} &middot; {weather.description}</p>
          <p className="mt-1 text-sm text-slate-400">
            Feels like {formatTemp(current.feels_like)}{unitSuffix('temp', unit)}
            {today && (
              <> &middot; H:{formatTemp(today.temp.max)}{unitSuffix('temp', unit)} L:{formatTemp(today.temp.min)}{unitSuffix('temp', unit)}</>
            )}
          </p>
        </div>

        <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} title={s.hint} className="glass flex min-h-[68px] min-w-0 flex-col justify-center rounded-2xl px-4 py-3 text-left md:min-w-[120px]">
              <dd className="data-mono order-1 text-lg font-semibold text-mist-50">{s.value}</dd>
              <dt className="order-2 text-xs text-slate-400">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  );
}
