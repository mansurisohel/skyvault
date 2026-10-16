// Small fetch wrapper used for every call to SkyVault's own /api routes.
//  - typed errors (ApiError.code) with user-readable messages
//  - hard timeout, caller-supplied AbortSignal, and offline fast-fail
//  - bounded retries with backoff for transient failures only
//  - in-memory TTL cache and in-flight de-duplication (reference counted, so
//    one caller aborting never cancels a request another caller still needs)

export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN', status = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const RETRYABLE = new Set(['NETWORK', 'TIMEOUT', 'UPSTREAM_ERROR', 'INTERNAL', 'RATE_LIMIT']);
const MAX_CACHE_ENTRIES = 100;

const cache = new Map();
const inflight = new Map();

export const isAbortError = (err) => err instanceof ApiError && err.code === 'ABORTED';
const abortError = () => new ApiError('Request cancelled.', { code: 'ABORTED' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function clearApiCache() {
  cache.clear();
  inflight.clear();
}

function buildUrl(path, params) {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function codeFromStatus(status) {
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMIT';
  if (status === 401 || status === 403) return 'KEY_REJECTED';
  return status >= 500 ? 'UPSTREAM_ERROR' : 'BAD_REQUEST';
}

const messageForCode = {
  NOT_FOUND: 'The requested data was not found.',
  RATE_LIMIT: 'Too many requests right now. Please try again in a moment.',
  KEY_REJECTED: 'The data provider rejected the server credentials.',
  UPSTREAM_ERROR: 'The data provider is having problems. Please try again shortly.',
  BAD_REQUEST: 'The request was not accepted.',
};

async function singleRequest(url, { signal, timeoutMs }) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError("You're offline. Reconnect to load fresh data.", { code: 'OFFLINE' });
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const isJson = (response.headers.get('content-type') ?? '').includes('json');

    let body = null;
    if (isJson) {
      try {
        body = await response.json();
      } catch {
        if (response.ok) throw new ApiError('The server returned malformed data.', { code: 'BAD_RESPONSE', status: response.status });
      }
    }

    if (!response.ok) {
      if (body?.error?.code) {
        throw new ApiError(body.error.message || 'Request failed.', { code: body.error.code, status: response.status });
      }
      if (!isJson) {
        throw new ApiError(
          'SkyVault API routes are not reachable here. Use "npm run dev" or "npm run preview", or deploy to Vercel.',
          { code: 'PROXY_UNAVAILABLE', status: response.status },
        );
      }
      const code = codeFromStatus(response.status);
      throw new ApiError(messageForCode[code], { code, status: response.status });
    }

    if (!isJson) {
      // e.g. a static host answering /api/* with index.html
      throw new ApiError(
        'SkyVault API routes are not reachable here. Use "npm run dev" or "npm run preview", or deploy to Vercel.',
        { code: 'PROXY_UNAVAILABLE', status: response.status },
      );
    }
    return body;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new ApiError('The request timed out. Please try again.', { code: 'TIMEOUT' });
    if (err?.name === 'AbortError') throw abortError();
    throw new ApiError('Network error. Check your connection and try again.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function requestWithRetry(url, { signal, timeoutMs, retries, retryDelayMs }) {
  let attempt = 0;
  for (;;) {
    try {
      return await singleRequest(url, { signal, timeoutMs });
    } catch (err) {
      const canRetry = err instanceof ApiError && RETRYABLE.has(err.code) && attempt < retries && !signal?.aborted;
      if (!canRetry) throw err;
      attempt += 1;
      await sleep(retryDelayMs * 2 ** (attempt - 1));
      if (signal?.aborted) throw abortError();
    }
  }
}

function subscribe(entry, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    entry.subscribers += 1;

    const onAbort = () => {
      entry.subscribers -= 1;
      if (entry.subscribers <= 0) {
        entry.controller.abort();
        if (inflight.get(entry.key) === entry) inflight.delete(entry.key);
      }
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    entry.promise.then(
      (value) => { signal?.removeEventListener('abort', onAbort); resolve(value); },
      (error) => { signal?.removeEventListener('abort', onAbort); reject(error); },
    );
  });
}

/**
 * GET a JSON endpoint on this site.
 * @param {string} path e.g. '/api/weather'
 * @param {{params?:object, ttlMs?:number, signal?:AbortSignal, timeoutMs?:number, retries?:number, retryDelayMs?:number}} options
 */
export function apiGet(path, { params, ttlMs = 0, signal, timeoutMs = 12000, retries = 2, retryDelayMs = 400 } = {}) {
  const url = buildUrl(path, params);

  if (ttlMs > 0) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.time < ttlMs) return Promise.resolve(hit.data);
  }

  let entry = inflight.get(url);
  if (!entry) {
    const controller = new AbortController();
    entry = { key: url, controller, subscribers: 0, promise: null };
    const created = entry;
    created.promise = requestWithRetry(url, { signal: controller.signal, timeoutMs, retries, retryDelayMs })
      .then((data) => {
        if (ttlMs > 0) {
          if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
          cache.set(url, { data, time: Date.now() });
        }
        return data;
      })
      .finally(() => {
        if (inflight.get(url) === created) inflight.delete(url);
      });
    inflight.set(url, created);
  }
  return subscribe(entry, signal);
}
