'use client';

import { useMemo } from 'react';
import type { BuildingFootprint } from '@/lib/geo/detections';
import { clamp } from '@/lib/utils/math';

/**
 * FootprintLayer — building outlines, with change emphasis.
 *
 * Two visual registers on purpose:
 *   `mode='all'`  every structure, drawn thin and quiet — a base map
 *   `mode='new'`  only what appeared between epochs, filled and bright
 *
 * Switching between them is the whole urban-change beat: the same geometry,
 * reinterpreted. Existing structures stay faintly visible in 'new' mode so the
 * growth reads *against* the city rather than floating on black.
 *
 * Footprints come from `extractBuildings`, which mirrors the shader's block
 * placement and district rotation, so outlines sit on drawn roofs.
 */
export default function FootprintLayer({
  buildings,
  progress,
  mode = 'all',
  color = 'rgb(var(--c-signal))',
}: {
  buildings: BuildingFootprint[];
  progress: number;
  mode?: 'all' | 'new';
  color?: string;
}) {
  const p = clamp(progress);

  const items = useMemo(
    () =>
      buildings.map((b, i) => {
        const n = buildings.length || 1;
        return {
          b,
          start: (i / n) * 0.7,
          d: b.points.map((pt, j) => `${j === 0 ? 'M' : 'L'} ${pt.u} ${pt.v}`).join(' ') + ' Z',
        };
      }),
    [buildings],
  );

  if (buildings.length === 0) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {items.map(({ b, start, d }) => {
        const local = clamp((p - start) / 0.24);
        if (local <= 0) return null;
        const emphasise = mode === 'all' || !!b.isNew;

        // New structures get a brief bright flash as they're identified — the
        // visual equivalent of a diff highlight.
        const flash = emphasise && mode === 'new' ? Math.max(0, 1 - Math.abs(local - 0.35) / 0.35) : 0;

        return (
          <path
            key={b.id}
            d={d}
            fill={emphasise ? color : 'none'}
            fillOpacity={emphasise ? local * (mode === 'new' ? 0.4 : 0.12) : 0}
            stroke={color}
            strokeWidth={emphasise ? 1 : 0.7}
            vectorEffect="non-scaling-stroke"
            opacity={
              emphasise
                ? local * (0.55 + flash * 0.45)
                : local * 0.16 /* the existing city, kept as context */
            }
          />
        );
      })}
    </svg>
  );
}
