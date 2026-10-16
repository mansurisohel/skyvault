import { Skeleton } from './Primitives';

export function MapSkeleton() {
  return (
    <div className="glass-panel min-h-[60dvh] overflow-hidden p-0" aria-busy="true" aria-label="Loading map">
      <Skeleton className="h-14 w-full rounded-none" />
      <Skeleton className="h-[50dvh] w-full rounded-none" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-panel flex h-full min-h-[22rem] flex-col gap-4 p-6" aria-busy="true" aria-label="Loading charts">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-52 w-full" />
    </div>
  );
}
