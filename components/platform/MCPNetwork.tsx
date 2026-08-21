'use client';

import { useEffect, useRef, useState } from 'react';
import { NETWORK_SECTION } from '@/data/content';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { onProgress } from '@/lib/story/store';
import { clamp, range, smootherstep } from '@/lib/utils/math';
import NetworkCanvas from './NetworkCanvas';
import NodeCluster from './NodeCluster';

/**
 * Act IV — the tool ecosystem.
 *
 * Ordering is deliberate and matches the brief: the visitor has already seen
 * *what* GoPilot does (Act III), so this section answers *how*. MCP is named
 * once, as an implementation fact, and never used as the headline claim.
 *
 * Choreography:
 *   0.00–0.18  headline, then the centre node ignites
 *   0.15–0.45  the four branches extend and their nodes resolve
 *   0.35–0.70  tool lists populate, one item at a time
 *   0.55–1.00  packets flow along the edges — data actually moving through
 *
 * The graph is drawn on a 2D canvas (not SVG, not WebGL): ~40 moving packets
 * with additive glow is exactly the workload canvas is best at, and it keeps
 * this section cheap enough to coexist with the WebGL panels above and below.
 */
export default function MCPNetwork() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const { caps } = useScrollContext();
  const [progress, setProgress] = useState(0);
  /* Last progress value pushed into React state, quantised to 1%. The store
     fires onProgress every scroll frame with a continuous value; feeding that
     straight to setState re-rendered NodeCluster (≈72 DOM nodes) on every frame,
     which is one of the three biggest scroll costs on the page. The clusters
     only cross-fade, so 1% resolution is visually identical — this caps the
     section at ~100 renders instead of thousands. Same pattern as
     UseCaseSection's figRef guard. */
  const progRef = useRef(-1);

  useStoryTrigger(sectionRef, 'network', {
    length: caps.mobile ? 3 : 4.5,
    pin: true,
    enabled: caps.ready,
  });

  useEffect(() => {
    return onProgress('network', (p) => {
      const h = headRef.current;
      if (h) {
        const inP = smootherstep(range(p, 0.02, 0.14));
        const outP = smootherstep(range(p, 0.2, 0.34));
        h.style.opacity = String(inP * (1 - outP * 0.72));
        h.style.transform = `translate3d(0, ${(1 - inP) * 36 - outP * 22}px, 0)`;
      }
      // The canvas reads progress from the store directly; React state only
      // drives the node clusters, so quantise to 1% before it enters React.
      const q = Math.round(p * 100) / 100;
      if (q !== progRef.current) {
        progRef.current = q;
        setProgress(q);
      }
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden bg-void"
      aria-label="GoPilot tool ecosystem"
    >
      {/* substrate: a faint technical grid, fading at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--c-signal) / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-signal) / 0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(70% 62% at 50% 50%, #000 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(70% 62% at 50% 50%, #000 20%, transparent 78%)',
        }}
      />

      {/* ---------- headline ---------- */}
      <div
        ref={headRef}
        className="pointer-events-none absolute inset-x-6 top-[13svh] z-30 opacity-0 will-transform md:inset-x-10 md:top-[15svh]"
      >
        <div className="mx-auto max-w-[52rem] text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{NETWORK_SECTION.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display text-[clamp(1.9rem,4.9vw,3.9rem)] text-chalk">
            {NETWORK_SECTION.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-[36rem] text-[0.93rem] leading-relaxed text-mist">
            {NETWORK_SECTION.body}
          </p>
        </div>
      </div>

      {/* ---------- the graph ---------- */}
      <div className="absolute inset-0 z-10">
        <NetworkCanvas caps={caps} nodes={NETWORK_SECTION.nodes} />
      </div>

      {/* ---------- node clusters (DOM: real text, selectable, accessible) --- */}
      <div className="absolute inset-0 z-20">
        <NodeCluster nodes={NETWORK_SECTION.nodes} progress={progress} caps={caps} />
      </div>

      {/* ---------- centre label ---------- */}
      <CenterNode progress={progress} label={NETWORK_SECTION.center} />

      {/* ---------- footer note ---------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
        <div className="mx-auto max-w-[1600px] px-6 pb-6 md:px-10 md:pb-8">
          <div className="hairline mb-3" />
          <div className="flex items-center justify-between gap-4">
            <span className="label-sm">Model Context Protocol · tool interface</span>
            <span
              className="label-sm text-signal/70 transition-opacity duration-700"
              style={{ opacity: clamp((progress - 0.55) / 0.2) }}
            >
              Data flowing
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The GoPilot node at the centre of the graph. */
function CenterNode({ progress, label }: { progress: number; label: string }) {
  const ignite = smootherstep(range(progress, 0.1, 0.24));
  const busy = clamp((progress - 0.5) / 0.2);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[54svh] z-30 -translate-x-1/2 -translate-y-1/2 md:top-1/2">
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: ignite,
          transform: `scale(${0.9 + ignite * 0.1})`,
        }}
      >
        {/* concentric rings */}
        <div className="relative flex h-[92px] w-[92px] items-center justify-center md:h-[112px] md:w-[112px]">
          <span className="absolute inset-0 rounded-full border border-signal/25" />
          <span
            className="absolute inset-[10px] rounded-full border border-signal/40"
            style={{ opacity: 0.4 + busy * 0.6 }}
          />
          {/* activity pulse — only once packets are actually moving */}
          <span
            className="absolute inset-0 animate-ping rounded-full border border-signal/25"
            style={{ opacity: busy * 0.7, animationDuration: '3.2s' }}
          />
          <span
            className="absolute inset-[26px] rounded-full bg-signal/[0.07] backdrop-blur-sm"
            style={{ opacity: 0.5 + busy * 0.5 }}
          />
          {/* core */}
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-signal" />
            <span
              className="absolute inset-[-6px] rounded-full bg-signal/25 blur-[6px]"
              style={{ opacity: 0.5 + busy * 0.5 }}
            />
          </span>
        </div>

        <div className="mt-3 text-center">
          <div className="text-[15px] font-medium tracking-tight text-chalk md:text-[17px]">
            {label}
          </div>
          <div className="label-sm mt-1">Agent · orchestrator</div>
        </div>
      </div>
    </div>
  );
}
