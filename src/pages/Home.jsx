import { motion } from 'framer-motion';
import { useWeatherContext } from '@/context/WeatherContext';
import SearchBar from '@/components/search/SearchBar';
import CurrentWeatherCard from '@/components/dashboard/CurrentWeatherCard';
import HourlyForecast from '@/components/dashboard/HourlyForecast';
import WeeklyForecast from '@/components/dashboard/WeeklyForecast';
import WeatherAlerts from '@/components/dashboard/WeatherAlerts';
import WeatherCharts from '@/components/charts/WeatherCharts';
import HealthIndexCard from '@/components/dashboard/HealthIndexCard';
import MoonPhaseCard from '@/components/dashboard/MoonPhaseCard';
import SunriseSunsetCard from '@/components/dashboard/SunriseSunsetCard';
import WindCard from '@/components/dashboard/WindCard';
import ActivityRecommendationsCard from '@/components/dashboard/ActivityRecommendationsCard';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import FavoritesSection from '@/components/dashboard/FavoritesSection';
import PreferencesSection from '@/components/dashboard/PreferencesSection';
import WeatherMapView from '@/components/map/WeatherMapView';
import NewsSection from '@/components/news/NewsSection';
import SectionHeading from '@/components/common/SectionHeading';
import { ErrorState } from '@/components/common/Primitives';

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  };
}

export default function Home() {
  const { snapshot, status, error, refresh } = useWeatherContext();
  const ready = Boolean(snapshot);

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {/* Overview: hero search + current conditions */}
      <section id="overview" className="scroll-mt-24">
        <motion.div {...fadeIn()} className="relative mx-auto mb-8 max-w-2xl text-center">
          <div className="absolute -inset-x-4 -inset-y-3 -z-10 rounded-3xl bg-abyss/35 backdrop-blur-[2px] sm:-inset-x-8" aria-hidden="true" />
          <p className="section-eyebrow mb-2">SkyVault Weather Data</p>
          <h1 className="font-display text-3xl font-semibold text-mist-50 sm:text-4xl">
            Precise, beautiful weather for wherever you are
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Search any city to see live conditions, forecasts, air quality, and more.
          </p>
          <div className="mt-6">
            <SearchBar variant="hero" />
          </div>
        </motion.div>

        {!ready && status === 'loading' && <DashboardSkeleton />}
        {!ready && status === 'error' && (
          <ErrorState message={error || 'Unable to load weather data.'} onRetry={refresh} />
        )}

        {ready && (
          <motion.div {...fadeIn(0.1)} className="flex flex-col gap-6">
            {snapshot.fallbackReason ? (
              <div className="glass-panel px-5 py-3 text-sm text-amber-300">{snapshot.fallbackReason}</div>
            ) : snapshot.isDemo ? (
              <div className="glass-panel px-5 py-3 text-sm text-slate-300">
                Showing demo data — add your OpenWeather API key in <code className="data-mono text-sky-300">.env</code> for live conditions.
              </div>
            ) : null}
            <WeatherAlerts />
            <CurrentWeatherCard />
            <HourlyForecast />
          </motion.div>
        )}
      </section>

      {/* Forecast: multi-day outlook + statistics */}
      {ready && (
        <section id="forecast" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Plan ahead"
            title="Forecast & trends"
            description="Several days out, plus temperature, rain, wind, and pressure trends."
          />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <WeeklyForecast />
            </div>
            <div className="lg:col-span-3">
              <WeatherCharts />
            </div>
          </div>
        </section>
      )}

      {/* Health & Moon: health index, moon activities, sunrise/sunset, wind */}
      {ready && (
        <section id="health" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Beyond the forecast"
            title="Health, moon & activities"
            description="UV, air quality, hydration guidance, moon-phase ideas, and outdoor activities matched to right now."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <HealthIndexCard />
            <MoonPhaseCard />
            <SunriseSunsetCard />
            <WindCard />
            <ActivityRecommendationsCard />
          </div>
        </section>
      )}

      {/* Live weather map */}
      <section id="map" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Explore"
          title="Live map"
          description="Precipitation, cloud cover, wind, temperature, and pressure layers in one interactive view."
        />
        <WeatherMapView />
      </section>

      {/* Weather news */}
      <NewsSection />

      {/* Favorites */}
      <FavoritesSection />

      {/* Preferences */}
      <PreferencesSection />
    </div>
  );
}
