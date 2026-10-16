import { RefreshCw, Sparkles, Clock, Info } from 'lucide-react';
import { useWeatherContext } from '@/context/WeatherContext';
import { useWeatherNews } from '@/hooks/useWeatherNews';
import { useClock } from '@/hooks/useClock';
import { relativeTime } from '@/utils/format';
import NewsCard from './NewsCard';
import InsightCard from './InsightCard';
import NewsSkeleton from './NewsSkeleton';
import SectionHeading from '@/components/common/SectionHeading';

export default function NewsSection() {
  const { snapshot, isStale, location, unit } = useWeatherContext();
  // Never build insights from a snapshot that still belongs to the previous city.
  const liveSnapshot = isStale ? null : snapshot;
  const { status, articles, insights, error, updatedAt, refresh } = useWeatherNews(liveSnapshot, location, unit);
  useClock(30000); // keeps the "Updated Xm ago" label live

  const loading = status === 'loading';
  const hasArticles = articles.length > 0;
  const updatedLabel = updatedAt ? relativeTime(new Date(updatedAt).toISOString()) : '';

  return (
    <section id="news" className="scroll-mt-24" aria-labelledby="news-heading">
      <SectionHeading
        eyebrow="Stay informed"
        title={<span id="news-heading">Weather news</span>}
        description={
          hasArticles
            ? 'Recent weather headlines from third-party publishers, ranked by relevance to your selected city.'
            : 'Live headlines are not available right now. Showing insights generated from current conditions instead.'
        }
        action={(
          <div className="flex items-center gap-3">
            {updatedLabel && !loading && hasArticles && (
              <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                <Clock size={12} aria-hidden="true" /> Updated {updatedLabel}
              </span>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="focus-ring flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-mist-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
            </button>
          </div>
        )}
      />

      <div aria-live="polite" aria-busy={loading}>
        {loading && <NewsSkeleton />}

        {!loading && hasArticles && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
        )}

        {!loading && !hasArticles && (
          <>
            <div role="status" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <Info size={16} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                {error ? error.message : 'No recent weather headlines were found. Check back soon.'}
              </span>
              <button
                type="button"
                onClick={refresh}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1.5 text-xs font-medium hover:bg-amber-400/30"
              >
                <RefreshCw size={13} aria-hidden="true" /> Try again
              </button>
            </div>

            {insights.length > 0 && (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-2xl bg-violet-500/10 px-4 py-2.5 text-xs text-violet-200">
                  <Sparkles size={14} className="shrink-0" aria-hidden="true" />
                  Generated from the current forecast. These are not news articles from publishers.
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {insights.map((i) => <InsightCard key={i.id} insight={i} sample={Boolean(liveSnapshot?.isDemo)} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
