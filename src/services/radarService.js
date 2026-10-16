import { ApiError } from './apiClient';

// RainViewer public weather-maps API. Verified against the provider docs
// (rainviewer.com/api/weather-maps-api.html):
//  - the only supported index is /public/weather-maps.json
//  - the free API exposes ~2 hours of PAST radar in 10-minute steps
//  - tiles are available up to zoom level 7 (higher zooms are not served)
//  - the only color scheme is 2 ("Universal Blue")
const INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

/** Highest zoom RainViewer serves. Leaflet upscales these tiles when the map is zoomed further. */
export const RADAR_MAX_NATIVE_ZOOM = 7;

const FRAME_PATH = /^\/v2\/radar\/[A-Za-z0-9_-]+$/;
const MAX_AGE_MS = 3 * 60 * 60 * 1000;
const STALE_AFTER_MS = 45 * 60 * 1000;
const INDEX_TTL_MS = 2 * 60 * 1000;

let cached = null;

export function resetRadarCache() {
  cached = null;
}

function validHost(host) {
  try {
    const url = new URL(host);
    return url.protocol === 'https:' && (url.hostname === 'rainviewer.com' || url.hostname.endsWith('.rainviewer.com'));
  } catch {
    return false;
  }
}

function cleanFrames(list, isForecast, nowMs) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((f) => f && Number.isFinite(f.time) && typeof f.path === 'string' && FRAME_PATH.test(f.path))
    .filter((f) => nowMs - f.time * 1000 <= MAX_AGE_MS)
    .map((f) => ({ time: f.time, path: f.path, isForecast }));
}

/**
 * Validates the provider response before anything is drawn: host must be an
 * https rainviewer.com host, every frame needs a numeric timestamp and a
 * well-formed path, duplicates are dropped and frames are time-ordered.
 * Exported for tests.
 */
export function validateRadarIndex(data, nowMs = Date.now()) {
  if (!data || typeof data !== 'object' || !validHost(data.host)) {
    throw new ApiError('The radar service returned an unexpected response.', { code: 'BAD_RESPONSE' });
  }

  const seen = new Set();
  const frames = [...cleanFrames(data.radar?.past, false, nowMs), ...cleanFrames(data.radar?.nowcast, true, nowMs)]
    .filter((f) => (seen.has(f.path) ? false : seen.add(f.path)))
    .sort((a, b) => a.time - b.time);

  if (!frames.length) {
    throw new ApiError('No radar frames are currently available.', { code: 'NO_FRAMES' });
  }

  const observed = frames.filter((f) => !f.isForecast);
  const newestObserved = observed.length ? observed[observed.length - 1].time : frames[0].time;

  return {
    host: data.host.replace(/\/+$/, ''),
    frames,
    newestTime: newestObserved,
    stale: nowMs - newestObserved * 1000 > STALE_AFTER_MS,
  };
}

/** Fetches and validates the radar frame list. Throws ApiError on failure. */
export async function fetchRadarIndex({ signal, force = false } = {}) {
  if (!force && cached && Date.now() - cached.time < INDEX_TTL_MS) return cached.value;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError("You're offline, so radar can't be loaded.", { code: 'OFFLINE' });
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 8000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(INDEX_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new ApiError(`The radar service responded with an error (HTTP ${response.status}).`, { code: 'UPSTREAM_ERROR', status: response.status });
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError('The radar service returned malformed data.', { code: 'BAD_RESPONSE' });
    }
    const value = validateRadarIndex(data);
    cached = { value, time: Date.now() };
    return value;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (signal?.aborted) throw new ApiError('Request cancelled.', { code: 'ABORTED' });
    if (timedOut) throw new ApiError('The radar service took too long to respond.', { code: 'TIMEOUT' });
    throw new ApiError('Could not reach the radar service.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** 256px tiles, color scheme 2, smoothed, snow shown ("1_1"). */
export function radarTileUrl(host, frame) {
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}
