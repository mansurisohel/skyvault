// OpenWeather's geocoding API only accepts a 2-letter ISO 3166 country code
// in the "city,state,country" query format — not a full country name. People
// naturally type the full name ("Paris, France"), which otherwise silently
// returns zero results. This covers the countries most likely to be searched;
// searchLocations() also has a broader fallback for anything not listed here.
export const COUNTRY_NAME_TO_CODE = {
  'united states': 'US',
  usa: 'US',
  'united states of america': 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  england: 'GB',
  'great britain': 'GB',
  'united arab emirates': 'AE',
  uae: 'AE',
  india: 'IN',
  france: 'FR',
  germany: 'DE',
  spain: 'ES',
  italy: 'IT',
  japan: 'JP',
  china: 'CN',
  canada: 'CA',
  australia: 'AU',
  brazil: 'BR',
  mexico: 'MX',
  russia: 'RU',
  'south korea': 'KR',
  'south africa': 'ZA',
  netherlands: 'NL',
  switzerland: 'CH',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  portugal: 'PT',
  greece: 'GR',
  turkey: 'TR',
  egypt: 'EG',
  'saudi arabia': 'SA',
  singapore: 'SG',
  malaysia: 'MY',
  thailand: 'TH',
  indonesia: 'ID',
  philippines: 'PH',
  vietnam: 'VN',
  pakistan: 'PK',
  bangladesh: 'BD',
  nigeria: 'NG',
  kenya: 'KE',
  argentina: 'AR',
  chile: 'CL',
  colombia: 'CO',
  peru: 'PE',
  poland: 'PL',
  ireland: 'IE',
  austria: 'AT',
  belgium: 'BE',
  'new zealand': 'NZ',
  israel: 'IL',
  ukraine: 'UA',
  'czech republic': 'CZ',
  czechia: 'CZ',
  romania: 'RO',
  hungary: 'HU',
  iceland: 'IS',
  morocco: 'MA',
  qatar: 'QA',
  kuwait: 'KW',
  oman: 'OM',
  bahrain: 'BH',
};

/**
 * Normalizes a free-text search query for OpenWeather's geocoding API:
 * trims each "city,state,country" segment, and swaps a recognized full
 * country name for its ISO code so common phrasing like "Paris, France"
 * resolves instead of silently returning nothing.
 */
export function normalizeGeocodeQuery(query) {
  const parts = query.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const lastIdx = parts.length - 1;
    const code = COUNTRY_NAME_TO_CODE[parts[lastIdx].toLowerCase()];
    if (code) parts[lastIdx] = code;
  }
  return parts.join(',');
}
