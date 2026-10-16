// Watches a Leaflet tile layer and reports whether most of its tiles are
// failing to load, so the UI can say so instead of silently showing nothing.
// Counters reset on every load cycle (pan/zoom), so a temporary glitch clears itself.
export function trackTileHealth(layer, onChange) {
  let total = 0;
  let errors = 0;
  let failing = false;

  const report = (next) => {
    if (next !== failing) {
      failing = next;
      onChange?.(next);
    }
  };

  layer.on('loading', () => { total = 0; errors = 0; });
  layer.on('tileloadstart', () => { total += 1; });
  layer.on('tileerror', () => { errors += 1; });
  layer.on('load', () => {
    report(total > 0 && errors > 0 && (total === 1 || errors / total >= 0.5));
  });

  return () => layer.off();
}

// 1x1 transparent PNG so a failed tile never shows a broken-image icon.
export const BLANK_TILE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
