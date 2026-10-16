import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { fetchWeatherSnapshot } from '@/services/weatherService';
import { reverseGeocode } from '@/services/geocodingService';
import { clearApiCache, isAbortError } from '@/services/apiClient';
import { convertSnapshot } from '@/utils/units';
import { sameLocation, validCoords } from '@/utils/location';
import { STORAGE_KEYS, DEFAULT_LOCATION } from '@/constants';

const WeatherContext = createContext(null);

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

// ---------- state ----------
// `snapshot` is always stored in METRIC; it is converted for display below.
const initialState = { snapshot: null, status: 'loading', error: null, refreshing: false, refreshError: null };

function reducer(state, action) {
  switch (action.type) {
    case 'load-start':
      return { ...state, status: 'loading', error: null, refreshError: null };
    case 'refresh-start':
      return { ...state, refreshing: true };
    case 'success':
      return { snapshot: action.snapshot, status: 'success', error: null, refreshing: false, refreshError: null };
    case 'error':
      return { ...state, status: 'error', error: action.error, refreshing: false };
    case 'refresh-error':
      return { ...state, refreshing: false, refreshError: action.error };
    default:
      return state;
  }
}

const toErrorInfo = (err) => ({ message: err?.message || 'Unable to load weather data.', code: err?.code ?? 'UNKNOWN' });

// ---------- browser helpers ----------
function getPosition(options) {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
}

function describeGeolocationError(err) {
  switch (err?.code) {
    case 1:
      return { code: 'DENIED', message: "Location access is blocked. Allow it in your browser's site settings, or search for a city instead." };
    case 2:
      return { code: 'UNAVAILABLE', message: "Your device couldn't determine its location. Check that location services are on, or search for a city." };
    case 3:
      return { code: 'TIMEOUT', message: 'Finding your location took too long. Try again, or search for a city instead.' };
    default:
      return { code: 'UNKNOWN', message: "We couldn't get your location. Search for a city instead." };
  }
}

const subscribeOnline = (callback) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

function readHasStoredLocation() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.LAST_LOCATION) !== null;
  } catch {
    return true;
  }
}

const validPlace = (p) => p && typeof p.name === 'string' && validCoords(p.lat, p.lon);

export function WeatherProvider({ children }) {
  const [unit, setUnit] = useLocalStorage(STORAGE_KEYS.UNIT, 'metric');
  const [storedFavorites, setFavorites] = useLocalStorage(STORAGE_KEYS.FAVORITES, []);
  const [storedHistory, setHistory] = useLocalStorage(STORAGE_KEYS.HISTORY, []);
  const [storedLast, setLastLocation] = useLocalStorage(STORAGE_KEYS.LAST_LOCATION, DEFAULT_LOCATION);

  // Stored data can be edited or corrupted by hand; never trust its shape.
  const favorites = useMemo(() => (Array.isArray(storedFavorites) ? storedFavorites.filter(validPlace) : []), [storedFavorites]);
  const history = useMemo(() => (Array.isArray(storedHistory) ? storedHistory.filter(validPlace) : []), [storedHistory]);

  const [location, setLocation] = useState(() => (validPlace(storedLast) ? storedLast : DEFAULT_LOCATION));
  const [state, dispatch] = useReducer(reducer, initialState);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const isOffline = useSyncExternalStore(subscribeOnline, () => !navigator.onLine, () => false);

  const requestId = useRef(0);
  const abortRef = useRef(null);
  const pendingExplicit = useRef(false);
  const locationRef = useRef(location);
  const locatingRef = useRef(false);
  const mountedRef = useRef(false);
  const hadStoredLocation = useRef(readHasStoredLocation());

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  /**
   * Loads weather for a place. Every call supersedes the previous one: the old
   * request is aborted and, if it still resolves, its result is discarded by
   * the request-id check, so a slow response can never overwrite a newer one.
   * `silent` loads (background refreshes) never replace the screen with a
   * spinner or error, and never interrupt an explicit load in flight.
   */
  const runLoad = useCallback(async (loc, { silent = false } = {}) => {
    if (!loc) return;
    if (silent && pendingExplicit.current) return;

    const id = ++requestId.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) pendingExplicit.current = true;
    else dispatch({ type: 'refresh-start' });

    try {
      const data = await fetchWeatherSnapshot({ ...loc, signal: controller.signal });
      if (id !== requestId.current) return;
      pendingExplicit.current = false;
      dispatch({ type: 'success', snapshot: data });
    } catch (err) {
      if (id !== requestId.current || isAbortError(err)) return;
      pendingExplicit.current = false;
      dispatch({ type: silent ? 'refresh-error' : 'error', error: toErrorInfo(err) });
    }
  }, []);

  const selectLocation = useCallback((loc) => {
    if (!validPlace(loc)) return;
    const next = { name: loc.name, state: loc.state || '', country: loc.country || '', lat: loc.lat, lon: loc.lon };

    setLocationError(null);
    setLastLocation(next);
    setHistory((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return [next, ...list.filter((h) => !sameLocation(h, next))].slice(0, 8);
    });
    setLocation(next);

    dispatch({ type: 'load-start' });
    runLoad(next);
  }, [setLastLocation, setHistory, runLoad]);

  const useCurrentLocation = useCallback(async () => {
    if (locatingRef.current) return;
    setLocationError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError({ code: 'UNSUPPORTED', message: "This browser doesn't support location lookup. Search for a city instead." });
      return;
    }
    if (window.isSecureContext === false) {
      setLocationError({ code: 'INSECURE', message: 'Location only works on secure (https) pages. Search for a city instead.' });
      return;
    }

    locatingRef.current = true;
    setLocating(true);
    try {
      const pos = await getPosition({ timeout: 10000, maximumAge: 5 * 60 * 1000 });
      const { latitude, longitude } = pos.coords;
      const place = await reverseGeocode(latitude, longitude);
      if (mountedRef.current) selectLocation({ ...place, lat: latitude, lon: longitude });
    } catch (err) {
      if (mountedRef.current) setLocationError(describeGeolocationError(err));
    } finally {
      locatingRef.current = false;
      if (mountedRef.current) setLocating(false);
    }
  }, [selectLocation]);

  const toggleFavorite = useCallback((loc) => {
    if (!validPlace(loc)) return;
    setFavorites((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((f) => sameLocation(f, loc))) return list.filter((f) => !sameLocation(f, loc));
      return [...list, { name: loc.name, state: loc.state || '', country: loc.country || '', lat: loc.lat, lon: loc.lon }];
    });
  }, [setFavorites]);

  const isFavorite = useCallback((loc) => favorites.some((f) => sameLocation(f, loc)), [favorites]);
  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  /** Retry after an error (shows the loading state again). */
  const retry = useCallback(() => {
    dispatch({ type: 'load-start' });
    return runLoad(locationRef.current);
  }, [runLoad]);

  /** Manual refresh: bypasses the response cache, keeps the current data on screen. */
  const refresh = useCallback(() => {
    clearApiCache();
    return runLoad(locationRef.current, { silent: true });
  }, [runLoad]);

  // Initial load. If this is a first visit AND the browser has already been
  // granted location permission, start from the user's real position. We never
  // trigger a permission prompt on page load; users opt in with "Use my location".
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      let target = locationRef.current;
      if (!hadStoredLocation.current && navigator.geolocation && navigator.permissions?.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'granted') {
            const pos = await getPosition({ timeout: 6000, maximumAge: 5 * 60 * 1000 });
            const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            target = { ...place, lat: pos.coords.latitude, lon: pos.coords.longitude };
            if (!cancelled) {
              setLocation(target);
              setLastLocation(target);
            }
          }
        } catch {
          // Fall back to the default city; no error is shown for a convenience feature.
        }
      }
      if (!cancelled) runLoad(target);
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [runLoad, setLastLocation]);

  // Keep data fresh: every 10 minutes while visible, when a hidden tab returns,
  // and when the connection comes back.
  useEffect(() => {
    const tick = () => runLoad(locationRef.current, { silent: true });
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') tick();
    }, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', tick);
    };
  }, [runLoad]);

  const baseSnapshot = state.snapshot;
  const snapshot = useMemo(() => convertSnapshot(baseSnapshot, unit), [baseSnapshot, unit]);
  const isStale = Boolean(snapshot) && !sameLocation(snapshot.location, location);

  const value = useMemo(
    () => ({
      unit,
      setUnit,
      location,
      snapshot,
      /** true while `snapshot` still belongs to a previously selected place */
      isStale,
      status: state.status,
      error: state.error?.message ?? null,
      errorCode: state.error?.code ?? null,
      refreshing: state.refreshing,
      refreshError: state.refreshError?.message ?? null,
      isOffline,
      locating,
      locationError,
      clearLocationError: () => setLocationError(null),
      favorites,
      history,
      selectLocation,
      useCurrentLocation,
      toggleFavorite,
      isFavorite,
      clearHistory,
      refresh,
      retry,
    }),
    [unit, setUnit, location, snapshot, isStale, state, isOffline, locating, locationError, favorites, history,
      selectLocation, useCurrentLocation, toggleFavorite, isFavorite, clearHistory, refresh, retry],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWeatherContext() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeatherContext must be used within WeatherProvider');
  return ctx;
}
