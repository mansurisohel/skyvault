import { AnimatePresence } from 'framer-motion';
import { useWeatherContext } from '@/context/WeatherContext';
import FavoriteCityCard from './FavoriteCityCard';
import { EmptyState } from '@/components/common/Primitives';
import SectionHeading from '@/components/common/SectionHeading';

export default function FavoritesSection() {
  const { favorites } = useWeatherContext();

  function goToOverview() {
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section id="favorites" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Quick access"
        title="Favorite cities"
        description="Star a location from the overview card to pin it here."
      />

      {favorites.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          message="Search for a city and tap the star to save it here."
          action={(
            <button
              type="button"
              onClick={goToOverview}
              className="mt-2 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/30"
            >
              Go to overview
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
    </section>
  );
}
