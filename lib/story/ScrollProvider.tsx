'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/story/gsap';
import type Lenis from 'lenis';
import { useCapabilities, type Capabilities } from '@/lib/hooks/useCapabilities';

/**
 * ScrollProvider — one smooth-scroll engine, one ScrollTrigger clock.
 *
 * Lenis drives scroll; ScrollTrigger is told to read position from Lenis rather
 * than from the native scroll event. Without that handshake the two run on
 * different clocks and everything scroll-linked jitters by a frame.
 *
 * gsap.ticker drives Lenis (instead of Lenis' own RAF) so GSAP tweens, Lenis
 * interpolation and ScrollTrigger updates all happen in one ordered pass.
 *
 * Reduced motion: Lenis is not started at all. ScrollTrigger still works, so
 * scrubbed sections remain *scroll-position-driven* — they just track the native
 * scroll exactly. That preserves the narrative without any smoothing or inertia.
 */

interface ScrollContextValue {
  lenis: Lenis | null;
  caps: Capabilities;
  ready: boolean;
  scrollTo: (target: string | number, opts?: { offset?: number; immediate?: boolean }) => void;
}

const ScrollContext = createContext<ScrollContextValue>({
  lenis: null,
  caps: {
    tier: 'high',
    reducedMotion: false,
    touch: false,
    mobile: false,
    webgl2: true,
    dpr: 1,
    ready: false,
  },
  ready: false,
  scrollTo: () => {},
});

export const useScrollContext = (): ScrollContextValue => useContext(ScrollContext);

export default function ScrollProvider({ children }: { children: ReactNode }) {
  const caps = useCapabilities();
  const lenisRef = useRef<Lenis | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!caps.ready) return;

    // (ScrollTrigger itself is registered at import time — see lib/story/gsap.)
    // The page's animations are all scroll-driven; a global default of no
    // overwrite protection avoids surprise tween conflicts on resize rebuilds.
    gsap.defaults({ ease: 'power2.out', overwrite: 'auto' });

    let lenis: Lenis | null = null;
    let disposed = false;

    const setup = async () => {
      if (!caps.reducedMotion) {
        const { default: LenisCtor } = await import('lenis');
        if (disposed) return;

        lenis = new LenisCtor({
          // ~1.05s to settle: long enough to feel cinematic, short enough that
          // the page never feels like it is fighting the wheel.
          duration: 1.05,
          easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          // Touch smoothing is deliberately off: overriding native momentum on
          // mobile always feels worse than the platform's own.
          syncTouch: false,
          touchMultiplier: 1.6,
          wheelMultiplier: 1,
          infinite: false,
          autoResize: true,
        });
        lenisRef.current = lenis;

        // Handshake: ScrollTrigger updates on Lenis frames…
        lenis.on('scroll', ScrollTrigger.update);
        // …and Lenis advances on the GSAP ticker (ms → s).
        const raf = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(200, 33);

        /* No scrollerProxy. In its default configuration Lenis writes the real
           window scroll position every frame, so ScrollTrigger's normal window
           scroller is already authoritative — it only needs to be told *when* to
           re-read, which is what the `scroll` handler above does. A proxy would
           also have to be installed before any trigger is created, and triggers
           are created by child sections that mount before this runs. */

        (lenis as unknown as { __gsapRaf?: (t: number) => void }).__gsapRaf = raf;
      }

      // Restoring a mid-page scroll position before pinned sections are measured
      // produces wrong pin spacing; start from the top.
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

      ScrollTrigger.refresh();
      setReady(true);

      /* Arrived with a hash (e.g. from /services → '/#pricing')? Converge on the
         section as the lazy/pinned sections mount and heights settle.
         history.scrollRestoration is manual, so this doesn't fight a restored
         position. */
      if (window.location.hash && window.location.hash.length > 1) {
        const { convergeScroll } = await import('./anchorScroll');
        window.setTimeout(() => convergeScroll(lenis, window.location.hash), 360);
      }
    };

    void setup();

    /* Re-measure after webfonts land: pinned section heights depend on text
       metrics, and a late font swap otherwise shifts every trigger. */
    const onFonts = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(onFonts).catch(() => {});

    // Orientation changes on mobile need a delayed refresh: the viewport
    // reports stale dimensions immediately after the event.
    let orientTimer = 0;
    const onOrient = () => {
      window.clearTimeout(orientTimer);
      orientTimer = window.setTimeout(() => ScrollTrigger.refresh(), 260);
    };
    window.addEventListener('orientationchange', onOrient);

    return () => {
      disposed = true;
      window.removeEventListener('orientationchange', onOrient);
      window.clearTimeout(orientTimer);
      const raf = (lenis as unknown as { __gsapRaf?: (t: number) => void } | null)?.__gsapRaf;
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      lenisRef.current = null;
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [caps.ready, caps.reducedMotion]);

  const value = useMemo<ScrollContextValue>(
    () => ({
      lenis: lenisRef.current,
      caps,
      ready,
      scrollTo: (target, opts) => {
        const offset = opts?.offset ?? 0;
        if (lenisRef.current) {
          lenisRef.current.scrollTo(target, {
            offset,
            duration: opts?.immediate ? 0 : 1.4,
            immediate: opts?.immediate,
          });
          return;
        }
        // Reduced motion / no Lenis: native jump.
        const el = typeof target === 'string' ? document.querySelector(target) : null;
        const top =
          typeof target === 'number'
            ? target
            : el
              ? el.getBoundingClientRect().top + window.scrollY + offset
              : 0;
        window.scrollTo({ top, behavior: caps.reducedMotion ? 'auto' : 'smooth' });
      },
    }),
    [caps, ready],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}
