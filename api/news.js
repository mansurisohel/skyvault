// Vercel serverless function — proxies GNews so the API key never ships in
// the client bundle. Reads GNEWS_API_KEY (no VITE_ prefix: this runs on the
// server, not in the browser, so it must be set as a plain env var in the
// Vercel project settings, not baked in at build time).
//
// Frontend calls: /api/news?city=London
// Local `npm run dev` (plain Vite, no serverless runtime) can't reach this
// route — LatestNews.jsx falls back to a direct client-side call using
// VITE_GNEWS_API_KEY for local development, then to static curated content
// if neither is available. See README.md for the full explanation.

// Vercel serverless function — proxies GNews so the API key never ships in
// the client bundle. Reads GNEWS_API_KEY (no VITE_ prefix: this runs on the
// server, not in the browser, so it must be set as a plain env var in the
// Vercel project settings, not baked in at build time).
//
// Frontend calls: /api/news?city=London
// Local `npm run dev` (plain Vite, no serverless runtime) can't reach this
// route — LatestNews.jsx falls back to a direct client-side call using
// VITE_GNEWS_API_KEY for local development, then to static curated content
// if neither is available. See README.md for the full explanation.
//
// IMPORTANT: the query is intentionally NOT city-specific. GNews's free tier
// is 100 requests/day for the whole key, shared across every visitor to a
// live deployment. Keying the cache per-city means every distinct city
// searched burns a fresh request — on real traffic that exhausts the daily
// quota within hours, after which every request (mobile or desktop) falls
// back to curated content until the quota resets. Using one generic query
// means every visitor, on every device, shares the same cached response —
// which is what makes this sustainable on a free key at all.

export default async function handler(req, res) {
  const key = process.env.GNEWS_API_KEY;

  if (!key) {
    res.status(200).json({
      articles: null,
      reason: 'GNEWS_API_KEY is not set in this deployment\u2019s environment variables.',
    });
    return;
  }

  const q = 'weather forecast alert';

  try {
    const upstream = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=6&apikey=${key}`
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
    // One shared cache entry for everyone, refreshed at most every 30 minutes,
    // serving stale content for up to 6 hours while it revalidates in the
    // background. This is what keeps a single free-tier key viable on a
    // live public deployment regardless of how much traffic it gets.
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=21600');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ articles: null, reason: 'Failed to reach GNews', detail: String(err) });
  }
}
