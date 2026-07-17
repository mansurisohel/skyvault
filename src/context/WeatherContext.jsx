import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { fetchWeatherSnapshot } from '@/services/weatherService';
import { reverseGeocode } from '@/services/geocodingService';
import { STORAGE_KEYS, DEFAULT_LOCATION } from '@/constants';

const WeatherContext = createContext(null);

function readHasStoredLocation() {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.LAST_LOCATION) !== null;
  } catch {
    return true;
  }
}

export function WeatherProvider({ children }) {
  const [unit, setUnit] = useLocalStorage(STORAGE_KEYS.UNIT, 'metric');
  const [favorites, setFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES, []);
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);
  const [lastLocation, setLastLocation] = useLocalStorage(STORAGE_KEYS.LAST_LOCATION, DEFAULT_LOCATION);

  const [location, setLocation] = useState(lastLocation);
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  // On a visitor's very first session (nothing saved yet), quietly try to use
  // their real position before fetching anything, so the app opens already
  // matching their actual location, time, and day/night state.
  const [initializing, setInitializing] = useState(() => !readHasStoredLocation());
  const autoAttempted = useRef(false);

  const loadWeather = useCallback(async (loc, { silent = false } = {}) => {
    if (!loc) return;
    if (!silent) setStatus('loading');
    setError(null);
    try {
      const data = await fetchWeatherSnapshot({ lat: loc.lat, lon: loc.lon, name: loc.name, units: unit });
      setSnapshot(data);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Unable to load weather data.');
      setStatus('error');
    }
  }, [unit]);

  const selectLocation = useCallback((loc) => {
    setLocation(loc);
    setLastLocation(loc);
    setHistory((prev) => {
      const filtered = prev.filter((h) => !(h.lat === loc.lat && h.lon === loc.lon));
      return [loc, ...filtered].slice(0, 8);
    });
  }, [setLastLocation, setHistory]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setStatus('error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        setLocating(false);
        selectLocation({ ...place, lat: latitude, lon: longitude });
      },
      () => {
        setLocating(false);
        setError('Location access was denied. Search for a city instead.');
        setStatus('error');
      },
      { timeout: 10000 },
    );
  }, [selectLocation]);

  const toggleFavorite = useCallback((loc) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.lat === loc.lat && f.lon === loc.lon);
      if (exists) return prev.filter((f) => !(f.lat === loc.lat && f.lon === loc.lon));
      return [...prev, loc];
    });
  }, [setFavorites]);

  const isFavorite = useCallback(
    (loc) => favorites.some((f) => f.lat === loc?.lat && f.lon === loc?.lon),
    [favorites],
  );

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  const refresh = useCallback(() => loadWeather(location, { silent: true }), [loadWeather, location]);

  // Silent, first-visit-only geolocation attempt. Falls back to the default
  // city without any error banner if permission is denied or unsupported —
  // this is a quiet convenience, not an explicit user action.
  useEffect(() => {
    if (!initializing || autoAttempted.current) return;
    autoAttempted.current = true;

    if (!navigator.geolocation) {
      setInitializing(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setInitializing(false), 7000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        window.clearTimeout(timeoutId);
        const { latitude, longitude } = pos.coords;
        try {
          const place = await reverseGeocode(latitude, longitude);
          selectLocation({ ...place, lat: latitude, lon: longitude });
        } finally {
          setInitializing(false);
        }
      },
      () => {
        window.clearTimeout(timeoutId);
        setInitializing(false);
      },
      { timeout: 6500 },
    );

    return () => window.clearTimeout(timeoutId);
  }, [initializing, selectLocation]);

  useEffect(() => {
    if (initializing) return;
    loadWeather(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, unit, initializing]);

  // Keeps data from silently going stale the longer a tab stays open: a
  // background refresh every 10 minutes (OpenWeather's own update cadence),
  // plus an immediate refresh when the tab regains focus/visibility — a
  // laptop woken from sleep hours later shouldn't keep showing old data,
  // which is exactly the kind of mismatch that makes the app feel wrong.
  useEffect(() => {
    if (initializing || !location) return undefined;

    const interval = window.setInterval(() => {
      loadWeather(location, { silent: true });
    }, 10 * 60 * 1000);

    function onVisible() {
      if (document.visibilityState === 'visible') {
        loadWeather(location, { silent: true });
      }
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [initializing, location, loadWeather]);

  const value = useMemo(
    () => ({
      unit,
      setUnit,
      location,
      snapshot,
      status: initializing ? 'loading' : status,
      error,
      locating,
      favorites,
      history,
      selectLocation,
      useCurrentLocation,
      toggleFavorite,
      isFavorite,
      clearHistory,
      refresh,
    }),
    [unit, location, snapshot, status, error, locating, favorites, history, initializing,
      selectLocation, useCurrentLocation, toggleFavorite, isFavorite, clearHistory, refresh, setUnit],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeatherContext() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeatherContext must be used within WeatherProvider');
  return ctx;
}
