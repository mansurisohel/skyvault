import { cachedGet, ApiError } from './apiClient';
import {
  GNEWS_API_KEY, GNEWS_BASE, NEWSDATA_API_KEY, NEWSDATA_BASE,
} from '@/constants';
import { buildLocalInsights } from './insightsService';

// Real, live news requires a real news API — there's no reliable, keyless,
// CORS-friendly provider to fall back to for genuine third-party
// journalism. Both of these have a free tier and support two independent
// providers so there's a fallback if one is down or unconfigured; if
// neither key is set, or both fail, the app falls back to locally-generated
// insights (see insightsService.js) rather than showing nothing.
const NEWS_TTL_MS = 5 * 60 * 1000; // short TTL — "always the most recent" over minimizing requests

function dedupe(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.title?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchFromGNews(location) {
  const q = `"${location.name}" AND (weather OR storm OR flood OR heatwave OR forecast)`;
  const data = await cachedGet(`${GNEWS_BASE}/search`, {
    params: {
      q, lang: 'en', max: 10, sortby: 'publishedAt', apikey: GNEWS_API_KEY,
    },
    ttlMs: NEWS_TTL_MS,
  });

  return (data?.articles || []).map((a, i) => ({
    id: `gnews-${a.url}-${i}`,
    title: a.title,
    description: a.description,
    source: a.source?.name || 'Unknown source',
    url: a.url,
    image: a.image,
    publishedAt: a.publishedAt,
  }));
}

async function fetchFromNewsData(location) {
  const q = `"${location.name}" AND (weather OR storm OR flood OR heatwave OR forecast)`;
  const data = await cachedGet(`${NEWSDATA_BASE}/news`, {
    params: {
      apikey: NEWSDATA_API_KEY,
      q,
      language: 'en',
    },
    ttlMs: NEWS_TTL_MS,
  });

  return (data?.results || []).map((a, i) => ({
    id: `newsdata-${a.link}-${i}`,
    title: a.title,
    description: a.description,
    source: a.source_id || 'Unknown source',
    url: a.link,
    image: a.image_url,
    publishedAt: a.pubDate ? new Date(a.pubDate).toISOString() : new Date().toISOString(),
  }));
}

/**
 * Fetches weather news for a location. Tries GNews first, then NewsData.io,
 * whichever has a key configured (both if you have both — GNews wins if
 * results come back, otherwise NewsData is used). If neither is configured,
 * both fail, or a provider returns nothing relevant, this falls back to
 * locally-generated insights built directly from the live weather snapshot
 * — genuinely accurate to the searched location, but clearly not the same
 * thing as live third-party news.
 */
export async function fetchWeatherNews(snapshot, location, unit = 'metric') {
  const insights = () => ({ kind: 'insights', items: buildLocalInsights(snapshot, location, unit) });

  for (const [key, fetcher] of [[GNEWS_API_KEY, fetchFromGNews], [NEWSDATA_API_KEY, fetchFromNewsData]]) {
    if (!key) continue;
    try {
      const articles = dedupe(await fetcher(location));
      if (articles.length) return { kind: 'articles', items: articles };
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      // try the next provider, or fall through to insights
    }
  }

  return insights();
}
