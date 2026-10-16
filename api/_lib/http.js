// Platform-neutral helpers. They only use the plain Node `req`/`res` API
// (statusCode, setHeader, end), so the same handlers run unchanged on Vercel
// and inside the local Vite dev/preview middleware.

export class UpstreamError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
    this.status = status;
  }
}

export function send(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(payload));
}

export function sendError(res, status, code, message, headers = {}) {
  send(res, status, { error: { code, message } }, { 'Cache-Control': 'no-store', ...headers });
}

/** Returns true if the method is allowed; otherwise sends a 405 and returns false. */
export function allowMethods(req, res, methods = ['GET', 'HEAD']) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendError(res, 405, 'METHOD_NOT_ALLOWED', `Use ${methods.join(' or ')} for this endpoint.`);
  return false;
}

export function queryValue(req, name) {
  const value = req.query?.[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Strict decimal parse so values like "1e3", "NaN" or "0x10" are rejected. */
export function parseCoord(value, min, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^-?\d{1,3}(\.\d{1,8})?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= min && n <= max ? n : null;
}

export function parseIntInRange(value, min, max) {
  if (typeof value !== 'string' || !/^\d{1,9}$/.test(value.trim())) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

/** Removes control characters, collapses whitespace and caps the length. */
export function sanitizeText(value, maxLength = 100) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Performs one upstream request with a hard timeout that covers both the
 * response headers AND the body. Never logs or returns the request URL, which
 * can contain an API key.
 */
export async function upstreamRequest(url, { timeoutMs = 8000, as = 'json' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: as === 'json' ? 'application/json' : 'image/png,image/*' },
    });

    if (as === 'buffer') {
      const buffer = response.ok ? Buffer.from(await response.arrayBuffer()) : null;
      return { ok: response.ok, status: response.status, buffer, contentType: response.headers.get('content-type') };
    }

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        if (response.ok) throw new UpstreamError('BAD_RESPONSE', 'The upstream service returned malformed data.', 502);
      }
    }
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err?.name === 'AbortError') {
      throw new UpstreamError('TIMEOUT', 'The upstream service took too long to respond.', 504);
    }
    throw new UpstreamError('NETWORK', 'Could not reach the upstream service.', 502);
  } finally {
    clearTimeout(timer);
  }
}

const SERVICE_STATUS_MESSAGES = {
  OpenWeather: {
    401: ['KEY_REJECTED', 502, 'OpenWeather rejected the API key (HTTP 401). A brand-new key can take up to a couple of hours to activate; otherwise check OPENWEATHER_API_KEY.'],
    404: ['NOT_FOUND', 404, 'OpenWeather has no data for that location.'],
    429: ['RATE_LIMIT', 429, 'OpenWeather rate limit reached (the free plan allows 60 calls per minute). Wait a moment and try again.'],
  },
  GNews: {
    400: ['UPSTREAM_ERROR', 502, 'GNews rejected the request as malformed.'],
    401: ['KEY_REJECTED', 502, 'GNews rejected the API key (HTTP 401). Check GNEWS_API_KEY.'],
    403: ['QUOTA', 429, 'The GNews daily quota or plan limit has been reached (the free plan allows 100 requests per day).'],
    429: ['RATE_LIMIT', 429, 'GNews rate limit reached (the free plan allows 1 request per second). Try again in a moment.'],
  },
};

/** Translates a non-OK upstream status into a safe { status, code, message }. */
export function mapUpstreamFailure(service, upstreamStatus) {
  const known = SERVICE_STATUS_MESSAGES[service]?.[upstreamStatus];
  if (known) return { code: known[0], status: known[1], message: known[2] };
  return {
    code: 'UPSTREAM_ERROR',
    status: 502,
    message: `${service} responded with an unexpected error (HTTP ${upstreamStatus}).`,
  };
}

export function sendUpstreamFailure(res, service, upstreamStatus) {
  const { code, status, message } = mapUpstreamFailure(service, upstreamStatus);
  sendError(res, status, code, message);
}

/** Handles anything thrown while talking to an upstream service. */
export function sendCaughtError(res, err) {
  if (err instanceof UpstreamError) {
    return sendError(res, err.status ?? 502, err.code, err.message);
  }
  console.error('[skyvault] unexpected error:', err?.message ?? err);
  return sendError(res, 500, 'INTERNAL', 'Something went wrong on the server.');
}
