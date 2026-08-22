'use client';

import { useEffect, useRef } from 'react';
import { ORBIT_STAGES, onProgress } from '@/lib/story/store';
import { clamp, range, smootherstep } from '@/lib/utils/math';
import type { Capabilities } from '@/lib/hooks/useCapabilities';

/**
 * HeroOverlay — the instrumentation layer over the dive.
 *
 * Everything here is written imperatively from a store subscription. Zero
 * React renders during scroll: only style properties on a handful of nodes,
 * all of them compositor-friendly (transform / opacity), plus a small number
 * of textContent writes for the numeric readouts.
 *
 * The point of this layer is narrative: it tells the viewer that the descent is
 * *instrumented* — an Earth-observation system acquiring a target — rather than
 * a decorative camera move.
 */

/** Altitude keyframes, mirrored from EarthScene, in km above the surface. */
const EARTH_R_KM = 6371;

const STAGE_LABELS = [
  { at: 0.0, code: 'ORB', text: 'Orbital survey' },
  { at: 0.12, code: 'APR', text: 'Approach' },
  { at: 0.32, code: 'TGT', text: 'Target acquired' },
  { at: 0.5, code: 'DSC', text: 'Descending' },
  { at: 0.82, code: 'IMG', text: 'Imagery resolved' },
] as const;

export default function HeroOverlay({ caps }: { caps: Capabilities }) {
  const altRef = useRef<HTMLSpanElement>(null);
  const gsdRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const stageCodeRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alt = altRef.current;
    const gsd = gsdRef.current;
    const stage = stageRef.current;
    const stageCode = stageCodeRef.current;
    const bar = barRef.current;
    const corner = cornerRef.current;
    const streaks = streaksRef.current;

    let lastStage = -1;

    return onProgress('orbit', (p) => {
      const { target, dive, surface } = ORBIT_STAGES;

      /* --- altitude readout (log interpolation, matches the camera) ------ */
      // Keyframes in Earth radii above surface → km.
      const logLerp = (a: number, b: number, k: number) =>
        Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * clamp(k));
      let altR: number;
      if (p < 0.1) altR = 2.1;
      else if (p < target[0]) altR = logLerp(2.1, 1.05, range(p, 0.1, target[0]));
      else if (p < dive[0]) altR = logLerp(1.05, 0.55, range(p, target[0], dive[0]));
      else if (p < surface[0]) altR = logLerp(0.55, 0.006, range(p, dive[0], surface[0]));
      else altR = logLerp(0.006, 0.0008, range(p, surface[0], 1));
      const altKm = altR * EARTH_R_KM;

      if (alt) {
        alt.textContent =
          altKm >= 1000
            ? `${(altKm / 1000).toFixed(altKm >= 10000 ? 1 : 2)}×10³ km`
            : altKm >= 10
              ? `${altKm.toFixed(0)} km`
              : `${(altKm * 1000).toFixed(0)} m`;
      }
      if (gsd) {
        // Ground sample distance implied by the altitude — pure flavour, but
        // it lands on 10 m (Sentinel-2) right as the imagery resolves.
        const g = clamp(altKm / 1400, 0.28, 900) * 10;
        gsd.textContent = g >= 100 ? `${(g / 1000).toFixed(2)} km` : `${g.toFixed(1)} m`;
      }

      /* --- frame corners fade in on approach, out as the dive completes --- */
      const release = smootherstep(range(p, 0.66, 0.8));
      if (corner) corner.style.opacity = String(smootherstep(range(p, 0.06, 0.2)) * (1 - release));

      /* --- speed streaks during the fast part of the dive --------------- */
      if (streaks) {
        const speed = smootherstep(range(p, dive[0] + 0.04, 0.72)) * (1 - smootherstep(range(p, 0.78, 0.9)));
        streaks.style.opacity = String(speed * 0.5);
      }

      /* --- stage label -------------------------------------------------- */
      let idx = 0;
      for (let i = 0; i < STAGE_LABELS.length; i++) {
        if (p >= STAGE_LABELS[i]!.at) idx = i;
      }
      if (idx !== lastStage) {
        lastStage = idx;
        const s = STAGE_LABELS[idx]!;
        if (stage) stage.textContent = s.text;
        if (stageCode) stageCode.textContent = s.code;
      }
      if (bar) bar.style.transform = `scaleX(${p})`;
    });
  }, []);

  return (
    <>
      {/* ---------- descent speed streaks ---------- */}
      {!caps.reducedMotion && (
        <div
          ref={streaksRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[15] opacity-0"
          style={{
            background:
              'repeating-linear-gradient(180deg, transparent 0 6px, rgba(200,235,240,0.10) 6px 7px, transparent 7px 46px)',
            maskImage: 'radial-gradient(58% 58% at 58% 50%, transparent 35%, #000 100%)',
            WebkitMaskImage: 'radial-gradient(58% 58% at 58% 50%, transparent 35%, #000 100%)',
          }}
        />
      )}

      {/* ---------- frame corners ---------- */}
      <div
        ref={cornerRef}
        aria-hidden
        className="pointer-events-none absolute inset-4 z-20 opacity-0 md:inset-7"
      >
        {(
          [
            ['top-0 left-0', 'border-l border-t'],
            ['top-0 right-0', 'border-r border-t'],
            ['bottom-0 left-0', 'border-l border-b'],
            ['bottom-0 right-0', 'border-r border-b'],
          ] as const
        ).map(([pos, border]) => (
          <span
            key={pos}
            className={`absolute ${pos} ${border} h-4 w-4 border-white/20 md:h-5 md:w-5`}
          />
        ))}
      </div>

      {/* ---------- telemetry strip ---------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
        <div className="mx-auto max-w-[1600px] px-6 pb-5 md:px-10 md:pb-7">
          <div className="hairline mb-3 w-full" />
          <div className="flex items-end justify-between gap-6">
            <div className="flex items-center gap-5 md:gap-9">
              <Readout label="Stage">
                <span className="text-signal">
                  <span ref={stageCodeRef}>ORB</span>
                </span>
                <span className="ml-2 text-chalk/80">
                  <span ref={stageRef}>Orbital survey</span>
                </span>
              </Readout>
              <Readout label="Altitude" className="hidden sm:block">
                <span ref={altRef} className="tabular-nums text-chalk/80">
                  13.4×10³ km
                </span>
              </Readout>
              <Readout label="GSD" className="hidden md:block">
                <span ref={gsdRef} className="tabular-nums text-chalk/80">
                  9.6 km
                </span>
              </Readout>
              <Readout label="Sensor" className="hidden lg:block">
                <span className="text-chalk/80">MSI · 13 bands</span>
              </Readout>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="label-sm">RASID / EO</span>
            </div>
          </div>
          {/* descent progress */}
          <div className="mt-3 h-px w-full overflow-hidden bg-white/8">
            <div
              ref={barRef}
              className="h-full w-full origin-left bg-signal/70"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function Readout({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="label-sm mb-1">{label}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider md:text-[11px]">{children}</div>
    </div>
  );
}
