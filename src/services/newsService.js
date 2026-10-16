import { apiGet, ApiError } from './apiClient';
import { setServiceStatus } from './serviceStatus';
import { safeHttpUrl, safeImageUrl } from '@/utils/safeUrl';

// News comes from SkyVault's own /api/news route, which holds the GNews key
// server-side. Articles are re-validated here (defense in depth) because the
// content ultimately originates from third-party publishers.

const NEWS_TTL_MS = 10 * 60 * 1000;

const text = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Validates, de-duplicates (by URL and by title) and caps raw articles. Exported for tests. */
export function normalizeArticles(raw) {
  if (!Array.isArray(raw)) throw new ApiError('The news service returned unexpected data.', { code: 'BAD_RESPONSE' });

  const seenUrls = new Set();
  const seenTitles = new Set();
  const out = [];

  for (const a of raw) {
    if (!a || typeof a !== 'object') continue;
    const title = text(a.title, 300);
    const url = safeHttpUrl(a.url);
    const published = new Date(a.publishedAt);
    if (!title || !url || Number.isNaN(published.getTime())) continue;

    const urlKey = url.replace(/[?#].*$/, '').toLowerCase();
    const titleKey = title.toLowerCase();
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;
    seenUrls.add(urlKey);
    seenTitles.add(titleKey);

    out.push({
      id: urlKey,
      title,
      description: text(a.description, 500),
      source: text(a.source?.name, 80) || 'Unknown source',
      url,
      image: safeImageUrl(a.image),
      publishedAt: published.toISOString(),
    });
  }
  return out;
}

/**
 * The query is general (not city-specific) so one cached request serves every
 * visitor and the free GNews quota (100/day) is never burned per city. This
 * re-ranks results so articles mentioning the selected place come first.
 */
export function rankByRelevance(articles, location) {
  const needles = [location?.name, location?.country].filter(Boolean).map((s) => s.toLowerCase()).filter((n) => n.length > 2);
  if (!needles.length) return articles;
  const score = (a) => {
    const hay = `${a.title} ${a.description}`.toLowerCase();
    return needles.some((n) => hay.includes(n)) ? 1 : 0;
  };
  return articles.map((a, i) => ({ a, i, s: score(a) })).sort((x, y) => y.s - x.s || x.i - y.i).map((x) => x.a);
}

/** Fetches validated articles. Throws ApiError (with a code) on any failure. */
export async function fetchNewsArticles({ signal } = {}) {
  try {
    const data = await apiGet('/api/news', { ttlMs: NEWS_TTL_MS, signal, retries: 1 });
    const articles = normalizeArticles(data?.articles);
    setServiceStatus('news', 'ok');
    return { articles, fetchedAt: typeof data?.fetchedAt === 'number' ? data.fetchedAt : Date.now() };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'NO_API_KEY') setServiceStatus('news', 'missing');
      if (err.code === 'PROXY_UNAVAILABLE') setServiceStatus('news', 'unavailable');
    }
    throw err;
  }
}

/** Short, user-facing explanation of why live news is not being shown. */
export function describeNewsFailure(err) {
  const code = err?.code;
  switch (code) {
    case 'NO_API_KEY':
      return { code, message: 'Live news is not configured. Add GNEWS_API_KEY on the server to enable it.' };
    case 'PROXY_UNAVAILABLE':
      return { code, message: 'The news API is not reachable in this environment (use "npm run dev" or deploy to Vercel).' };
    case 'KEY_REJECTED':
      return { code, message: 'The news provider rejected the API key. Check GNEWS_API_KEY.' };
    case 'QUOTA':
      return { code, message: 'The daily news quota has been reached. It resets automatically.' };
    case 'RATE_LIMIT':
      return { code, message: 'The news provider is rate limiting requests. Try again in a moment.' };
    case 'OFFLINE':
      return { code, message: "You're offline, so live news can't be loaded." };
    default:
      return { code: code ?? 'UNKNOWN', message: err?.message || 'Live news could not be loaded.' };
  }
}
