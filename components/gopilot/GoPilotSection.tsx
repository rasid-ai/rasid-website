'use client';

import { useEffect, useRef, useState } from 'react';
import { GOPILOT_SECTION } from '@/data/content';
import SceneParseOverlay from './SceneParseOverlay';
import SceneResult from './SceneResult';
import GoPilotChat from './GoPilotChat';
import AgentWorkflow from './AgentWorkflow';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { useInView } from '@/lib/hooks/useInView';
import { onProgress } from '@/lib/story/store';
import { range, smootherstep } from '@/lib/utils/math';

/**
 * Act III — the question.
 *
 * The most important interaction on the site: the question is typed, the agent's
 * plan advances step by step, the map flies to Beirut, the model runs as a
 * visible sweep, and GoPilot's scene parse (a real per-pixel segmentation of
 * Beirut, supplied as public/beirut-parse.webp) wipes in behind the sweep. The
 * per-class coverage in the result panel is measured from that overlay's pixels.
 *
 * Timeline (section progress 0→1):
 *   0.00–0.14  headline settles, interface assembles
 *   0.10–0.22  question types out
 *   0.20–0.30  step 1 · understand         → AOI framing appears
 *   0.28–0.46  step 2 · search imagery     → map flies to Beirut
 *   0.36–0.50  step 3 · select imagery     → acquisition wipe reveals the scene
 *   0.48–0.70  step 4 · run segmentation   → sweep passes, the parse wipes in
 *   0.68–0.84  step 5 · analyse            → per-class coverage counts up
 *   0.82–1.00  result holds
 */

export default function GoPilotSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const mapFrameRef = useRef<HTMLDivElement>(null);

  const baseImgRef = useRef<HTMLImageElement>(null);

  const { caps } = useScrollContext();
  const { ref: viewRef, near } = useInView<HTMLDivElement>({ nearMargin: '60% 0px' });

  // Scroll progress is mirrored into state at coarse granularity so the chat,
  // workflow and result panel can stay declarative.
  //
  // These are fed continuous scroll-derived floats, which change every frame — so
  // each MUST be quantised before it enters React, or the whole subtree
  // (GoPilotChat, AgentWorkflow, SceneParseOverlay, SceneResult) reconciles on
  // every scroll frame. `beat` (0→5) stays fractional for its rail fill; the rest
  // quantise to 1%. Refs hold the last emitted value so setState only fires on a
  // real change.
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState(0);
  const [reveal, setReveal] = useState(0); // scene-parse wipe-in
  const [statProgress, setStatProgress] = useState(0);
  const emitRef = useRef({ beat: -1, typed: -1, reveal: -1, stat: -1 });

  useStoryTrigger(sectionRef, 'gopilot', {
    // Trimmed 6→4.5 (desktop) to shorten the overall scroll (feedback #7). The
    // choreography is progress-keyed (0→1), so it just plays a touch faster.
    length: caps.mobile ? 3.5 : 4.5,
    pin: true,
    enabled: caps.ready,
  });

  useEffect(() => {
    return onProgress('gopilot', (p) => {
      /* ---- base imagery: grey → GoPilot's chosen scene ----
         The map holds a neutral grey placeholder until GoPilot reaches "Selecting
         optimal imagery" (step 3), when the real inference frame — the exact
         satellite scene the segmentation was run on (public/beirut-base.webp) —
         resolves in. A gentle settle-zoom sells "found the right image" rather
         than a flat swap. The scene-parse then wipes in over it at step 4. */
      const base = baseImgRef.current;
      if (base) {
        const inP = smootherstep(range(p, 0.36, 0.5));
        base.style.opacity = String(inP);
        base.style.transform = `scale(${1.06 - 0.06 * inP})`;
      }

      /* ---- headline releases as the interface takes over ----
         Visible from p=0 (no fade-IN) so landing at the top of this section —
         via "Skip intro" or scrolling in from the hero — shows the headline
         immediately instead of a black gap; it then rises out as the interface
         assembles. */
      const h = headRef.current;
      if (h) {
        const outP = smootherstep(range(p, 0.16, 0.28));
        h.style.opacity = String(1 - outP);
        h.style.transform = `translate3d(0, ${-outP * 26}px, 0)`;
      }

      const ui = uiRef.current;
      if (ui) {
        const inP = smootherstep(range(p, 0.14, 0.28));
        ui.style.opacity = String(inP);
        ui.style.transform = `translate3d(0, ${(1 - inP) * 46}px, 0)`;
      }

      const frame = mapFrameRef.current;
      if (frame) {
        const inP = smootherstep(range(p, 0.16, 0.3));
        frame.style.opacity = String(inP);
        frame.style.transform = `scale(${0.97 + 0.03 * inP})`;
      }

      /* ---- coarse beats for declarative children ----
         Quantise before setState so React sees ~100 discrete updates per value
         across the section instead of one per scroll frame. */
      const e = emitRef.current;
      const typedQ = Math.round(range(p, 0.1, 0.22) * 100) / 100;
      // `beat` (0→5) drives a smooth rail fill and per-step hairlines off its
      // fractional part, so it can't be floored to a step index — quantise it,
      // at higher resolution (5 steps ≈ 500 stops → 2‰) so 5 steps stay smooth.
      const beatQ = Math.round(range(p, 0.2, 0.8) * 5 * 200) / 200;
      const revealQ = Math.round(range(p, 0.5, 0.7) * 100) / 100;
      const statQ = Math.round(range(p, 0.68, 0.84) * 100) / 100;
      if (typedQ !== e.typed) { e.typed = typedQ; setTyped(typedQ); }
      if (beatQ !== e.beat) { e.beat = beatQ; setBeat(beatQ); }
      if (revealQ !== e.reveal) { e.reveal = revealQ; setReveal(revealQ); }
      if (statQ !== e.stat) { e.stat = statQ; setStatProgress(statQ); }
    });
    // aoi is derived from caps.mobile only; depend on that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caps.mobile]);

  return (
    <div ref={viewRef}>
      <section
        ref={sectionRef}
        className="relative h-[100svh] w-full overflow-hidden bg-void"
        aria-label="GoPilot"
      >
        {/* Ambient backdrop so the interface floats over Earth, not over a slab. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(90% 70% at 78% 26%, rgb(var(--c-ink)) 0%, transparent 62%), radial-gradient(70% 60% at 10% 84%, rgb(var(--c-abyss)) 0%, transparent 66%), rgb(var(--c-void))',
          }}
        />

        <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col px-4 sm:px-6 md:px-10">
          {/* ---------- headline ----------
              The wrapper flex-centres; the animation (fade + rise) is applied to
              the inner block via headRef. Do NOT put the centring transform on
              headRef — the scroll handler overwrites `transform` each frame, which
              would clobber a `-translate-y-1/2` and drop the headline low. */}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-6 md:px-10">
            <div ref={headRef} className="mx-auto max-w-[54rem] text-center opacity-0 will-transform">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-signal/60" />
                <span className="label text-signal/90">{GOPILOT_SECTION.eyebrow}</span>
                <span className="h-px w-8 bg-signal/60" />
              </div>
              <h2 className="display text-[clamp(2.2rem,6.6vw,5.6rem)] text-chalk">
                {GOPILOT_SECTION.headline}
              </h2>
              <p className="mx-auto mt-6 max-w-[34rem] text-[0.95rem] leading-relaxed text-mist">
                {GOPILOT_SECTION.body}
              </p>
            </div>
          </div>

          {/* ---------- the interface ---------- */}
          <div ref={uiRef} className="flex h-full flex-col justify-center opacity-0 will-transform">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)] lg:gap-5">
              {/* left: chat + workflow */}
              <div className="order-2 flex flex-col gap-3 lg:order-1">
                <GoPilotChat
                  question={GOPILOT_SECTION.question}
                  typed={typed}
                  compact={caps.mobile}
                />
                <AgentWorkflow steps={GOPILOT_SECTION.steps} beat={beat} compact={caps.mobile} />
              </div>

              {/* right: the map */}
              <div className="order-1 lg:order-2">
                <div
                  ref={mapFrameRef}
                  data-scene="dark"
                  className="brackets relative aspect-[16/10] w-full overflow-hidden border border-white/[0.08] bg-ink opacity-0 will-transform lg:aspect-auto lg:h-[min(64svh,580px)]"
                >
                  {/* Grey plate — the map before GoPilot has chosen anything. */}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(150% 120% at 30% 20%, #2b2f33 0%, #22262a 42%, #1a1d20 100%)',
                    }}
                  />

                  {near && (
                    <>
                      {/* The inference frame GoPilot settles on — the real Beirut
                          satellite scene the segmentation was run against. Fades in
                          (opacity/scale driven imperatively) at "Selecting optimal
                          imagery". */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={baseImgRef}
                        src="/beirut-base.webp"
                        alt=""
                        aria-hidden
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover opacity-0 will-transform"
                      />
                      {/* GoPilot's scene parse wipes in over the satellite base */}
                      <SceneParseOverlay reveal={reveal} compact={caps.mobile} />
                    </>
                  )}

                  <MapChrome source={GOPILOT_SECTION.source} />

                  <SceneResult
                    title={GOPILOT_SECTION.resultTitle}
                    model={GOPILOT_SECTION.model}
                    classes={GOPILOT_SECTION.classes}
                    progress={statProgress}
                    compact={caps.mobile}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Map furniture: acquisition banner, scale bar, north arrow. */
function MapChrome({ source }: { source: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1 w-1">
            <span className="absolute inset-0 rounded-full bg-signal" />
            <span className="absolute inset-0 animate-ping rounded-full bg-signal/50" />
          </span>
          <span className="label-sm text-signal/80">Beirut · Live</span>
        </div>
        <span className="label-sm truncate">{source}</span>
      </div>

      <div className="absolute bottom-3 left-3">
        <div className="flex flex-col items-start gap-1">
          <span className="label-sm">200 m</span>
          <div className="flex h-1.5 items-end">
            <span className="h-1.5 w-px bg-white/50" />
            <span className="h-px w-14 bg-white/50" />
            <span className="h-1.5 w-px bg-white/50" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col items-center gap-0.5">
        <svg width="10" height="14" viewBox="0 0 10 14" className="opacity-60">
          <path d="M5 0 L9 13 L5 10 L1 13 Z" fill="rgba(238,243,244,0.75)" />
        </svg>
        <span className="label-sm leading-none">N</span>
      </div>
    </div>
  );
}
