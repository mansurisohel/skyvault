import { cachedGet, ApiError } from './apiClient';
import { OPENWEATHER_API_KEY, OPENWEATHER_BASE, DEMO_MODE } from '@/constants';
import { buildDemoWeather } from './demoData';
import { estimateUVIndex } from '@/utils/health';

// Deliberately using the free, always-available endpoints rather than
// One Call 3.0. One Call 3.0 requires a separate subscription toggle on the
// OpenWeather account (even with a perfectly valid key it 401s for anyone
// who hasn't opted in), which is a common, silent cause of "the weather is
// wrong" — the app would quietly fall back to demo data instead of showing
// real conditions. /weather + /forecast work with every free-tier key.
async function fetchCurrent(lat, lon, units) {
  return cachedGet(`${OPENWEATHER_BASE}/data/2.5/weather`, {
    params: { lat, lon, units, appid: OPENWEATHER_API_KEY },
    ttlMs: 5 * 60 * 1000,
  });
}

async function fetchForecast(lat, lon, units) {
  return cachedGet(`${OPENWEATHER_BASE}/data/2.5/forecast`, {
    params: { lat, lon, units, cnt: 40, appid: OPENWEATHER_API_KEY },
    ttlMs: 10 * 60 * 1000,
  });
}

// The dedicated /uvi endpoint is deprecated in favor of One Call 3.0 but
// still responds for many existing keys, so it's worth trying first; if it
// 4xxs, callers fall back to estimateUVIndex() instead of showing nothing.
async function fetchUVIndex(lat, lon) {
  try {
    return await cachedGet(`${OPENWEATHER_BASE}/data/2.5/uvi`, {
      params: { lat, lon, appid: OPENWEATHER_API_KEY },
      ttlMs: 30 * 60 * 1000,
    });
  } catch {
    return null;
  }
}

async function fetchAirQuality(lat, lon) {
  return cachedGet(`${OPENWEATHER_BASE}/data/2.5/air_pollution`, {
    params: { lat, lon, appid: OPENWEATHER_API_KEY },
    ttlMs: 30 * 60 * 1000,
  });
}

function normalizeAirQuality(raw) {
  const item = raw?.list?.[0];
  if (!item) return null;
  return { aqi: item.main.aqi, components: item.components };
}

function dayKey(unixSeconds, tzOffsetSeconds) {
  const d = new Date((unixSeconds + tzOffsetSeconds) * 1000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

// OpenWeather's `units=metric` returns wind speed in meters/second, not
// km/h — but every wind reading in this app is labeled and expected in
// km/h (unitSuffix, WindCard, health thresholds, etc). `units=imperial`
// already returns mph directly, matching its label, so only metric needs
// converting here.
function normalizeWindSpeed(speedMs, units) {
  return units === 'metric' ? speedMs * 3.6 : speedMs;
}

/**
 * The free /forecast endpoint only returns 3-hour-step entries (5 days, 40
 * entries) — there is no true "daily" resolution on this tier. This groups
 * those entries by local calendar day and derives real min/max, using the
 * entry closest to local noon as the representative condition for that day
 * (matching how most weather apps summarize a day from 3-hour data).
 */
function aggregateDaily(list, tzOffsetSeconds, units) {
  const byDay = new Map();
  for (const item of list) {
    const key = dayKey(item.dt, tzOffsetSeconds);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  }

  return Array.from(byDay.values()).map((items) => {
    const noon = items.reduce((closest, item) => {
      const hour = new Date((item.dt + tzOffsetSeconds) * 1000).getUTCHours();
      const closestHour = new Date((closest.dt + tzOffsetSeconds) * 1000).getUTCHours();
      return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? item : closest;
    });
    return {
      dt: noon.dt,
      temp: {
        min: Math.min(...items.map((i) => i.main.temp_min ?? i.main.temp)),
        max: Math.max(...items.map((i) => i.main.temp_max ?? i.main.temp)),
      },
      pop: Math.max(...items.map((i) => i.pop ?? 0)),
      humidity: noon.main.humidity,
      wind_speed: normalizeWindSpeed(noon.wind?.speed ?? 0, units),
      pressure: noon.main.pressure,
      weather: noon.weather,
    };
  });
}

function normalizeHourly(list, units) {
  return list.map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    feels_like: item.main.feels_like,
    pop: item.pop ?? 0,
    wind_speed: normalizeWindSpeed(item.wind?.speed ?? 0, units),
    humidity: item.main.humidity,
    weather: item.weather,
  }));
}

/**
 * Fetches a complete weather snapshot: current conditions, a 3-hour-step
 * timeline (~5 days), a day-aggregated outlook, and air quality — for a
 * given coordinate. Falls back to deterministic demo data if no API key is
 * configured, or if the live request fails, so the UI never shows a dead end.
 */
export async function fetchWeatherSnapshot({ lat, lon, name, units = 'metric' }) {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 400)); // simulate latency for realistic skeletons
    return buildDemoWeather(lat, lon, name, units);
  }

  try {
    const [current, forecast, uviRaw, air] = await Promise.all([
      fetchCurrent(lat, lon, units),
      fetchForecast(lat, lon, units),
      fetchUVIndex(lat, lon),
      fetchAirQuality(lat, lon).catch(() => null),
    ]);

    const tzOffset = current.timezone ?? 0;
    const localHour = new Date((current.dt + tzOffset) * 1000).getUTCHours();
    const clouds = current.clouds?.all ?? 0;
    const uviEstimated = uviRaw?.value === undefined;
    const uvi = uviEstimated ? estimateUVIndex(lat, clouds, localHour) : uviRaw.value;

    return {
      location: { name, lat, lon, timezoneOffset: tzOffset },
      current: {
        dt: current.dt,
        temp: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        visibility: current.visibility ?? 10000,
        uvi,
        uviEstimated,
        wind_speed: normalizeWindSpeed(current.wind?.speed ?? 0, units),
        wind_gust: current.wind?.gust ? normalizeWindSpeed(current.wind.gust, units) : null,
        wind_deg: current.wind?.deg ?? 0,
        clouds,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        weather: current.weather,
        rainVolume: current.rain?.['1h'] ?? current.rain?.['3h'] ?? 0,
        snowVolume: current.snow?.['1h'] ?? current.snow?.['3h'] ?? 0,
      },
      hourly: normalizeHourly(forecast.list ?? [], units),
      daily: aggregateDaily(forecast.list ?? [], tzOffset, units),
      airQuality: normalizeAirQuality(air),
      alerts: [], // not available on the free-tier endpoints used here
      isDemo: false,
    };
  } catch (err) {
    if (err instanceof ApiError && (err.code === 'RATE_LIMIT' || err.code === 'UNAUTHORIZED')) {
      const demo = buildDemoWeather(lat, lon, name, units);
      return { ...demo, fallbackReason: err.message };
    }
    throw err;
  }
}
