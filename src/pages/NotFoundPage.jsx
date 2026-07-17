import { Link } from 'react-router-dom';
import { CloudOff } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <CloudOff size={40} className="text-slate-500" />
      <h1 className="font-display text-2xl font-semibold text-mist-50">Lost in the clouds</h1>
      <p className="max-w-sm text-sm text-slate-400">This page doesn&apos;t exist. Let&apos;s get you back to clearer skies.</p>
      <Link to="/" className="rounded-full bg-sky-500/20 px-5 py-2.5 text-sm font-medium text-sky-300 hover:bg-sky-500/30 transition-colors">
        Back to dashboard
      </Link>
    </div>
  );
}
