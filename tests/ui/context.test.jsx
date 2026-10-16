// @vitest-environment jsdom
import { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

vi.mock('@/services/weatherService', () => ({ fetchWeatherSnapshot: vi.fn(), fetchCurrentSummary: vi.fn() }));
vi.mock('@/services/geocodingService', () => ({ reverseGeocode: vi.fn(async (lat, lon) => ({ name: 'Here', state: '', country: 'XX', lat, lon })), searchLocations: vi.fn() }));

import { fetchWeatherSnapshot } from '@/services/weatherService';
import { WeatherProvider, useWeatherContext } from '@/context/WeatherContext';
import { ApiError } from '@/services/apiClient';

const snap = (name, lat, lon, temp) => ({
  location: { name, state: '', country: '', lat, lon, timezoneOffset: 0 },
  current: { dt: 1, temp, feels_like: temp, wind_speed: 36, wind_gust: null, humidity: 50, weather: [{ id: 800, icon: '01d' }] },
  hourly: [{ dt: 2, temp, feels_like: temp, wind_speed: 36, pop: 0, weather: [{ id: 800, icon: '01d' }] }],
  daily: [{ dt: 2, temp: { min: temp - 2, max: temp + 2 }, wind_speed: 36, pop: 0, weather: [{ id: 800, icon: '01d' }] }],
  airQuality: null, alerts: [], isDemo: false, units: 'metric', fetchedAt: Date.now(),
});

const deferred = () => {
  let resolve; let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

// Exposes the latest context value to the tests through a callback (not a module variable assigned during render).
let ctx;
function Probe({ onValue }) {
  const value = useWeatherContext();
  useEffect(() => { onValue(value); });
  return <div data-testid="probe">{value.snapshot ? `${value.snapshot.location.name}:${Math.round(value.snapshot.current.temp)}${value.unit}` : 'none'}</div>;
}
const mount = () => render(<WeatherProvider><Probe onValue={(v) => { ctx = v; }} /></WeatherProvider>);

const A = { name: 'Alpha', state: '', country: '', lat: 10, lon: 10 };
const B = { name: 'Beta', state: '', country: '', lat: 20, lon: 20 };

beforeEach(() => {
  localStorage.clear();
  vi.mocked(fetchWeatherSnapshot).mockReset();
});

describe('WeatherContext', () => {
  it('loads the default location on mount', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 20));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    expect(ctx.isStale).toBe(false);
  });

  it('a slow older response can never overwrite a newer selection', async () => {
    const first = deferred(); const second = deferred();
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 1)); // initial load
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));

    vi.mocked(fetchWeatherSnapshot)
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    act(() => { ctx.selectLocation(A); });
    act(() => { ctx.selectLocation(B); });

    // While loading, the previous city's data must be flagged stale (never shown under the new name).
    expect(ctx.isStale).toBe(true);
    expect(ctx.status).toBe('loading');

    await act(async () => { second.resolve(snap('Beta', 20, 20, 22)); });
    await act(async () => { first.resolve(snap('Alpha', 10, 10, 11)); }); // arrives late
    expect(screen.getByTestId('probe').textContent).toBe('Beta:22metric');
    expect(ctx.isStale).toBe(false);
    expect(ctx.location.name).toBe('Beta');
  });

  it('aborts the superseded request', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 1));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    const signals = [];
    vi.mocked(fetchWeatherSnapshot).mockImplementation(({ signal }) => { signals.push(signal); return new Promise(() => {}); });
    act(() => { ctx.selectLocation(A); });
    act(() => { ctx.selectLocation(B); });
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('failure on a new city shows an error and keeps old data flagged stale, then retry recovers', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 5));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));

    vi.mocked(fetchWeatherSnapshot).mockRejectedValueOnce(new ApiError('Network error', { code: 'NETWORK' }));
    await act(async () => { ctx.selectLocation(A); });
    await waitFor(() => expect(ctx.status).toBe('error'));
    expect(ctx.error).toBe('Network error');
    expect(ctx.isStale).toBe(true); // UI must not present the old city's weather as Alpha's

    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 9));
    await act(async () => { ctx.retry(); });
    await waitFor(() => expect(ctx.status).toBe('success'));
    expect(screen.getByTestId('probe').textContent).toBe('Alpha:9metric');
  });

  it('a failed background refresh keeps the current data and reports refreshError', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 15));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    vi.mocked(fetchWeatherSnapshot).mockRejectedValueOnce(new ApiError('Provider down', { code: 'UPSTREAM_ERROR' }));
    await act(async () => { await ctx.refresh(); });
    expect(ctx.status).toBe('success');
    expect(ctx.refreshError).toBe('Provider down');
    expect(screen.getByTestId('probe').textContent).toMatch(/:15metric/);
  });

  it('toggling units converts in place without any new request', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 20));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    const calls = vi.mocked(fetchWeatherSnapshot).mock.calls.length;
    act(() => ctx.setUnit('imperial'));
    expect(ctx.snapshot.current.temp).toBeCloseTo(68);
    expect(ctx.snapshot.current.wind_speed).toBeCloseTo(36 * 0.621371);
    expect(vi.mocked(fetchWeatherSnapshot).mock.calls.length).toBe(calls);
    act(() => ctx.setUnit('metric'));
    expect(ctx.snapshot.current.temp).toBe(20);
  });

  it('a denied location request sets a message but does NOT break the dashboard', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 20));
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_ok, err) => err({ code: 1 }) } });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    await act(async () => { await ctx.useCurrentLocation(); });
    expect(ctx.locationError.code).toBe('DENIED');
    expect(ctx.status).toBe('success');
    expect(ctx.snapshot).not.toBeNull();
    expect(ctx.locating).toBe(false);
  });

  it('ignores corrupted stored favorites/history', async () => {
    localStorage.setItem('skyvault:favorites', JSON.stringify('not-an-array'));
    localStorage.setItem('skyvault:history', JSON.stringify([{ nope: true }, A]));
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 20));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    expect(ctx.favorites).toEqual([]);
    expect(ctx.history).toHaveLength(1);
  });

  it('favorites match nearby coordinates (same place from search vs map click)', async () => {
    vi.mocked(fetchWeatherSnapshot).mockImplementation(async ({ name, lat, lon }) => snap(name, lat, lon, 20));
    mount();
    await waitFor(() => expect(ctx.status).toBe('success'));
    act(() => ctx.toggleFavorite(A));
    expect(ctx.isFavorite({ ...A, lat: 10.0004, lon: 9.9996 })).toBe(true);
    act(() => ctx.toggleFavorite({ ...A, lat: 10.0004 }));
    expect(ctx.favorites).toHaveLength(0);
  });
});
