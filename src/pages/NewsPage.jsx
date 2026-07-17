import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import { useWeatherNews } from '@/hooks/useWeatherNews';
import NewsCard from '@/components/news/NewsCard';
import NewsSkeleton from '@/components/news/NewsSkeleton';
import { ErrorState, EmptyState } from '@/components/common/Primitives';

export default function NewsPage() {
  const { location } = useWeatherContext();
  const { articles, status, error, refresh } = useWeatherNews(location?.name);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-mist-50">Weather news</h1>
          <p className="mt-1 text-sm text-slate-400">Local coverage for {location?.name}, updated as you move around the map.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-slate-300 hover:text-mist-100 transition-colors"
        >
          <RefreshCw size={15} className={status === 'loading' ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {status === 'loading' && <NewsSkeleton />}
      {status === 'error' && <ErrorState message={error} onRetry={refresh} />}
      {status === 'success' && articles.length === 0 && (
        <EmptyState title="No stories right now" message="Check back soon, or refresh to try again." />
      )}
      {status === 'success' && articles.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => <NewsCard key={a.id} article={a} />)}
        </div>
      )}
    </motion.div>
  );
}
