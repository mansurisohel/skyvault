import {
  AlertTriangle, Cloud, CalendarClock, Wind, Sun, Droplets, Sunrise, Sparkles,
  Eye, TrendingUp, TrendingDown, CalendarDays,
} from 'lucide-react';
import { relativeTime } from '@/utils/format';

const ICONS = {
  AlertTriangle, Cloud, CalendarClock, Wind, Sun, Droplets, Sunrise, Eye, TrendingUp, TrendingDown, CalendarDays,
};

const ACCENTS = {
  AlertTriangle: { bar: 'bg-amber-400', badge: 'bg-amber-400/15 text-amber-300' },
  Cloud: { bar: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-300' },
  CalendarClock: { bar: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-300' },
  Wind: { bar: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-300' },
  Sun: { bar: 'bg-amber-400', badge: 'bg-amber-400/15 text-amber-300' },
  Droplets: { bar: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-300' },
  Sunrise: { bar: 'bg-amber-400', badge: 'bg-amber-400/15 text-amber-300' },
  Eye: { bar: 'bg-slate-400', badge: 'bg-white/10 text-slate-300' },
  TrendingUp: { bar: 'bg-amber-400', badge: 'bg-amber-400/15 text-amber-300' },
  TrendingDown: { bar: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-300' },
  CalendarDays: { bar: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-300' },
};

export default function InsightCard({ insight }) {
  const Icon = ICONS[insight.icon] ?? Sparkles;
  const accent = ACCENTS[insight.icon] ?? { bar: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-300' };

  return (
    <article className="glass-panel relative flex h-full flex-col gap-3 overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <span className={`absolute left-0 top-0 h-full w-1 ${accent.bar}`} aria-hidden="true" />
      <div className="flex items-center justify-between gap-2 pl-1">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${accent.badge}`}>
          <Icon size={13} /> {insight.tag}
        </span>
        <span className="shrink-0 text-xs text-slate-500">{relativeTime(insight.publishedAt)}</span>
      </div>
      <h3 className="pl-1 text-sm font-semibold leading-snug text-mist-50">{insight.title}</h3>
      <p className="pl-1 text-sm text-slate-300">{insight.body}</p>
    </article>
  );
}
