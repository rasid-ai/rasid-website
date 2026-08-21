'use client';

import { useEffect, useMemo, useRef } from 'react';
import ImageryPanel, { type ImageryHandle } from '@/components/imagery/ImageryPanel';
import DetectionLayer, { DetectionLabels } from '@/components/imagery/DetectionLayer';
import Reticle from '@/components/imagery/Reticle';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { clamp, smootherstep } from '@/lib/utils/math';
import { SCENE_SEEDS, SCENE_VIEWS } from '@/lib/story/scenes';
import { extractSolar, type Viewport } from '@/lib/geo/detections';
import { usePlateGate } from './UseCaseSection';

/**
 * 02 · Energy — solar installations, from detection to polygon.
 *
 * Deliberately the same model the GoPilot section ran, at a different site and a
 * wider frame. That repetition is the point: the visitor already knows what this
 * model does, so this section can be about *scale* — a whole region rather than
 * one neighbourhood — instead of re-explaining the capability.
 *
 * The distinguishing beat is the pull-back after detection: boxes are found at
 * the working zoom, then the camera zooms out with the boxes still attached, so
 * the count stops being an abstraction. That only works because detections live
 * in world coordinates and are re-extracted per frame of the viewport.
 *
 * Timeline (0→1):
 *   0.00–0.20  imagery acquires
 *   0.16–0.44  detection sweep
 *   0.30–0.62  boxes appear behind the sweep
 *   0.58–0.86  pull back — the same detections at regional scale
 */

const SEED = SCENE_SEEDS.solarField;
const VIEW = SCENE_VIEWS.solarField;

export default function Solar({ progress }: { progress: number }) {
  const { caps } = useScrollContext();
  const { near, inView } = usePlateGate();
  const imagery = useRef<ImageryHandle>(null);

  const aspect = caps.mobile ? 1.3 : 1.9;
  const p = clamp(progress);

  // The pull-back. Quantised to 24 steps so the memoised extraction below runs a
  // couple of dozen times across the section instead of once per scroll frame —
  // and so the boxes visibly re-resolve, which is what a real zoom-out does.
  const zoom = smootherstep(clamp((p - 0.58) / 0.28));
  const zoomStep = Math.round(zoom * 24) / 24;
  const widthKm = VIEW.widthKm * (1 + zoomStep * 2.6);

  const vp = useMemo<Viewport>(
    () => ({ cx: VIEW.centerX, cy: VIEW.centerY, widthKm, aspect, seed: SEED }),
    [widthKm, aspect],
  );

  const detections = useMemo(
    () => extractSolar(vp, { max: caps.mobile ? 44 : 110 }),
    [vp, caps.mobile],
  );

  const detect = clamp((p - 0.3) / 0.3);

  useEffect(() => {
    imagery.current?.set({
      widthKm: vp.widthKm,
      centerX: vp.cx,
      centerY: vp.cy,
      reveal: smootherstep(clamp(p / 0.2)),
      sharpen: smootherstep(clamp((p - 0.1) / 0.24)),
      grid: 0.24 * smootherstep(clamp((p - 0.12) / 0.2)),
      scan: p > 0.16 && p < 0.46 ? clamp(Math.min((p - 0.16) / 0.05, (0.46 - p) / 0.06)) : 0,
      scanPos: clamp((p - 0.16) / 0.28),
      vignette: 0.45,
    });
  }, [p, vp]);

  return (
    <>
      {near && (
        <>
          <ImageryPanel
            seed={SEED}
            caps={caps}
            active={inView}
            handleRef={imagery}
            className="grain absolute inset-0"
            initial={{
              widthKm: VIEW.widthKm,
              centerX: VIEW.centerX,
              centerY: VIEW.centerY,
              reveal: 0,
              sharpen: 0,
              grid: 0,
              vignette: 0.45,
            }}
          />
          <DetectionLayer
            detections={detections}
            progress={detect}
            showLabels={!caps.mobile && zoom < 0.4}
          />
          {!caps.mobile && zoom < 0.4 && (
            <DetectionLabels detections={detections} progress={detect} max={3} />
          )}
          {!caps.touch && <Reticle scope="map" />}
        </>
      )}

      <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="label-sm text-signal/85">rasid/solar-pv v3.2</span>
          <span className="label-sm tabular-nums">
            {vp.widthKm.toFixed(1)} km · {detections.length} in view
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-3 py-2.5">
          <span
            className="label-sm transition-opacity duration-500"
            style={{ opacity: clamp((detect - 0.2) / 0.3) }}
          >
            Oriented boxes → polygons
          </span>
          <span
            className="label-sm text-signal/80 transition-opacity duration-500"
            style={{ opacity: clamp((zoom - 0.15) / 0.3) }}
          >
            Regional extent
          </span>
        </div>
      </div>
    </>
  );
}
