// Maps OpenWeather condition codes + icon (day/night) + temperature to an
// internal condition key used to drive backgrounds, animations, and
// gradients. A hot, sunny day gets its own brighter "hot-day" treatment
// distinct from a mild clear day — real hot, sunny weather looks and feels
// different (harsher light, hazier horizon) from a pleasant clear day.
const HOT_THRESHOLD_C = 32;

export function resolveCondition(weatherId, icon = '', tempC = null) {
  const isNight = icon.endsWith('n');

  if (weatherId >= 200 && weatherId < 300) return 'storm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId === 741) return 'fog';
  if (weatherId >= 700 && weatherId < 800) return 'mist';
  if (weatherId === 800) {
    if (isNight) return 'clear-night';
    if (tempC !== null && tempC >= HOT_THRESHOLD_C) return 'hot-day';
    return 'clear-day';
  }
  if (weatherId > 800) return isNight ? 'cloudy-night' : 'cloudy-day';
  return isNight ? 'clear-night' : 'clear-day';
}

/**
 * Classifies the moment relative to the location's *actual* sunrise/sunset
 * (not a fixed clock band), so "morning" genuinely means shortly after
 * sunrise wherever the user is, and updates live as time passes.
 * Five periods: night, early-morning (dawn twilight either side of
 * sunrise), morning, afternoon, evening.
 */
export function getDayPeriod(current, nowUnix = Math.floor(Date.now() / 1000)) {
  const { sunrise, sunset } = current;
  const EARLY_MORNING_WINDOW = 50 * 60; // dawn twilight: ~50min either side of actual sunrise
  const MORNING_WINDOW = 2.25 * 3600;
  const EVENING_WINDOW = 2 * 3600;

  if (nowUnix < sunrise - EARLY_MORNING_WINDOW || nowUnix > sunset) return 'night';

  const sinceRise = nowUnix - sunrise;
  const untilSet = sunset - nowUnix;

  if (sinceRise <= EARLY_MORNING_WINDOW) return 'early-morning';
  if (sinceRise <= MORNING_WINDOW) return 'morning';
  if (untilSet <= EVENING_WINDOW) return 'evening';
  return 'afternoon';
}

export const CONDITION_GRADIENTS = {
  'clear-day': 'from-sky-500 via-sky-400 to-amber-400',
  'hot-day': 'from-sky-400 via-amber-400 to-amber-500',
  'clear-night': 'from-midnight via-dusk to-violet-500',
  'cloudy-day': 'from-slate-500 via-sky-500 to-slate-400',
  'cloudy-night': 'from-abyss via-midnight-2 to-dusk',
  rain: 'from-abyss via-midnight-2 to-slate-600',
  storm: 'from-abyss via-midnight to-violet-500',
  snow: 'from-slate-400 via-mist-200 to-sky-300',
  mist: 'from-slate-500 via-slate-400 to-mist-200',
  fog: 'from-slate-600 via-slate-400 to-mist-100',
};

// Time-of-day variants for every condition, so the sky's mood shifts
// through early-morning/morning/afternoon/evening regardless of what the
// weather is doing. Night is handled separately via PERIOD_TINTS (a
// darkening wash) rather than its own gradient set, since these conditions
// don't have distinct day/night condition keys the way clear/cloudy do.
export const PERIOD_GRADIENTS = {
  'clear-day': {
    'early-morning': 'from-violet-500 via-amber-400/70 to-sky-400',
    morning: 'from-amber-400 via-sky-400 to-sky-500',
    afternoon: 'from-sky-500 via-sky-400 to-sky-300',
    evening: 'from-violet-500 via-amber-500 to-amber-400',
  },
  'hot-day': {
    'early-morning': 'from-violet-500 via-amber-500/70 to-amber-400',
    morning: 'from-amber-400 via-amber-500 to-sky-400',
    afternoon: 'from-sky-400 via-amber-400 to-amber-500',
    evening: 'from-amber-500 via-amber-400 to-violet-500',
  },
  'cloudy-day': {
    'early-morning': 'from-violet-500 via-slate-500 to-amber-400/60',
    morning: 'from-amber-500/80 via-slate-500 to-sky-500',
    afternoon: 'from-slate-500 via-sky-500 to-slate-400',
    evening: 'from-violet-500 via-slate-500 to-amber-500',
  },
  rain: {
    'early-morning': 'from-violet-500/60 via-midnight-2 to-slate-600',
    morning: 'from-amber-500/40 via-midnight-2 to-slate-600',
    afternoon: 'from-abyss via-midnight-2 to-slate-600',
    evening: 'from-violet-500/70 via-midnight-2 to-slate-600',
  },
  storm: {
    'early-morning': 'from-violet-500/50 via-midnight to-abyss',
    morning: 'from-amber-500/30 via-midnight to-violet-500',
    afternoon: 'from-abyss via-midnight to-violet-500',
    evening: 'from-violet-500 via-midnight to-abyss',
  },
  snow: {
    'early-morning': 'from-violet-400/50 via-slate-400 to-mist-200',
    morning: 'from-amber-400/50 via-mist-200 to-sky-300',
    afternoon: 'from-slate-400 via-mist-200 to-sky-300',
    evening: 'from-violet-400/60 via-slate-400 to-mist-200',
  },
  mist: {
    'early-morning': 'from-violet-400/40 via-slate-500 to-slate-400',
    morning: 'from-amber-500/30 via-slate-400 to-mist-200',
    afternoon: 'from-slate-500 via-slate-400 to-mist-200',
    evening: 'from-violet-400/40 via-slate-500 to-slate-400',
  },
  fog: {
    'early-morning': 'from-violet-400/35 via-slate-600 to-slate-400',
    morning: 'from-amber-500/25 via-slate-400 to-mist-100',
    afternoon: 'from-slate-600 via-slate-400 to-mist-100',
    evening: 'from-violet-400/35 via-slate-600 to-slate-400',
  },
};

// Subtle color wash applied on top of the gradient so it still feels like
// the right moment of day without needing a full palette swap.
export const PERIOD_TINTS = {
  'early-morning': 'rgba(124,108,240,0.16)',
  morning: 'rgba(247,185,85,0.14)',
  afternoon: 'transparent',
  evening: 'rgba(124,108,240,0.16)',
  night: 'rgba(5,9,20,0.35)',
};

export const CONDITION_LABELS = {
  'clear-day': 'Clear',
  'hot-day': 'Sunny & Hot',
  'clear-night': 'Clear',
  'cloudy-day': 'Cloudy',
  'cloudy-night': 'Cloudy',
  rain: 'Rain',
  storm: 'Thunderstorm',
  snow: 'Snow',
  mist: 'Mist',
  fog: 'Fog',
};

export function gradientFor(condition, period) {
  return PERIOD_GRADIENTS[condition]?.[period] ?? CONDITION_GRADIENTS[condition] ?? CONDITION_GRADIENTS['clear-day'];
}
