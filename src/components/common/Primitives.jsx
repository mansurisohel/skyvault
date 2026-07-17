import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export function Card({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={clsx('glass-panel p-5 md:p-6', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      className={clsx('animate-pulse rounded-xl bg-mist-100/10', className)}
      aria-hidden="true"
    />
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangle className="text-amber-400" size={32} />
      <p className="text-sm text-slate-400 max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/30 transition-colors"
        >
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </Card>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center text-slate-400">
      <Inbox size={30} />
      <p className="font-medium text-mist-100">{title}</p>
      {message && <p className="text-sm max-w-sm">{message}</p>}
      {action}
    </div>
  );
}
