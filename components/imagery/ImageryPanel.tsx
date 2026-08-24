'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { QuadRenderer, type UniformValue } from '@/lib/webgl/QuadRenderer';
import { IMAGERY_FRAGMENT } from '@/lib/webgl/glsl/imageryFragment';
import { BUDGET, type Capabilities } from '@/lib/hooks/useCapabilities';

/**
 * The site's single imagery primitive.
 *
 * Sections don't own shaders — they own *state*, and push it here through
 * `set()`. State is written into a mutable ref and consumed inside the GL draw
 * call, so scroll-linked imagery never rerenders React.
 */
export interface ImageryState {
  centerX: number;
  centerY: number;
  widthKm: number;
  reveal: number;
  sharpen: number;
  bands: number;
  grid: number;
  scan: number;
  scanPos: number;
  heat: number;
  vignette: number;
  fade: number;
  rotate: number;
  sunAz: number;
  sunEl: number;
}

export const defaultImageryState = (over: Partial<ImageryState> = {}): ImageryState => ({
  centerX: 0,
  centerY: 0,
  widthKm: 4,
  reveal: 1,
  sharpen: 1,
  bands: 0,
  grid: 0,
  scan: 0,
  scanPos: 0,
  heat: 0,
  vignette: 0.6,
  fade: 1,
  rotate: 0,
  sunAz: 2.44, // ~140° — long shadows toward lower-left, a flattering sun angle
  sunEl: 0.62,
  ...over,
});

export interface ImageryHandle {
  /** Merge new state and schedule a frame. Safe to call every scroll tick. */
  set: (patch: Partial<ImageryState>) => void;
  get: () => ImageryState;
}

interface Props {
  seed: number;
  caps: Capabilities;
  /** Render frames continuously (needed when the shader animates by itself). */
  animate?: boolean;
  /** False pauses the GL loop entirely. */
  active?: boolean;
  initial?: Partial<ImageryState>;
  className?: string;
  handleRef?: Ref<ImageryHandle>;
}

export default function ImageryPanel({
  seed,
  caps,
  animate = false,
  active = true,
  initial,
  className,
  handleRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<QuadRenderer | null>(null);
  /** Only true when WebGL2 is genuinely unavailable — see the init effect. */
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const stateRef = useRef<ImageryState>(defaultImageryState(initial));
  /* `active` is read by the init effect's retry guard but must not be a dependency
     of it: visibility toggles constantly as the reader scrolls, and re-keying on it
     would tear down and rebuild the GL context every time a panel left the
     viewport — the exact context churn that exhausts the pool. */
  const activeRef = useRef(active);
  activeRef.current = active;

  useImperativeHandle(
    handleRef,
    () => ({
      set: (patch) => {
        Object.assign(stateRef.current, patch);
        rendererRef.current?.request();
      },
      get: () => stateRef.current,
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const detail = caps.tier === 'low' ? 0.45 : caps.tier === 'mid' ? 0.8 : 1;

    const renderer = new QuadRenderer(canvas, {
      fragment: IMAGERY_FRAGMENT,
      animate,
      /* Capped at 1.5 even on `high`. DPR and renderScale multiply, and pixel
         count goes as the square, so an unclamped 2× DPR retina panel was drawing
         ~4× the fragments of a 1× one — the single largest cost on the page for a
         difference that is invisible on procedural, band-limited imagery. */
      maxDpr: caps.tier === 'low' ? 1 : caps.tier === 'mid' ? 1.1 : 1.25,
      uniforms: (): Record<string, UniformValue> => {
        const s = stateRef.current;
        return {
          uCenter: [s.centerX, s.centerY],
          uWidthKm: s.widthKm,
          uReveal: s.reveal,
          uSharpen: s.sharpen,
          uBands: s.bands,
          uGrid: s.grid,
          uScan: s.scan,
          uScanPos: s.scanPos,
          uHeat: s.heat,
          uVignette: s.vignette,
          uFade: s.fade,
          uRotate: s.rotate,
          uSunAz: s.sunAz,
          uSunEl: s.sunEl,
          uSeedF: seed,
          uDetail: detail,
        };
      },
    });

    if (!renderer.ok) {
      /* Couldn't get a context or compile. Two very different causes:
         genuinely no WebGL2 (show the CSS substrate, permanent), or this canvas
         is spent — its context was released by a previous dispose, or Chrome
         evicted it to stay under the simultaneous-context cap. Writing
         `display:none` straight onto the DOM node made the second case
         permanent and invisible: the panel simply never appeared, with no error.
         Bumping `attempt` remounts a *fresh* canvas element (it is the React
         key), which is the only way to get a live context back — see the note in
         QuadRenderer.dispose. Only a real absence of WebGL2 reaches the
         substrate. */
      renderer.dispose();
      if (typeof document !== 'undefined') {
        const probe = document.createElement('canvas');
        if (!probe.getContext('webgl2')) {
          setFailed(true);
          return;
        }
      }
      /* Retry only while this panel is actually meant to be rendering, and only
         a few times. An off-screen panel that reclaimed a context would push the
         pool back over the cap and evict an on-screen one, which would retry in
         turn — an unbounded round-robin of panels stealing contexts from each
         other. Bounding it means a genuinely unrecoverable panel settles onto the
         substrate instead of spinning. */
      if (!activeRef.current || attempt >= 3) return;
      const retry = requestAnimationFrame(() => setAttempt((n) => n + 1));
      return () => cancelAnimationFrame(retry);
    }
    setFailed(false);

    renderer.setScale(BUDGET[caps.tier].renderScale);
    rendererRef.current = renderer;

    const onResize = () => renderer.request();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      rendererRef.current = null;
    };
    // Deliberately not keyed on imagery state — that flows through set() into a
    // ref, so scroll never rerenders this. `attempt` is the retry counter from
    // the context-loss path above; `active` is read via activeRef, not a dep.
  }, [seed, caps.tier, animate, attempt]);

  useEffect(() => {
    rendererRef.current?.setVisible(active);
    /* Becoming visible with no live renderer means this panel's context was
       taken while it was off-screen — Chrome evicts the oldest to stay under the
       cap, which is exactly what happens when the reader scrolls back up to an
       earlier act. Reset the retry budget so the effect above can rebuild it. */
    if (active && !rendererRef.current) setAttempt(0);
  }, [active]);

  return (
    <div className={className}>
      {/* Fallback substrate: visible if WebGL2 is unavailable, otherwise hidden
          behind the canvas. Keeps the layout and mood intact. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[#0a1015]"
        style={{
          backgroundImage:
            'radial-gradient(60% 60% at 40% 35%, #16241f 0%, transparent 70%), radial-gradient(50% 50% at 70% 70%, #1d2620 0%, transparent 70%), linear-gradient(180deg,#080d11,#0c1318)',
        }}
      />
      {/* `key` is the retry counter, not decoration: a canvas whose WebGL context
          has been released can never get another one, so recovering requires a
          brand-new element. Keying on `attempt` makes React discard the corpse. */}
      <canvas
        key={attempt}
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={failed ? { display: 'none' } : undefined}
      />
    </div>
  );
}
