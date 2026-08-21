import { cellRand2 } from '../utils/rng';

/**
 * Exact CPU reconstruction of the shader's Voronoi cells.
 *
 * The GPU draws parcel edges as `f2 - f1` bands; the CPU needs the actual
 * polygon to emit an SVG boundary for the field-delineation model. Both agree
 * because the site placement rule here is identical to noise.ts
 * (offset 0.2 + jitter 0.6) and because that constraint makes a 3×3 (here 5×5,
 * for safety) neighbourhood search exact — see the proof in noise.ts.
 *
 * Method: start with the cell's bounding square and clip it by the perpendicular
 * bisector half-plane against every nearby site (Sutherland–Hodgman). The result
 * is the true convex Voronoi polygon in lattice units.
 */

const SITE_OFF = 0.2;
const SITE_JIT = 0.6;

export type Pt = { x: number; y: number };

export function siteOf(cx: number, cy: number, salt: number): Pt {
  const [jx, jy] = cellRand2(cx, cy, salt);
  return { x: cx + SITE_OFF + SITE_JIT * jx, y: cy + SITE_OFF + SITE_JIT * jy };
}

/** Clip a convex polygon by the half-plane of points closer to `a` than `b`. */
function clipBisector(poly: Pt[], a: Pt, b: Pt): Pt[] {
  // Half-plane: dot(p - m, d) <= 0 where d = b - a, m = midpoint.
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const side = (p: Pt) => (p.x - mx) * dx + (p.y - my) * dy;

  const out: Pt[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % n]!;
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if (sp <= 0 !== sq <= 0) {
      const t = sp / (sp - sq);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return out;
}

/** The Voronoi polygon of cell (cx,cy), in lattice units. */
export function cellPolygon(cx: number, cy: number, salt: number, radius = 2): Pt[] {
  const a = siteOf(cx, cy, salt);
  // Bounding box generous enough to contain the cell (sites stay within ±0.8).
  let poly: Pt[] = [
    { x: cx - 1.2, y: cy - 1.2 },
    { x: cx + 2.2, y: cy - 1.2 },
    { x: cx + 2.2, y: cy + 2.2 },
    { x: cx - 1.2, y: cy + 2.2 },
  ];
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x === 0 && y === 0) continue;
      poly = clipBisector(poly, a, siteOf(cx + x, cy + y, salt));
      if (poly.length === 0) return poly;
    }
  }
  return poly;
}

/** Shoelace area (lattice units²) — always positive. */
export function polygonArea(poly: Pt[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    s += p.x * q.y - q.x * p.y;
  }
  return Math.abs(s) / 2;
}

export function polygonCentroid(poly: Pt[]): Pt {
  let cx = 0;
  let cy = 0;
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const cross = p.x * q.y - q.x * p.y;
    s += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (Math.abs(s) < 1e-9) return poly[0] ?? { x: 0, y: 0 };
  return { x: cx / (3 * s), y: cy / (3 * s) };
}

/** Shrink a convex polygon toward its centroid (inset stroke look). */
export function insetPolygon(poly: Pt[], factor: number): Pt[] {
  const c = polygonCentroid(poly);
  return poly.map((p) => ({
    x: c.x + (p.x - c.x) * factor,
    y: c.y + (p.y - c.y) * factor,
  }));
}
