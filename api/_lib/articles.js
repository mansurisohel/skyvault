// Validates and trims GNews articles before they are forwarded to the browser.
// Only fields the UI needs are kept (no full `content`), URLs must be http(s),
// and every string is length-capped.

function httpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function sanitizeArticles(raw) {
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  const out = [];

  for (const a of raw) {
    if (!a || typeof a !== 'object') continue;
    const title = text(a.title, 300);
    const url = httpUrl(a.url);
    const published = new Date(a.publishedAt);
    if (!title || !url || Number.isNaN(published.getTime())) continue;

    const dedupeKey = url.replace(/[?#].*$/, '').toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({
      title,
      description: text(a.description, 500),
      url,
      image: httpUrl(a.image),
      publishedAt: published.toISOString(),
      source: {
        name: text(a.source?.name, 80) || 'Unknown source',
        url: httpUrl(a.source?.url),
      },
    });
  }
  return out;
}
