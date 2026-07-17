import { useState } from 'react';
import {
  PersonStanding, Waves, Bike, Sprout, Mountain, Apple, Footprints, Tent, FishingRod,
  UtensilsCrossed, Flower2, Camera, Bird, Sailboat, Volleyball, CircleDot, Goal, Zap, Compass,
} from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import { useWeatherContext } from '@/context/WeatherContext';
import { useClock } from '@/hooks/useClock';
import { getDayPeriod } from '@/utils/weatherCondition';
import { getActivityRecommendations } from '@/utils/activities';

const ICONS = {
  PersonStanding, Waves, Bike, Sprout, Mountain, Apple, Footprints, Tent, FishingRod,
  UtensilsCrossed, Flower2, Camera, Bird, Sailboat, Volleyball, CircleDot, Goal, Zap,
};

function scoreColor(score) {
  if (score >= 80) return { text: 'text-sky-300', bg: 'bg-sky-400/15' };
  if (score >= 55) return { text: 'text-amber-300', bg: 'bg-amber-400/15' };
  return { text: 'text-slate-400', bg: 'bg-white/5' };
}

export default function ActivityRecommendationsCard() {
  const { snapshot, unit } = useWeatherContext();
  const { current } = snapshot;
  const now = useClock(5 * 60000);
  const [showAll, setShowAll] = useState(false);

  const period = getDayPeriod(current, now);
  const tempC = unit === 'metric' ? current.temp : (current.temp - 32) * (5 / 9);
  const ranked = getActivityRecommendations({ current, period, tempC });
  const visible = showAll ? ranked : ranked.slice(0, 6);

  return (
    <Card className="flex flex-col gap-4 md:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-mist-50">Outdoor activities right now</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Compass size={13} /> Matched to current conditions
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => {
          const Icon = ICONS[a.icon] ?? Compass;
          const colors = scoreColor(a.score);
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-2xl bg-white/5 p-3.5">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
                <Icon size={17} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-mist-50">{a.name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
                    {a.score}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{a.reason}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowAll((s) => !s)}
        className="self-center rounded-full px-4 py-2 text-xs font-medium text-sky-300 hover:bg-white/5 transition-colors"
      >
        {showAll ? 'Show top picks only' : `Show all ${ranked.length} activities`}
      </button>
    </Card>
  );
}
