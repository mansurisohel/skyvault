import { useEffect, useRef, useState } from 'react';

/**
 * Renders `children` only once the placeholder scrolls near the viewport, so
 * heavy sections (the map and its tile requests) cost nothing until needed.
 */
export default function LazyOnVisible({ children, fallback = null, rootMargin = '400px' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}
