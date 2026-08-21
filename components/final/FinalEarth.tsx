'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { FINAL_SECTION } from '@/data/content';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { onProgress } from '@/lib/story/store';
import { clamp, range, smootherstep } from '@/lib/utils/math';
import EarthFallback from '@/components/hero/EarthFallback';

/**
 * Act VIII — the return.
 *
 * Deliberately the *same* component as the hero (`EarthScene mode="final"`), same
 * shader, same sphere, same land raster. The visual loop the brief asks for only
 * closes if it is literally the same planet; a second, similar globe would read
 * as a different asset and break the argument that we have come back to where we
 * started, changed.
 *
 * What differs is what it is wearing. `mode="final"` turns on the analysis layer
 * (coverage cells over land, detected-object points), brightens the graticule,
 * keeps the orbital paths lit, and holds a slow orbit instead of diving. The
 * planet is now instrumented — that is the whole payoff.
 *
 * The camera stays high: after the dive, Act II–VI and the decision section, the
 * one thing this section must not do is start another journey.
 */

const EarthScene = dynamic(() => import('@/components/hero/EarthScene'), {
  ssr: false,
  loading: () => null,
});

export default function FinalEarth() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const { caps, scrollTo } = useScrollContext();
  const [mounted, setMounted] = useState(false);

  useStoryTrigger(sectionRef, 'finalEarth', {
    length: caps.mobile ? 2.4 : 3.2,
    pin: true,
    enabled: caps.ready,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return onProgress('finalEarth', (p) => {
      const copy = copyRef.current;
      if (copy) {
        // Copy arrives with the data layers, and stays. This is the last thing
        // on the page that asks for anything — it must not leave.
        const inP = smootherstep(range(p, 0.06, 0.34));
        copy.style.opacity = String(inP);
        copy.style.transform = `translate3d(0, ${(1 - inP) * 34}px, 0)`;
      }

      const scene = sceneRef.current;
      if (scene) {
        // A gentle rise: the planet settles into frame rather than sitting still.
        scene.style.transform = `translate3d(0, ${(1 - smootherstep(clamp(p / 0.5))) * 26}px, 0)`;
      }

      const status = statusRef.current;
      if (status) status.style.opacity = String(smootherstep(range(p, 0.45, 0.72)));
    });
  }, []);

  const showScene = mounted && caps.ready && caps.webgl2 && caps.tier !== 'low';
  const showFallback = mounted && caps.ready && (!caps.webgl2 || caps.tier === 'low');

  const onCta = (href: string) => (e: React.MouseEvent) => {
    if (href.startsWith('#') && document.querySelector(href)) {
      e.preventDefault();
      scrollTo(href, { offset: -10 });
    }
    // External (the real SaaS app) navigates normally via the anchor.
  };
  // Open external CTAs in a new tab, consistent with the navbar/hero.
  const ext = (href: string) =>
    /^https?:\/\//.test(href) ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {};

  return (
    <section
      ref={sectionRef}
      data-scene="dark"
      className="relative h-[100svh] w-full overflow-hidden bg-void"
      aria-label="See Earth differently"
    >
      {/* ---------- the planet, instrumented ---------- */}
      <div ref={sceneRef} className="absolute inset-0 will-transform">
        {showScene && (
          <EarthScene caps={caps} channel="finalEarth" mode="final" className="absolute inset-0" />
        )}
        {showFallback && <EarthFallback caps={caps} className="absolute inset-0" />}
      </div>

      {/* Floor gradient so the type has a base and the canvas edge disappears. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(110% 70% at 50% 96%, rgb(var(--c-void) / 0.95) 0%, rgb(var(--c-void) / 0.6) 38%, transparent 68%), linear-gradient(to top, rgb(var(--c-void) / 0.92), transparent 42%)',
        }}
      />

      {/* ---------- copy + CTAs ---------- */}
      <div
        ref={copyRef}
        className="absolute inset-x-0 bottom-0 z-30 opacity-0 will-transform"
      >
        <div className="mx-auto max-w-[1600px] px-6 pb-[calc(env(safe-area-inset-bottom)+3.2rem)] md:px-10 md:pb-[4.4rem]">
          <div className="max-w-[44rem]">
            <h2 className="display text-[clamp(2.4rem,8vw,7rem)] text-chalk">
              {FINAL_SECTION.headline}
            </h2>
            <p className="mt-6 max-w-[28rem] text-[clamp(0.98rem,1.6vw,1.2rem)] leading-snug text-mist">
              {FINAL_SECTION.body}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={FINAL_SECTION.primary.href}
                onClick={onCta(FINAL_SECTION.primary.href)}
                {...ext(FINAL_SECTION.primary.href)}
                className="group relative inline-flex items-center gap-2.5 overflow-hidden bg-chalk px-7 py-3.5 text-[13px] font-medium tracking-wide text-void transition-colors duration-500"
              >
                <span className="relative z-10">{FINAL_SECTION.primary.label}</span>
                <span
                  aria-hidden
                  className="relative z-10 transition-transform duration-500 ease-cinema group-hover:translate-x-1"
                >
                  →
                </span>
                <span className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-600 ease-cinema group-hover:scale-x-100" />
              </a>
              <a
                href={FINAL_SECTION.secondary.href}
                onClick={onCta(FINAL_SECTION.secondary.href)}
                className="inline-flex items-center gap-2.5 border border-white/15 px-7 py-3.5 text-[13px] font-medium tracking-wide text-chalk transition-all duration-500 hover:border-signal/50 hover:text-signal"
              >
                {FINAL_SECTION.secondary.label}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- telemetry: what the planet is now showing ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+4.8rem)] z-30">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 md:px-10">
          <span className="label-sm">Global · analysed coverage</span>
          <span
            ref={statusRef}
            className="label-sm flex items-center gap-2 text-signal/80 opacity-0"
          >
            <span className="relative flex h-1 w-1">
              <span className="absolute inset-0 rounded-full bg-signal" />
              <span className="absolute inset-0 animate-ping rounded-full bg-signal/50" />
            </span>
            Layers active
          </span>
        </div>
      </div>
    </section>
  );
}
