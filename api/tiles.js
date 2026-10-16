// GET /api/tiles?layer=clouds_new&z=3&x=4&y=2
// Proxies OpenWeather map tiles so the API key is not embedded in tile URLs
// (which would make it visible in the browser's network tab and page source).
// Responses are cacheable by the CDN, so each tile hits OpenWeather rarely.
import { getOpenWeatherKey } from './_lib/env.js';
import {
  allowMethods, parseIntInRange, queryValue, sendError, sendCaughtError,
  sendUpstreamFailure, upstreamRequest,
} from './_lib/http.js';

const LAYERS = new Set(['precipitation_new', 'clouds_new', 'wind_new', 'temp_new', 'pressure_new']);

export default async function handler(req, res) {
  if (!allowMethods(req, res)) return;

  const layer = queryValue(req, 'layer');
  const z = parseIntInRange(queryValue(req, 'z'), 0, 12);
  if (!LAYERS.has(layer) || z === null) {
    return sendError(res, 400, 'BAD_REQUEST', 'Unknown layer or invalid zoom level.');
  }
  const max = 2 ** z - 1;
  const x = parseIntInRange(queryValue(req, 'x'), 0, max);
  const y = parseIntInRange(queryValue(req, 'y'), 0, max);
  if (x === null || y === null) {
    return sendError(res, 400, 'BAD_REQUEST', 'Tile coordinates are out of range for this zoom level.');
  }

  const key = getOpenWeatherKey();
  if (!key) return sendError(res, 503, 'NO_API_KEY', 'OPENWEATHER_API_KEY is not set on the server.');

  try {
    const r = await upstreamRequest(
      `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${encodeURIComponent(key)}`,
      { as: 'buffer', timeoutMs: 8000 },
    );
    if (!r.ok) return sendUpstreamFailure(res, 'OpenWeather', r.status);

    res.statusCode = 200;
    res.setHeader('Content-Type', r.contentType?.startsWith('image/') ? r.contentType : 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=900, stale-while-revalidate=1800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(r.buffer);
  } catch (err) {
    sendCaughtError(res, err);
  }
}
