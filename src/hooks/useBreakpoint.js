import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);
  return {
    width,
    isMobile:  width < 480,
    isSmall:   width < 640,
    isTablet:  width < 960,
    isDesktop: width >= 960,
  };
}
