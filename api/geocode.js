// GET /api/geocode?q=Paris,FR        -> up to 5 matching places
// GET /api/geocode?lat=..&lon=..     -> reverse lookup (1 place)
import { getOpenWeatherKey } from './_lib/env.js';
import {
  allowMethods, parseCoord, queryValue, sanitizeText, send, sendError, sendCaughtError,
  sendUpstreamFailure, upstreamRequest,
} from './_lib/http.js';

const GEO = 'https://api.openweathermap.org/geo/1.0';
const CACHE = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' };

function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((d) => d && typeof d.name === 'string' && Number.isFinite(d.lat) && Number.isFinite(d.lon))
    .map((d) => ({
      name: d.name.slice(0, 80),
      state: typeof d.state === 'string' ? d.state.slice(0, 80) : '',
      country: typeof d.country === 'string' ? d.country.slice(0, 4) : '',
      lat: d.lat,
      lon: d.lon,
    }));
}

export default async function handler(req, res) {
  if (!allowMethods(req, res)) return;

  const q = sanitizeText(queryValue(req, 'q'), 100);
  const lat = parseCoord(queryValue(req, 'lat'), -90, 90);
  const lon = parseCoord(queryValue(req, 'lon'), -180, 180);
  const reverse = lat !== null && lon !== null;

  if (!reverse && q.length < 2) {
    return sendError(res, 400, 'BAD_REQUEST', 'Provide q (at least 2 characters) or lat and lon.');
  }

  const key = getOpenWeatherKey();
  if (!key) {
    return sendError(res, 503, 'NO_API_KEY', 'OPENWEATHER_API_KEY is not set on the server.');
  }

  // OpenWeather returns at most 5 results for direct geocoding.
  const url = reverse
    ? `${GEO}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${encodeURIComponent(key)}`
    : `${GEO}/direct?q=${encodeURIComponent(q)}&limit=5&appid=${encodeURIComponent(key)}`;

  try {
    const r = await upstreamRequest(url);
    if (!r.ok) return sendUpstreamFailure(res, 'OpenWeather', r.status);
    return send(res, 200, { results: normalize(r.data) }, CACHE);
  } catch (err) {
    return sendCaughtError(res, err);
  }
}
