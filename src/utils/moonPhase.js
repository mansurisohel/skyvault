// Moon phase via a standard synodic-month approximation. Accurate to within
// a few hours, which is more than enough for a "what phase is it tonight"
// feature (real ephemeris data needs a dedicated astronomy API).
const SYNODIC_MONTH = 29.530588853; // days
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // Jan 6 2000, 18:14 UTC

export function getMoonPhase(date = new Date()) {
  const daysSinceKnown = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const cycles = daysSinceKnown / SYNODIC_MONTH;
  const age = (cycles - Math.floor(cycles)) * SYNODIC_MONTH; // 0..29.53
  const fraction = age / SYNODIC_MONTH; // 0..1

  const illumination = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) * 50);

  const phases = [
    { max: 1.84566, key: 'new', name: 'New Moon' },
    { max: 5.53699, key: 'waxing-crescent', name: 'Waxing Crescent' },
    { max: 9.22831, key: 'first-quarter', name: 'First Quarter' },
    { max: 12.91963, key: 'waxing-gibbous', name: 'Waxing Gibbous' },
    { max: 16.61096, key: 'full', name: 'Full Moon' },
    { max: 20.30228, key: 'waning-gibbous', name: 'Waning Gibbous' },
    { max: 23.99361, key: 'last-quarter', name: 'Last Quarter' },
    { max: 27.68493, key: 'waning-crescent', name: 'Waning Crescent' },
    { max: SYNODIC_MONTH, key: 'new', name: 'New Moon' },
  ];
  const phase = phases.find((p) => age <= p.max) ?? phases[0];

  const daysToNewMoon = SYNODIC_MONTH - age;
  const daysToFullMoon = age <= 14.7652944
    ? 14.7652944 - age
    : SYNODIC_MONTH - age + 14.7652944;

  return {
    age,
    fraction,
    illumination,
    key: phase.key,
    name: phase.name,
    daysToNewMoon: Math.round(daysToNewMoon),
    daysToFullMoon: Math.round(daysToFullMoon),
  };
}

// Activity guidance grounded in real, commonly cited lore and practical
// reasoning (dark-sky visibility for stargazing, solunar theory for fishing,
// lunar planting calendars for gardening) rather than invented claims.
export const MOON_ACTIVITIES = {
  new: {
    tagline: 'Darkest skies of the month — best for anything that loves the dark.',
    activities: [
      { name: 'Stargazing', icon: 'Telescope', reason: 'No moonlight washing out the sky — faint stars and the Milky Way are at their clearest.' },
      { name: 'Camping', icon: 'Tent', reason: 'Pair a dark campsite with a clear night for the best sky views of the month.' },
      { name: 'Night photography', icon: 'Camera', reason: 'Minimal ambient light makes this an ideal window for long-exposure astrophotography.' },
      { name: 'Fishing', icon: 'Fish', reason: 'Solunar theory rates new-moon periods as a strong feeding window for many species.' },
    ],
  },
  'waxing-crescent': {
    tagline: 'A sliver of light returns — mild evenings, still dark enough to see stars.',
    activities: [
      { name: 'Gardening', icon: 'Sprout', reason: 'Traditional lunar planting calendars favor the waxing phase for sowing leafy, above-ground crops.' },
      { name: 'Evening cycling', icon: 'Bike', reason: 'A thin crescent low on the horizon makes for a pleasant, easy-to-spot evening ride marker.' },
      { name: 'Stargazing', icon: 'Telescope', reason: 'Skies stay dark for most of the night before the crescent sets early.' },
      { name: 'Hiking', icon: 'Mountain', reason: 'Cooler evening light and minimal glare make for comfortable trail conditions.' },
    ],
  },
  'first-quarter': {
    tagline: 'Half-lit and high after sunset — good light without overpowering the stars.',
    activities: [
      { name: 'Running', icon: 'PersonStanding', reason: 'Moonlight through early evening adds a bit of natural light for dusk runs.' },
      { name: 'Camping', icon: 'Tent', reason: 'Enough moonlight to move around camp comfortably after dark.' },
      { name: 'Gardening', icon: 'Sprout', reason: 'Still within the traditional waxing window favored for planting.' },
      { name: 'Fishing', icon: 'Fish', reason: 'A secondary solunar peak often falls around moonrise on quarter-moon days.' },
    ],
  },
  'waxing-gibbous': {
    tagline: 'Bright and building toward full — great for evening visibility.',
    activities: [
      { name: 'Evening hiking', icon: 'Mountain', reason: 'Strong moonlight extends usable daylight-like visibility into the evening.' },
      { name: 'Cycling', icon: 'Bike', reason: 'Well-lit roads and paths after dusk make for safer low-light rides.' },
      { name: 'Fishing', icon: 'Fish', reason: 'Solunar activity typically builds toward its monthly peak as the moon nears full.' },
      { name: 'Night photography', icon: 'Camera', reason: 'A bright gibbous moon makes an interesting subject and natural light source.' },
    ],
  },
  full: {
    tagline: 'Maximum moonlight — the brightest nights of the month.',
    activities: [
      { name: 'Night walks', icon: 'Moon', reason: 'The moon lights up paths and landscapes almost like a soft streetlight.' },
      { name: 'Fishing', icon: 'Fish', reason: "The full moon is the classic peak of the solunar calendar for many anglers." },
      { name: 'Camping', icon: 'Tent', reason: 'Bright enough to move around camp without a headlamp for most of the night.' },
      { name: 'Photography', icon: 'Camera', reason: 'A rising full moon over a horizon is one of the most photogenic sky events.' },
    ],
  },
  'waning-gibbous': {
    tagline: 'Still bright, now rising later in the evening.',
    activities: [
      { name: 'Early stargazing', icon: 'Telescope', reason: 'The first few hours after sunset stay dark before moonrise.' },
      { name: 'Fishing', icon: 'Fish', reason: 'Activity often stays elevated for a few days after the full moon.' },
      { name: 'Evening cycling', icon: 'Bike', reason: 'Cooler temperatures and lingering moonlight suit an after-dinner ride.' },
      { name: 'Camping', icon: 'Tent', reason: 'Late moonrise means a dark start to the night, followed by natural light later on.' },
    ],
  },
  'last-quarter': {
    tagline: 'Half-lit again, now rising around midnight.',
    activities: [
      { name: 'Stargazing', icon: 'Telescope', reason: 'Dark evening skies before the moon rises late at night.' },
      { name: 'Gardening', icon: 'Sprout', reason: 'Lunar calendars traditionally favor the waning phase for root crops and pruning.' },
      { name: 'Running', icon: 'PersonStanding', reason: 'Cooler, darker evenings suit an early workout without moon glare.' },
      { name: 'Hiking', icon: 'Mountain', reason: 'Good visibility conditions with a calmer, darker sky overall.' },
    ],
  },
  'waning-crescent': {
    tagline: 'A thin morning crescent — dark evenings return.',
    activities: [
      { name: 'Stargazing', icon: 'Telescope', reason: 'Nearly moonless evenings make this one of the best windows before the next new moon.' },
      { name: 'Camping', icon: 'Tent', reason: 'Dark, quiet nights are ideal for a low-light-pollution trip.' },
      { name: 'Gardening', icon: 'Sprout', reason: 'The end of the waning phase is traditionally used for rest and soil preparation.' },
      { name: 'Fishing', icon: 'Fish', reason: 'A minor solunar uptick often appears as the cycle approaches new moon again.' },
    ],
  },
};
