import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import weather from '../../api/weather.js';
import geocode from '../../api/geocode.js';
import tiles from '../../api/tiles.js';
import news, { NEWS_QUERY } from '../../api/news.js';
import { sanitizeArticles } from '../../api/_lib/articles.js';
import { mockReq, mockRes, jsonResponse, routeFetch } from './helpers.js';

const SECRET = 'abcdef0123456789abcdef0123456789';

beforeEach(() => {
  vi.stubEnv('OPENWEATHER_API_KEY', SECRET);
  vi.stubEnv('GNEWS_API_KEY', SECRET);
  vi.stubEnv('VITE_OPENWEATHER_API_KEY', '');
  vi.stubEnv('VITE_GNEWS_DEV_KEY', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('/api/weather', () => {
  const owmCurrent = { main: { temp: 20 }, weather: [{ id: 800 }] };
  const owmForecast = { list: [{ dt: 1 }] };

  it('rejects invalid coordinates with 400', async () => {
    for (const q of [{}, { lat: 'abc', lon: '1' }, { lat: '91', lon: '0' }, { lat: '1e2', lon: '0' }, { lat: '0', lon: '181' }]) {
      const res = mockRes();
      await weather(mockReq(q), res);
      expect(res.statusCode).toBe(400);
    }
  });

  it('rejects non-GET methods', async () => {
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1' }, 'POST'), res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBeDefined();
  });

  it('reports NO_API_KEY (503) when the key is missing', async () => {
    vi.stubEnv('OPENWEATHER_API_KEY', '');
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1' }), res);
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('NO_API_KEY');
  });

  it('returns a combined bundle, with UV from Open-Meteo, and never leaks the key', async () => {
    vi.stubGlobal('fetch', routeFetch([
      ['/data/2.5/weather', jsonResponse(owmCurrent)],
      ['/data/2.5/forecast', jsonResponse(owmForecast)],
      ['/air_pollution', jsonResponse({ list: [{ main: { aqi: 2 } }] })],
      ['open-meteo.com', jsonResponse({ current: { uv_index: 5.4 }, daily: { uv_index_max: [7.1] } })],
    ]));
    const res = mockRes();
    await weather(mockReq({ lat: '23.02', lon: '72.57' }), res);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.current).toEqual(owmCurrent);
    expect(body.uv).toEqual({ current: 5.4, max: 7.1, source: 'open-meteo' });
    expect(body.air.list[0].main.aqi).toBe(2);
    expect(res.headers['cache-control']).toMatch(/s-maxage=300/);
    expect(res.body).not.toContain(SECRET);
  });

  it('degrades gracefully when UV and air quality fail', async () => {
    vi.stubGlobal('fetch', routeFetch([
      ['/data/2.5/weather', jsonResponse(owmCurrent)],
      ['/data/2.5/forecast', jsonResponse(owmForecast)],
      ['/air_pollution', jsonResponse({}, 500)],
      ['open-meteo.com', () => { throw new Error('offline'); }],
    ]));
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.json().uv).toBeNull();
    expect(res.json().air).toBeNull();
  });

  it('maps upstream 401 to KEY_REJECTED without echoing the key', async () => {
    vi.stubGlobal('fetch', routeFetch([
      ['/data/2.5/weather', jsonResponse({ cod: 401, message: `Invalid API key ${SECRET}` }, 401)],
      ['/data/2.5/forecast', jsonResponse({}, 401)],
      ['/air_pollution', jsonResponse({}, 401)],
      ['open-meteo.com', jsonResponse({})],
    ]));
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1' }), res);
    expect(res.json().error.code).toBe('KEY_REJECTED');
    expect(res.body).not.toContain(SECRET);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('maps upstream 429 to RATE_LIMIT (429)', async () => {
    vi.stubGlobal('fetch', routeFetch([
      ['/data/2.5/weather', jsonResponse({}, 429)],
      ['/data/2.5/forecast', jsonResponse({}, 429)],
      ['/air_pollution', jsonResponse({})],
      ['open-meteo.com', jsonResponse({})],
    ]));
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1' }), res);
    expect(res.statusCode).toBe(429);
    expect(res.json().error.code).toBe('RATE_LIMIT');
  });

  it('maps network failure to a safe 502 error', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError(`fetch failed ${SECRET}`); });
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body).not.toContain(SECRET);
  });

  it('times out slow upstreams with 504', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));
    const res = mockRes();
    const pending = weather(mockReq({ lat: '1', lon: '1', mode: 'current' }), res);
    await vi.advanceTimersByTimeAsync(9000);
    await pending;
    vi.useRealTimers();
    expect(res.statusCode).toBe(504);
    expect(res.json().error.code).toBe('TIMEOUT');
  });

  it('supports the legacy VITE_OPENWEATHER_API_KEY name on the server', async () => {
    vi.stubEnv('OPENWEATHER_API_KEY', '');
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', SECRET);
    vi.stubGlobal('fetch', routeFetch([['/data/2.5/weather', jsonResponse(owmCurrent)]]));
    const res = mockRes();
    await weather(mockReq({ lat: '1', lon: '1', mode: 'current' }), res);
    expect(res.statusCode).toBe(200);
  });
});

describe('/api/geocode', () => {
  it('validates input', async () => {
    const res = mockRes();
    await geocode(mockReq({ q: 'a' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('requests at most 5 results, sanitizes the query and normalizes output', async () => {
    const f = routeFetch([['/geo/1.0/direct', jsonResponse([
      { name: 'Paris', state: 'Île-de-France', country: 'FR', lat: 48.85, lon: 2.35, local_names: { fr: 'Paris' } },
      { name: 'Bad', lat: 'x', lon: 1 },
    ])]]);
    vi.stubGlobal('fetch', f);
    const res = mockRes();
    await geocode(mockReq({ q: '  Par\u0000is,  FR ' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.json().results).toEqual([{ name: 'Paris', state: 'Île-de-France', country: 'FR', lat: 48.85, lon: 2.35 }]);
    expect(f.calls[0]).toContain('limit=5');
    expect(f.calls[0]).toContain('q=Par%20is%2C%20FR');
  });

  it('supports reverse lookups', async () => {
    const f = routeFetch([['/geo/1.0/reverse', jsonResponse([{ name: 'X', country: 'IN', lat: 1, lon: 2 }])]]);
    vi.stubGlobal('fetch', f);
    const res = mockRes();
    await geocode(mockReq({ lat: '1', lon: '2' }), res);
    expect(res.json().results[0].name).toBe('X');
  });
});

describe('/api/tiles', () => {
  it('rejects unknown layers and out-of-range tiles (no open proxy)', async () => {
    for (const q of [
      { layer: '../../etc', z: '1', x: '0', y: '0' },
      { layer: 'clouds_new', z: '1', x: '2', y: '0' },
      { layer: 'clouds_new', z: '99', x: '0', y: '0' },
    ]) {
      const res = mockRes();
      await tiles(mockReq(q), res);
      expect(res.statusCode).toBe(400);
    }
  });

  it('streams a PNG with cache headers and hides the key', async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    const f = routeFetch([['tile.openweathermap.org/map/clouds_new/2/1/1.png', new Response(png, { status: 200, headers: { 'Content-Type': 'image/png' } })]]);
    vi.stubGlobal('fetch', f);
    const res = mockRes();
    await tiles(mockReq({ layer: 'clouds_new', z: '2', x: '1', y: '1' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toMatch(/s-maxage/);
    expect(Buffer.from(res.body).toString('latin1')).not.toContain(SECRET);
  });

  it('maps upstream failures', async () => {
    vi.stubGlobal('fetch', routeFetch([['tile.openweathermap.org', new Response('no', { status: 401 })]]));
    const res = mockRes();
    await tiles(mockReq({ layer: 'wind_new', z: '0', x: '0', y: '0' }), res);
    expect(res.json().error.code).toBe('KEY_REJECTED');
  });
});

describe('/api/news', () => {
  const good = { title: ' Storm  hits coast ', description: 'd', url: 'https://example.com/a?utm=1', image: 'https://example.com/i.jpg', publishedAt: '2026-10-13T10:00:00Z', source: { name: 'Example', url: 'https://example.com' } };

  it('keeps the query within GNews 200-character limit', () => {
    expect(NEWS_QUERY.length).toBeLessThanOrEqual(200);
  });

  it('503 NO_API_KEY when unset', async () => {
    vi.stubEnv('GNEWS_API_KEY', '');
    const res = mockRes();
    await news(mockReq(), res);
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('NO_API_KEY');
  });

  it('sanitizes, dedupes and caches articles; key not echoed', async () => {
    const f = routeFetch([['gnews.io/api/v4/search', jsonResponse({ articles: [
      good,
      { ...good, url: 'https://example.com/a?utm=2' },                 // duplicate URL
      { ...good, url: 'javascript:alert(1)', title: 'bad scheme' },     // unsafe
      { ...good, title: '', url: 'https://example.com/b' },             // no title
      { ...good, url: 'https://example.com/c', publishedAt: 'nonsense' },// bad date
      { ...good, url: 'https://example.com/d', image: 'javascript:x', title: 'Ok image' },
    ] })]]);
    vi.stubGlobal('fetch', f);
    const res = mockRes();
    await news(mockReq(), res);
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.articles.map((a) => a.title)).toEqual(['Storm hits coast', 'Ok image']);
    expect(body.articles[1].image).toBeNull();
    expect(res.headers['cache-control']).toMatch(/s-maxage=1800/);
    expect(res.body).not.toContain(SECRET);
    expect(f.calls[0]).toMatch(/from=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}Z/);
  });

  it.each([
    [401, 502, 'KEY_REJECTED'],
    [403, 429, 'QUOTA'],
    [429, 429, 'RATE_LIMIT'],
    [500, 502, 'UPSTREAM_ERROR'],
  ])('maps GNews %i to %i %s', async (up, status, code) => {
    vi.stubGlobal('fetch', routeFetch([['gnews.io', jsonResponse({ errors: ['x'] }, up)]]));
    const res = mockRes();
    await news(mockReq(), res);
    expect(res.statusCode).toBe(status);
    expect(res.json().error.code).toBe(code);
  });

  it('rejects malformed JSON and missing articles field', async () => {
    vi.stubGlobal('fetch', routeFetch([['gnews.io', new Response('<html>oops', { status: 200 })]]));
    let res = mockRes();
    await news(mockReq(), res);
    expect(res.json().error.code).toBe('BAD_RESPONSE');

    vi.stubGlobal('fetch', routeFetch([['gnews.io', jsonResponse({ nope: true })]]));
    res = mockRes();
    await news(mockReq(), res);
    expect(res.json().error.code).toBe('BAD_RESPONSE');
  });

  it('sanitizeArticles tolerates non-arrays', () => {
    expect(sanitizeArticles(null)).toBeNull();
    expect(sanitizeArticles([null, 3, {}])).toEqual([]);
  });
});
