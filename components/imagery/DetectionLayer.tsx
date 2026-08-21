'use client';

import { useMemo } from 'react';
import type { Detection } from '@/lib/geo/detections';
import { clamp } from '@/lib/utils/math';

/**
 * DetectionLayer — oriented bounding boxes over imagery.
 *
 * Boxes appear *progressively*, ordered by distance from the scene centre, so
 * the detection reads as a model working outward from where it started rather
 * than a group fade-in. Each box draws its own outline (dash-offset) and then
 * settles — the same two-stage motion a real annotation tool uses.
 *
 * Coordinates are the 0..1 viewport space produced by lib/geo/detections, and
 * the SVG uses a 0..1 viewBox with `preserveAspectRatio="none"`, so the overlay
 * tracks the imagery exactly at any container size. Stroke widths are therefore
 * declared in the same space and scaled by vector-effect.
 */
export default function DetectionLayer({
  detections,
  progress,
  showLabels = true,
  color = 'rgb(var(--c-signal))',
}: {
  detections: Detection[];
  progress: number;
  showLabels?: boolean;
  color?: string;
}) {
  const p = clamp(progress);

  // Reveal order: centre-out. `detections` already arrives sorted that way, so
  // the index is the reveal rank.
  const items = useMemo(() => {
    const n = detections.length;
    return detections.map((d, i) => {
      // Each box gets a window of the run; windows overlap heavily so the
      // sequence feels continuous rather than metronomic.
      const start = n <= 1 ? 0 : (i / n) * 0.72;
      return { d, start, span: 0.28 };
    });
  }, [detections]);

  if (detections.length === 0) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {items.map(({ d, start, span }) => {
        const local = clamp((p - start) / span);
        if (local <= 0) return null;

        // Two-stage: outline draws (0→0.6), then the fill/label settle (0.6→1).
        const draw = clamp(local / 0.6);
        const settle = clamp((local - 0.55) / 0.45);

        const hw = d.w / 2;
        const hh = d.h / 2;
        const perim = 2 * (d.w + d.h);

        return (
          <g
            key={d.id}
            transform={`translate(${d.cx} ${d.cy}) rotate(${(d.rot * 180) / Math.PI})`}
            opacity={local}
          >
            {/* faint fill, arrives after the outline */}
            <rect
              x={-hw}
              y={-hh}
              width={d.w}
              height={d.h}
              fill={color}
              opacity={settle * 0.14}
            />
            {/* the drawn outline */}
            <rect
              x={-hw}
              y={-hh}
              width={d.w}
              height={d.h}
              fill="none"
              stroke={color}
              strokeWidth={1.15}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={perim}
              strokeDashoffset={perim * (1 - draw)}
              opacity={0.5 + settle * 0.45}
            />
            {/* corner ticks — reads as a detection box, not a drawn rectangle */}
            {settle > 0.15 && (
              /* `vector-effect` is NOT an inherited property, so it cannot be
                 hoisted onto this <g> the way `stroke` can — it has to sit on
                 each shape. Declared here it silently did nothing, leaving the
                 ticks with a 1.6 *user-unit* stroke in a 0..1 viewBox scaled to
                 the panel width: a ~1900px bar of solid signal-teal that covered
                 the whole map from the moment the boxes settled. */
              <g stroke={color} opacity={settle}>
                {(
                  [
                    [-hw, -hh, 1, 1],
                    [hw, -hh, -1, 1],
                    [-hw, hh, 1, -1],
                    [hw, hh, -1, -1],
                  ] as const
                ).map(([x, y, sx, sy], i) => {
                  const t = Math.min(hw, hh) * 0.42;
                  return (
                    <path
                      key={i}
                      d={`M ${x} ${y + sy * t} L ${x} ${y} L ${x + sx * t} ${y}`}
                      fill="none"
                      strokeWidth={1.6}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </g>
            )}
          </g>
        );
      })}

      {/* Leader lines for the labelled subset. */}
      {showLabels &&
        items.slice(0, 3).map(({ d, start, span }) => {
          const settle = clamp((clamp((p - start) / span) - 0.6) / 0.4);
          if (settle <= 0.02) return null;
          return (
            <line
              key={`ldr-${d.id}`}
              x1={d.cx}
              y1={d.cy - d.h / 2}
              x2={d.cx}
              y2={d.cy - d.h / 2 - 0.04}
              stroke={color}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              opacity={settle * 0.6}
            />
          );
        })}
    </svg>
  );
}

/**
 * Confidence labels.
 *
 * Rendered as HTML rather than SVG text: the overlay's viewBox is intentionally
 * non-uniform (`preserveAspectRatio="none"`) so boxes track the imagery exactly,
 * and any text inside that coordinate system would be stretched with it.
 * Percentage positioning gives the same alignment with undistorted glyphs.
 *
 * Only the few nearest detections are labelled — labelling all of them is noise,
 * and real annotation views label selectively too.
 */
export function DetectionLabels({
  detections,
  progress,
  max = 3,
  color = 'rgb(var(--c-signal))',
}: {
  detections: Detection[];
  progress: number;
  max?: number;
  color?: string;
}) {
  const p = clamp(progress);
  const n = detections.length;
  if (n === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {detections.slice(0, max).map((d, i) => {
        const start = n <= 1 ? 0 : (i / n) * 0.72;
        const settle = clamp((clamp((p - start) / 0.28) - 0.6) / 0.4);
        if (settle <= 0.02) return null;
        return (
          <span
            key={`lbl-${d.id}`}
            className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap font-mono text-[9px] uppercase tracking-widest"
            style={{
              left: `${d.cx * 100}%`,
              top: `${(d.cy - d.h / 2 - 0.045) * 100}%`,
              color,
              opacity: settle,
            }}
          >
            {(d.confidence * 100).toFixed(0)}%
          </span>
        );
      })}
    </div>
  );
}
