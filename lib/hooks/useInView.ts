'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Visibility gate for expensive children.
 *
 * Two thresholds, deliberately:
 *  • `near` (large rootMargin) → mount the scene, compile shaders, warm up
 *  • `inView`                  → actually render frames
 * That split is why scrolling never lands on a blank canvas *and* why five
 * WebGL panels don't all render simultaneously.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: { rootMargin?: string; nearMargin?: string; once?: boolean } = {},
): { ref: RefObject<T | null>; inView: boolean; near: boolean } {
  const { rootMargin = '0px', nearMargin = '80% 0px', once = false } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      setNear(true);
      return;
    }

    const ioNear = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setNear(true);
          ioNear.disconnect(); // mounting is one-way
        }
      },
      { rootMargin: nearMargin },
    );
    const ioView = new IntersectionObserver(
      ([e]) => {
        const v = !!e?.isIntersecting;
        setInView(v);
        if (v && once) ioView.disconnect();
      },
      { rootMargin, threshold: 0 },
    );

    ioNear.observe(el);
    ioView.observe(el);
    return () => {
      ioNear.disconnect();
      ioView.disconnect();
    };
  }, [rootMargin, nearMargin, once]);

  return { ref, inView, near };
}
