import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, FlaskConical, TriangleAlert } from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import SearchBar from '@/components/search/SearchBar';
import CurrentWeatherCard from '@/components/dashboard/CurrentWeatherCard';
import HourlyForecast from '@/components/dashboard/HourlyForecast';
import WeeklyForecast from '@/components/dashboard/WeeklyForecast';
import WeatherAlerts from '@/components/dashboard/WeatherAlerts';
import HealthIndexCard from '@/components/dashboard/HealthIndexCard';
import MoonPhaseCard from '@/components/dashboard/MoonPhaseCard';
import SunriseSunsetCard from '@/components/dashboard/SunriseSunsetCard';
import WindCard from '@/components/dashboard/WindCard';
import ActivityRecommendationsCard from '@/components/dashboard/ActivityRecommendationsCard';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import FavoritesSection from '@/components/dashboard/FavoritesSection';
import NewsSection from '@/components/news/NewsSection';
import SectionHeading from '@/components/common/SectionHeading';
import { ErrorState } from '@/components/common/Primitives';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LazyOnVisible from '@/components/common/LazyOnVisible';
import { MapSkeleton, ChartSkeleton } from '@/components/common/SectionSkeletons';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { relativeTime } from '@/utils/format';

// Heavy, below-the-fold code is split out: recharts (~390 KB) and Leaflet only
// download when their sections are needed.
const WeatherCharts = lazy(() => import('@/components/charts/WeatherCharts'));
const WeatherMapView = lazy(() => import('@/components/map/WeatherMapView'));

function Banner({ icon: Icon, tone = 'amber', children }) {
  const tones = { amber: 'text-amber-200', slate: 'text-slate-200' };
  return (
    <div role="status" className={`glass-panel flex items-start gap-3 px-5 py-3 text-sm ${tones[tone]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  };
}

export default function Home() {
  const {
    snapshot, isStale, status, error, retry, isOffline, refreshError, errorCode,
  } = useWeatherContext();
  const services = useServiceStatus();
  // `snapshot` can still belong to the previous city while the new one loads or
  // fails. Never show it under a different place name.
  const ready = Boolean(snapshot) && !isStale;
  const showSkeleton = !ready && status !== 'error';

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      {/* Overview: hero search + current conditions */}
      <section id="overview" className="scroll-mt-24">
        <motion.div {...fadeIn()} className="relative mx-auto mb-8 max-w-2xl text-center">
          <div className="absolute -inset-x-4 -inset-y-3 -z-10 rounded-3xl  sm:-inset-x-8" aria-hidden="true" />
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

        {isOffline && (
          <div className="mb-6">
            <Banner icon={WifiOff}>
              You are offline.{' '}
              {ready && !snapshot.isDemo
                ? `Showing the last data we loaded (${relativeTime(new Date(snapshot.fetchedAt).toISOString()) || 'earlier'}). It will refresh when you reconnect.`
                : 'Weather will load when you reconnect.'}
            </Banner>
          </div>
        )}

        {showSkeleton && <DashboardSkeleton />}
        {!ready && status === 'error' && (
          <ErrorState
            message={error || 'Unable to load weather data.'}
            onRetry={errorCode === 'OFFLINE' ? undefined : retry}
          />
        )}

        {ready && (
          <motion.div key={`${snapshot.location.lat}-${snapshot.location.lon}`} {...fadeIn(0.1)} className="flex flex-col gap-6">
            {snapshot.isDemo && (
              <Banner icon={FlaskConical}>
                <p className="font-medium text-amber-200">You are viewing sample data, not live weather.</p>
                <p className="mt-0.5 text-slate-300">
                  {snapshot.fallbackReason
                    ?? (services.openweather === 'unavailable'
                      ? 'The API routes are not reachable in this environment. Run "npm run dev" or deploy to Vercel.'
                      : 'No OpenWeather API key is configured on the server. Set OPENWEATHER_API_KEY (see .env.example) to see live conditions.')}
                </p>
              </Banner>
            )}
            {refreshError && !snapshot.isDemo && (
              <Banner icon={TriangleAlert}>
                Could not refresh just now ({refreshError}) Showing the last data we loaded.
              </Banner>
            )}
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
              <ErrorBoundary message="The charts could not be loaded. Check your connection and try again.">
                <Suspense fallback={<ChartSkeleton />}>
                  <WeatherCharts />
                </Suspense>
              </ErrorBoundary>
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
        <ErrorBoundary message="The map could not be loaded. Check your connection and try again.">
          <LazyOnVisible fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <WeatherMapView />
            </Suspense>
          </LazyOnVisible>
        </ErrorBoundary>
      </section>

      {/* Weather news */}
      <NewsSection />

      {/* Favorites */}
      <FavoritesSection />

    </div>
  );
}
