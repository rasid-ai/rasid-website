'use client';

import { useEffect, useState } from 'react';

/**
 * Device capability tiering.
 *
 * Mobile is not a collapsed desktop: the tier decides particle counts, sphere
 * tessellation, render scale and whether the heavy scenes mount at all. It is
 * resolved once, on the client, after mount — never guessed during SSR.
 */
export type Tier = 'high' | 'mid' | 'low';

export interface Capabilities {
  tier: Tier;
  reducedMotion: boolean;
  /** Coarse pointer — no hover, no bespoke cursor. */
  touch: boolean;
  /** Narrow viewport at mount. */
  mobile: boolean;
  webgl2: boolean;
  dpr: number;
  /** Resolved after mount; guards against SSR/hydration mismatch. */
  ready: boolean;
}

const DEFAULTS: Capabilities = {
  tier: 'high',
  reducedMotion: false,
  touch: false,
  mobile: false,
  webgl2: true,
  dpr: 1,
  ready: false,
};

function detectWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

/**
 * Is this an integrated / software GPU?
 *
 * Core count is a poor proxy for fill rate, and it was the only signal here: a
 * thin-and-light laptop with 8 cores and Intel Iris graphics scored `high` and
 * got 2× DPR, MSAA and the full shader, which is exactly the machine that then
 * stutters. The renderer string is the cheapest reliable discriminator — these
 * shaders are fill-rate bound, so the GPU matters far more than the CPU.
 */
function weakGpu(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (!dbg) return false; // unknown is not evidence of weakness
    const r = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '').toLowerCase();
    // SwiftShader/ANGLE-software render on the CPU; UHD/HD/Iris are integrated.
    return /swiftshader|software|llvmpipe|microsoft basic|uhd graphics|hd graphics|iris|vega \d|radeon graphics|apple m1(?!\s*(pro|max|ultra))/.test(r);
  } catch {
    return false;
  }
}

function detectTier(mobile: boolean): Tier {
  const cores = navigator.hardwareConcurrency ?? 4;
  // deviceMemory is Chromium-only; absence is not evidence of a weak device.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const weak = weakGpu();
  if (mobile) {
    if (weak || cores <= 4 || (mem !== undefined && mem <= 4)) return 'low';
    return 'mid';
  }
  if (weak) return 'mid';
  if (cores <= 4 || (mem !== undefined && mem <= 4)) return 'mid';
  return 'high';
}

export function useCapabilities(): Capabilities {
  const [caps, setCaps] = useState<Capabilities>(DEFAULTS);

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqTouch = window.matchMedia('(hover: none), (pointer: coarse)');
    const mqMobile = window.matchMedia('(max-width: 900px)');

    const resolve = () => {
      const mobile = mqMobile.matches;
      const webgl2 = detectWebGL2();
      setCaps({
        tier: webgl2 ? detectTier(mobile) : 'low',
        reducedMotion: mqMotion.matches,
        touch: mqTouch.matches,
        mobile,
        webgl2,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        ready: true,
      });
    };

    resolve();
    mqMotion.addEventListener('change', resolve);
    mqMobile.addEventListener('change', resolve);
    return () => {
      mqMotion.removeEventListener('change', resolve);
      mqMobile.removeEventListener('change', resolve);
    };
  }, []);

  return caps;
}

/**
 * Per-tier budgets. Single place to tune the whole page's cost.
 *
 * `renderScale` is the strongest lever by far and the least visible: the imagery
 * shader is fill-rate bound, so cost scales with the square of this number while
 * the material is procedural and band-limited — it resolves detail to whatever
 * resolution it is drawn at rather than showing interpolation blur. Even `high`
 * therefore renders below native, because 2× DPR on a 1600px panel is 4× the
 * pixels of DPR 1 for a difference that is hard to see on any real display.
 */
export const BUDGET = {
  high: { stars: 1800, satellites: 4, dataPoints: 160, sphereSeg: 96, renderScale: 0.8, particles: 460 },
  mid: { stars: 1000, satellites: 3, dataPoints: 100, sphereSeg: 72, renderScale: 0.65, particles: 260 },
  low: { stars: 550, satellites: 2, dataPoints: 55, sphereSeg: 56, renderScale: 0.5, particles: 120 },
} as const satisfies Record<Tier, Record<string, number>>;
