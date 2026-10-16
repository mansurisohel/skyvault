// Tiny observable store describing which backend integrations are usable.
//   'unknown'     not contacted yet
//   'ok'          responded normally
//   'missing'     the server has no API key configured (demo/sample mode)
//   'unavailable' API routes are not reachable in this environment
let state = { openweather: 'unknown', news: 'unknown' };
const listeners = new Set();

export const getServiceStatus = () => state;

export function setServiceStatus(name, value) {
  if (state[name] === value) return;
  state = { ...state, [name]: value };
  listeners.forEach((listener) => listener());
}

export function subscribeServiceStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isDemoStatus = (value) => value === 'missing' || value === 'unavailable';

export function resetServiceStatus() {
  state = { openweather: 'unknown', news: 'unknown' };
  listeners.forEach((listener) => listener());
}
