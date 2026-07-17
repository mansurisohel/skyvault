import { useEffect, useState } from 'react';

/**
 * Returns the current unix timestamp (seconds) and re-renders every
 * `intervalMs`, so anything derived from "now" — day/night state, the
 * sunrise/sunset arc, countdowns — stays live without user interaction.
 */
export function useClock(intervalMs = 60000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
