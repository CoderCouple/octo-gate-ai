'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';

// Track the width of a container element via ResizeObserver so children
// (e.g. a canvas that can't just be CSS-scaled) can re-render at the
// current width. Returns [ref, width]; width is 0 until first measure.
//
// Returns a MutableRefObject (not RefObject) so it accepts a nullable
// `.current` — assignable to a React `<div ref={...}>` under both React
// 18 and 19 typings.
export function useContainerWidth<T extends HTMLElement>(): [MutableRefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}
