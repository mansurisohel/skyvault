import { RefreshCw, Sparkles, Clock } from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import { useWeatherNews } from '@/hooks/useWeatherNews';
import { useClock } from '@/hooks/useClock';
import { relativeTime } from '@/utils/format';
import NewsCard from './NewsCard';
import InsightCard from './InsightCard';
import NewsSkeleton from './NewsSkeleton';
import { ErrorState, EmptyState } from '@/components/common/Primitives';
import SectionHeading from '@/components/common/SectionHeading';

export default function NewsSection() {
  const { snapshot, location, unit } = useWeatherContext();
  const { kind, items, status, error, updatedAt, refresh } = useWeatherNews(snapshot, location, unit);
  useClock(15000); // re-render periodically so the "updated Xs ago" label stays live

  return (
    <section id="news" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Stay informed"
        title="Weather news"
        description={
          kind === 'insights'
            ? `Generated from ${location?.name}'s live conditions — not third-party articles.`
            : `Live coverage for ${location?.name}.`
        }
        action={(
          <div className="flex items-center gap-3">
            {updatedAt && status !== 'loading' && (
              <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                <Clock size={12} /> Updated {relativeTime(updatedAt)}
              </span>
            )}
            <button
              type="button"
              onClick={() => refresh()}
              disabled={status === 'loading'}
              className="flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-slate-300 hover:text-mist-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={status === 'loading' ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        )}
      />

      {kind === 'insights' && status !== 'loading' && items.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-violet-500/10 px-4 py-2.5 text-xs text-violet-200">
          <Sparkles size={14} className="shrink-0" />
          These are generated directly from the current forecast, not sourced news articles. Add a GNews or NewsData.io API key in <code className="data-mono">.env</code> for live third-party coverage.
        </div>
      )}

      {status === 'loading' && <NewsSkeleton />}
      {status === 'error' && <ErrorState message={error} onRetry={refresh} />}
      {status === 'success' && items.length === 0 && (
        <EmptyState title="No stories right now" message="Check back soon, or refresh to try again." />
      )}
      {status === 'success' && items.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kind === 'articles'
            ? items.map((a) => <NewsCard key={a.id} article={a} />)
            : items.map((i) => <InsightCard key={i.id} insight={i} />)}
        </div>
      )}
    </section>
  );
}
