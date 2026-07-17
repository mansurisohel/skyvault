import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, RefreshCw } from 'lucide-react';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition, CONDITION_LABELS } from '@/utils/weatherCondition';
import {
  formatTemp, unitSuffix, locationLabel, toCelsius,
} from '@/utils/format';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';

function formatLocalDateTime(nowUnix, tzOffsetSeconds) {
  const date = new Date((nowUnix + tzOffsetSeconds) * 1000);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  return `${weekday}, ${monthDay} · ${time}`;
}

export default function CurrentWeatherCard() {
  const {
    snapshot, location, unit, toggleFavorite, isFavorite, refresh,
  } = useWeatherContext();
  const { current, daily } = snapshot;
  const today = daily?.[0];
  const weather = current.weather[0];
  const condition = resolveCondition(weather.id, weather.icon, toCelsius(current.temp, unit));
  const favorite = isFavorite(location);
  const nowUnix = useClock(30000);
  const localDateTime = formatLocalDateTime(nowUnix, snapshot.location.timezoneOffset);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel relative overflow-hidden p-6 md:p-10"
    >
      <div className="absolute right-5 top-5 flex items-center gap-1">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh weather data"
          title="Refresh weather data"
          className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-mist-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(location)}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="rounded-full p-2 text-slate-400 hover:bg-white/10 transition-colors"
        >
          <Star size={18} className={favorite ? 'fill-amber-400 text-amber-400' : ''} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-400">{locationLabel(location)}</p>
          <p className="data-mono mt-0.5 text-xs text-slate-500">{localDateTime}</p>
          <div className="mt-3 flex items-center justify-center gap-4 md:justify-start">
            <span className="font-display text-7xl font-semibold leading-none text-mist-50 md:text-8xl">
              {formatTemp(current.temp)}
              <span className="text-4xl font-medium text-slate-300 md:text-5xl">{unitSuffix('temp', unit)}</span>
            </span>
            <WeatherIcon condition={condition} size={72} />
          </div>
          <p className="mt-2 text-lg text-slate-300">{CONDITION_LABELS[condition]} &middot; {weather.description}</p>
          <p className="mt-1 text-sm text-slate-400">
            Feels like {formatTemp(current.feels_like)}{unitSuffix('temp', unit)}
            {today && (
              <> &middot; H:{formatTemp(today.temp.max)}{unitSuffix('temp', unit)} L:{formatTemp(today.temp.min)}{unitSuffix('temp', unit)}</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:w-auto">
          {[
            { label: 'Humidity', value: `${current.humidity}%` },
            { label: 'Wind', value: `${Math.round(current.wind_speed)} ${unitSuffix('wind', unit)}` },
            { label: 'Pressure', value: `${current.pressure} hPa` },
            { label: 'Visibility', value: `${(current.visibility / 1000).toFixed(1)} km` },
            { label: 'UV Index', value: current.uvi.toFixed(1) },
            { label: 'Cloud Cover', value: `${current.clouds}%` },
          ].map((s) => (
            <div key={s.label} className="glass flex flex-col justify-center rounded-2xl px-4 py-3 min-w-[110px] min-h-[68px]">
              <p className="data-mono text-lg font-semibold text-mist-50">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
