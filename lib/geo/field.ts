import { cellRand } from '../utils/rng';
import { siteOf, type Pt } from './voronoi';

/**
 * CPU mirror of the shader's *continuous* fields.
 *
 * lib/utils/rng.ts already mirrors the integer hashes, which is enough to place
 * anything on a lattice. But some of the shader's gates are smooth noise fields
 * — `urbanity()` decides whether a district is built-up or farmed — and any
 * overlay that has to agree with those gates needs them on the CPU too.
 *
 * Every function here mirrors lib/webgl/glsl/noise.ts and surface.ts exactly:
 * same constants, same octave count, same rotation matrix, same seed salts. The
 * only divergence is float width (GPU highp vs JS double), which on smooth
 * fields is ~1e-7 — orders of magnitude below a pixel.
 *
 * If you change a constant in the GLSL, change it here.
 */

/* GLSL smoothstep. */
export function smoothstepG(e0: number, e1: number, x: number): number {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Value noise, quintic interpolation. Mirrors `vnoise`. */
export function vnoise(px: number, py: number, s: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = cellRand(ix, iy, s);
  const b = cellRand(ix + 1, iy, s);
  const d = cellRand(ix, iy + 1, s);
  const e = cellRand(ix + 1, iy + 1, s);
  const top = a + (b - a) * ux;
  const bot = d + (e - d) * ux;
  return top + (bot - top) * uy;
}

/* The octave-decorrelating rotation. GLSL mat2 is column-major, so
   mat2(0.86, 0.51, -0.51, 0.86) * p = (0.86x − 0.51y, 0.51x + 0.86y). */
const R00 = 0.86;
const R01 = -0.51;
const R10 = 0.51;
const R11 = 0.86;

/** Mirrors `fbm`. */
export function fbm(px: number, py: number, oct: number, s: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let x = px;
  let y = py;
  for (let i = 0; i < oct && i < 8; i++) {
    sum += amp * vnoise(x, y, s + i * 37);
    norm += amp;
    const nx = (R00 * x + R01 * y) * 2.02;
    const ny = (R10 * x + R11 * y) * 2.02;
    x = nx;
    y = ny;
    amp *= 0.5;
  }
  return sum / Math.max(norm, 1e-5);
}

/** Mirrors `warpFbm`. */
export function warpFbm(px: number, py: number, oct: number, s: number): number {
  const qx = fbm(px + 11.3, py + 11.3, 3, s + 7);
  const qy = fbm(px - 4.7, py - 4.7, 3, s + 91);
  return fbm(px + 2.2 * (qx - 0.5), py + 2.2 * (qy - 0.5), oct, s);
}

/** Mirrors `urbanity` — probability a district is built-up rather than farmed. */
export function urbanity(x: number, y: number, s: number): number {
  return smoothstepG(0.46, 0.72, warpFbm(x * 0.048 - 14.2, y * 0.048 + 9.4, 4, s + 97));
}

/** Mirrors `landMask` — 0 = open sea, 1 = inland. */
export function landMask(x: number, y: number, s: number): number {
  return smoothstepG(0.34, 0.52, warpFbm(x * 0.028 + 3.1, y * 0.028 - 1.7, 4, s + 41));
}

/** Mirrors `elevation`. */
export function elevation(x: number, y: number, s: number): number {
  const base = warpFbm(x * 0.055, y * 0.055, 5, s + 3);
  // `ridged` is only needed above the base threshold; approximate with base
  // alone below it, exactly as the shader's smoothstep gate does.
  const gate = smoothstepG(0.35, 0.8, base);
  return base * 0.72 + (gate > 0 ? ridged(x * 0.13, y * 0.13, 4, s + 17) * 0.34 * gate : 0);
}

/** Mirrors `ridged`. */
export function ridged(px: number, py: number, oct: number, s: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let prev = 1;
  let x = px;
  let y = py;
  for (let i = 0; i < oct && i < 8; i++) {
    let n = 1 - Math.abs(vnoise(x, y, s + i * 53) * 2 - 1);
    n *= n;
    sum += amp * n * prev;
    prev = n;
    norm += amp;
    const nx = (R00 * x + R01 * y) * 2.04;
    const ny = (R10 * x + R11 * y) * 2.04;
    x = nx;
    y = ny;
    amp *= 0.5;
  }
  return sum / Math.max(norm, 1e-5);
}

/**
 * Mirrors the `voronoi()` nearest-site search: which cell owns this point, and
 * where its site sits. Exact for the same reason the shader's 3×3 search is —
 * see the proof in lib/webgl/glsl/noise.ts.
 */
export function nearestSite(
  px: number,
  py: number,
  salt: number,
): { id: { x: number; y: number }; site: Pt } {
  const bx = Math.floor(px);
  const by = Math.floor(py);
  let best = Infinity;
  let id = { x: bx, y: by };
  let site: Pt = { x: bx, y: by };
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      const cx = bx + x;
      const cy = by + y;
      const sp = siteOf(cx, cy, salt);
      const d = (sp.x - px) ** 2 + (sp.y - py) ** 2;
      if (d < best) {
        best = d;
        id = { x: cx, y: cy };
        site = sp;
      }
    }
  }
  return { id, site };
}

/** 2D rotation matching GLSL `rot2`. */
export function rot2(x: number, y: number, a: number): Pt {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: c * x - s * y, y: s * x + c * y };
}
