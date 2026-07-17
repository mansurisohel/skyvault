import { useEffect, useRef, useState } from 'react';
import { fetchRadarFrames } from '@/services/radarService';

/**
 * Fetches RainViewer's animated radar frames only once `enabled` is true —
 * radar is opt-in (a dedicated "Enable Radar" button), so a visitor who
 * never turns it on never spends the extra network request.
 */
export function useRadarFrames({ playbackMs = 600, enabled = true } = {}) {
  const [data, setData] = useState(null); // { host, frames }
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setStatus('loading');
    fetchRadarFrames()
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setStatus('error');
          return;
        }
        setData(res);
        const forecastStart = res.frames.findIndex((f) => f.isForecast);
        setIndex(forecastStart > 0 ? forecastStart - 1 : res.frames.length - 1);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, [enabled]);

  useEffect(() => {
    if (!playing || !data?.frames?.length) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % data.frames.length);
    }, playbackMs);
    return () => clearInterval(timerRef.current);
  }, [playing, data, playbackMs]);

  return {
    frames: data?.frames ?? [],
    host: data?.host,
    index,
    setIndex,
    playing,
    setPlaying,
    status,
  };
}
