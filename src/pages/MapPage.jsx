import { motion } from 'framer-motion';
import SearchBar from '@/components/search/SearchBar';
import WeatherMapView from '@/components/map/WeatherMapView';

export default function MapPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-mist-50">Weather map</h1>
        <p className="mt-1 text-sm text-slate-400">Explore live conditions across regions with rain, cloud, temperature, and wind layers.</p>
      </div>
      <div className="max-w-xl">
        <SearchBar />
      </div>
      <WeatherMapView />
    </motion.div>
  );
}
