import { useEffect, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';

const DOUBLE_CLICK_GRACE_MS = 280;

/**
 * Picks a location on single click. Waits briefly so a double-click (zoom)
 * or the start of a drag/zoom never counts as a pick; the old handler fired
 * on every click, including both clicks of a double-click-to-zoom.
 */
export default function ClickToSelect({ onPick }) {
  const timer = useRef(null);
  const cancel = () => {
    window.clearTimeout(timer.current);
    timer.current = null;
  };

  useMapEvents({
    click(e) {
      cancel();
      const { lat, lng } = e.latlng;
      timer.current = window.setTimeout(() => onPick(lat, lng), DOUBLE_CLICK_GRACE_MS);
    },
    dblclick: cancel,
    zoomstart: cancel,
    movestart: cancel,
  });

  useEffect(() => cancel, []);
  return null;
}
