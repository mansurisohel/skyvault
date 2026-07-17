import { useEffect, useState } from 'react';
import { Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition } from '@/utils/weatherCondition';
import { formatTemp, unitSuffix, locationLabel, toCelsius } from '@/utils/format';
import { fetchWeatherSnapshot } from '@/services/weatherService';
import { useWeatherContext } from '@/context/WeatherContext';
import { Skeleton } from '@/components/common/Primitives';

export default function FavoriteCityCard({ loc }) {
  const { selectLocation, toggleFavorite, unit } = useWeatherContext();
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setSnap(null);
    fetchWeatherSnapshot({ lat: loc.lat, lon: loc.lon, name: loc.name, units: unit })
      .then((d) => !cancelled && setSnap(d))
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.lat, loc.lon, unit]);

  const condition = snap ? resolveCondition(snap.current.weather[0].id, snap.current.weather[0].icon, toCelsius(snap.current.temp, unit)) : null;

  function goToOverview() {
    selectLocation(loc);
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel flex h-full flex-col gap-4 p-5 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-mist-100">
          <MapPin size={15} className="shrink-0 text-sky-400" />
          <span className="truncate">{locationLabel(loc)}</span>
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(loc)}
          aria-label="Remove from favorites"
          className="shrink-0 text-amber-400 hover:opacity-70"
        >
          <Star size={17} className="fill-amber-400" />
        </button>
      </div>

      {snap ? (
        <div className="flex items-center justify-between">
          <span className="font-display text-4xl font-semibold text-mist-50">
            {formatTemp(snap.current.temp)}{unitSuffix('temp', unit)}
          </span>
          <WeatherIcon condition={condition} size={40} />
        </div>
      ) : (
        <Skeleton className="h-12 w-24" />
      )}

      <button
        type="button"
        onClick={goToOverview}
        className="mt-auto rounded-full bg-sky-500/15 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/25 transition-colors"
      >
        View overview
      </button>
    </motion.div>
  );
}
