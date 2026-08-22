'use client';

import { useMemo } from 'react';
import { fmt, smootherstep, clamp } from '@/lib/utils/math';

/**
 * ResultPanel — the answer.
 *
 * Numbers count up as a function of scroll progress (not a timer), and each
 * figure has its own slightly offset ramp so they don't all land on the same
 * frame — that stagger is what makes a counter read as computation finishing
 * rather than a number appearing.
 *
 * `stats` is the seam for real RASID output: swap the object, keep the panel.
 */

export interface SolarResultStats {
  objects: number;
  areaM2: number;
  coverageKm2: number;
  estimatedMwp: number;
  meanConfidence: number;
  sampleObjects: number;
}

export default function ResultPanel({
  title,
  progress,
  stats,
  compact,
}: {
  title: string;
  progress: number;
  stats: SolarResultStats;
  compact?: boolean;
}) {
  const rows = useMemo(
    () => [
      { label: 'Objects', value: fmt(stats.objects), raw: stats.objects, unit: '', decimals: 0 },
      {
        label: 'Estimated area',
        value: fmt(stats.areaM2),
        raw: stats.areaM2,
        unit: 'm²',
        decimals: 0,
      },
      {
        label: 'Coverage analyzed',
        value: stats.coverageKm2.toFixed(1),
        raw: stats.coverageKm2,
        unit: 'km²',
        decimals: 1,
      },
      {
        label: 'Estimated capacity',
        value: stats.estimatedMwp.toFixed(1),
        raw: stats.estimatedMwp,
        unit: 'MWp',
        decimals: 1,
      },
    ],
    [stats],
  );

  const shell = smootherstep(clamp(progress / 0.25));

  return (
    <div
      className="pointer-events-none absolute bottom-8 left-3 right-3 z-30 sm:bottom-9 sm:left-auto sm:right-3 sm:w-[268px]"
      style={{
        opacity: shell,
        transform: `translate3d(0, ${(1 - shell) * 14}px, 0)`,
      }}
      aria-live="polite"
    >
      <div className="glass brackets relative px-3.5 py-3">
        {/* title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="label-sm mb-1 text-signal/85">Result</div>
            <div
              className={[
                'font-medium tracking-tight text-chalk',
                compact ? 'text-[0.86rem]' : 'text-[0.92rem]',
              ].join(' ')}
            >
              {title}
            </div>
          </div>
          <span className="mt-0.5 shrink-0 border border-signal/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal">
            {(stats.meanConfidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="hairline my-2.5" />

        {/* figures */}
        <dl className="space-y-1.5">
          {rows.map((row, i) => {
            // Staggered ramps: 0.18 apart, each taking ~0.45 of the remaining run.
            const local = smootherstep(clamp((progress - 0.15 - i * 0.14) / 0.42));
            const shown =
              row.decimals === 0
                ? fmt(row.raw * local)
                : (row.raw * local).toFixed(row.decimals);
            return (
              <div key={row.label} className="flex items-baseline justify-between gap-3">
                <dt className="label-sm normal-case tracking-normal">{row.label}</dt>
                <dd className="font-mono text-[11.5px] tabular-nums text-chalk">
                  {shown}
                  {row.unit && <span className="ml-1 text-graphite">{row.unit}</span>}
                </dd>
              </div>
            );
          })}
        </dl>

        {/* provenance — the detail that makes the result feel accountable */}
        <div
          className="mt-2.5 border-t border-white/[0.06] pt-2 transition-opacity duration-700"
          style={{ opacity: smootherstep(clamp((progress - 0.6) / 0.3)) }}
        >
          <div className="label-sm normal-case tracking-normal text-graphite">
            rasid/solar-pv v3.2 · {fmt(stats.sampleObjects)} in view
          </div>
        </div>
      </div>
    </div>
  );
}
