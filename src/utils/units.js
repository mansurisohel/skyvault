// Single source of truth for unit handling.
//
// The app always fetches and stores weather in a metric baseline
// (°C, km/h, mm, m, hPa) and converts for display here. Toggling the unit
// therefore never triggers a network request and can never leave some values
// in the wrong unit.

export const cToF = (c) => (c * 9) / 5 + 32;
export const fToC = (f) => ((f - 32) * 5) / 9;
export const kmhToMph = (kmh) => kmh * 0.621371;
export const mmToIn = (mm) => mm / 25.4;
export const msToKmh = (ms) => ms * 3.6;

const mapTemp = (t) => (typeof t === 'number' ? cToF(t) : t);
const mapWind = (w) => (typeof w === 'number' ? kmhToMph(w) : w);

function convertEntry(entry) {
  const next = { ...entry };
  if ('temp' in entry) {
    next.temp = entry.temp && typeof entry.temp === 'object'
      ? { ...entry.temp, ...Object.fromEntries(Object.entries(entry.temp).map(([k, v]) => [k, mapTemp(v)])) }
      : mapTemp(entry.temp);
  }
  if ('feels_like' in entry) next.feels_like = mapTemp(entry.feels_like);
  if ('wind_speed' in entry) next.wind_speed = mapWind(entry.wind_speed);
  if ('wind_gust' in entry) next.wind_gust = mapWind(entry.wind_gust);
  return next;
}

/** Returns a copy of a metric snapshot expressed in the requested unit system. */
export function convertSnapshot(base, unit) {
  if (!base || unit !== 'imperial' || base.units === 'imperial') return base;
  return {
    ...base,
    units: 'imperial',
    current: convertEntry(base.current),
    hourly: base.hourly.map(convertEntry),
    daily: base.daily.map(convertEntry),
  };
}

/** Converts a value in the display unit back to Celsius (no-op for metric). */
export function toCelsius(value, unit) {
  return unit === 'imperial' ? fToC(value) : value;
}

export function formatPrecip(mm, unit = 'metric') {
  if (typeof mm !== 'number' || Number.isNaN(mm)) return '--';
  if (unit === 'imperial') return `${mmToIn(mm).toFixed(2)} in`;
  return `${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`;
}

export function formatVisibility(meters, unit = 'metric') {
  if (typeof meters !== 'number' || Number.isNaN(meters)) return '--';
  // OpenWeather caps visibility at 10 km, so 10000 means "10 km or more".
  const capped = meters >= 10000;
  if (unit === 'imperial') {
    const mi = meters / 1609.344;
    return `${capped ? '6+' : mi.toFixed(1)} mi`;
  }
  return capped ? '10+ km' : `${(meters / 1000).toFixed(1)} km`;
}
