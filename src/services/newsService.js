import { cachedGet, ApiError } from './apiClient';
import { GNEWS_DEV_KEY, GNEWS_BASE } from '@/constants';
import { buildLocalInsights } from './insightsService';

// Real, live news requires a real news API — there's no reliable, keyless,
// CORS-friendly provider to fall back to for genuine third-party
// journalism. If GNEWS_API_KEY isn't configured anywhere, or every attempt
// below fails, the app falls back to locally-generated insights (see
// insightsService.js) rather than showing nothing.
const NEWS_TTL_MS = 5 * 60 * 1000;

// Deliberately broad and NOT city-specific — see api/news.js for why: on a
// live deployment with real traffic, a free-tier key (100 req/day on
// GNews) gets exhausted almost immediately if every distinct searched city
// burns its own request. One shared query, cached, is what keeps a public
// deployment on a free key viable at all.
const GENERAL_WEATHER_QUERY = '"severe weather" OR "weather forecast" OR "storm warning" OR "weather alert" OR "extreme heat" OR "winter storm" OR "flood warning"';

function dedupe(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.title?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Since the underlying query is general (not scoped to one city), this
 * re-ranks the general result set so any article that happens to mention
 * the searched location's name or country surfaces first — a lightweight,
 * free way to feel location-aware without paying for a per-city API call.
 */
function rankByRelevance(articles, location) {
  const needles = [location.name, location.country].filter(Boolean).map((s) => s.toLowerCase());
  const score = (a) => {
    const text = `${a.title} ${a.description ?? ''}`.toLowerCase();
    return needles.some((n) => n.length > 2 && text.includes(n)) ? 1 : 0;
  };
  return [...articles].sort((a, b) => score(b) - score(a));
}

function normalizeGNewsArticles(data) {
  return (data?.articles || []).map((a, i) => ({
    id: `${a.url}-${i}`,
    title: a.title,
    description: a.description,
    source: a.source?.name || 'Unknown source',
    url: a.url,
    image: a.image,
    publishedAt: a.publishedAt,
  }));
}

// Same-origin call to our own Vercel serverless function — works after
// deploying to Vercel (or `vercel dev` locally), and has no CORS exposure
// since it's not a cross-origin request from the browser's point of view.
async function fetchFromProxy() {
  const res = await fetch('/api/news');
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // A plain `vite dev`/`vite preview` server has no /api routes, so this
    // request 404s and returns its HTML fallback page — treat that as "the
    // proxy isn't available here" rather than a data error.
    throw new ApiError('The news proxy is not available in this environment.', { code: 'PROXY_UNAVAILABLE' });
  }
  const data = await res.json();
  if (!res.ok || !data.articles) {
    throw new ApiError(data?.reason || 'News proxy returned no articles.', { status: res.status, code: 'NO_ARTICLES' });
  }
  return normalizeGNewsArticles(data);
}

// Local-development-only convenience: calling GNews directly from the
// browser with a VITE_-prefixed key. Only used when the serverless proxy
// above isn't reachable (i.e. running plain `vite dev`) — on a real
// deployment the proxy path is what's actually used.
async function fetchDirectFromGNews() {
  if (!GNEWS_DEV_KEY) {
    throw new ApiError('No GNews key available for a direct client-side call.', { code: 'NO_KEY' });
  }
  const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const data = await cachedGet(`${GNEWS_BASE}/search`, {
    params: {
      q: GENERAL_WEATHER_QUERY, lang: 'en', max: 10, sortby: 'publishedAt', from, apikey: GNEWS_DEV_KEY,
    },
    ttlMs: NEWS_TTL_MS,
  });
  return normalizeGNewsArticles(data);
}

/**
 * Fetches weather news. Tries the serverless proxy first (production),
 * falls back to a direct client-side GNews call for local dev, and finally
 * falls back to locally-generated insights if neither path produces
 * anything — genuinely accurate to the searched location, but clearly not
 * the same thing as live third-party news.
 */
export async function fetchWeatherNews(snapshot, location, unit = 'metric') {
  const insights = () => ({ kind: 'insights', items: buildLocalInsights(snapshot, location, unit) });

  for (const fetcher of [fetchFromProxy, fetchDirectFromGNews]) {
    try {
      const articles = dedupe(await fetcher());
      if (articles.length) return { kind: 'articles', items: rankByRelevance(articles, location) };
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      // try the next strategy, or fall through to insights
    }
  }

  return insights();
}
