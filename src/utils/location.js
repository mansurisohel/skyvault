/** Rounded so the same place found via search, GPS or a map click compares equal (~1 km). */
export function locationKey(loc) {
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lon)) return '';
  return `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
}

export function sameLocation(a, b) {
  const ka = locationKey(a);
  return ka !== '' && ka === locationKey(b);
}

/** Trims, strips control characters, collapses spaces and caps length. */
export function sanitizeQuery(value, max = 80) {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function validCoords(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
