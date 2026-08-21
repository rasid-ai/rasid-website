'use client';

import { useMemo } from 'react';
import type { SegmentMask } from '@/lib/geo/detections';
import { clamp } from '@/lib/utils/math';

/**
 * SegmentationVisualization — the SAM 3 stage.
 *
 * Class-agnostic segmentation looks different from detection, and the visual
 * language should say so: no boxes, no confidence chips, no labels. Instead,
 * every region on screen gets filled at once with a translucent mask, hues
 * spread across a narrow band around the accent so the result reads as "many
 * instances" without introducing a second colour to the palette.
 *
 * Masks arrive in a fast wave with a bright rim that decays — the "everything
 * got segmented in one pass" feeling, which is the point of the model.
 */
export default function SegmentationVisualization({
  segments,
  progress,
}: {
  segments: SegmentMask[];
  progress: number;
}) {
  const p = clamp(progress);

  const items = useMemo(
    () =>
      segments.map((s, i) => {
        const n = segments.length || 1;
        // Hue walk stays inside 150°–192° (teal → cyan) so the palette holds.
        const hue = 150 + ((i * 37) % 43);
        const light = 52 + ((i * 17) % 22);
        return {
          s,
          start: (i / n) * 0.52,
          fill: `hsl(${hue} 72% ${light}%)`,
          d:
            s.points.map((pt, j) => `${j === 0 ? 'M' : 'L'} ${pt.u} ${pt.v}`).join(' ') +
            ' Z',
        };
      }),
    [segments],
  );

  if (segments.length === 0) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {items.map(({ s, start, fill, d }) => {
        const local = clamp((p - start) / 0.26);
        if (local <= 0) return null;
        // Rim flashes as the mask lands, then fades to a quiet outline.
        const rim = local < 0.4 ? local / 0.4 : 1 - (local - 0.4) / 0.6;

        return (
          <g key={s.id}>
            <path d={d} fill={fill} opacity={local * 0.3 * s.confidence} />
            <path
              d={d}
              fill="none"
              stroke={fill}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              opacity={0.25 + rim * 0.65}
            />
          </g>
        );
      })}
    </svg>
  );
}
