import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWeatherContext } from '@/context/WeatherContext';
import FavoriteCityCard from '@/components/dashboard/FavoriteCityCard';
import { EmptyState } from '@/components/common/Primitives';

export default function FavoritesPage() {
  const { favorites } = useWeatherContext();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-mist-50">Favorite cities</h1>
        <p className="mt-1 text-sm text-slate-400">Star a location from the dashboard to pin it here for quick access.</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          message="Search for a city and tap the star to save it here."
          action={(
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-2 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/30"
            >
              Go to dashboard
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {favorites.map((loc) => (
              <FavoriteCityCard key={`${loc.lat}-${loc.lon}`} loc={loc} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
