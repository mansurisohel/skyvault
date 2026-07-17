import axios from 'axios';

const memoryCache = new Map();

function cacheKey(url, params) {
  return `${url}?${JSON.stringify(params || {})}`;
}

export function getCached(url, params, ttlMs) {
  const key = cacheKey(url, params);
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.time < ttlMs) return hit.data;

  try {
    const raw = sessionStorage.getItem(`skyvault:cache:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.time < ttlMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // sessionStorage unavailable — ignore, fall through to network
  }
  return null;
}

export function setCached(url, params, data) {
  const key = cacheKey(url, params);
  const entry = { data, time: Date.now() };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`skyvault:cache:${key}`, JSON.stringify(entry));
  } catch {
    // storage full or unavailable — memory cache still applies
  }
}

export const apiClient = axios.create({ timeout: 12000 });

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function cachedGet(url, { params, ttlMs = 5 * 60 * 1000 } = {}) {
  const cached = getCached(url, params, ttlMs);
  if (cached) return cached;

  try {
    const res = await apiClient.get(url, { params });
    setCached(url, params, res.data);
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new ApiError('Invalid or missing API key.', { status: 401, code: 'UNAUTHORIZED' });
    }
    if (err.response?.status === 404) {
      throw new ApiError('Location not found.', { status: 404, code: 'NOT_FOUND' });
    }
    if (err.response?.status === 429) {
      throw new ApiError('API rate limit reached. Showing cached or demo data instead.', { status: 429, code: 'RATE_LIMIT' });
    }
    if (err.code === 'ECONNABORTED') {
      throw new ApiError('The request timed out. Check your connection and try again.', { code: 'TIMEOUT' });
    }
    if (!err.response) {
      throw new ApiError('Network error. Check your connection and try again.', { code: 'NETWORK' });
    }
    throw new ApiError(err.message || 'Something went wrong.', { status: err.response?.status, code: 'UNKNOWN' });
  }
}
