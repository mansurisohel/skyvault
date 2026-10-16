import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiGet, ApiError, clearApiCache, isAbortError } from '../../src/services/apiClient';
import { normalizeSnapshot, aggregateDaily, fetchWeatherSnapshot } from '../../src/services/weatherService';
import { searchLocations, reverseGeocode } from '../../src/services/geocodingService';
import { normalizeArticles, rankByRelevance, fetchNewsArticles, describeNewsFailure } from '../../src/services/newsService';
import { validateRadarIndex, radarTileUrl, RADAR_MAX_NATIVE_ZOOM, resetRadarCache } from '../../src/services/radarService';
import { resetServiceStatus, getServiceStatus } from '../../src/services/serviceStatus';
import { convertSnapshot, formatVisibility, formatPrecip, cToF } from '../../src/utils/units';
import { sameLocation, sanitizeQuery } from '../../src/utils/location';
import { safeHttpUrl, safeImageUrl } from '../../src/utils/safeUrl';
import { estimatePollen } from '../../src/utils/health';
import { relativeTime, windDirection } from '../../src/utils/format';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => { clearApiCache(); resetServiceStatus(); resetRadarCache(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

// ---------- fixtures ----------
const T0 = Date.UTC(2026, 9, 14, 15, 0, 0) / 1000; // 15:00 UTC, tz offset 0
const item = (dt, temp, extra = {}) => ({ dt, main: { temp, temp_min: temp, temp_max: temp, humidity: 50, pressure: 1010, feels_like: temp }, wind: { speed: 5 }, pop: 0, weather: [{ id: 800, main: 'Clear', icon: '01d' }], ...extra });
const current = { dt: T0, timezone: 0, main: { temp: 30, feels_like: 31, humidity: 40, pressure: 1008 }, wind: { speed: 10, deg: 90 }, clouds: { all: 10 }, sys: { sunrise: T0 - 9 * 3600, sunset: T0 + 3 * 3600 }, weather: [{ id: 800, main: 'Clear', icon: '01d' }] };
const forecastList = Array.from({ length: 40 }, (_, i) => item(T0 + 3 * 3600 * (i + 1), 20 + (i % 5)));

describe('normalizeSnapshot', () => {
  const raw = { current, forecast: { list: forecastList }, air: { list: [{ main: { aqi: 2 }, components: {} }] }, uv: { current: 6.2, max: 8, source: 'open-meteo' }, fetchedAt: 1 };
  const loc = { name: 'Test', state: 'S', country: 'C', lat: 10, lon: 20 };

  it('converts wind m/s to km/h and keeps a metric baseline', () => {
    const s = normalizeSnapshot(raw, loc);
    expect(s.current.wind_speed).toBeCloseTo(36);
    expect(s.hourly[0].wind_speed).toBeCloseTo(18);
    expect(s.units).toBe('metric');
    expect(s.isDemo).toBe(false);
    expect(s.location).toMatchObject({ name: 'Test', state: 'S', country: 'C' });
  });

  it('uses real UV when provided and flags estimates otherwise', () => {
    expect(normalizeSnapshot(raw, loc).current).toMatchObject({ uvi: 6.2, uviEstimated: false });
    const est = normalizeSnapshot({ ...raw, uv: null }, loc).current;
    expect(est.uviEstimated).toBe(true);
    expect(typeof est.uvi).toBe('number');
  });

  it('never invents missing values', () => {
    const s = normalizeSnapshot({ ...raw, current: { ...current, visibility: undefined, wind: { speed: 2 }, sys: {} } }, loc).current;
    expect(s.visibility).toBeNull();
    expect(s.wind_deg).toBeNull();
    expect(s.sunrise).toBeNull();
    expect(s.wind_gust).toBeNull();
  });

  it('rejects malformed payloads with BAD_RESPONSE', () => {
    for (const bad of [null, {}, { current }, { current, forecast: { list: [] } }, { current: { ...current, weather: [] }, forecast: { list: forecastList } }]) {
      expect(() => normalizeSnapshot(bad, loc)).toThrow(ApiError);
    }
  });

  it('ignores a null/invalid air-quality payload', () => {
    expect(normalizeSnapshot({ ...raw, air: { list: [{ main: { aqi: 99 } }] } }, loc).airQuality).toBeNull();
  });
});

describe('aggregateDaily', () => {
  it("includes the current temperature in today's range (High can't be below 'now')", () => {
    const days = aggregateDaily(forecastList, 0, current);
    expect(days[0].temp.max).toBeGreaterThanOrEqual(30);
  });

  it('drops a trailing day that has fewer than 4 slots', () => {
    const list = [];
    // 5 full days then a day with 2 slots
    const start = Date.UTC(2026, 9, 14, 0, 0, 0) / 1000;
    for (let i = 0; i < 5 * 8 + 2; i++) list.push(item(start + i * 3 * 3600, 20));
    const days = aggregateDaily(list, 0, { dt: start, main: { temp: 20 } });
    expect(days).toHaveLength(5);
  });

  it('keeps a full sixth day', () => {
    const start = Date.UTC(2026, 9, 14, 0, 0, 0) / 1000;
    const list = Array.from({ length: 5 * 8 + 6 }, (_, i) => item(start + i * 3 * 3600, 20));
    expect(aggregateDaily(list, 0, { dt: start, main: { temp: 20 } })).toHaveLength(6);
  });

  it('sums precipitation and respects the location timezone', () => {
    const list = [item(T0 + 3600, 20, { rain: { '3h': 1.5 } }), item(T0 + 3 * 3600 + 3600, 20, { rain: { '3h': 0.5 } })];
    const [d] = aggregateDaily(list, 0, null);
    expect(d.precip).toBeCloseTo(2);
    // 15:00 UTC is already the next day at UTC+10
    expect(aggregateDaily([item(T0 + 3600, 20)], 10 * 3600, null)[0].slots).toBe(1);
  });
});

describe('unit conversion', () => {
  const base = normalizeSnapshot({ current, forecast: { list: forecastList }, uv: null }, { name: 'X', lat: 0, lon: 0 });

  it('converts every temperature and wind value consistently', () => {
    const imp = convertSnapshot(base, 'imperial');
    expect(imp.current.temp).toBeCloseTo(cToF(30));
    expect(imp.current.feels_like).toBeCloseTo(cToF(31));
    expect(imp.current.wind_speed).toBeCloseTo(36 * 0.621371);
    expect(imp.hourly[3].temp).toBeCloseTo(cToF(base.hourly[3].temp));
    expect(imp.daily[0].temp.min).toBeCloseTo(cToF(base.daily[0].temp.min));
    expect(imp.daily[0].temp.max).toBeCloseTo(cToF(base.daily[0].temp.max));
    expect(imp.units).toBe('imperial');
  });

  it('is a no-op for metric, does not mutate the base, and is idempotent', () => {
    expect(convertSnapshot(base, 'metric')).toBe(base);
    const before = JSON.stringify(base);
    const imp = convertSnapshot(base, 'imperial');
    expect(JSON.stringify(base)).toBe(before);
    expect(convertSnapshot(imp, 'imperial')).toBe(imp);
  });

  it('formats visibility/precip without inventing values', () => {
    expect(formatVisibility(null)).toBe('--');
    expect(formatVisibility(10000)).toBe('10+ km');
    expect(formatVisibility(4500)).toBe('4.5 km');
    expect(formatPrecip(0.25)).toBe('0.3 mm');
    expect(formatPrecip(undefined)).toBe('--');
  });
});

describe('small utils', () => {
  it('compares locations with ~1 km tolerance', () => {
    expect(sameLocation({ lat: 40.7128, lon: -74.006 }, { lat: 40.7131, lon: -74.0059 })).toBe(true);
    expect(sameLocation({ lat: 40.7, lon: -74 }, { lat: 41.7, lon: -74 })).toBe(false);
    expect(sameLocation(null, null)).toBe(false);
  });
  it('sanitizes queries', () => {
    expect(sanitizeQuery('  Par\u0007is   FR ')).toBe('Par is FR');
    expect(sanitizeQuery('x'.repeat(500))).toHaveLength(80);
  });
  it('only allows http(s) URLs and https images', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,hi')).toBeNull();
    expect(safeHttpUrl('/relative')).toBeNull();
    expect(safeHttpUrl('https://a.com/x')).toBe('https://a.com/x');
    expect(safeImageUrl('http://a.com/i.jpg')).toBeNull();
    expect(safeImageUrl('https://a.com/i.jpg')).toBe('https://a.com/i.jpg');
  });
  it('flips pollen seasons for the southern hemisphere', () => {
    const oct = 9;
    expect(estimatePollen(20, oct, 40).level).toBeLessThan(estimatePollen(20, oct, -33).level + 1);
    expect(estimatePollen(20, oct, -33).level).toBe(4); // spring in Sydney
    expect(estimatePollen(20, oct, 40).level).toBe(2);  // autumn in New York
  });
  it('handles bad dates and directions', () => {
    expect(relativeTime('nonsense')).toBe('');
    expect(relativeTime(undefined)).toBe('');
    expect(windDirection(null)).toBe('--');
    expect(windDirection(90)).toBe('E');
  });
});

describe('apiClient', () => {
  it('retries transient failures, then succeeds', async () => {
    const f = vi.fn().mockResolvedValueOnce(json({ error: { code: 'UPSTREAM_ERROR', message: 'x' } }, 502)).mockResolvedValueOnce(json({ ok: 1 }));
    vi.stubGlobal('fetch', f);
    await expect(apiGet('/api/x', { retryDelayMs: 1 })).resolves.toEqual({ ok: 1 });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('does not retry configuration errors', async () => {
    const f = vi.fn().mockResolvedValue(json({ error: { code: 'NO_API_KEY', message: 'no key' } }, 503));
    vi.stubGlobal('fetch', f);
    await expect(apiGet('/api/x', { retryDelayMs: 1 })).rejects.toMatchObject({ code: 'NO_API_KEY', message: 'no key' });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('gives up after the retry budget and reports NETWORK', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('boom'));
    vi.stubGlobal('fetch', f);
    await expect(apiGet('/api/x', { retryDelayMs: 1, retries: 2 })).rejects.toMatchObject({ code: 'NETWORK' });
    expect(f).toHaveBeenCalledTimes(3);
  });

  it('detects missing API routes (HTML fallback) as PROXY_UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })));
    await expect(apiGet('/api/x')).rejects.toMatchObject({ code: 'PROXY_UNAVAILABLE' });
  });

  it('fails fast when offline without touching the network', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    vi.stubGlobal('navigator', { onLine: false });
    await expect(apiGet('/api/x')).rejects.toMatchObject({ code: 'OFFLINE' });
    expect(f).not.toHaveBeenCalled();
  });

  it('times out slow requests', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(Object.assign(new Error('a'), { name: 'AbortError' })))));
    const p = apiGet('/api/x', { timeoutMs: 100, retries: 0 });
    const assertion = expect(p).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(150);
    await assertion;
  });

  it('caches successes and de-duplicates concurrent identical requests', async () => {
    const f = vi.fn().mockImplementation(async () => json({ n: 1 }));
    vi.stubGlobal('fetch', f);
    await Promise.all([apiGet('/api/c', { params: { a: 1 }, ttlMs: 1000 }), apiGet('/api/c', { params: { a: 1 }, ttlMs: 1000 })]);
    await apiGet('/api/c', { params: { a: 1 }, ttlMs: 1000 });
    expect(f).toHaveBeenCalledTimes(1);
    await apiGet('/api/c', { params: { a: 2 }, ttlMs: 1000 });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const f = vi.fn().mockResolvedValueOnce(json({ error: { code: 'BAD_REQUEST', message: 'b' } }, 400)).mockResolvedValueOnce(json({ ok: 1 }));
    vi.stubGlobal('fetch', f);
    await expect(apiGet('/api/d', { ttlMs: 1000, retries: 0 })).rejects.toBeInstanceOf(ApiError);
    await expect(apiGet('/api/d', { ttlMs: 1000, retries: 0 })).resolves.toEqual({ ok: 1 });
  });

  it('abort: cancelling the only caller aborts the request; one caller aborting does not cancel a shared request', async () => {
    let underlying;
    vi.stubGlobal('fetch', (_u, { signal }) => new Promise((resolve, rej) => {
      underlying = signal;
      signal.addEventListener('abort', () => rej(Object.assign(new Error('a'), { name: 'AbortError' })));
      setTimeout(() => resolve(json({ ok: 1 })), 20);
    }));
    const a = new AbortController();
    const b = new AbortController();
    const pa = apiGet('/api/s', { signal: a.signal });
    const pb = apiGet('/api/s', { signal: b.signal });
    a.abort();
    await expect(pa).rejects.toSatisfy(isAbortError);
    await expect(pb).resolves.toEqual({ ok: 1 });
    expect(underlying.aborted).toBe(false);

    const solo = new AbortController();
    const ps = apiGet('/api/t', { signal: solo.signal });
    solo.abort();
    await expect(ps).rejects.toSatisfy(isAbortError);
    expect(underlying.aborted).toBe(true);
  });
});

describe('weatherService.fetchWeatherSnapshot', () => {
  const loc = { lat: 10, lon: 20, name: 'Testville', state: '', country: 'TV' };

  it('falls back to flagged SAMPLE data only when the server has no key, and remembers it', async () => {
    const f = vi.fn().mockResolvedValue(json({ error: { code: 'NO_API_KEY', message: 'm' } }, 503));
    vi.stubGlobal('fetch', f);
    const s = await fetchWeatherSnapshot(loc);
    expect(s.isDemo).toBe(true);
    expect(s.demoReason).toBe('missing');
    expect(getServiceStatus().openweather).toBe('missing');
    await fetchWeatherSnapshot(loc);
    expect(f).toHaveBeenCalledTimes(1); // no repeated doomed requests
  });

  it('shows an explanation when the key is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: { code: 'KEY_REJECTED', message: 'rejected!' } }, 502)));
    const s = await fetchWeatherSnapshot(loc);
    expect(s.isDemo).toBe(true);
    expect(s.fallbackReason).toBe('rejected!');
  });

  it('throws (no fake data) on network failures so the UI can show an error + retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')));
    await expect(fetchWeatherSnapshot({ ...loc, signal: undefined })).rejects.toMatchObject({ code: 'NETWORK' });
  }, 10000);

  it('rounds coordinates to improve CDN cache hits', async () => {
    const f = vi.fn().mockResolvedValue(json({ error: { code: 'NO_API_KEY', message: 'm' } }, 503));
    vi.stubGlobal('fetch', f);
    await fetchWeatherSnapshot({ ...loc, lat: 23.022505, lon: 72.571362 });
    expect(f.mock.calls[0][0]).toContain('lat=23.02&lon=72.57');
  });
});

describe('geocodingService', () => {
  it('returns live results and never substitutes demo cities on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ results: [{ name: 'Paris', state: '', country: 'FR', lat: 48.8, lon: 2.3 }] })));
    const r = await searchLocations('Paris, France');
    expect(r.demo).toBe(false);
    expect(r.results[0].name).toBe('Paris');

    clearApiCache();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')));
    await expect(searchLocations('Berlin')).rejects.toMatchObject({ code: 'NETWORK' });
  }, 10000);

  it('uses clearly flagged sample cities when the key is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: { code: 'NO_API_KEY', message: 'm' } }, 503)));
    const r = await searchLocations('Lon');
    expect(r.demo).toBe(true);
    expect(r.results.map((c) => c.name)).toContain('London');
  });

  it('falls back to the bare city when a qualified query has no results', async () => {
    const f = vi.fn().mockResolvedValueOnce(json({ results: [] })).mockResolvedValueOnce(json({ results: [{ name: 'Springfield', state: 'IL', country: 'US', lat: 1, lon: 2 }] }));
    vi.stubGlobal('fetch', f);
    const r = await searchLocations('Springfield, Nowhere');
    expect(r.results).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('ignores 1-character queries and bad coordinates; reverse geocode never throws', async () => {
    expect(await searchLocations('a')).toEqual({ results: [], demo: false });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')));
    const r = await reverseGeocode(1, 2);
    expect(r).toMatchObject({ name: 'Current location', lat: 1, lon: 2 });
  }, 10000);
});

describe('newsService', () => {
  const a = (o = {}) => ({ title: 'Heavy rain expected in Mumbai', description: 'd', url: 'https://x.com/1', publishedAt: '2026-10-13T00:00:00Z', source: { name: 'S' }, image: 'https://x.com/i.jpg', ...o });

  it('drops unsafe/incomplete items and de-duplicates by URL and by title', () => {
    const out = normalizeArticles([a(), a({ url: 'https://x.com/1?utm=2' }), a({ url: 'https://x.com/2' }), a({ url: 'javascript:1', title: 'js' }), a({ title: 'No date', publishedAt: 'x', url: 'https://x.com/3' }), a({ url: 'https://x.com/4', title: 'img', image: 'http://insecure/i.jpg' })]);
    expect(out.map((x) => x.url)).toEqual(['https://x.com/1', 'https://x.com/4']);
    expect(out[1].image).toBeNull();
  });
  it('throws BAD_RESPONSE for non-arrays', () => {
    expect(() => normalizeArticles({})).toThrow(ApiError);
  });
  it('ranks location mentions first and keeps order otherwise (stable)', () => {
    const list = normalizeArticles([a({ title: 'Delhi smog', url: 'https://x.com/a' }), a({ title: 'Mumbai floods', url: 'https://x.com/b' }), a({ title: 'Other', url: 'https://x.com/c' })]);
    expect(rankByRelevance(list, { name: 'Mumbai' }).map((x) => x.title)).toEqual(['Mumbai floods', 'Delhi smog', 'Other']);
  });
  it('maps failures to specific, honest messages and records service status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: { code: 'NO_API_KEY', message: 'm' } }, 503)));
    const err = await fetchNewsArticles().catch((e) => e);
    expect(err.code).toBe('NO_API_KEY');
    expect(getServiceStatus().news).toBe('missing');
    expect(describeNewsFailure(err).message).toMatch(/GNEWS_API_KEY/);
    expect(describeNewsFailure({ code: 'QUOTA' }).message).toMatch(/quota/i);
  });
});

describe('radarService', () => {
  const now = Date.UTC(2026, 9, 14, 12, 0, 0);
  const t = (minAgo) => Math.floor((now - minAgo * 60000) / 1000);
  const frame = (minAgo, id = minAgo) => ({ time: t(minAgo), path: `/v2/radar/${id}` });

  it('accepts valid frames, sorts them and builds correct tile URLs', () => {
    const idx = validateRadarIndex({ host: 'https://tilecache.rainviewer.com', radar: { past: [frame(10), frame(30), frame(20)] } }, now);
    expect(idx.frames.map((f) => f.time)).toEqual([t(30), t(20), t(10)]);
    expect(idx.stale).toBe(false);
    expect(radarTileUrl(idx.host, idx.frames[0])).toBe(`https://tilecache.rainviewer.com/v2/radar/30/256/{z}/{x}/{y}/2/1_1.png`);
  });
  it('uses RainViewer\'s documented max zoom of 7', () => {
    expect(RADAR_MAX_NATIVE_ZOOM).toBe(7);
  });
  it('rejects hostile hosts and malformed frames', () => {
    for (const host of ['http://tilecache.rainviewer.com', 'https://evil.com', 'https://rainviewer.com.evil.com', 'javascript:1', undefined]) {
      expect(() => validateRadarIndex({ host, radar: { past: [frame(10)] } }, now)).toThrow(ApiError);
    }
    const idx = validateRadarIndex({ host: 'https://tilecache.rainviewer.com', radar: { past: [frame(10), { time: 'x', path: '/v2/radar/1' }, { time: t(5), path: '/../etc/passwd' }, { time: t(5), path: 'https://evil.com/x' }, frame(10)] } }, now);
    expect(idx.frames).toHaveLength(1);
  });
  it('drops frames older than 3 hours and errors when nothing is left', () => {
    expect(() => validateRadarIndex({ host: 'https://tilecache.rainviewer.com', radar: { past: [frame(400)] } }, now)).toThrow(/No radar frames/);
  });
  it('flags stale data (newest observed frame > 45 min old)', () => {
    const idx = validateRadarIndex({ host: 'https://tilecache.rainviewer.com', radar: { past: [frame(90), frame(60)] } }, now);
    expect(idx.stale).toBe(true);
  });
  it('tolerates a missing nowcast and marks it when present', () => {
    const idx = validateRadarIndex({ host: 'https://tilecache.rainviewer.com', radar: { past: [frame(10)], nowcast: [{ time: t(-10), path: '/v2/radar/n1' }] } }, now);
    expect(idx.frames.at(-1).isForecast).toBe(true);
  });
});
