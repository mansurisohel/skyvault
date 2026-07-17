import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWeatherNews } from '@/services/newsService';

const AUTO_REFRESH_MS = 5 * 60 * 1000; // matches newsService's cache TTL

export function useWeatherNews(snapshot, location, unit) {
  const [result, setResult] = useState(null); // { kind: 'articles' | 'insights', items: [] }
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const loadingRef = useRef(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!snapshot || !location || loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) setStatus('loading');
    setError(null);
    try {
      const data = await fetchWeatherNews(snapshot, location, unit);
      setResult(data);
      setStatus('success');
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Unable to load news right now.');
      setStatus('error');
    } finally {
      loadingRef.current = false;
    }
  }, [snapshot, location, unit]);

  useEffect(() => {
    load();
  }, [load]);

  // Keeps "the most recent articles" genuinely true over time: a periodic
  // background refresh, plus an immediate one when the tab regains focus
  // (so news isn't stale from hours ago just because the tab stayed open).
  useEffect(() => {
    if (!snapshot || !location) return undefined;

    const interval = window.setInterval(() => load({ silent: true }), AUTO_REFRESH_MS);

    function onVisible() {
      if (document.visibilityState === 'visible') load({ silent: true });
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [snapshot, location, load]);

  return {
    kind: result?.kind ?? 'insights',
    items: result?.items ?? [],
    status,
    error,
    updatedAt,
    refresh: load,
  };
}
