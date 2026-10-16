import { apiGet, ApiError } from './apiClient';
import { getServiceStatus, setServiceStatus, isDemoStatus } from './serviceStatus';
import { buildDemoGeocode } from './demoData';
import { normalizeGeocodeQuery } from '@/utils/countryCodes';
import { sanitizeQuery, validCoords } from '@/utils/location';

function dedupeLocations(list) {
  const seen = new Set();
  return list.filter((loc) => {
    const key = `${loc.name.toLowerCase()}|${loc.state.toLowerCase()}|${loc.country.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toLocations(data) {
  const list = Array.isArray(data?.results) ? data.results : [];
  return list
    .filter((d) => typeof d?.name === 'string' && validCoords(d.lat, d.lon))
    .map((d) => ({ name: d.name, state: d.state || '', country: d.country || '', lat: d.lat, lon: d.lon }));
}

function noteServiceUnavailable(err) {
  if (err instanceof ApiError && (err.code === 'NO_API_KEY' || err.code === 'PROXY_UNAVAILABLE')) {
    setServiceStatus('openweather', err.code === 'NO_API_KEY' ? 'missing' : 'unavailable');
    return true;
  }
  return false;
}

async function queryGeocode(q, signal) {
  const data = await apiGet('/api/geocode', { params: { q }, ttlMs: 60 * 60 * 1000, signal });
  return toLocations(data);
}

/**
 * Resolves a free-text query to candidate places (max 5, an OpenWeather limit).
 * Returns { results, demo }. `demo: true` means the server has no API key and
 * the results come from a small built-in list of sample cities.
 *
 * Failures other than "not configured" are THROWN (never replaced with made-up
 * cities) so the search UI can say what went wrong and offer a retry.
 *
 * A full country name ("Paris, France") is normalized to the ISO code the API
 * needs, and a qualified query with no hits falls back to the bare city name.
 */
export async function searchLocations(query, { signal } = {}) {
  const clean = sanitizeQuery(query);
  if (clean.length < 2) return { results: [], demo: false };

  if (isDemoStatus(getServiceStatus().openweather)) {
    return { results: buildDemoGeocode(clean), demo: true };
  }

  const normalized = normalizeGeocodeQuery(clean);
  try {
    let results = await queryGeocode(normalized, signal);
    if (!results.length && normalized.includes(',')) {
      const bareCity = normalized.split(',')[0].trim();
      if (bareCity) results = await queryGeocode(bareCity, signal);
    }
    return { results: dedupeLocations(results), demo: false };
  } catch (err) {
    if (noteServiceUnavailable(err)) return { results: buildDemoGeocode(clean), demo: true };
    throw err;
  }
}

/** Never throws: if the lookup fails the coordinates are still valid, only the label is generic. */
export async function reverseGeocode(lat, lon, { signal } = {}) {
  const fallback = { name: 'Current location', state: '', country: '', lat, lon };
  if (isDemoStatus(getServiceStatus().openweather)) return fallback;
  try {
    const data = await apiGet('/api/geocode', { params: { lat: lat.toFixed(4), lon: lon.toFixed(4) }, ttlMs: 60 * 60 * 1000, signal });
    const d = toLocations(data)[0];
    return d ? { ...d, lat, lon } : fallback;
  } catch (err) {
    noteServiceUnavailable(err);
    return fallback;
  }
}
