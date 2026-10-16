/** Returns a normalized http(s) URL string, or null for anything else (javascript:, data:, relative, garbage). */
export function safeHttpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Images additionally require https so the page never mixes insecure content. */
export function safeImageUrl(value) {
  const url = safeHttpUrl(value);
  return url && url.startsWith('https:') ? url : null;
}
