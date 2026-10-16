// Server-side only. Nothing in src/ may import this file, and none of these
// values are ever sent to the browser.
//
// Files in api/ whose name starts with "_" are not exposed as routes on
// Vercel (or by the local dev middleware), so this is a safe place for shared code.

const warnedLegacy = new Set();

function clean(value) {
  if (typeof value !== 'string') return '';
  // Copy/paste into a dashboard often drags along whitespace or quotes.
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

function readKey(primary, legacyNames = []) {
  const value = clean(process.env[primary]);
  if (value) return value;

  for (const name of legacyNames) {
    const legacy = clean(process.env[name]);
    if (!legacy) continue;
    if (!warnedLegacy.has(name)) {
      warnedLegacy.add(name);
      // Logs the variable NAME only, never the value.
      console.warn(`[skyvault] ${name} still works but is a legacy name. Rename it to ${primary}.`);
    }
    return legacy;
  }
  return '';
}

export function getOpenWeatherKey() {
  return readKey('OPENWEATHER_API_KEY', ['VITE_OPENWEATHER_API_KEY']);
}

export function getGNewsKey() {
  return readKey('GNEWS_API_KEY', ['VITE_GNEWS_DEV_KEY']);
}
