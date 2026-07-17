import { resolveCondition } from './weatherCondition';

// Thresholds are authored in °C/km-h regardless of the display unit, then
// the current reading is converted to match before scoring — so switching
// the app to °F never changes which activities get recommended.
export const ACTIVITIES = [
  {
    id: 'running', name: 'Running', icon: 'PersonStanding',
    goodConditions: ['clear-day', 'hot-day', 'clear-night', 'cloudy-day', 'cloudy-night'],
    badConditions: ['storm', 'snow'],
    tempRange: [5, 24], tolerance: 7, periods: ['morning', 'evening'], maxWind: 30,
  },
  {
    id: 'swimming', name: 'Swimming', icon: 'Waves',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow', 'fog'],
    tempRange: [24, 34], tolerance: 4, periods: ['afternoon'], maxWind: 25,
  },
  {
    id: 'cycling', name: 'Cycling', icon: 'Bike',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [10, 28], tolerance: 6, periods: ['morning', 'afternoon'], maxWind: 26,
  },
  {
    id: 'gardening', name: 'Gardening', icon: 'Sprout',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [10, 27], tolerance: 6, periods: ['morning', 'afternoon'], maxWind: 28,
  },
  {
    id: 'hiking', name: 'Hiking', icon: 'Mountain',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm'],
    tempRange: [5, 25], tolerance: 6, periods: ['morning', 'afternoon'], maxWind: 32,
  },
  {
    id: 'fruit-picking', name: 'Fruit Picking', icon: 'Apple',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [12, 28], tolerance: 5, periods: ['morning', 'afternoon'], maxWind: 28,
  },
  {
    id: 'walking', name: 'Walking', icon: 'Footprints',
    goodConditions: ['clear-day', 'hot-day', 'clear-night', 'cloudy-day', 'cloudy-night', 'mist'],
    badConditions: ['storm'],
    tempRange: [-2, 30], tolerance: 9, periods: ['morning', 'afternoon', 'evening', 'night'], maxWind: 34,
  },
  {
    id: 'camping', name: 'Camping', icon: 'Tent',
    goodConditions: ['clear-night', 'clear-day', 'hot-day', 'cloudy-night'],
    badConditions: ['storm', 'rain'],
    tempRange: [8, 27], tolerance: 6, periods: ['evening', 'night'], maxWind: 28,
  },
  {
    id: 'fishing', name: 'Fishing', icon: 'FishingRod',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day', 'clear-night', 'mist', 'rain'],
    badConditions: ['storm'],
    tempRange: [5, 30], tolerance: 10, periods: ['morning', 'evening'], maxWind: 24,
  },
  {
    id: 'picnics', name: 'Picnics', icon: 'UtensilsCrossed',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [16, 28], tolerance: 5, periods: ['morning', 'afternoon'], maxWind: 20,
  },
  {
    id: 'yoga', name: 'Outdoor Yoga', icon: 'Flower2',
    goodConditions: ['clear-day', 'hot-day', 'clear-night', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [14, 26], tolerance: 5, periods: ['morning', 'evening'], maxWind: 16,
  },
  {
    id: 'photography', name: 'Photography', icon: 'Camera',
    goodConditions: ['clear-day', 'hot-day', 'clear-night', 'cloudy-day', 'cloudy-night', 'fog', 'mist', 'snow'],
    badConditions: ['storm'],
    tempRange: [-8, 32], tolerance: 10, periods: ['morning', 'evening', 'night'], maxWind: 34,
  },
  {
    id: 'birdwatching', name: 'Bird Watching', icon: 'Bird',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day', 'mist'],
    badConditions: ['storm', 'rain'],
    tempRange: [6, 28], tolerance: 7, periods: ['morning'], maxWind: 24,
  },
  {
    id: 'boating', name: 'Boating', icon: 'Sailboat',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain'],
    tempRange: [16, 32], tolerance: 6, periods: ['morning', 'afternoon'], maxWind: 19,
  },
  {
    id: 'tennis', name: 'Tennis', icon: 'Volleyball',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [13, 30], tolerance: 5, periods: ['morning', 'afternoon', 'evening'], maxWind: 22,
  },
  {
    id: 'cricket', name: 'Cricket', icon: 'CircleDot',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day'],
    badConditions: ['storm', 'rain', 'snow'],
    tempRange: [16, 32], tolerance: 5, periods: ['morning', 'afternoon'], maxWind: 25,
  },
  {
    id: 'football', name: 'Football', icon: 'Goal',
    goodConditions: ['clear-day', 'hot-day', 'cloudy-day', 'clear-night', 'cloudy-night'],
    badConditions: ['storm'],
    tempRange: [6, 30], tolerance: 8, periods: ['afternoon', 'evening'], maxWind: 32,
  },
  {
    id: 'skateboarding', name: 'Skateboarding', icon: 'Zap',
    goodConditions: ['clear-day', 'hot-day', 'clear-night', 'cloudy-day', 'cloudy-night'],
    badConditions: ['storm', 'rain', 'snow', 'fog', 'mist'],
    tempRange: [10, 30], tolerance: 6, periods: ['afternoon', 'evening'], maxWind: 24,
  },
];

function tempScore(tempC, [min, max], tolerance) {
  if (tempC >= min && tempC <= max) return 100;
  const dist = tempC < min ? min - tempC : tempC - max;
  if (dist >= tolerance) return 0;
  return Math.round(100 * (1 - dist / tolerance));
}

function windScore(windKmh, maxWind) {
  if (windKmh <= maxWind) return 100;
  const over = windKmh - maxWind;
  return Math.max(0, Math.round(100 - over * 6));
}

function reasonFor(activity, condition, tempC, windKmh, period, score) {
  if (activity.badConditions.includes(condition)) {
    return `Not ideal right now — current conditions aren't a great fit for ${activity.name.toLowerCase()}.`;
  }
  if (score >= 80) {
    const periodNote = activity.periods.includes(period) ? ` This ${period} is a great window.` : '';
    return `Good conditions for ${activity.name.toLowerCase()} — comfortable temperature and favorable skies.${periodNote}`;
  }
  if (score >= 55) {
    return `Workable for ${activity.name.toLowerCase()}, though not perfect — check the forecast before heading out.`;
  }
  return `Conditions are a bit rough for ${activity.name.toLowerCase()} at the moment.`;
}

/**
 * Scores every activity against the real current snapshot (condition,
 * temperature, wind, time of day) and returns them ranked best-first.
 * Temperature thresholds are authored in °C — `tempC` should always be
 * passed in Celsius regardless of the user's display unit.
 */
export function getActivityRecommendations({ current, period, tempC }) {
  const condition = resolveCondition(current.weather[0].id, current.weather[0].icon, tempC);

  return ACTIVITIES.map((activity) => {
    const isBad = activity.badConditions.includes(condition);
    const isGood = activity.goodConditions.includes(condition);
    const conditionScore = isBad ? 5 : isGood ? 100 : 55;
    const tScore = tempScore(tempC, activity.tempRange, activity.tolerance);
    const wScore = windScore(current.wind_speed, activity.maxWind);
    const periodBonus = activity.periods.includes(period) ? 100 : 65;

    const score = Math.round(
      conditionScore * 0.4 + tScore * 0.32 + periodBonus * 0.16 + wScore * 0.12,
    );

    return {
      ...activity,
      score,
      reason: reasonFor(activity, condition, tempC, current.wind_speed, period, score),
    };
  }).sort((a, b) => b.score - a.score);
}
