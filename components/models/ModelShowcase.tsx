'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MODEL_SECTION } from '@/data/content';
import ImageryPanel, { type ImageryHandle } from '@/components/imagery/ImageryPanel';
import DetectionLayer, { DetectionLabels } from '@/components/imagery/DetectionLayer';
import FieldLayer, { FieldLabels } from '@/components/imagery/FieldLayer';
import TreeLayer from '@/components/imagery/TreeLayer';
import SegmentationVisualization from './SegmentationVisualization';
import Reticle from '@/components/imagery/Reticle';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { useInView } from '@/lib/hooks/useInView';
import { onProgress } from '@/lib/story/store';
import { clamp, fmt, range, smootherstep } from '@/lib/utils/math';
import { SCENE_SEEDS, SCENE_VIEWS } from '@/lib/story/scenes';
import {
  extractFields,
  extractSegments,
  extractSolar,
  extractTrees,
  fieldStats,
  solarStats,
  type Viewport,
} from '@/lib/geo/detections';

/**
 * Act V — one image, many questions.
 *
 * The single most important constraint here: **the imagery never changes.** The
 * scene is framed once and held for the whole section; only the interpretation
 * layer swaps. If the picture moved, the argument ("nothing about the imagery
 * changed — only the question") would be a lie the visuals tell on themselves.
 *
 * Six stages share the section's scroll. Each stage:
 *   1. an analysis sweep crosses the plate (the model running)
 *   2. mid-sweep, the previous overlay is replaced — the bright scan line hides
 *      the swap, so layers never cross-dissolve into mush
 *   3. the new overlay draws itself in, instance by instance
 *
 * Every overlay is derived from the same procedural ground the shader drew, via
 * lib/geo/detections — so field boundaries land on parcel edges, solar boxes on
 * panel arrays, crowns on canopy. The final stage's statistics are computed from
 * those same vectors, not authored.
 */

const SEED = SCENE_SEEDS.showcase;
const VIEW = SCENE_VIEWS.showcase;
const STAGES = MODEL_SECTION.stages;

/** Scroll window shared by the six stages; the rest is the headline. */
const RUN_START = 0.15;
/** Where inside a stage's window the overlay swaps — mid-sweep, so the bright
 *  scan line covers the cut. */
const SWAP_AT = 0.12;
/** Fraction of a stage's window spent drawing the overlay in. */
const DRAW_SPAN = 0.62;
/** Fraction of a stage's window occupied by the analysis sweep. */
const SWEEP_SPAN = 0.24;

export default function ModelShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imagery = useRef<ImageryHandle>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  const { caps } = useScrollContext();
  const { ref: viewRef, near, inView } = useInView<HTMLDivElement>({ nearMargin: '60% 0px' });

  const [stage, setStage] = useState(0);
  const [local, setLocal] = useState(0);
  /* `local` is the overlay draw-on fraction; it changes every scroll frame, so
     it must be quantised before it enters React or ModelShowcase re-renders the
     active overlay (up to ~70 SVG polygons) every frame. `stage` is an integer
     index and already bails via Object.is. See UseCaseSection's figRef guard. */
  const localRef = useRef(-1);

  useStoryTrigger(sectionRef, 'models', {
    length: caps.mobile ? 5 : 7,
    pin: true,
    enabled: caps.ready,
  });

  const aspect = caps.mobile ? 1.28 : 1.6;
  const vp = useMemo<Viewport>(
    () => ({
      cx: VIEW.centerX,
      cy: VIEW.centerY,
      widthKm: VIEW.widthKm,
      aspect,
      seed: SEED,
    }),
    [aspect],
  );

  /* Vectors are extracted once per viewport and kept for the whole section.
     Cheap enough to precompute all five at mount (~1200 objects total) and it
     means a stage swap costs nothing but a render. */
  const fields = useMemo(() => extractFields(vp, { max: caps.mobile ? 34 : 70 }), [vp, caps.mobile]);
  const solar = useMemo(() => extractSolar(vp, { max: caps.mobile ? 26 : 54 }), [vp, caps.mobile]);
  const trees = useMemo(
    () => extractTrees(vp, { max: caps.mobile ? 90 : 240, stride: caps.mobile ? 4 : 3 }),
    [vp, caps.mobile],
  );
  const segments = useMemo(
    () => extractSegments(vp, { max: caps.mobile ? 16 : 30 }),
    [vp, caps.mobile],
  );

  /** Stage 6: what it adds up to. Derived, not written. */
  const summary = useMemo(() => {
    const fs = fieldStats(fields);
    const ss = solarStats(solar, vp);
    const canopyM2 = trees.reduce(
      (a, t) => a + Math.PI * Math.pow(t.r * vp.widthKm * 1000, 2),
      0,
    );
    return [
      { label: 'Parcels', value: fmt(fs.fields), unit: '' },
      { label: 'Cultivated', value: fs.totalHa.toFixed(1), unit: 'ha' },
      { label: 'Mean NDVI', value: fs.meanNdvi.toFixed(2), unit: '' },
      { label: 'Solar arrays', value: fmt(ss.objects), unit: '' },
      { label: 'Module area', value: fmt(ss.areaM2), unit: 'm²' },
      { label: 'Canopy', value: fmt(canopyM2), unit: 'm²' },
      { label: 'Trees sampled', value: fmt(trees.length), unit: '' },
      { label: 'Scene', value: (vp.widthKm * (vp.widthKm / aspect)).toFixed(2), unit: 'km²' },
    ];
  }, [fields, solar, trees, vp, aspect]);

  useEffect(() => {
    return onProgress('models', (p) => {
      /* ---- headline releases; the persistent strip takes over ---- */
      const h = headRef.current;
      if (h) {
        const inP = smootherstep(range(p, 0.01, 0.1));
        const outP = smootherstep(range(p, 0.13, 0.23));
        h.style.opacity = String(inP * (1 - outP));
        h.style.transform = `translate3d(0, ${(1 - inP) * 40 - outP * 30}px, 0)`;
      }
      const strip = stripRef.current;
      if (strip) {
        const inP = smootherstep(range(p, 0.17, 0.27));
        strip.style.opacity = String(inP);
        strip.style.transform = `translate3d(0, ${(1 - inP) * -14}px, 0)`;
      }
      const plate = plateRef.current;
      if (plate) {
        const inP = smootherstep(range(p, 0.14, 0.28));
        plate.style.opacity = String(inP);
        plate.style.transform = `scale(${0.965 + inP * 0.035})`;
      }

      /* ---- which stage, and how far into it ----
         `k` is the scroll window; the *displayed* stage lags it by SWAP_AT so
         the outgoing overlay survives until the scan line has passed over it. */
      const t = clamp((p - RUN_START) / (1 - RUN_START));
      const raw = t * STAGES.length;
      const k = Math.min(STAGES.length - 1, Math.floor(raw));
      const within = clamp(raw - k);

      const lingering = within < SWAP_AT && k > 0;
      const idx = lingering ? k - 1 : k;
      // The outgoing overlay holds fully drawn; the incoming one draws in.
      const drawn = lingering ? 1 : clamp((within - SWAP_AT) / DRAW_SPAN);

      setStage(idx);
      // Quantise to 1% so the SVG overlay reconciles ~100× per section, not per
      // frame. `lingering` pins it to exactly 1, and the reveal front is smooth
      // at 1% steps, so this is visually identical.
      const q = Math.round(drawn * 100) / 100;
      if (q !== localRef.current) {
        localRef.current = q;
        setLocal(q);
      }

      /* ---- the plate: sharpen once, then just run models over it ---- */
      const img = imagery.current;
      if (img) {
        // No sweep on the first window — the acquisition wipe is already there.
        const sweeping = k > 0 && within < SWEEP_SPAN;
        img.set({
          widthKm: vp.widthKm,
          centerX: vp.cx,
          centerY: vp.cy,
          reveal: smootherstep(range(p, 0.16, 0.34)),
          sharpen: smootherstep(range(p, 0.2, 0.4)),
          grid: 0.22 * smootherstep(range(p, 0.2, 0.34)),
          // The last stage recolours the imagery analytically — the only stage
          // allowed to touch the pixels, because that stage *is* the numbers.
          heat:
            idx === STAGES.length - 1
              ? smootherstep(clamp((within - SWAP_AT) / 0.4)) * 0.85
              : 0,
          scan: sweeping ? clamp((SWEEP_SPAN - within) / (SWEEP_SPAN * 0.4)) : 0,
          scanPos: sweeping ? within / SWEEP_SPAN : 0,
          vignette: 0.5,
        });
      }
    });
  }, [vp]);

  const active = STAGES[stage]!;

  return (
    <div ref={viewRef}>
      <section
        ref={sectionRef}
        className="relative h-[100svh] w-full overflow-hidden bg-void"
        aria-label="Model ecosystem"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(80% 60% at 22% 18%, #0c1a1c 0%, transparent 60%), #04070a',
          }}
        />

        {/* ---------- opening headline ---------- */}
        <div
          ref={headRef}
          className="pointer-events-none absolute inset-x-6 top-1/2 z-30 -translate-y-1/2 opacity-0 will-transform md:inset-x-10"
        >
          <div className="mx-auto max-w-[52rem] text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{MODEL_SECTION.eyebrow}</span>
              <span className="h-px w-8 bg-signal/60" />
            </div>
            <h2 className="display text-[clamp(2.2rem,6.4vw,5.4rem)] text-chalk">
              {MODEL_SECTION.headline[0]}
              <br />
              <span className="text-signal">{MODEL_SECTION.headline[1]}</span>
            </h2>
            <p className="mx-auto mt-6 max-w-[34rem] text-[0.95rem] leading-relaxed text-mist">
              {MODEL_SECTION.body}
            </p>
          </div>
        </div>

        {/* ---------- persistent title strip ---------- */}
        <div
          ref={stripRef}
          className="pointer-events-none absolute inset-x-4 top-[calc(env(safe-area-inset-top)+4.6rem)] z-30 opacity-0 will-transform sm:inset-x-6 md:inset-x-10"
        >
          <div className="mx-auto flex max-w-[1600px] items-baseline justify-between gap-6">
            <h3 className="display text-[clamp(1rem,2.1vw,1.6rem)] leading-none text-chalk">
              One image. <span className="text-signal">Infinite questions.</span>
            </h3>
            <span className="label-sm hidden shrink-0 sm:block">
              {SCENE_SEEDS.showcase} · {vp.widthKm.toFixed(1)} km · Sentinel-2 L2A
            </span>
          </div>
        </div>

        {/* ---------- stage + plate ---------- */}
        <div className="relative z-20 mx-auto flex h-full max-w-[1600px] flex-col justify-center px-4 pt-16 sm:px-6 md:px-10">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,268px)_minmax(0,1fr)] lg:gap-7">
            {/* index rail */}
            <div className="order-2 lg:order-1 lg:self-center">
              <StageRail stage={stage} local={local} compact={!!caps.mobile} />
            </div>

            {/* the plate */}
            <div className="order-1 lg:order-2">
              <div
                ref={plateRef}
                className="brackets relative w-full overflow-hidden border border-white/[0.08] bg-ink opacity-0 will-transform"
                style={{ aspectRatio: `${aspect}` }}
              >
                {near && (
                  <>
                    <ImageryPanel
                      seed={SEED}
                      caps={caps}
                      active={inView}
                      handleRef={imagery}
                      className="grain absolute inset-0"
                      initial={{
                        widthKm: vp.widthKm,
                        centerX: vp.cx,
                        centerY: vp.cy,
                        reveal: 0,
                        sharpen: 0,
                        grid: 0,
                        vignette: 0.5,
                      }}
                    />

                    {/* ---- the interpretation layer ---- */}
                    {active.id === 'fields' && (
                      <>
                        <FieldLayer fields={fields} progress={local} />
                        {!caps.mobile && <FieldLabels fields={fields} progress={local} max={4} />}
                      </>
                    )}
                    {active.id === 'solar' && (
                      <>
                        <DetectionLayer detections={solar} progress={local} showLabels={!caps.mobile} />
                        {!caps.mobile && <DetectionLabels detections={solar} progress={local} />}
                      </>
                    )}
                    {active.id === 'trees' && <TreeLayer trees={trees} progress={local} />}
                    {active.id === 'sam' && (
                      <SegmentationVisualization segments={segments} progress={local} />
                    )}
                    {active.id === 'analysis' && (
                      <AnalysisOverlay rows={summary} progress={local} compact={!!caps.mobile} />
                    )}

                    {!caps.touch && <Reticle scope="model" />}
                  </>
                )}

                {/* plate chrome */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-30">
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="label-sm text-signal/85">{active.model}</span>
                    <span className="label-sm hidden sm:block">{active.detail}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="label-sm">
                      {String(stage + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
                    </span>
                    <span className="label-sm tabular-nums">
                      {(local * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* the question — the only thing that actually changes */}
              <div className="relative mt-3 h-[2.6rem] sm:mt-4 sm:h-[3.1rem]">
                {STAGES.map((s, i) => (
                  <p
                    key={s.id}
                    className="display absolute inset-x-0 top-0 text-[clamp(1rem,2.3vw,1.75rem)] leading-tight text-chalk transition-[opacity,transform] duration-500 ease-cinema"
                    style={{
                      opacity: i === stage ? 1 : 0,
                      transform: `translate3d(0, ${i === stage ? 0 : 10}px, 0)`,
                    }}
                    aria-hidden={i !== stage}
                  >
                    <span className="mr-2 align-middle font-mono text-[0.62em] uppercase tracking-[0.2em] text-signal/70">
                      Q
                    </span>
                    {s.question}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * The stage index.
 *
 * A rail, not cards: each row is a model that has run, is running, or is waiting,
 * with a fill bar that tracks the current stage's own progress. The vertical line
 * makes the six stages read as one continuous interrogation of one image.
 */
function StageRail({
  stage,
  local,
  compact,
}: {
  stage: number;
  local: number;
  compact: boolean;
}) {
  return (
    <ol className="relative pl-5">
      {/* the rail */}
      <span aria-hidden className="absolute left-[3px] top-1 bottom-1 w-px bg-white/[0.09]" />
      <span
        aria-hidden
        className="absolute left-[3px] top-1 w-px bg-signal/60 transition-[height] duration-300 ease-out"
        style={{ height: `${((stage + clamp(local)) / STAGES.length) * 100}%` }}
      />

      {STAGES.map((s, i) => {
        const state = i < stage ? 'done' : i === stage ? 'active' : 'todo';
        return (
          <li
            key={s.id}
            className={[
              'relative',
              compact ? 'py-1.5' : 'py-[0.42rem]',
              state === 'todo' ? 'opacity-40' : 'opacity-100',
              'transition-opacity duration-500',
            ].join(' ')}
          >
            {/* node */}
            <span
              aria-hidden
              className={[
                'absolute -left-5 top-[0.62rem] h-[7px] w-[7px] rounded-full border transition-all duration-300',
                state === 'todo'
                  ? 'border-white/25 bg-void'
                  : 'border-signal bg-signal',
              ].join(' ')}
              style={
                state === 'active'
                  ? { boxShadow: '0 0 0 4px rgb(var(--c-signal) / 0.14)' }
                  : undefined
              }
            />
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[9px] tabular-nums text-graphite">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={[
                  'font-medium tracking-tight',
                  compact ? 'text-[12.5px]' : 'text-[13.5px]',
                  state === 'active' ? 'text-chalk' : 'text-mist',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
            {!compact && (
              <div className="mt-0.5 pl-[1.55rem] font-mono text-[9.5px] uppercase tracking-[0.12em] text-graphite">
                {s.model}
              </div>
            )}
            {/* progress fill for the running stage */}
            {state === 'active' && (
              <div aria-hidden className="mt-1.5 ml-[1.55rem] h-px bg-white/10">
                <div
                  className="h-px bg-signal"
                  style={{ width: `${clamp(local) * 100}%` }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Stage 6 — the numbers.
 *
 * Deliberately not a chart. A chart would be a second visual language competing
 * with the imagery; a measured table over an analytically-recoloured scene says
 * "this is what the pixels amount to" with no new vocabulary.
 */
function AnalysisOverlay({
  rows,
  progress,
  compact,
}: {
  rows: { label: string; value: string; unit: string }[];
  progress: number;
  compact: boolean;
}) {
  const shown = compact ? rows.slice(0, 4) : rows;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center p-4 sm:p-6">
      <dl
        className={[
          'grid w-full gap-x-6 gap-y-2',
          compact ? 'grid-cols-2' : 'grid-cols-4',
        ].join(' ')}
      >
        {shown.map((r, i) => {
          const t = smootherstep(clamp((progress - i * 0.055) / 0.3));
          return (
            <div
              key={r.label}
              className="border-t border-signal/25 pt-1.5"
              style={{
                opacity: t,
                transform: `translate3d(0, ${(1 - t) * 8}px, 0)`,
              }}
            >
              <dt className="label-sm normal-case tracking-normal text-mist">{r.label}</dt>
              <dd className="font-mono text-[clamp(0.8rem,1.5vw,1.05rem)] tabular-nums text-chalk">
                {r.value}
                {r.unit && <span className="ml-1 text-[0.7em] text-graphite">{r.unit}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
