import { describe, it, expect } from 'vitest';
import { getBaseMapConfig } from '../../src/components/map/baseMap';

describe('getBaseMapConfig', () => {
  it('never uses unkeyed CARTO tiles (they come back watermarked)', () => {
    for (const k of [undefined, null, '', '   ', 123]) {
      const c = getBaseMapConfig(k);
      expect(c.id).toBe('osm-dark');
      expect(c.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(c.url).not.toMatch(/cartocdn/);
      expect(c.options.className).toBe('skyvault-osm-dark');
      expect(c.options.attribution).toMatch(/OpenStreetMap/);
    }
  });

  it('uses CARTO dark tiles with the key as a URL parameter when configured', () => {
    const c = getBaseMapConfig('  my key&x  ');
    expect(c.id).toBe('carto-dark');
    expect(c.url).toBe('https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=my%20key%26x');
    expect(c.options.attribution).toMatch(/CARTO/);
    expect(c.options.attribution).toMatch(/OpenStreetMap/);
  });
});
