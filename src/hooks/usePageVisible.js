import { useSyncExternalStore } from 'react';

const subscribe = (callback) => {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
};

/** true while the browser tab is visible; used to pause animations and polling in background tabs. */
export function usePageVisible() {
  return useSyncExternalStore(subscribe, () => document.visibilityState === 'visible', () => true);
}
