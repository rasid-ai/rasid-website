'use client';

import { useEffect, useRef } from 'react';
import { DECISION_SECTION } from '@/data/content';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { onProgress } from '@/lib/story/store';
import { clamp, lerp, range, smootherstep } from '@/lib/utils/math';

/**
 * Act VII — the argument.
 *
 * After six acts of instrumentation this section removes every instrument. No
 * imagery, no canvas, no overlays: only type on near-black. That contrast is the
 * design decision — the page has been showing capability, and now it stops and
 * says what the capability is *for*. Adding a visual here would undercut it.
 *
 * The four lines are strictly sequential: each arrives, holds, and leaves before
 * the next arrives, all in the same optical position so the eye never travels.
 * The last line ("From pixels to decisions.") does not leave — it holds to the
 * end of the section and is the only one rendered in the accent.
 *
 * The one graphic element is a hairline that measures the argument's progress,
 * because a reader deserves to know how long a section of pure type will last.
 */

const LINES = DECISION_SECTION.lines;

export default function DecisionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement>(null);
  const { caps } = useScrollContext();

  useStoryTrigger(sectionRef, 'decision', {
    length: caps.mobile ? 3.4 : 4.6,
    pin: true,
    enabled: caps.ready,
  });

  useEffect(() => {
    return onProgress('decision', (p) => {
      const n = LINES.length;
      // Each line owns a window; windows are adjacent, with the *transitions*
      // overlapping slightly so there is never a frame of empty screen.
      const span = 1 / n;

      for (let i = 0; i < n; i++) {
        const el = lineRefs.current[i];
        if (!el) continue;

        const from = i * span;
        const to = (i + 1) * span;
        const last = i === n - 1;

        // In over the first 34% of the window, out over the last 26%.
        const inP = smootherstep(range(p, from - span * 0.06, from + span * 0.34));
        const outP = last ? 0 : smootherstep(range(p, to - span * 0.26, to + span * 0.04));

        const vis = inP * (1 - outP);
        el.style.opacity = String(vis);
        // Type rises in and continues rising out — one continuous motion per
        // line, so the sequence reads as a single thought advancing.
        el.style.transform = `translate3d(0, ${lerp(34, 0, inP) - outP * 26}px, 0)`;
        // A whisper of blur at the edges of the window: the line resolves into
        // legibility rather than fading, which reads as arriving *at* an idea.
        el.style.filter = vis > 0.985 ? 'none' : `blur(${(1 - inP) * 7 + outP * 5}px)`;
        el.style.pointerEvents = 'none';
      }

      const rail = railRef.current;
      if (rail) rail.style.transform = `scaleX(${clamp(p)})`;
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[100svh] w-full items-center overflow-hidden bg-void"
      aria-label="From pixels to decisions"
    >
      {/* A single faint horizon line at the optical centre — the only geometry
          in the section, and the thing the type sits on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgb(var(--c-signal) / 0.14) 30%, rgb(var(--c-signal) / 0.14) 70%, transparent)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-6 md:px-10">
        {/* All four lines occupy the same box, so nothing shifts. Height is
            driven by the longest line at any viewport. */}
        <div className="relative mx-auto flex min-h-[46svh] max-w-[54rem] items-center justify-center">
          {LINES.map((line, i) => (
            <p
              key={line.id}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={[
                'display absolute inset-x-0 text-center opacity-0 will-transform',
                // The concluding line is set larger and in the accent: it is the
                // only line that is a claim rather than a negation.
                i === LINES.length - 1
                  ? 'text-signal text-[clamp(2.1rem,7.4vw,6.4rem)]'
                  : 'text-chalk text-[clamp(1.7rem,5.6vw,4.8rem)]',
              ].join(' ')}
              // The first line is the section's accessible heading; the rest are
              // read in order as the argument they are.
              aria-hidden={false}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>

      {/* progress rail */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-[1600px] px-6 pb-6 md:px-10 md:pb-8">
          <div className="relative h-px w-full bg-white/[0.07]">
            <span
              ref={railRef}
              aria-hidden
              className="absolute inset-y-0 left-0 w-full origin-left bg-signal/50"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
