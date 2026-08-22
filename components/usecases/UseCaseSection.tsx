'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { useInView } from '@/lib/hooks/useInView';
import { onProgress, type Channel } from '@/lib/story/store';
import { clamp, range, smootherstep } from '@/lib/utils/math';

/**
 * The shell every use case shares.
 *
 * Per the brief these are *not* cards. Each takes a full pinned viewport and
 * plays the same four-part argument — question → imagery → analysis → figures —
 * so that by the third one the visitor is reading the *answer* rather than
 * relearning the layout. Repetition of structure is what lets the content differ.
 *
 * The shell owns the pin, the channel, the copy choreography, the stage rail and
 * the figure grid. The child owns only the plate: its imagery and its overlays.
 * That split keeps Agriculture/Solar/Urban to the ~80 lines each actually needs.
 */

export interface UseCaseStat {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface UseCaseData {
  readonly id: string;
  readonly index: string;
  readonly sector: string;
  readonly question: string;
  readonly stages: readonly string[];
  readonly stats: readonly UseCaseStat[];
  readonly conclusion: string;
}

/** Where the plate's analysis run sits inside the section's scroll. */
export const CASE_RUN = { start: 0.28, end: 0.78 } as const;

export default function UseCaseSection({
  data,
  channel,
  children,
  /** Receives 0→1 analysis progress; children drive their overlays from it. */
  onAnalysis,
}: {
  data: UseCaseData;
  channel: Channel;
  children: ReactNode;
  onAnalysis?: (p: number) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const figuresRef = useRef<HTMLDivElement>(null);

  const { caps } = useScrollContext();
  const { ref: viewRef, near, inView } = useInView<HTMLDivElement>({ nearMargin: '55% 0px' });

  // Only two pieces of this section are declarative: which stage is lit, and the
  // figure count-up. Everything else is written straight to style in the
  // subscription below, so scrolling doesn't rerender the plate.
  const [stage, setStage] = useState(-1);
  const [figT, setFigT] = useState(0);
  const figRef = useRef(0);

  useStoryTrigger(sectionRef, channel, {
    length: caps.mobile ? 3.2 : 4.5,
    pin: true,
    enabled: caps.ready,
  });

  useEffect(() => {
    return onProgress(channel, (p) => {
      /* question: arrives, then recedes into a caption as the plate takes over */
      const q = questionRef.current;
      if (q) {
        const inP = smootherstep(range(p, 0.02, 0.14));
        const outP = smootherstep(range(p, 0.18, 0.32));
        q.style.opacity = String(inP * (1 - outP * 0.45));
        q.style.transform = `translate3d(0, ${(1 - inP) * 30 - outP * 14}px, 0) scale(${1 - outP * 0.16})`;
      }

      const plate = plateRef.current;
      if (plate) {
        const inP = smootherstep(range(p, 0.16, 0.32));
        plate.style.opacity = String(inP);
        plate.style.transform = `scale(${0.955 + inP * 0.045})`;
      }

      const rail = railRef.current;
      if (rail) rail.style.opacity = String(smootherstep(range(p, 0.24, 0.36)));

      const fig = figuresRef.current;
      if (fig) {
        const inP = smootherstep(range(p, 0.74, 0.86));
        fig.style.opacity = String(inP);
        fig.style.transform = `translate3d(0, ${(1 - inP) * 20}px, 0)`;
      }

      /* the analysis run */
      const t = clamp((p - CASE_RUN.start) / (CASE_RUN.end - CASE_RUN.start));
      onAnalysis?.(t);
      setStage(t <= 0 ? -1 : Math.min(data.stages.length - 1, Math.floor(t * data.stages.length)));

      // Count-up: quantised so React only sees ~100 updates across the section.
      const f = clamp((p - 0.74) / 0.2);
      if (Math.abs(f - figRef.current) > 0.01 || f === 0 || f === 1) {
        figRef.current = f;
        setFigT(f);
      }
    });
  }, [channel, data.stages.length, onAnalysis]);

  return (
    <div ref={viewRef}>
      <section
        ref={sectionRef}
        className="relative h-[100svh] w-full overflow-hidden bg-void"
        aria-label={`${data.sector} use case`}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.45]"
          style={{
            background:
              'radial-gradient(70% 55% at 80% 12%, #0b171a 0%, transparent 62%), #04070a',
          }}
        />

        <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-center gap-4 px-4 py-[calc(env(safe-area-inset-top)+4.4rem)] sm:px-6 md:gap-6 md:px-10">
          {/* ---------- index + sector + question ---------- */}
          <div ref={questionRef} className="pointer-events-none origin-left opacity-0 will-transform">
            <div className="mb-2.5 flex items-center gap-3 md:mb-3.5">
              <span className="font-mono text-[clamp(1.6rem,3.4vw,2.6rem)] leading-none tabular-nums text-signal/85">
                {data.index}
              </span>
              <span className="h-px max-w-[4rem] flex-1 bg-signal/40" />
              <span className="label text-signal/90">{data.sector}</span>
            </div>
            <h3 className="display max-w-[46rem] text-[clamp(1.35rem,3.5vw,2.9rem)] leading-[1.08] text-chalk">
              {data.question}
            </h3>
          </div>

          {/* ---------- plate + rail ---------- */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,216px)] lg:gap-6">
            <div
              ref={plateRef}
              className="brackets relative min-h-0 w-full overflow-hidden border border-white/[0.08] bg-ink opacity-0 will-transform"
            >
              {/* Children mount only when the section is near and render frames
                  only while it is in view — the reason five WebGL panels can
                  coexist on one page without exhausting GL contexts. */}
              <PlateContext.Provider value={{ near, inView }}>{children}</PlateContext.Provider>
            </div>

            {/* stage rail */}
            <div ref={railRef} className="opacity-0 lg:self-center">
              <ol className="flex flex-row flex-wrap gap-x-4 gap-y-1.5 lg:flex-col lg:gap-2.5">
                {data.stages.map((s, i) => {
                  const state = i < stage ? 'done' : i === stage ? 'active' : 'todo';
                  return (
                    <li
                      key={s}
                      className="flex items-center gap-2 transition-opacity duration-500"
                      style={{ opacity: state === 'todo' ? 0.35 : 1 }}
                    >
                      <span
                        aria-hidden
                        className={[
                          'h-[5px] w-[5px] shrink-0 rounded-full transition-all duration-300',
                          state === 'todo' ? 'bg-white/25' : 'bg-signal',
                        ].join(' ')}
                        style={
                          state === 'active'
                            ? { boxShadow: '0 0 0 3.5px rgb(var(--c-signal) / 0.16)' }
                            : undefined
                        }
                      />
                      <span
                        className={[
                          'font-mono text-[9.5px] uppercase tracking-[0.14em]',
                          state === 'active' ? 'text-chalk' : 'text-mist',
                        ].join(' ')}
                      >
                        {s}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* ---------- figures + conclusion ---------- */}
          <div ref={figuresRef} className="opacity-0 will-transform">
            <div className="hairline mb-3" />
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-8">
              <dl className="grid flex-1 grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
                {data.stats.map((s, i) => {
                  const t = smootherstep(clamp((figT - i * 0.08) / 0.4));
                  return (
                    <div key={s.label} style={{ opacity: t }}>
                      <dt className="label-sm normal-case tracking-normal">{s.label}</dt>
                      <dd className="font-mono text-[clamp(0.95rem,1.8vw,1.35rem)] leading-tight tabular-nums text-chalk">
                        {s.value}
                        {s.unit && <span className="ml-1 text-[0.62em] text-graphite">{s.unit}</span>}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <p
                className="max-w-[22rem] shrink-0 text-[0.86rem] leading-relaxed text-mist md:text-right"
                style={{ opacity: smootherstep(clamp((figT - 0.4) / 0.5)) }}
              >
                {data.conclusion}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Mount/render gating, shared with the plate children
 * ------------------------------------------------------------------ */
const PlateContext = createContext<{ near: boolean; inView: boolean }>({
  near: false,
  inView: false,
});

/** Children of a UseCaseSection read their mount/render gates from here. */
export const usePlateGate = () => useContext(PlateContext);
