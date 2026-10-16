import { apiGet, ApiError } from './apiClient';
import { getServiceStatus, setServiceStatus, isDemoStatus } from './serviceStatus';
import { buildDemoWeather } from './demoData';
import { estimateUVIndex } from '@/utils/health';
import { msToKmh } from '@/utils/units';

// Data comes from SkyVault's own /api/weather route (api/weather.js), which
// calls OpenWeather's free endpoints server-side. Everything is normalized to
// a METRIC baseline here (°C, km/h, mm, m, hPa); unit conversion for display
// lives in utils/units.js so toggling °C/°F never needs a new request.

const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function badResponse() {
  return new ApiError('The weather service returned unexpected data. Please try again.', { code: 'BAD_RESPONSE' });
}

function dayKey(unixSeconds, tzOffsetSeconds) {
  const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function normalizeAirQuality(raw) {
  const item = raw?.list?.[0];
  const aqi = item?.main?.aqi;
  if (!Number.isInteger(aqi) || aqi < 1 || aqi > 5) return null;
  return { aqi, components: item.components ?? {} };
}

function normalizeHourly(list) {
  return list.map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    feels_like: num(item.main.feels_like) ?? item.main.temp,
    pop: num(item.pop) ?? 0,
    wind_speed: msToKmh(num(item.wind?.speed) ?? 0),
    humidity: num(item.main.humidity),
    pressure: num(item.main.pressure),
    precip: (num(item.rain?.['3h']) ?? 0) + (num(item.snow?.['3h']) ?? 0),
    weather: item.weather,
  }));
}

/**
 * The free /forecast endpoint returns 3-hour steps for ~5 days — there is no
 * true daily resolution on this tier. Entries are grouped by the location's
 * local calendar day. Two corrections matter for accuracy:
 *  - today's range includes the CURRENT temperature, otherwise "High" could be
 *    lower than the temperature outside right now once the afternoon peak has
 *    passed;
 *  - a trailing day with only a couple of 3-hour slots is dropped instead of
 *    being presented as a full day.
 */
export function aggregateDaily(list, tzOffsetSeconds, current, uvMax = null) {
  const byDay = new Map();
  for (const item of list) {
    const key = dayKey(item.dt, tzOffsetSeconds);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  }
  const todayKey = current ? dayKey(current.dt, tzOffsetSeconds) : null;

  const days = Array.from(byDay.entries()).map(([key, items]) => {
    const noon = items.reduce((best, item) => {
      const h = new Date((item.dt + tzOffsetSeconds) * 1000).getUTCHours();
      const bh = new Date((best.dt + tzOffsetSeconds) * 1000).getUTCHours();
      return Math.abs(h - 12) < Math.abs(bh - 12) ? item : best;
    });
    const temps = items.flatMap((i) => [i.main.temp_min ?? i.main.temp, i.main.temp_max ?? i.main.temp]);
    if (key === todayKey && current?.main?.temp !== undefined) temps.push(current.main.temp);

    return {
      dt: noon.dt,
      temp: { min: Math.min(...temps), max: Math.max(...temps) },
      pop: Math.max(...items.map((i) => num(i.pop) ?? 0)),
      humidity: num(noon.main.humidity),
      wind_speed: msToKmh(num(noon.wind?.speed) ?? 0),
      pressure: num(noon.main.pressure),
      precip: items.reduce((sum, i) => sum + (num(i.rain?.['3h']) ?? 0) + (num(i.snow?.['3h']) ?? 0), 0),
      slots: items.length,
      uvMax: key === todayKey ? uvMax : null,
      weather: noon.weather,
    };
  });

  if (days.length > 5 && days[days.length - 1].slots < 4) days.pop();
  return days;
}

/** Converts the raw /api/weather bundle into the app's snapshot shape. Exported for tests. */
export function normalizeSnapshot(raw, loc) {
  const cur = raw?.current;
  const list = Array.isArray(raw?.forecast?.list)
    ? raw.forecast.list.filter((i) => i && Number.isFinite(i.dt) && num(i?.main?.temp) !== null && Array.isArray(i.weather) && i.weather.length)
    : [];
  if (num(cur?.main?.temp) === null || !Number.isFinite(cur?.dt) || !Array.isArray(cur?.weather) || !cur.weather.length || !list.length) {
    throw badResponse();
  }

  const tz = num(cur.timezone) ?? 0;
  const localHour = new Date((cur.dt + tz) * 1000).getUTCHours();
  const clouds = num(cur.clouds?.all);

  // Real UV (Open-Meteo, fetched server-side) when available; otherwise a
  // clearly flagged estimate. OpenWeather retired its own UV API in 2021.
  const liveUv = num(raw.uv?.current);
  const uvi = liveUv ?? estimateUVIndex(loc.lat, clouds ?? 0, localHour);

  const hourly = normalizeHourly(list);
  const daily = aggregateDaily(list, tz, cur, num(raw.uv?.max));

  return {
    location: { name: loc.name, state: loc.state ?? '', country: loc.country ?? '', lat: loc.lat, lon: loc.lon, timezoneOffset: tz },
    current: {
      dt: cur.dt,
      temp: cur.main.temp,
      feels_like: num(cur.main.feels_like) ?? cur.main.temp,
      humidity: num(cur.main.humidity),
      pressure: num(cur.main.pressure),
      visibility: num(cur.visibility), // null when the API omits it; never invented
      uvi,
      uviEstimated: liveUv === null,
      wind_speed: msToKmh(num(cur.wind?.speed) ?? 0),
      wind_gust: num(cur.wind?.gust) !== null ? msToKmh(cur.wind.gust) : null,
      wind_deg: num(cur.wind?.deg),
      clouds,
      sunrise: num(cur.sys?.sunrise),
      sunset: num(cur.sys?.sunset),
      weather: cur.weather,
      rainVolume: num(cur.rain?.['1h']) ?? 0,
      snowVolume: num(cur.snow?.['1h']) ?? 0,
    },
    hourly,
    daily,
    airQuality: normalizeAirQuality(raw.air),
    alerts: [], // not available on the free-tier endpoints used here
    isDemo: false,
    units: 'metric',
    fetchedAt: num(raw.fetchedAt) ?? Date.now(),
  };
}

function demoSnapshot({ lat, lon, name, state, country }, extra = {}) {
  const demo = buildDemoWeather(lat, lon, name);
  return { ...demo, location: { ...demo.location, state: state ?? '', country: country ?? '' }, ...extra };
}

/**
 * Fetches a complete snapshot (metric). Falls back to clearly flagged sample
 * data ONLY when the server has no key, API routes are unavailable, or the key
 * is rejected / rate limited. Network and server failures are thrown so the UI
 * can show an error with a retry, rather than silently showing invented data.
 */
export async function fetchWeatherSnapshot({ lat, lon, name, state = '', country = '', signal } = {}) {
  const loc = { lat, lon, name, state, country };

  if (isDemoStatus(getServiceStatus().openweather)) {
    return demoSnapshot(loc, { demoReason: getServiceStatus().openweather });
  }

  try {
    const raw = await apiGet('/api/weather', {
      params: { lat: round2(lat), lon: round2(lon) },
      ttlMs: 5 * 60 * 1000,
      signal,
    });
    const snapshot = normalizeSnapshot(raw, loc);
    setServiceStatus('openweather', 'ok');
    return snapshot;
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'NO_API_KEY' || err.code === 'PROXY_UNAVAILABLE') {
        setServiceStatus('openweather', err.code === 'NO_API_KEY' ? 'missing' : 'unavailable');
        return demoSnapshot(loc, { demoReason: err.code === 'NO_API_KEY' ? 'missing' : 'unavailable', fallbackReason: err.code === 'PROXY_UNAVAILABLE' ? err.message : undefined });
      }
      if (err.code === 'KEY_REJECTED' || err.code === 'RATE_LIMIT') {
        return demoSnapshot(loc, { demoReason: err.code.toLowerCase(), fallbackReason: err.message });
      }
    }
    throw err;
  }
}

/** Lightweight current-conditions lookup (one upstream call) for favorite cards. Metric. */
export async function fetchCurrentSummary({ lat, lon, signal }) {
  if (isDemoStatus(getServiceStatus().openweather)) {
    const demo = buildDemoWeather(lat, lon, '');
    return { temp: demo.current.temp, weather: demo.current.weather, isDemo: true };
  }
  const raw = await apiGet('/api/weather', {
    params: { lat: round2(lat), lon: round2(lon), mode: 'current' },
    ttlMs: 5 * 60 * 1000,
    signal,
  });
  const cur = raw?.current;
  if (num(cur?.main?.temp) === null || !Array.isArray(cur?.weather) || !cur.weather.length) throw badResponse();
  setServiceStatus('openweather', 'ok');
  return { temp: cur.main.temp, weather: cur.weather, isDemo: false };
}
