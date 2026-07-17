import { UV_LEVELS, AQI_LABELS } from '@/constants';
import { uvAdvice, hydrationAdvice } from '@/utils/health';
import { windDirection, formatTime, formatDuration, locationLabel, toCelsius } from '@/utils/format';
import { resolveCondition, CONDITION_LABELS } from '@/utils/weatherCondition';

const WINDY_THRESHOLD_KMH = 24;

/**
 * Builds a set of short, accurate briefing cards directly from the live
 * weather snapshot already on screen. Unlike generic "demo news" filler,
 * every number here comes from the same data backing the rest of the
 * dashboard, so it's always genuinely relevant to the searched location —
 * it's just not a substitute for real third-party journalism, and is
 * labeled as a generated insight rather than attributed to a fake outlet.
 */
export function buildLocalInsights(snapshot, location, unit = 'metric') {
  const { current, daily, airQuality, alerts } = snapshot;
  const tz = snapshot.location.timezoneOffset;
  const condition = resolveCondition(current.weather[0].id, current.weather[0].icon, toCelsius(current.temp, unit));
  const conditionLabel = CONDITION_LABELS[condition] ?? current.weather[0].main;
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windUnit = unit === 'metric' ? 'km/h' : 'mph';
  const now = new Date().toISOString();
  const place = locationLabel(location);
  const today = daily?.[0];

  const cards = [];

  if (alerts?.length) {
    cards.push({
      id: 'alert',
      icon: 'AlertTriangle',
      tag: 'Active alert',
      title: `${alerts[0].event} in effect for ${place}`,
      body: alerts[0].description,
      publishedAt: now,
    });
  }

  cards.push({
    id: 'current',
    icon: 'Cloud',
    tag: 'Right now',
    title: `${conditionLabel} in ${place}, ${Math.round(current.temp)}${tempUnit}`,
    body: `Feels like ${Math.round(current.feels_like)}${tempUnit} with ${current.humidity}% humidity and wind from the ${windDirection(current.wind_deg)} at ${Math.round(current.wind_speed)} ${windUnit}.`,
    publishedAt: now,
  });

  if (today) {
    cards.push({
      id: 'outlook',
      icon: 'CalendarClock',
      tag: "Today's outlook",
      title: `High of ${Math.round(today.temp.max)}${tempUnit}, low of ${Math.round(today.temp.min)}${tempUnit}`,
      body: today.pop >= 0.3
        ? `There's a ${Math.round(today.pop * 100)}% chance of precipitation today — worth keeping a jacket or umbrella handy.`
        : `Precipitation chance is low today at around ${Math.round(today.pop * 100)}%.`,
      publishedAt: now,
    });
  }

  if (current.wind_speed >= WINDY_THRESHOLD_KMH) {
    cards.push({
      id: 'wind',
      icon: 'Wind',
      tag: 'Wind advisory',
      title: `Breezy conditions — ${Math.round(current.wind_speed)} ${windUnit} from the ${windDirection(current.wind_deg)}`,
      body: 'Secure loose outdoor items and use caution with high-profile vehicles or bikes today.',
      publishedAt: now,
    });
  }

  const uvLevel = UV_LEVELS.find((l) => current.uvi <= l.max);
  if (current.uvi >= 3) {
    cards.push({
      id: 'uv',
      icon: 'Sun',
      tag: `UV ${uvLevel.label}${current.uviEstimated ? ' (estimated)' : ''}`,
      title: `UV index is ${current.uvi.toFixed(1)} today`,
      body: uvAdvice(current.uvi),
      publishedAt: now,
    });
  }

  if (airQuality) {
    const aqiInfo = AQI_LABELS[airQuality.aqi];
    cards.push({
      id: 'aqi',
      icon: 'Wind',
      tag: `Air quality: ${aqiInfo.label}`,
      title: airQuality.aqi >= 3
        ? `Air quality is ${aqiInfo.label.toLowerCase()} in ${place} today`
        : `Air quality is ${aqiInfo.label.toLowerCase()} in ${place}`,
      body: airQuality.aqi >= 3
        ? 'Consider limiting prolonged outdoor exertion, especially for sensitive groups.'
        : 'Good conditions for spending time outdoors.',
      publishedAt: now,
    });
  }

  if (current.visibility < 5000) {
    cards.push({
      id: 'visibility',
      icon: 'Eye',
      tag: 'Reduced visibility',
      title: `Visibility is around ${(current.visibility / 1000).toFixed(1)} km in ${place}`,
      body: 'Allow extra following distance while driving and use low-beam headlights if visibility keeps dropping.',
      publishedAt: now,
    });
  }

  if (daily && daily.length > 2) {
    const upcoming = daily.slice(1, Math.min(daily.length, 5));
    const avgMax = upcoming.reduce((sum, d) => sum + d.temp.max, 0) / upcoming.length;
    const trendVsToday = today ? avgMax - today.temp.max : 0;
    const trendWord = trendVsToday >= 2 ? 'warming up' : trendVsToday <= -2 ? 'cooling down' : 'holding steady';
    cards.push({
      id: 'trend',
      icon: trendVsToday >= 2 ? 'TrendingUp' : trendVsToday <= -2 ? 'TrendingDown' : 'CalendarDays',
      tag: `Next ${upcoming.length} days`,
      title: `${place} is ${trendWord} over the next few days`,
      body: `Average highs are trending toward ${Math.round(avgMax)}${tempUnit} across the available forecast window.`,
      publishedAt: now,
    });
  }

  const tempC = unit === 'metric' ? current.temp : (current.temp - 32) * (5 / 9);
  const hydration = hydrationAdvice(tempC, current.humidity);
  cards.push({
    id: 'hydration',
    icon: 'Droplets',
    tag: 'Health tip',
    title: `Hydration guidance: ${hydration.level}`,
    body: hydration.tip,
    publishedAt: now,
  });

  cards.push({
    id: 'sun',
    icon: 'Sunrise',
    tag: 'Sun times',
    title: `Sunrise ${formatTime(current.sunrise, tz)}, sunset ${formatTime(current.sunset, tz)}`,
    body: `Daylight lasts about ${formatDuration(current.sunset - current.sunrise)} today.`,
    publishedAt: now,
  });

  return cards;
}
