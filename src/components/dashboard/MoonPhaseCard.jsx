import { useMemo } from 'react';
import {
  Telescope, Tent, Camera, Fish, Sprout, Bike, Mountain, PersonStanding, Moon as MoonGlyph,
} from 'lucide-react';
import { Card } from '@/components/common/Primitives';
import MoonIcon from './MoonIcon';
import { getMoonPhase, MOON_ACTIVITIES } from '@/utils/moonPhase';

const ACTIVITY_ICONS = {
  Telescope, Tent, Camera, Fish, Sprout, Bike, Mountain, PersonStanding, Moon: MoonGlyph,
};

export default function MoonPhaseCard() {
  const moon = useMemo(() => getMoonPhase(new Date()), []);
  const waxing = moon.age <= 14.7652944;
  const guide = MOON_ACTIVITIES[moon.key];

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-mist-50">Moon phase activities</h2>
        <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
          {moon.illumination}% illuminated
        </span>
      </div>

      <div className="flex items-center gap-4">
        <MoonIcon illumination={moon.illumination} waxing={waxing} size={64} />
        <div>
          <p className="font-display text-lg font-semibold text-mist-50">{moon.name}</p>
          <p className="text-sm text-slate-300">{guide.tagline}</p>
          <p className="mt-1 text-xs text-slate-400">
            {moon.daysToFullMoon === 0 ? 'Full moon tonight' : `Full moon in ${moon.daysToFullMoon}d`}
            {' · '}
            {moon.daysToNewMoon === 0 ? 'New moon tonight' : `New moon in ${moon.daysToNewMoon}d`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {guide.activities.map((a) => {
          const Icon = ACTIVITY_ICONS[a.icon] ?? MoonGlyph;
          return (
            <div key={a.name} className="flex items-start gap-3 rounded-2xl bg-white/5 p-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
                <Icon size={17} />
              </span>
              <div>
                <p className="text-sm font-medium text-mist-50">{a.name}</p>
                <p className="text-xs leading-relaxed text-slate-400">{a.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
