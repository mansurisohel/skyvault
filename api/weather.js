// GET /api/weather?lat=..&lon=..[&mode=current]
// Calls OpenWeather server-side so the key never reaches the browser, and
// bundles current conditions + 5-day/3-hour forecast + air quality into one
// request. UV comes from Open-Meteo (keyless) because OpenWeather's own UV
// API was retired in April 2021.
import { getOpenWeatherKey } from './_lib/env.js';
import {
  allowMethods, parseCoord, queryValue, send, sendError, sendCaughtError,
  sendUpstreamFailure, upstreamRequest,
} from './_lib/http.js';

const OWM = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

function finiteOrNull(value, min = 0, max = 25) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

async function lookupUv(lat, lon) {
  try {
    const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&current=uv_index&daily=uv_index_max&timezone=auto&forecast_days=1`;
    const r = await upstreamRequest(url, { timeoutMs: 5000 });
    if (!r.ok || !r.data) return null;
    const current = finiteOrNull(r.data.current?.uv_index);
    const max = finiteOrNull(r.data.daily?.uv_index_max?.[0]);
    return current === null && max === null ? null : { current, max, source: 'open-meteo' };
  } catch {
    return null; // UV is optional; the client labels its own estimate instead
  }
}

export default async function handler(req, res) {
  if (!allowMethods(req, res)) return;

  const lat = parseCoord(queryValue(req, 'lat'), -90, 90);
  const lon = parseCoord(queryValue(req, 'lon'), -180, 180);
  if (lat === null || lon === null) {
    return sendError(res, 400, 'BAD_REQUEST', 'lat and lon must be valid coordinates.');
  }
  const mode = queryValue(req, 'mode') === 'current' ? 'current' : 'full';

  const key = getOpenWeatherKey();
  if (!key) {
    return sendError(res, 503, 'NO_API_KEY', 'OPENWEATHER_API_KEY is not set on the server, so SkyVault is showing sample data.');
  }

  const qs = `lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(key)}`;
  const cache = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

  try {
    const currentReq = upstreamRequest(`${OWM}/weather?${qs}`);

    if (mode === 'current') {
      const current = await currentReq;
      if (!current.ok) return sendUpstreamFailure(res, 'OpenWeather', current.status);
      return send(res, 200, { current: current.data, fetchedAt: Date.now() }, cache);
    }

    const [current, forecast, air, uv] = await Promise.all([
      currentReq,
      upstreamRequest(`${OWM}/forecast?${qs}&cnt=40`),
      upstreamRequest(`${OWM}/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(key)}`).catch(() => null),
      lookupUv(lat, lon),
    ]);

    if (!current.ok) return sendUpstreamFailure(res, 'OpenWeather', current.status);
    if (!forecast.ok) return sendUpstreamFailure(res, 'OpenWeather', forecast.status);

    return send(res, 200, {
      current: current.data,
      forecast: forecast.data,
      air: air?.ok ? air.data : null,
      uv,
      fetchedAt: Date.now(),
    }, cache);
  } catch (err) {
    return sendCaughtError(res, err);
  }
}
