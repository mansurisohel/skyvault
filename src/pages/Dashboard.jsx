import { motion } from 'framer-motion';
import { useWeatherContext } from '@/context/WeatherContext';
import CurrentWeatherCard from '@/components/dashboard/CurrentWeatherCard';
import HourlyForecast from '@/components/dashboard/HourlyForecast';
import WeeklyForecast from '@/components/dashboard/WeeklyForecast';
import InstrumentPanel from '@/components/dashboard/InstrumentPanel';
import WeatherAlerts from '@/components/dashboard/WeatherAlerts';
import WeatherCharts from '@/components/charts/WeatherCharts';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/common/Primitives';

export default function Dashboard() {
  const { snapshot, status, error, refresh } = useWeatherContext();

  if (status === 'loading' && !snapshot) return <DashboardSkeleton />;
  if (status === 'error' && !snapshot) {
    return <ErrorState message={error || 'Unable to load weather data.'} onRetry={refresh} />;
  }
  if (!snapshot) return <DashboardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {snapshot.isDemo && (
        <div className="glass-panel px-5 py-3 text-sm text-slate-300">
          Showing demo data — add your OpenWeather API key in <code className="data-mono text-sky-300">.env</code> for live conditions.
        </div>
      )}
      {snapshot.fallbackReason && (
        <div className="glass-panel px-5 py-3 text-sm text-amber-300">{snapshot.fallbackReason}</div>
      )}
      <WeatherAlerts />
      <CurrentWeatherCard />
      <HourlyForecast />
      <InstrumentPanel />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <WeeklyForecast />
        </div>
        <div className="xl:col-span-3">
          <WeatherCharts />
        </div>
      </div>
    </motion.div>
  );
}
