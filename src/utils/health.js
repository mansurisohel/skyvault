// The free-tier /uvi endpoint is deprecated and unavailable to many keys.
// This estimates UV from solar geometry (latitude + time of day) and cloud
// cover — the same class of heuristic meteorologists use for a rough clear/
// cloudy-sky index — and is only used when the real reading isn't available.
// The UI labels it as an estimate rather than presenting it as measured data.
export function estimateUVIndex(lat, cloudsPct, localHour) {
  const maxUV = Math.max(0, 11 - Math.abs(lat) / 10);
  const solarFactor = Math.max(0, Math.sin((Math.PI * (localHour - 6)) / 12));
  const cloudFactor = 1 - (cloudsPct / 100) * 0.7;
  return Math.round(maxUV * solarFactor * cloudFactor * 10) / 10;
}

// OpenWeather's free tiers don't expose pollen data (that needs a dedicated
// allergy API like Ambee/Breezometer). This gives a clearly-labeled estimate
// based on season and temperature so the section is still useful, without
// pretending to be a real pollen sensor reading.
export function estimatePollen(tempC, month) {
  const springSummer = month >= 2 && month <= 7; // Mar–Aug (Northern-hemisphere biased, but presented as an estimate)
  const mild = tempC > 10 && tempC < 32;
  let level = 1;
  if (springSummer && mild) level = tempC > 18 ? 4 : 3;
  else if (springSummer) level = 2;
  else if (mild) level = 2;

  const labels = {
    1: { label: 'Low', color: '#5fd18b' },
    2: { label: 'Moderate', color: '#a9d15f' },
    3: { label: 'High', color: '#f5c542' },
    4: { label: 'Very High', color: '#f58a42' },
  };
  return { level, ...labels[level] };
}

export function hydrationAdvice(tempC, humidity) {
  const heatLoad = tempC + (humidity - 50) / 10;
  if (tempC >= 30 && humidity >= 55) {
    return { level: 'High', tip: 'Heat and humidity both elevated — drink water more often than usual and take breaks in shade during peak hours.' };
  }
  if (heatLoad >= 26) {
    return { level: 'Elevated', tip: 'Warm conditions increase fluid loss — keep water on hand, especially during exercise or time outdoors.' };
  }
  if (tempC <= 5) {
    return { level: 'Standard', tip: 'Cold air is drier than it feels — it\'s easy to under-drink in cool weather, so keep sipping water regularly.' };
  }
  return { level: 'Standard', tip: 'Conditions are mild — normal daily water intake should be plenty.' };
}

export function uvAdvice(uvi) {
  if (uvi >= 8) return 'Very high UV — wear SPF 30+, sunglasses, and a hat; seek shade between 11am–3pm.';
  if (uvi >= 6) return 'High UV — sunscreen and sunglasses recommended for extended time outside.';
  if (uvi >= 3) return 'Moderate UV — sunscreen recommended for fair skin or long exposure.';
  return 'Low UV — minimal protection needed for most skin types.';
}
