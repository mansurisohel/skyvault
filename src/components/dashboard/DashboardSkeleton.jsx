import { Card, Skeleton } from '@/components/common/Primitives';

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-24" />
          ))}
        </div>
      </Card>

      <Card>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-16 shrink-0" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>

      <Card>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
