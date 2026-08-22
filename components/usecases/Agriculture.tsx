'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ImageryPanel, { type ImageryHandle } from '@/components/imagery/ImageryPanel';
import FieldLayer, { FieldLabels } from '@/components/imagery/FieldLayer';
import Reticle from '@/components/imagery/Reticle';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { clamp, smootherstep } from '@/lib/utils/math';
import { SCENE_SEEDS, SCENE_VIEWS } from '@/lib/story/scenes';
import { extractFields, type Viewport } from '@/lib/geo/detections';
import { usePlateGate } from './UseCaseSection';

/**
 * 01 · Agriculture — what changed between 2024 and 2026.
 *
 * Change detection needs *two* images, so there are two: the same AOI rendered
 * at two seeds that share their large-scale structure (coastline, roads, parcel
 * lattice) but differ in per-parcel crop and vigour — exactly how a real
 * two-epoch pair differs. Same place, two years.
 *
 * The comparison is a hard-edged swipe rather than a crossfade. A dissolve would
 * average the two epochs into something that is neither; a swipe keeps both
 * images honest and lets the eye do the comparing, which is how analysts
 * actually work.
 *
 * Timeline (0→1 analysis progress):
 *   0.00–0.22  2024 acquires
 *   0.18–0.42  parcels delineated on the 2024 epoch
 *   0.38–0.66  swipe to 2026 — the compare
 *   0.60–1.00  changed parcels isolated and hatched
 */

const SEED_2024 = SCENE_SEEDS.bekaa;
/** +1 keeps the terrain/road/coastline hashes adjacent while crop hashes diverge. */
const SEED_2026 = SCENE_SEEDS.bekaa + 1;
const VIEW = SCENE_VIEWS.bekaa;

export default function Agriculture({ progress }: { progress: number }) {
  const { caps } = useScrollContext();
  const { near, inView } = usePlateGate();
  const before = useRef<ImageryHandle>(null);
  const after = useRef<ImageryHandle>(null);
  const [swipe, setSwipe] = useState(0);

  const aspect = caps.mobile ? 1.3 : 1.9;
  const vp = useMemo<Viewport>(
    () => ({ cx: VIEW.centerX, cy: VIEW.centerY, widthKm: VIEW.widthKm, aspect, seed: SEED_2024 }),
    [aspect],
  );

  const fields = useMemo(
    () => extractFields(vp, { max: caps.mobile ? 40 : 84, withChange: true }),
    [vp, caps.mobile],
  );

  const p = clamp(progress);
  const delineate = clamp((p - 0.18) / 0.24);
  const compare = smootherstep(clamp((p - 0.38) / 0.28));
  const isolate = clamp((p - 0.6) / 0.32);

  useEffect(() => {
    setSwipe(compare);
    const common = {
      widthKm: vp.widthKm,
      centerX: vp.cx,
      centerY: vp.cy,
      sharpen: smootherstep(clamp(p / 0.3)),
      grid: 0.2 * smootherstep(clamp((p - 0.1) / 0.2)),
      vignette: 0.45,
    };
    before.current?.set({
      ...common,
      reveal: smootherstep(clamp(p / 0.22)),
      // Isolating the change pulls the colour out of the base imagery so the
      // hatched parcels are the only saturated thing left on the plate.
      heat: 0,
      fade: 1,
    });
    after.current?.set({
      ...common,
      reveal: 1,
      heat: 0,
      fade: 1,
    });
  }, [p, compare, vp]);

  return (
    <>
      {near && (
        <>
          {/* 2024 — the base epoch */}
          <ImageryPanel
            seed={SEED_2024}
            caps={caps}
            active={inView}
            handleRef={before}
            className="grain absolute inset-0"
            initial={{ widthKm: vp.widthKm, centerX: vp.cx, centerY: vp.cy, reveal: 0, sharpen: 0, grid: 0, vignette: 0.45 }}
          />

          {/* 2026 — revealed by the swipe. clip-path, so no blending happens. */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${(1 - swipe) * 100}%)` }}
          >
            <ImageryPanel
              seed={SEED_2026}
              caps={caps}
              active={inView && compare > 0.001}
              handleRef={after}
              className="grain absolute inset-0"
              initial={{ widthKm: vp.widthKm, centerX: vp.cx, centerY: vp.cy, reveal: 1, sharpen: 0, grid: 0, vignette: 0.45 }}
            />
          </div>

          {/* the swipe handle */}
          {swipe > 0.001 && swipe < 0.999 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-30 w-px bg-signal"
              style={{
                left: `${(1 - swipe) * 100}%`,
                boxShadow: '0 0 14px 1px rgb(var(--c-signal) / 0.55)',
              }}
            />
          )}

          {/* delineation, then change isolation */}
          <FieldLayer
            fields={fields}
            progress={delineate}
            mode={isolate > 0.02 ? 'change' : 'delineate'}
          />
          {!caps.mobile && (
            <FieldLabels
              fields={fields}
              progress={isolate > 0.15 ? isolate : delineate}
              mode={isolate > 0.15 ? 'change' : 'delineate'}
              max={4}
            />
          )}

          {!caps.touch && <Reticle scope="model" />}
        </>
      )}

      {/* epoch chrome — the labels that make it a comparison, not a slideshow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2.5">
          <span
            className="label-sm transition-opacity duration-500"
            style={{ opacity: 0.5 + (1 - swipe) * 0.5 }}
          >
            2024-06-14 · Sentinel-2
          </span>
          <span
            className="label-sm text-signal/90 transition-opacity duration-500"
            style={{ opacity: 0.25 + swipe * 0.75 }}
          >
            2026-06-09 · Sentinel-2
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2.5">
          <span className="label-sm">{vp.widthKm.toFixed(1)} km across</span>
          <span
            className="label-sm text-signal/80 transition-opacity duration-500"
            style={{ opacity: clamp((isolate - 0.1) / 0.3) }}
          >
            Change isolated
          </span>
        </div>
      </div>
    </>
  );
}
