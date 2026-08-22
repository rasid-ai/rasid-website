'use client';

import { useMemo } from 'react';
import type { FieldPolygon } from '@/lib/geo/detections';
import { clamp } from '@/lib/utils/math';

/**
 * FieldLayer — delineated parcel boundaries.
 *
 * The polygons come from `extractFields`, which reconstructs the *exact* Voronoi
 * cells the imagery shader drew. So these outlines land on the visible parcel
 * edges rather than near them — the difference between a real delineation and a
 * decorative overlay, and the whole reason the geometry is reconstructed on the
 * CPU instead of eyeballed.
 *
 * Each boundary draws itself (stroke dash-offset) before its fill arrives, in
 * centre-out order. `changed` fields are drawn brighter with a hatched fill, for
 * the agriculture change-detection story.
 */
export default function FieldLayer({
  fields,
  progress,
  mode = 'delineate',
  color = 'rgb(var(--c-signal))',
}: {
  fields: FieldPolygon[];
  progress: number;
  /** 'delineate' = all parcels · 'change' = emphasise only what changed. */
  mode?: 'delineate' | 'change';
  color?: string;
}) {
  const p = clamp(progress);

  const items = useMemo(
    () =>
      fields.map((f, i) => {
        const n = fields.length || 1;
        const start = (i / n) * 0.66;
        return {
          f,
          start,
          d: f.points.map((pt, j) => `${j === 0 ? 'M' : 'L'} ${pt.u} ${pt.v}`).join(' ') + ' Z',
        };
      }),
    [fields],
  );

  if (fields.length === 0) return null;

  const hatchId = `fl-hatch-${mode}`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Hatching is defined in userSpace so the non-uniform viewBox doesn't
            shear it into an unreadable moiré. */}
        <pattern
          id={hatchId}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="1.1" opacity="0.55" />
        </pattern>
      </defs>

      {items.map(({ f, start, d }) => {
        const local = clamp((p - start) / 0.3);
        if (local <= 0) return null;
        const draw = clamp(local / 0.62);
        const settle = clamp((local - 0.55) / 0.45);

        const emphasise = mode === 'change' ? !!f.changed : true;
        const strokeOpacity = emphasise ? 0.42 + settle * 0.5 : 0.16 * settle;

        return (
          <g key={f.id}>
            {/* fill: NDVI-weighted for delineation, hatched for change */}
            {emphasise && (
              <path
                d={d}
                fill={mode === 'change' ? `url(#${hatchId})` : color}
                opacity={
                  mode === 'change'
                    ? settle * 0.5
                    : settle * (0.05 + f.ndvi * 0.1)
                }
              />
            )}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={emphasise ? 1.1 : 0.8}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={f.perimeter}
              strokeDashoffset={f.perimeter * (1 - draw)}
              opacity={strokeOpacity}
            />
            {/* centroid tick — where a real tool would anchor its attribute row */}
            {emphasise && settle > 0.4 && (
              <circle
                cx={f.centroid.u}
                cy={f.centroid.v}
                r={0.004}
                fill={color}
                opacity={settle * 0.7}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Attribute labels for the largest parcels.
 *
 * HTML, not SVG text: the overlay viewBox is intentionally non-uniform so
 * geometry tracks the imagery, and text inside it would be stretched with it.
 */
export function FieldLabels({
  fields,
  progress,
  max = 4,
  mode = 'delineate',
  color = 'rgb(var(--c-signal))',
}: {
  fields: FieldPolygon[];
  progress: number;
  max?: number;
  mode?: 'delineate' | 'change';
  color?: string;
}) {
  const p = clamp(progress);

  const labelled = useMemo(() => {
    const pool = mode === 'change' ? fields.filter((f) => f.changed) : fields;
    // Biggest parcels carry the label — smallest ones have no room for it.
    return [...pool]
      .map((f, i) => ({ f, rank: fields.indexOf(f), i }))
      .sort((a, b) => b.f.areaHa - a.f.areaHa)
      .slice(0, max);
  }, [fields, mode, max]);

  if (labelled.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {labelled.map(({ f, rank }) => {
        const start = (Math.max(rank, 0) / (fields.length || 1)) * 0.66;
        const settle = clamp((clamp((p - start) / 0.3) - 0.6) / 0.4);
        if (settle <= 0.02) return null;
        return (
          <div
            key={`fl-${f.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center"
            style={{
              left: `${f.centroid.u * 100}%`,
              top: `${f.centroid.v * 100}%`,
              opacity: settle,
            }}
          >
            <div
              className="font-mono text-[9px] uppercase leading-tight tracking-[0.14em]"
              style={{ color }}
            >
              {mode === 'change' ? (f.changeKind ?? 'changed') : f.crop}
            </div>
            <div className="font-mono text-[9px] leading-tight tabular-nums text-chalk/70">
              {f.areaHa.toFixed(1)} ha
            </div>
          </div>
        );
      })}
    </div>
  );
}
