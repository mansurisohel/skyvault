// The Beaufort scale is the real, standard meteorological classification
// for wind speed — using it (rather than an arbitrary label) gives an
// accurate, recognizable description instead of just a bare number.
// Thresholds are in km/h; convert before calling if needed.
const BEAUFORT_SCALE = [
  { force: 0, max: 1, label: 'Calm', description: 'Smoke rises vertically; almost no air movement.' },
  { force: 1, max: 5, label: 'Light air', description: 'Barely noticeable; smoke drifts slightly.' },
  { force: 2, max: 11, label: 'Light breeze', description: 'Wind felt on skin; leaves rustle gently.' },
  { force: 3, max: 19, label: 'Gentle breeze', description: 'Leaves and small twigs move; flags extend.' },
  { force: 4, max: 28, label: 'Moderate breeze', description: 'Dust and loose paper lift; small branches move.' },
  { force: 5, max: 38, label: 'Fresh breeze', description: 'Small trees sway; noticeable on bikes and boats.' },
  { force: 6, max: 49, label: 'Strong breeze', description: 'Large branches move; umbrellas become hard to use.' },
  { force: 7, max: 61, label: 'Near gale', description: 'Whole trees sway; walking into it takes effort.' },
  { force: 8, max: 74, label: 'Gale', description: 'Twigs break off trees; progress on foot is hard.' },
  { force: 9, max: 88, label: 'Severe gale', description: 'Structural damage possible; branches break.' },
  { force: 10, max: 102, label: 'Storm', description: 'Trees uprooted; considerable structural damage.' },
  { force: 11, max: 117, label: 'Violent storm', description: 'Widespread damage — exceptionally rare inland.' },
  { force: 12, max: Infinity, label: 'Hurricane force', description: 'Severe, widespread destruction.' },
];

/** windKmh must be in km/h regardless of the display unit — convert first if needed. */
export function getBeaufortScale(windKmh) {
  return BEAUFORT_SCALE.find((b) => windKmh <= b.max) ?? BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
}

export function mphToKmh(mph) {
  return mph * 1.60934;
}
