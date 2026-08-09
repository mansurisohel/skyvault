// Vercel serverless function — proxies GNews so the API key never ships in
// the client bundle and the request is same-origin (no browser CORS
// involved at all, since the browser only ever talks to our own domain;
// this server-to-server call to GNews has no CORS restrictions to begin
// with). Reads GNEWS_API_KEY as a plain server-side env var — set it in
// the hosting platform's project settings, NOT with a VITE_ prefix, or it
// would get bundled into the client's public JS instead of staying secret.
//
// Frontend calls: /api/news
// Local `npm run dev` (plain Vite, no serverless runtime) can't reach this
// route — newsService.js falls back to generated insights in that case.
// See README.md for the full explanation, and for deploying this on a
// platform other than Vercel.
//
// IMPORTANT: the query is intentionally NOT city-specific. GNews's free
// tier is 100 requests/day for the whole key, shared across every visitor
// to a live deployment. Keying the query per searched city means every
// distinct city burns a fresh request — on real traffic that exhausts the
// daily quota within hours, after which every visitor falls back to
// generated insights until the quota resets. One shared, general query
// means every visitor shares the same cached response, which is what
// makes a free-tier key sustainable on a real deployment at all.
export default async function handler(req, res) {
  const key = process.env.GNEWS_API_KEY;

  if (!key) {
    res.status(200).json({
      articles: null,
      reason: 'GNEWS_API_KEY is not set in this deployment\u2019s environment variables.',
    });
    return;
  }

  // Quoted phrases joined with OR (GNews's documented query syntax) keep
  // this to genuinely weather-focused coverage, rather than bare keywords
  // that could match any article mentioning those words in passing.
  const q = '"severe weather" OR "weather forecast" OR "storm warning" OR "weather alert" OR "extreme heat" OR "winter storm" OR "flood warning"';

  // Only the last 3 days, sorted newest-first — GNews's archive goes back
  // years, and without both of these a "relevant" but months-old match
  // could easily outrank something published an hour ago.
  const from = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const upstream = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&from=${from}&apikey=${key}`,
    );

    if (!upstream.ok) {
      let detail = '';
      try { detail = await upstream.text(); } catch { /* ignore */ }
      const quotaLikely = upstream.status === 403 || upstream.status === 429;
      res.status(upstream.status).json({
        articles: null,
        reason: quotaLikely
          ? `GNews responded ${upstream.status} — this usually means the free-tier daily quota (100 req/day) has been used up.`
          : `GNews responded ${upstream.status}`,
        detail,
      });
      return;
    }

    const data = await upstream.json();
    // One shared cache entry for everyone, refreshed at most every 30
    // minutes, serving stale content for up to 6 hours while it
    // revalidates in the background — this is what keeps a single
    // free-tier key viable regardless of how much traffic the deployment
    // gets, since most requests are served from Vercel's edge cache
    // instead of hitting GNews (or this function) at all.
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=21600');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ articles: null, reason: 'Failed to reach GNews', detail: String(err) });
  }
}
