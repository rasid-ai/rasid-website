'use client';

import { useEffect, useRef } from 'react';
import { DATA_SECTION } from '@/data/content';
import ImageryPanel, { type ImageryHandle } from '@/components/imagery/ImageryPanel';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { useInView } from '@/lib/hooks/useInView';
import { onProgress } from '@/lib/story/store';
import { clamp, lerp, range, smootherstep } from '@/lib/utils/math';
import Reticle from '@/components/imagery/Reticle';
import { SCENE_SEEDS } from '@/lib/story/scenes';

/**
 * Act II — "Earth is data."
 *
 * Receives the dive: the imagery starts at exactly the scale and sharpness the
 * hero handed over at, then resolves into a clean, legible Beirut scene. The
 * band/graticule/NDVI instrument overlays were deliberately removed (§15) — they
 * distracted from the story. What remains is the imagery, one value statement,
 * and very subtle scene metadata.
 */

/**
 * Visible width (km) the hero dive ends on — the hand-off frame. The hero's
 * WebGL camera finishes at altitude ~0.0008 R⊕ (~5 km up, fov 32°) over the dive
 * target, and the hero canvas is scaled up ~1.14× through the dive, so the scene
 * on screen is roughly this wide. DataSection mounts at exactly this so there's
 * no jump between the two. Tune against the hero's final frame if it drifts.
 */
const HERO_END_KM = 2.6;

export default function DataSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imagery = useRef<ImageryHandle>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const { caps } = useScrollContext();
  const { ref: viewRef, near, inView } = useInView<HTMLDivElement>({ nearMargin: '60% 0px' });

  useStoryTrigger(sectionRef, 'data', {
    length: caps.mobile ? 2.6 : 4,
    pin: true,
    enabled: caps.ready,
  });

  useEffect(() => {
    const h = headlineRef.current;
    const b = bodyRef.current;
    const coord = coordRef.current;

    return onProgress('data', (p) => {
      const img = imagery.current;
      if (img) {
        // COUPLED TO THE HERO. The dive ends framed on the target at surface
        // coordinate (0,0), ~HERO_END_KM wide, already acquired. This section
        // PICKS UP exactly there — same centre, same zoom, already resolved (no
        // zoom-out to 6 km, no acquisition wipe) — and simply keeps descending a
        // little further. That makes hero → "Earth is data" one continuous move.
        const zoom = smootherstep(range(p, 0, 0.85));
        img.set({
          widthKm: lerp(HERO_END_KM, 1.4, zoom),
          // Tiny drift for life; stays essentially on the hero's centre.
          centerX: lerp(0, 0.16, smootherstep(p)),
          centerY: lerp(0, -0.12, smootherstep(p)),
          sharpen: lerp(0.85, 1, smootherstep(range(p, 0, 0.45))),
          // bands / grid / heat intentionally left at rest (§15): a clean,
          // resolving satellite image, not a band-switching demo.
          vignette: lerp(0.42, 0.32, zoom),
          reveal: 1, // hero already acquired the scene — no wipe / reset
        });
      }

      // Headline holds, then releases as the instrument layers take over.
      if (h) {
        const inP = smootherstep(range(p, 0.04, 0.16));
        const outP = smootherstep(range(p, 0.4, 0.56));
        h.style.opacity = String(inP * (1 - outP));
        h.style.transform = `translate3d(0, ${(1 - inP) * 44 - outP * 40}px, 0)`;
      }
      if (b) {
        const inP = smootherstep(range(p, 0.16, 0.3));
        const outP = smootherstep(range(p, 0.46, 0.6));
        b.style.opacity = String(inP * (1 - outP));
        b.style.transform = `translate3d(0, ${(1 - inP) * 30 - outP * 30}px, 0)`;
      }

      if (coord) coord.style.opacity = String(smootherstep(range(p, 0.44, 0.58)));
    });
  }, []);

  return (
    <div ref={viewRef}>
      <section
        ref={sectionRef}
        data-scene="dark"
        className="relative h-[100svh] w-full overflow-hidden bg-void"
        aria-label="Earth is data"
      >
        {/* ---------- imagery plate ---------- */}
        <div className="absolute inset-0">
          {near && (
            <ImageryPanel
              seed={SCENE_SEEDS.beirut}
              caps={caps}
              active={inView}
              handleRef={imagery}
              className="grain absolute inset-0"
              initial={{
                // Mount already at the hero's hand-off frame (see onProgress):
                // centred on the dive target, ~HERO_END_KM wide, resolved.
                widthKm: HERO_END_KM,
                sharpen: 0.85,
                reveal: 1,
                vignette: 0.42,
                centerX: 0,
                centerY: 0,
              }}
            />
          )}
        </div>

        {/* Legibility scrim — strongest at the left, where the type sits.
            Weighted deliberately: the old ramp started at 0.93 and never fell
            below 0.55 even at the right edge, which multiplied with the panel's
            own 0.75 vignette and buried the imagery in near-black — the section
            is called "Earth is data" and you could not see the data. The type
            column still gets its contrast, but the right two-thirds are left
            open so the plate reads as photography. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(90deg, rgba(4,7,10,0.88) 0%, rgba(4,7,10,0.45) 38%, rgba(4,7,10,0) 66%, rgba(4,7,10,0.18) 100%), linear-gradient(0deg, rgba(4,7,10,0.72), transparent 30%)',
          }}
        />

        {/* Cursor reticle over the imagery */}
        {!caps.touch && <Reticle scope="data" />}

        {/* ---------- copy ---------- */}
        <div className="relative z-20 flex h-full items-center">
          <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10">
            <div className="max-w-[38rem]">
              <h2
                ref={headlineRef}
                className="display text-[clamp(2.6rem,7.6vw,6.6rem)] text-chalk opacity-0 will-transform"
              >
                {DATA_SECTION.headline}
              </h2>
              <div ref={bodyRef} className="mt-8 opacity-0 will-transform">
                {DATA_SECTION.body.map((line, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? 'text-[clamp(1.1rem,2.4vw,1.8rem)] font-normal leading-snug tracking-tight text-chalk'
                        : 'text-[clamp(1.1rem,2.4vw,1.8rem)] font-normal leading-snug tracking-tight text-mist'
                    }
                  >
                    {line}
                  </p>
                ))}
                {/* Value statement (§14): data → measurable information → decisions. */}
                <p className="mt-7 max-w-[30rem] border-l border-signal/40 pl-4 text-[0.98rem] leading-relaxed text-chalk/75">
                  {DATA_SECTION.value}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- subtle scene metadata (§15) ----------
            The RGB/NIR/GRID/NDVI band strip was removed; only this quiet,
            cinematic coordinate frame remains. */}
        <div
          ref={coordRef}
          aria-hidden
          className="pointer-events-none absolute right-6 top-1/2 z-20 -translate-y-1/2 opacity-0 md:right-10"
        >
          <div className="text-right">
            {DATA_SECTION.meta.map((m) => (
              <div key={m.label} className="mt-3 first:mt-0">
                <div className="label-sm">{m.label}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-chalk/85">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
