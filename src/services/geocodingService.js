import { cachedGet, ApiError } from './apiClient';
import { OPENWEATHER_API_KEY, OPENWEATHER_BASE, DEMO_MODE } from '@/constants';
import { buildDemoGeocode } from './demoData';
import { normalizeGeocodeQuery } from '@/utils/countryCodes';

function dedupeLocations(list) {
  const seen = new Set();
  return list.filter((loc) => {
    const key = `${loc.name.toLowerCase()}|${loc.state.toLowerCase()}|${loc.country.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function queryGeocode(q, limit) {
  const data = await cachedGet(`${OPENWEATHER_BASE}/geo/1.0/direct`, {
    params: { q, limit, appid: OPENWEATHER_API_KEY },
    ttlMs: 60 * 60 * 1000,
  });
  return (data || []).map((d) => ({
    name: d.name,
    state: d.state || '',
    country: d.country,
    lat: d.lat,
    lon: d.lon,
  }));
}

/**
 * Resolves a free-text location query into candidate coordinates via the
 * OpenWeather Geocoding API. Used to power search-with-autocomplete so
 * the app always fetches weather by lat/lon rather than by raw city name.
 *
 * Handles the two things that most commonly broke "search a city and
 * country" in practice: a full country name instead of an ISO code (OWM
 * only accepts codes — "Paris, France" is normalized to "Paris,FR"), and a
 * qualified query that turns up nothing (falls back to searching the bare
 * city name so the user still gets real results to pick the right one from).
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  if (DEMO_MODE) {
    return buildDemoGeocode(query);
  }

  const normalized = normalizeGeocodeQuery(query);

  try {
    let results = await queryGeocode(normalized, 8);

    if (!results.length && normalized.includes(',')) {
      const bareCity = normalized.split(',')[0].trim();
      if (bareCity) results = await queryGeocode(bareCity, 8);
    }

    return dedupeLocations(results);
  } catch (err) {
    if (err instanceof ApiError) return buildDemoGeocode(query);
    throw err;
  }
}

export async function reverseGeocode(lat, lon) {
  if (DEMO_MODE) {
    return { name: 'Current Location', state: '', country: '', lat, lon };
  }
  try {
    const data = await cachedGet(`${OPENWEATHER_BASE}/geo/1.0/reverse`, {
      params: { lat, lon, limit: 1, appid: OPENWEATHER_API_KEY },
      ttlMs: 60 * 60 * 1000,
    });
    const d = data?.[0];
    if (!d) return { name: 'Current Location', state: '', country: '', lat, lon };
    return { name: d.name, state: d.state || '', country: d.country, lat, lon };
  } catch {
    return { name: 'Current Location', state: '', country: '', lat, lon };
  }
}
