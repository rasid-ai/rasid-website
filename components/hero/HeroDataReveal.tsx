'use client';

import { useEffect, useRef } from 'react';
import { HERO_DATA } from '@/data/content';
import { onProgress } from '@/lib/story/store';
import { range, smootherstep } from '@/lib/utils/math';

/**
 * "Earth is data" beats, revealed one after another over the hero's descent.
 *
 * This replaces the old standalone DataSection — folding the message into the
 * dive removes the section seam (no pin hand-off, no dead scroll). Each beat
 * cross-fades in place, centred over the descending imagery, driven imperatively
 * off the `orbit` channel so nothing re-renders on scroll. A soft radial scrim
 * (themed via --c-void, so it works in both modes) lifts legibility over the
 * bright surface without hiding it.
 *
 * Windows are in orbit-progress; the dive/surface run ~0.48→1.0, so the beats
 * live in 0.50→1.0. The last beat holds to the end, then the GoPilot section
 * takes over.
 */
const WIN: Array<[number, number]> = [
  [0.5, 0.64],
  [0.63, 0.75],
  [0.74, 0.88],
  [0.87, 1.01], // last beat holds through the end of the dive
];

export default function HeroDataReveal() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onProgress('orbit', (p) => {
      const scrim = scrimRef.current;
      if (scrim) scrim.style.opacity = String(smootherstep(range(p, 0.44, 0.54)) * 0.62);

      for (let i = 0; i < WIN.length; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const [s, e] = WIN[i]!;
        const inP = smootherstep(range(p, s, s + 0.05));
        const isLast = i === WIN.length - 1;
        const outP = isLast ? 0 : smootherstep(range(p, e - 0.045, e + 0.01));
        el.style.opacity = String(inP * (1 - outP));
        el.style.transform = `translate3d(0, ${(1 - inP) * 26 - outP * 26}px, 0)`;
      }
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {/* legibility scrim — themed, so dark scrim in dark mode / white in light */}
      <div
        ref={scrimRef}
        aria-hidden
        className="absolute inset-0 opacity-0 will-transform"
        style={{
          background:
            'radial-gradient(58% 58% at 50% 50%, rgb(var(--c-void) / 0.9) 0%, rgb(var(--c-void) / 0.45) 46%, transparent 74%)',
        }}
      />
      <div className="relative mx-auto w-full max-w-[48rem] px-6">
        {HERO_DATA.map((text, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="absolute inset-x-6 top-1/2 -translate-y-1/2 whitespace-pre-line text-center opacity-0 will-transform"
          >
            <p
              className={
                i === 0
                  ? 'display text-[clamp(2.6rem,7vw,5.6rem)] text-chalk'
                  : 'text-[clamp(1.15rem,2.9vw,2.1rem)] font-normal leading-snug tracking-tight text-chalk/95'
              }
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
