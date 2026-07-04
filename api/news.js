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

export default async function handler(req, res) {
  const key = process.env.GNEWS_API_KEY;

  if (!key) {
    res.status(200).json({
      articles: null,
      reason: 'GNEWS_API_KEY is not set in this deployment\u2019s environment variables.',
    });
    return;
  }

  const city = typeof req.query.city === 'string' ? req.query.city : '';
  const q = city ? `weather ${city}` : 'weather alert forecast';

  try {
    const upstream = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=6&apikey=${key}`
    );

    if (!upstream.ok) {
      let detail = '';
      try { detail = await upstream.text(); } catch { /* ignore */ }
      res.status(upstream.status).json({ articles: null, reason: `GNews responded ${upstream.status}`, detail });
      return;
    }

    const data = await upstream.json();
    // Cache for 10 minutes at the edge — GNews free tier is 100 req/day,
    // and a public deployment will get far more page loads than that.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ articles: null, reason: 'Failed to reach GNews', detail: String(err) });
  }
}
