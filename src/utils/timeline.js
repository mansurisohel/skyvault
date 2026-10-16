/**
 * The free-tier forecast API only returns 3-hour-step data. Rather than
 * pretending to have finer-grained real readings, this linearly interpolates
 * the continuous values (temp, feels-like, wind, humidity) between the two
 * real bracketing points, a standard, honest technique most weather apps use
 * to smooth a coarse timeline. The weather icon/condition and rain chance are
 * categorical, so they're carried from the nearer real point rather than blended.
 * Times outside the data range clamp to the nearest real point.
 */
export function buildInterpolatedTimeline(points, { stepSeconds = 7200, count = 12, startAt } = {}) {
  if (!points.length) return [];
  const start = startAt ?? points[0].dt;
  const last = points.length - 1;

  return Array.from({ length: count }, (_, i) => {
    const t = start + i * stepSeconds;
    let a;
    let b;

    if (t <= points[0].dt) {
      a = points[0];
      b = points[0];
    } else if (t >= points[last].dt) {
      a = points[last];
      b = points[last];
    } else {
      let j = 0;
      while (j < last - 1 && points[j + 1].dt < t) j += 1;
      a = points[j];
      b = points[j + 1];
    }

    const span = b.dt - a.dt || 1;
    const frac = a === b ? 0 : Math.min(1, Math.max(0, (t - a.dt) / span));
    const lerp = (x, y) => x + (y - x) * frac;
    // Optional fields (humidity, pressure) can be null; use whichever side has a value.
    const optional = (x, y) => (x === null || x === undefined ? y : y === null || y === undefined ? x : Math.round(lerp(x, y)));
    const nearest = frac < 0.5 ? a : b;

    return {
      dt: t,
      temp: lerp(a.temp, b.temp),
      feels_like: lerp(a.feels_like, b.feels_like),
      wind_speed: lerp(a.wind_speed, b.wind_speed),
      humidity: optional(a.humidity, b.humidity),
      pressure: optional(a.pressure, b.pressure),
      pop: Math.max(a.pop, b.pop),
      weather: nearest.weather,
      isReal: t === a.dt,
    };
  });
}

/**
 * Builds the 12-tile "next 24 hours" strip used by the hourly card and charts.
 * The first tile is the CURRENT observation itself (so "Now" always matches the
 * big temperature on screen instead of showing a forecast up to 3 hours ahead);
 * the rest sit on local 2-hour steps interpolated from the real forecast.
 */
export function buildHourlyTimeline(snapshot, { count = 12, stepSeconds = 7200 } = {}) {
  const { current, hourly, location } = snapshot;
  if (!current || !hourly?.length) return [];
  const tz = location.timezoneOffset ?? 0;

  const anchor = {
    dt: current.dt,
    temp: current.temp,
    feels_like: current.feels_like,
    wind_speed: current.wind_speed,
    humidity: current.humidity,
    pressure: current.pressure,
    pop: hourly[0]?.pop ?? 0,
    weather: current.weather,
  };
  const points = [anchor, ...hourly.filter((h) => h.dt > anchor.dt)];

  const nextHour = Math.ceil((anchor.dt + tz) / 3600) * 3600 - tz;
  const first = nextHour - anchor.dt < 1800 ? nextHour + 3600 : nextHour;

  const rest = buildInterpolatedTimeline(points, { stepSeconds, count: count - 1, startAt: first });
  return [{ ...anchor, isReal: true, isNow: true }, ...rest];
}
