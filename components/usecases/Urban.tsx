'use client';

import { useEffect, useMemo, useRef } from 'react';
import ImageryPanel, { type ImageryHandle } from '@/components/imagery/ImageryPanel';
import FootprintLayer from '@/components/imagery/FootprintLayer';
import Reticle from '@/components/imagery/Reticle';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { clamp, smootherstep } from '@/lib/utils/math';
import { SCENE_SEEDS, SCENE_VIEWS } from '@/lib/story/scenes';
import { extractBuildings, type Viewport } from '@/lib/geo/detections';
import { usePlateGate } from './UseCaseSection';

/**
 * 03 · Urban — newly developed areas.
 *
 * The structural difference from Agriculture: this comparison is *temporal but
 * co-registered*. Both epochs share every street, district boundary and terrain
 * feature — only the occupancy of individual plots differs, because
 * `extractBuildings` re-rolls nothing but the occupancy salt between epochs.
 * That is what makes the change credible: a city that grew, not a different city.
 *
 * So the reveal is a dissolve here, not a swipe. Two co-registered epochs
 * dissolving *is* the analyst's blink comparator, and the new buildings appear as
 * the only thing that moves. Agriculture swipes because its two epochs differ
 * everywhere; Urban dissolves because its two epochs differ in one place.
 *
 * Timeline (0→1):
 *   0.00–0.18  before-epoch acquires
 *   0.14–0.34  every structure outlined — the existing city
 *   0.32–0.56  dissolve to the after epoch
 *   0.52–1.00  new structures isolated and filled
 */

const SEED = SCENE_SEEDS.urbanEdge;
const VIEW = SCENE_VIEWS.urbanEdge;

export default function Urban({ progress }: { progress: number }) {
  const { caps } = useScrollContext();
  const { near, inView } = usePlateGate();
  const before = useRef<ImageryHandle>(null);
  const after = useRef<ImageryHandle>(null);

  const aspect = caps.mobile ? 1.3 : 1.9;
  const vp = useMemo<Viewport>(
    () => ({ cx: VIEW.centerX, cy: VIEW.centerY, widthKm: VIEW.widthKm, aspect, seed: SEED }),
    [aspect],
  );

  // Epoch 1 is the "after"; `markNewVs: 0` tags what wasn't there in epoch 0.
  const buildings = useMemo(
    () => extractBuildings(vp, { max: caps.mobile ? 150 : 340, epoch: 1, markNewVs: 0 }),
    [vp, caps.mobile],
  );

  const p = clamp(progress);
  const outline = clamp((p - 0.14) / 0.22);
  const dissolve = smootherstep(clamp((p - 0.32) / 0.24));
  const isolate = clamp((p - 0.52) / 0.34);

  useEffect(() => {
    const common = {
      widthKm: vp.widthKm,
      centerX: vp.cx,
      centerY: vp.cy,
      sharpen: smootherstep(clamp(p / 0.26)),
      grid: 0.2 * smootherstep(clamp((p - 0.1) / 0.2)),
      vignette: 0.45,
    };
    before.current?.set({ ...common, reveal: smootherstep(clamp(p / 0.18)), fade: 1 });
    after.current?.set({ ...common, reveal: 1, fade: 1 });
  }, [p, vp]);

  return (
    <>
      {near && (
        <>
          {/* before */}
          <ImageryPanel
            seed={SEED}
            caps={caps}
            active={inView}
            handleRef={before}
            className="grain absolute inset-0"
            initial={{ widthKm: vp.widthKm, centerX: vp.cx, centerY: vp.cy, reveal: 0, sharpen: 0, grid: 0, vignette: 0.45 }}
          />

          {/* after — co-registered, so a dissolve is legitimate here.
              SEED+1 keeps district/terrain hashes adjacent while the built
              lattice's occupancy diverges. */}
          <div className="absolute inset-0" style={{ opacity: dissolve }}>
            <ImageryPanel
              seed={SEED + 1}
              caps={caps}
              active={inView && dissolve > 0.001}
              handleRef={after}
              className="grain absolute inset-0"
              initial={{ widthKm: vp.widthKm, centerX: vp.cx, centerY: vp.cy, reveal: 1, sharpen: 0, grid: 0, vignette: 0.45 }}
            />
          </div>

          <FootprintLayer
            buildings={buildings}
            progress={isolate > 0.02 ? Math.max(outline, isolate) : outline}
            mode={isolate > 0.02 ? 'new' : 'all'}
          />

          {!caps.touch && <Reticle scope="map" />}
        </>
      )}

      <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-3 py-2.5">
          <span
            className="label-sm transition-opacity duration-500"
            style={{ opacity: 0.45 + (1 - dissolve) * 0.55 }}
          >
            2024-04 · before
          </span>
          <span
            className="label-sm text-signal/90 transition-opacity duration-500"
            style={{ opacity: 0.25 + dissolve * 0.75 }}
          >
            2026-04 · after
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="label-sm tabular-nums">
            {buildings.length} structures · {vp.widthKm.toFixed(1)} km
          </span>
          <span
            className="label-sm text-signal/80 transition-opacity duration-500"
            style={{ opacity: clamp((isolate - 0.1) / 0.3) }}
          >
            {buildings.filter((b) => b.isNew).length} new
          </span>
        </div>
      </div>
    </>
  );
}
