/**
 * The free-tier forecast API only returns 3-hour-step data. Rather than
 * pretending to have finer-grained real readings, this linearly interpolates
 * the continuous values (temp, feels-like, wind, humidity) between the two
 * real bracketing points — a standard, honest technique most weather apps
 * use to smooth a coarse timeline. The weather icon/condition and rain
 * chance are categorical, so they're carried from the nearer real point
 * rather than blended.
 */
export function buildInterpolatedTimeline(points, { stepSeconds = 7200, count = 12, startAt } = {}) {
  if (!points.length) return [];
  const start = startAt ?? points[0].dt;

  return Array.from({ length: count }, (_, i) => {
    const t = start + i * stepSeconds;
    let a = points[0];
    let b = points[points.length - 1];

    for (let j = 0; j < points.length - 1; j += 1) {
      if (points[j].dt <= t && points[j + 1].dt >= t) {
        a = points[j];
        b = points[j + 1];
        break;
      }
    }

    const span = b.dt - a.dt || 1;
    const frac = Math.min(1, Math.max(0, (t - a.dt) / span));
    const lerp = (x, y) => x + (y - x) * frac;
    const nearest = frac < 0.5 ? a : b;

    return {
      dt: t,
      temp: lerp(a.temp, b.temp),
      feels_like: lerp(a.feels_like, b.feels_like),
      wind_speed: lerp(a.wind_speed, b.wind_speed),
      humidity: Math.round(lerp(a.humidity, b.humidity)),
      pop: Math.max(a.pop, b.pop),
      weather: nearest.weather,
      isReal: t === a.dt,
    };
  });
}
