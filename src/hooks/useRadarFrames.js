import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRadarIndex } from '@/services/radarService';
import { isAbortError } from '@/services/apiClient';
import { usePageVisible } from '@/hooks/usePageVisible';

const REFRESH_MS = 5 * 60 * 1000; // frames expire on the provider side, so keep the list fresh

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Loads and validates RainViewer radar frames (only once `enabled`), keeps the
 * list fresh while the tab is visible, and drives play/pause/step. Playback
 * pauses in background tabs and starts paused for users who prefer reduced motion.
 */
export function useRadarFrames({ playbackMs = 700, enabled = true } = {}) {
  const [data, setData] = useState(null); // { host, frames, newestTime, stale }
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const visible = usePageVisible();
  const shownTime = useRef(null);

  const frames = data?.frames;
  useEffect(() => {
    shownTime.current = frames?.[index]?.time ?? null;
  }, [frames, index]);

  const load = useCallback(async ({ force = false, silent = false, signal } = {}) => {
    try {
      const next = await fetchRadarIndex({ force, signal });
      if (signal?.aborted) return;
      setData(next);
      setError(null);
      // Keep the same moment on screen across refreshes when it still exists;
      // otherwise jump to the newest observed frame.
      setIndex((current) => {
        const sameTime = next.frames.findIndex((f) => f.time === shownTime.current);
        if (sameTime >= 0) return sameTime;
        const lastObserved = next.frames.map((f) => f.isForecast).lastIndexOf(false);
        return lastObserved >= 0 ? lastObserved : Math.min(current, next.frames.length - 1);
      });
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      if (silent) return; // a failed background refresh keeps the frames already loaded
      setError({ code: err.code, message: err.message });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    // load() only sets state after its first `await`, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load({ signal: controller.signal });
    return () => {
      controller.abort();
      // Disabling radar resets it, so re-enabling never shows expired frames.
      setData(null);
      setError(null);
      setIndex(0);
    };
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !visible) return undefined;
    const controller = new AbortController();
    const timer = window.setInterval(() => load({ force: true, silent: true, signal: controller.signal }), REFRESH_MS);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, [enabled, visible, load]);

  const count = frames?.length ?? 0;
  useEffect(() => {
    if (!enabled || !playing || !visible || count < 2) return undefined;
    const atEnd = index === count - 1;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), atEnd ? playbackMs * 2.5 : playbackMs);
    return () => window.clearTimeout(timer);
  }, [enabled, playing, visible, index, count, playbackMs]);

  const retry = useCallback(() => {
    setError(null);
    return load({ force: true });
  }, [load]);

  const step = useCallback((direction) => {
    setPlaying(false);
    setIndex((i) => Math.min(count - 1, Math.max(0, i + direction)));
  }, [count]);

  const status = !enabled ? 'idle' : data ? 'ready' : error ? 'error' : 'loading';

  return {
    status,
    error,
    frames: frames ?? [],
    host: data?.host,
    stale: data?.stale ?? false,
    newestTime: data?.newestTime ?? null,
    index,
    setIndex,
    playing,
    setPlaying,
    step,
    retry,
  };
}
