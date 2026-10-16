// GET /api/news — proxies GNews so the key stays on the server.
//
// The query is deliberately NOT city-specific: the free plan allows only 100
// requests/day for the whole key, shared by every visitor. One shared query
// lets the CDN serve nearly all visitors from cache; the client re-ranks
// results by location instead.
import { getGNewsKey } from './_lib/env.js';
import { sanitizeArticles } from './_lib/articles.js';
import {
  allowMethods, send, sendError, sendCaughtError, sendUpstreamFailure, upstreamRequest,
} from './_lib/http.js';

// GNews limits q to 200 characters.
export const NEWS_QUERY =
  '"severe weather" OR "weather forecast" OR "storm warning" OR "weather alert" OR "extreme heat" OR "winter storm" OR "flood warning"';

export default async function handler(req, res) {
  if (!allowMethods(req, res)) return;

  const key = getGNewsKey();
  if (!key) {
    return sendError(res, 503, 'NO_API_KEY', 'GNEWS_API_KEY is not set on the server, so live news is unavailable.');
  }

  // GNews expects an ISO 8601 timestamp; drop milliseconds for the strictest form.
  const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(NEWS_QUERY)}&lang=en&max=10&sortby=publishedAt&from=${encodeURIComponent(from)}&apikey=${encodeURIComponent(key)}`;

  try {
    const r = await upstreamRequest(url, { timeoutMs: 8000 });
    if (!r.ok) return sendUpstreamFailure(res, 'GNews', r.status);

    const articles = sanitizeArticles(r.data?.articles);
    if (!articles) return sendError(res, 502, 'BAD_RESPONSE', 'GNews returned data in an unexpected format.');

    return send(res, 200, { articles, fetchedAt: Date.now() }, {
      'Cache-Control': 's-maxage=1800, stale-while-revalidate=21600',
    });
  } catch (err) {
    return sendCaughtError(res, err);
  }
}
