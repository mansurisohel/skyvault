import { useMemo } from 'react';
import { buildHourlyTimeline } from '@/utils/timeline';

/** Memoized 12-tile timeline shared by the hourly card and the charts. */
export function useHourlyTimeline(snapshot) {
  return useMemo(() => (snapshot ? buildHourlyTimeline(snapshot) : []), [snapshot]);
}
