import { useCallback, useEffect, useState } from 'react';
import { Star, MapPin, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherIcon from '@/components/common/WeatherIcon';
import { resolveCondition } from '@/utils/weatherCondition';
import { formatTemp, unitSuffix, locationLabel } from '@/utils/format';
import { cToF } from '@/utils/units';
import { fetchCurrentSummary } from '@/services/weatherService';
import { isAbortError } from '@/services/apiClient';
import { useWeatherContext } from '@/context/WeatherContext';
import { Skeleton } from '@/components/common/Primitives';

export default function FavoriteCityCard({ loc }) {
  const { selectLocation, toggleFavorite, unit } = useWeatherContext();
  // { status: 'loading' | 'ready' | 'error', data?, message? } — the base data is METRIC
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // One lightweight request (current conditions only). Changing °C/°F only
  // converts what's already loaded; it never triggers another request.
  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentSummary({ lat: loc.lat, lon: loc.lon, signal: controller.signal })
      .then((data) => setState({ status: 'ready', data }))
      .catch((err) => {
        if (isAbortError(err)) return;
        setState({ status: 'error', message: err.message || 'Could not load weather.' });
      });
    return () => controller.abort();
  }, [loc.lat, loc.lon, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  const data = state.status === 'ready' ? state.data : null;
  const temp = data ? (unit === 'imperial' ? cToF(data.temp) : data.temp) : null;
  const condition = data
    ? resolveCondition(data.weather[0].id, data.weather[0].icon, data.temp)
    : null;

  function goToOverview() {
    selectLocation(loc);
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="glass-panel flex h-full flex-col gap-4 p-5 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-mist-100">
          <MapPin size={15} className="shrink-0 text-sky-400" aria-hidden="true" />
          <span className="truncate">{locationLabel(loc)}</span>
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(loc)}
          aria-label={`Remove ${loc.name} from favorites`}
          className="focus-ring -m-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amber-400 transition-opacity hover:opacity-70"
        >
          <Star size={17} className="fill-amber-400" aria-hidden="true" />
        </button>
      </div>

      {state.status === 'loading' && <Skeleton className="h-12 w-24" />}

      {state.status === 'error' && (
        <div role="status" className="flex flex-col items-start gap-2 text-sm text-amber-200">
          <span>{state.message}</span>
          <button type="button" onClick={retry} className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20">
            <RefreshCw size={12} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      {data && (
        <div className="flex items-center justify-between">
          <span className="font-display text-4xl font-semibold text-mist-50">
            {formatTemp(temp)}{unitSuffix('temp', unit)}
          </span>
          <WeatherIcon condition={condition} size={40} />
        </div>
      )}
      {data?.isDemo && <p className="-mt-2 text-[11px] text-amber-300">Sample data</p>}

      <button
        type="button"
        onClick={goToOverview}
        className="focus-ring mt-auto min-h-10 rounded-full bg-sky-500/15 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/25 active:scale-[0.98]"
      >
        View overview
      </button>
    </motion.div>
  );
}
