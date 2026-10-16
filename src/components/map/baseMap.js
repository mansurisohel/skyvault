// Base map selection.
//
// CARTO now requires a free API key on basemaps.cartocdn.com (since Aug 2026);
// unkeyed tiles come back with an "API KEY REQUIRED" watermark baked into the
// image, which can't be detected as a failed request. So:
//   - with a key  -> CARTO dark tiles (matches the SkyVault theme natively)
//   - without one -> OpenStreetMap tiles, darkened with a CSS filter, so the
//                    map is never watermarked and needs no account.
//
// The CARTO key is meant to be public (it ships in tile URLs). Restrict it to
// your site's domain in the CARTO basemaps dashboard.

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

/** Pure function (unit tested): decides which base map to draw. */
export function getBaseMapConfig(cartoKey) {
  const key = typeof cartoKey === 'string' ? cartoKey.trim() : '';
  if (key) {
    return {
      id: 'carto-dark',
      url: `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`,
      options: { attribution: CARTO_ATTRIBUTION },
    };
  }
  return {
    id: 'osm-dark',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { attribution: OSM_ATTRIBUTION, className: 'skyvault-osm-dark' },
  };
}
