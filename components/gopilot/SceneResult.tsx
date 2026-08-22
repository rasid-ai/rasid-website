'use client';

import { smootherstep, clamp } from '@/lib/utils/math';

/**
 * SceneResult — the scene-parse answer: a per-class coverage legend.
 *
 * Replaces the solar-specific ResultPanel for this demo. Each class bar and its
 * percentage ramp in as a function of scroll progress (not a timer), staggered
 * so they don't all land on one frame — the same "computation finishing" read as
 * the old counter. `classes` is the seam for real model output.
 */
export interface SceneClass {
  name: string;
  pct: number;
  color: string;
}

export default function SceneResult({
  title,
  model,
  classes,
  progress,
  confidence = 0.93,
  compact,
}: {
  title: string;
  model: string;
  classes: readonly SceneClass[];
  progress: number;
  confidence?: number;
  compact?: boolean;
}) {
  const shell = smootherstep(clamp(progress / 0.25));

  return (
    <div
      className="pointer-events-none absolute bottom-8 left-3 right-3 z-30 sm:bottom-9 sm:left-auto sm:right-3 sm:w-[280px]"
      style={{ opacity: shell, transform: `translate3d(0, ${(1 - shell) * 14}px, 0)` }}
      aria-live="polite"
    >
      <div className="glass brackets relative px-3.5 py-3">
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
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="hairline my-2.5" />

        {/* per-class coverage */}
        <dl className="space-y-2">
          {classes.map((c, i) => {
            // Staggered ramps — each class resolves slightly after the last.
            const local = smootherstep(clamp((progress - 0.15 - i * 0.08) / 0.4));
            return (
              <div key={c.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0"
                      style={{ backgroundColor: c.color, opacity: 0.5 + local * 0.5 }}
                    />
                    <span className="label-sm normal-case tracking-normal">{c.name}</span>
                  </dt>
                  <dd className="font-mono text-[11.5px] tabular-nums text-chalk">
                    {(c.pct * local).toFixed(0)}
                    <span className="ml-0.5 text-graphite">%</span>
                  </dd>
                </div>
                {/* coverage bar */}
                <div className="mt-1 h-px w-full overflow-hidden bg-white/[0.06]">
                  <div
                    className="h-full origin-left"
                    style={{
                      backgroundColor: c.color,
                      transform: `scaleX(${(c.pct / 100) * local})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </dl>

        <div
          className="mt-2.5 border-t border-white/[0.06] pt-2 transition-opacity duration-700"
          style={{ opacity: smootherstep(clamp((progress - 0.6) / 0.3)) }}
        >
          <div className="label-sm normal-case tracking-normal text-graphite">
            {model} · {classes.length} classes
          </div>
        </div>
      </div>
    </div>
  );
}
