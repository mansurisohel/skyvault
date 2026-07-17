import { AnimatePresence, motion } from 'framer-motion';
import CloudLayer from './CloudLayer';
import {
  RainLayer, SnowLayer, LightningLayer, StarsLayer, SunGlowLayer, MistLayer, FogLayer, WindLinesLayer,
} from './AtmosphereLayers';
import { gradientFor, PERIOD_TINTS } from '@/utils/weatherCondition';

const WINDY_THRESHOLD_KMH = 24;

function rainIntensity(mmPerHour) {
  if (mmPerHour >= 6) return 'heavy';
  if (mmPerHour >= 2) return 'medium';
  return mmPerHour > 0 ? 'light' : 'medium'; // no volume reported — assume a moderate shower
}

function snowIntensity(mmPerHour) {
  if (mmPerHour >= 3) return 'heavy';
  if (mmPerHour >= 1) return 'medium';
  return mmPerHour > 0 ? 'light' : 'medium';
}

function cloudDensity(cloudPct) {
  if (cloudPct >= 75) return 'high';
  if (cloudPct >= 40) return 'medium';
  return 'low';
}

function WeatherLayers({ condition, cloudyDensity, rainVolume, snowVolume }) {
  return (
    <>
      {condition === 'clear-day' && <SunGlowLayer />}
      {condition === 'hot-day' && <SunGlowLayer intensity="hot" />}
      {condition === 'clear-night' && <StarsLayer />}
      {condition === 'cloudy-day' && <CloudLayer density={cloudyDensity} tone="light" seed={2} />}
      {condition === 'cloudy-night' && (
        <>
          <StarsLayer />
          <CloudLayer density={cloudyDensity} tone="dark" seed={4} />
        </>
      )}
      {condition === 'rain' && (
        <>
          <CloudLayer density="high" tone="dark" seed={6} />
          <RainLayer intensity={rainIntensity(rainVolume)} />
        </>
      )}
      {condition === 'storm' && (
        <>
          <CloudLayer density="high" tone="dark" seed={8} />
          <RainLayer intensity={rainVolume >= 6 ? 'heavy' : 'medium'} />
          <LightningLayer />
        </>
      )}
      {condition === 'snow' && (
        <>
          <CloudLayer density="low" tone="light" seed={10} />
          <SnowLayer intensity={snowIntensity(snowVolume)} />
        </>
      )}
      {condition === 'mist' && <MistLayer />}
      {condition === 'fog' && <FogLayer />}
    </>
  );
}

export default function AnimatedBackground({
  condition = 'clear-day', period = 'afternoon', windSpeed = 0, rainVolume = 0, snowVolume = 0, cloudCover = 60,
}) {
  const gradient = gradientFor(condition, period);
  const tint = PERIOD_TINTS[period] ?? 'transparent';
  const conditionEncodesNight = condition.endsWith('night'); // clear-night / cloudy-night already look dark
  const showExtraNightWash = period === 'night' && !conditionEncodesNight;
  const brightScene = condition === 'clear-day' || condition === 'hot-day' || condition === 'cloudy-day';
  const windy = windSpeed >= WINDY_THRESHOLD_KMH;
  const windIntensity = Math.min(1, (windSpeed - WINDY_THRESHOLD_KMH) / 30);
  const cloudyDensity = cloudDensity(cloudCover);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Sky gradient — crossfades on any condition or time-of-day change.
          Kept separate from the weather layers below so a pure time-of-day
          shift (e.g. afternoon -> evening while it's still raining) glides
          the color smoothly without resetting the rain/cloud animation. */}
      <AnimatePresence>
        <motion.div
          key={`${condition}-${period}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
        />
      </AnimatePresence>

      {/* Darkening scrim + time-of-day tint — plain opacity/color
          transitions rather than a remount, so these never interrupt the
          foreground animation underneath. Bright daytime conditions get a
          much lighter wash than moody/low-light ones — a flat scrim strong
          enough to keep snow/fog legible was making sunny scenes look dull. */}
      <div className={`absolute inset-0 bg-abyss transition-opacity duration-[1800ms] ${brightScene ? 'opacity-35' : 'opacity-65'}`} />
      <div className="absolute inset-0 transition-[background-color] duration-[1800ms] ease-in-out" style={{ background: tint }} />
      {showExtraNightWash && (
        <div className="absolute inset-0 bg-abyss/25 transition-opacity duration-1000" />
      )}

      {/* Weather layers — only remount when the actual condition changes,
          not on every time-of-day tick, so clouds/rain/snow keep drifting
          continuously through a sunset instead of jumping to new positions. */}
      <AnimatePresence>
        <motion.div
          key={condition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <WeatherLayers
            condition={condition}
            cloudyDensity={cloudyDensity}
            rainVolume={rainVolume}
            snowVolume={snowVolume}
          />
        </motion.div>
      </AnimatePresence>

      {windy && <WindLinesLayer intensity={windIntensity} />}
    </div>
  );
}
