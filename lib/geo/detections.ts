import { cellRand, cellRand2, makeRng } from '../utils/rng';
import { cellPolygon, polygonArea, polygonCentroid, type Pt } from './voronoi';
import { nearestSite, rot2, urbanity } from './field';

/**
 * Detection extraction — the CPU half of the imagery contract.
 *
 * These functions read the *same* procedural model the imagery shader draws
 * (lib/webgl/glsl/surface.ts) and emit vector results in the shape a real
 * geospatial model would: polygons, boxes, confidences, areas.
 *
 * Consequence: the boundaries we animate are genuinely the boundaries of the
 * fields in the picture, and the solar boxes genuinely sit on the panel arrays.
 * Nothing is hand-placed, and nothing drifts when the viewport changes.
 *
 * ── Swapping in real RASID results ──────────────────────────────────────────
 * Every consumer takes `Detection[]` / `FieldPolygon[]`. Replace these
 * generators with an API call that returns the same types and the entire
 * visualisation layer works unchanged.
 */

/** Viewport into the procedural world, in kilometres. */
export interface Viewport {
  /** Centre position (km) in world space. */
  cx: number;
  cy: number;
  /** Visible width (km). Height derives from aspect. */
  widthKm: number;
  aspect: number;
  seed: number;
}

/** Normalised device-ish coords: 0..1 across the viewport, y down. */
export interface UV {
  u: number;
  v: number;
}

export interface FieldPolygon {
  id: string;
  /** Polygon in 0..1 viewport space. */
  points: UV[];
  areaHa: number;
  ndvi: number;
  crop: string;
  confidence: number;
  /** Perimeter in viewport units — used to drive stroke draw-on animation. */
  perimeter: number;
  centroid: UV;
  /** True when the field changed between epochs (Agriculture use case). */
  changed?: boolean;
  changeKind?: 'expanded' | 'cleared' | 'replanted';
}

export interface Detection {
  id: string;
  /** Oriented box in 0..1 viewport space. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
  confidence: number;
  /** Square metres. */
  areaM2: number;
  label: string;
}

export interface TreeDetection {
  id: string;
  cx: number;
  cy: number;
  r: number;
  confidence: number;
  heightM: number;
}

export interface SegmentMask {
  id: string;
  points: UV[];
  label: string;
  confidence: number;
}

/* Must match SURFACE_GLSL. */
const PARCEL_KM = 0.3;
const SOLAR_KM = 0.42;
const TREE_KM = 0.022;

const CROPS = ['Fallow', 'Cereal', 'Orchard', 'Vineyard', 'Bare soil'] as const;

/** Mirror of `parcels()` classification. */
function parcelClass(cx: number, cy: number, seed: number) {
  const type = cellRand(cx, cy, seed + 227);
  const vigour = cellRand(cx, cy, seed + 229);
  let crop: string;
  let ndvi: number;
  if (type < 0.2) {
    crop = CROPS[0];
    ndvi = 0.12;
  } else if (type < 0.44) {
    crop = CROPS[1];
    ndvi = 0.55;
  } else if (type < 0.72) {
    crop = CROPS[2];
    ndvi = 0.72;
  } else if (type < 0.9) {
    crop = CROPS[3];
    ndvi = 0.83;
  } else {
    crop = CROPS[4];
    ndvi = 0.2;
  }
  return { crop, ndvi: ndvi * (0.85 + 0.3 * vigour), vigour };
}

/* --- coordinate helpers ---------------------------------------------- */

function makeProjector(vp: Viewport) {
  const heightKm = vp.widthKm / vp.aspect;
  const x0 = vp.cx - vp.widthKm / 2;
  const y0 = vp.cy - heightKm / 2;
  return {
    heightKm,
    /** world km → viewport 0..1 (v flipped so it matches screen space) */
    toUV: (x: number, y: number): UV => ({
      u: (x - x0) / vp.widthKm,
      v: 1 - (y - y0) / heightKm,
    }),
    x0,
    y0,
  };
}

function perimeterOf(pts: UV[]): number {
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    p += Math.hypot(b.u - a.u, b.v - a.v);
  }
  return p;
}

/* ------------------------------------------------------------------ *
 * Field delineation
 * ------------------------------------------------------------------ */
export function extractFields(vp: Viewport, opts: { max?: number; withChange?: boolean } = {}): FieldPolygon[] {
  const { max = 90, withChange = false } = opts;
  const proj = makeProjector(vp);
  const salt = vp.seed + 211;

  // Lattice cells overlapping the viewport (plus a ring so edges look cut off,
  // not conveniently absent).
  const i0 = Math.floor((vp.cx - vp.widthKm / 2) / PARCEL_KM) - 1;
  const i1 = Math.ceil((vp.cx + vp.widthKm / 2) / PARCEL_KM) + 1;
  const j0 = Math.floor((vp.cy - proj.heightKm / 2) / PARCEL_KM) - 1;
  const j1 = Math.ceil((vp.cy + proj.heightKm / 2) / PARCEL_KM) + 1;

  const out: FieldPolygon[] = [];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const poly = cellPolygon(i, j, salt);
      if (poly.length < 3) continue;

      const cls = parcelClass(i, j, vp.seed);
      // Model wouldn't delineate bare rock / water; approximate with a gate.
      if (cellRand(i, j, vp.seed + 401) > 0.86) continue;

      const areaLat = polygonArea(poly);
      const areaKm2 = areaLat * PARCEL_KM * PARCEL_KM;
      const pts = poly.map((p: Pt) => proj.toUV(p.x * PARCEL_KM, p.y * PARCEL_KM));

      // Cull polygons entirely outside the viewport.
      const inside = pts.some((p) => p.u > -0.25 && p.u < 1.25 && p.v > -0.25 && p.v < 1.25);
      if (!inside) continue;

      const c = polygonCentroid(poly);
      const changed = withChange && cellRand(i, j, vp.seed + 419) < 0.26;
      const kindR = cellRand(i, j, vp.seed + 421);

      out.push({
        id: `fld-${i}-${j}`,
        points: pts,
        areaHa: areaKm2 * 100,
        ndvi: cls.ndvi,
        crop: cls.crop,
        confidence: 0.88 + 0.11 * cellRand(i, j, vp.seed + 431),
        perimeter: perimeterOf(pts),
        centroid: proj.toUV(c.x * PARCEL_KM, c.y * PARCEL_KM),
        changed,
        changeKind: changed
          ? kindR < 0.42
            ? 'expanded'
            : kindR < 0.76
              ? 'replanted'
              : 'cleared'
          : undefined,
      });
    }
  }

  // Nearest-to-centre first, so truncation removes peripheral clutter.
  out.sort(
    (a, b) =>
      Math.hypot(a.centroid.u - 0.5, a.centroid.v - 0.5) -
      Math.hypot(b.centroid.u - 0.5, b.centroid.v - 0.5),
  );
  return out.slice(0, max);
}

/* ------------------------------------------------------------------ *
 * Solar detection — mirrors `solar()` site selection exactly
 * ------------------------------------------------------------------ */
export function extractSolar(vp: Viewport, opts: { max?: number } = {}): Detection[] {
  const { max = 120 } = opts;
  const proj = makeProjector(vp);
  const s = vp.seed;

  const i0 = Math.floor((vp.cx - vp.widthKm / 2) / SOLAR_KM) - 1;
  const i1 = Math.ceil((vp.cx + vp.widthKm / 2) / SOLAR_KM) + 1;
  const j0 = Math.floor((vp.cy - proj.heightKm / 2) / SOLAR_KM) - 1;
  const j1 = Math.ceil((vp.cy + proj.heightKm / 2) / SOLAR_KM) + 1;

  const out: Detection[] = [];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      if (cellRand(i, j, s + 331) > 0.16) continue; // same gate as the shader
      const [jx, jy] = cellRand2(i, j, s + 337);
      const wx = (i + 0.2 + 0.6 * jx) * SOLAR_KM;
      const wy = (j + 0.2 + 0.6 * jy) * SOLAR_KM;
      const rot = (cellRand(i, j, s + 347) - 0.5) * 0.7;
      const hw = 0.03 + 0.045 * cellRand(i, j, s + 349);
      const hh = 0.022 + 0.034 * cellRand(i, j, s + 353);

      const c = proj.toUV(wx, wy);
      if (c.u < -0.1 || c.u > 1.1 || c.v < -0.1 || c.v > 1.1) continue;

      out.push({
        id: `sol-${i}-${j}`,
        cx: c.u,
        cy: c.v,
        // Box in viewport units: x scales by widthKm, y by heightKm.
        w: (hw * 2) / vp.widthKm,
        h: (hh * 2) / proj.heightKm,
        rot: -rot, // screen y is flipped relative to world y
        confidence: 0.9 + 0.095 * cellRand(i, j, s + 443),
        areaM2: hw * 2 * hh * 2 * 1e6 * 0.78, // packing factor: panels ≠ whole pad
        label: 'Solar panel',
      });
    }
  }
  out.sort(
    (a, b) => Math.hypot(a.cx - 0.5, a.cy - 0.5) - Math.hypot(b.cx - 0.5, b.cy - 0.5),
  );
  return out.slice(0, max);
}

/* ------------------------------------------------------------------ *
 * Tree detection — samples the same forest field + crown lattice
 * ------------------------------------------------------------------ */
export function extractTrees(vp: Viewport, opts: { max?: number; stride?: number } = {}): TreeDetection[] {
  const { max = 260, stride = 3 } = opts;
  const proj = makeProjector(vp);
  const s = vp.seed;

  // Crowns are tiny; step the lattice so we sample a representative subset
  // rather than emitting tens of thousands of SVG nodes.
  const i0 = Math.floor((vp.cx - vp.widthKm / 2) / TREE_KM);
  const i1 = Math.ceil((vp.cx + vp.widthKm / 2) / TREE_KM);
  const j0 = Math.floor((vp.cy - proj.heightKm / 2) / TREE_KM);
  const j1 = Math.ceil((vp.cy + proj.heightKm / 2) / TREE_KM);

  const out: TreeDetection[] = [];
  const rng = makeRng(s + 977);
  for (let j = j0; j <= j1; j += stride) {
    for (let i = i0; i <= i1; i += stride) {
      // `forest` in the shader is a smooth field; approximate its gate with the
      // same per-cell occupancy test so crowns coincide with drawn canopy.
      const occ = cellRand(i, j, s + 257);
      if (occ > 0.42) continue;
      const [jx, jy] = cellRand2(i, j, s + 263);
      const wx = (i + 0.18 + 0.64 * jx) * TREE_KM;
      const wy = (j + 0.18 + 0.64 * jy) * TREE_KM;
      const rLat = 0.26 + 0.2 * cellRand(i, j, s + 269);
      const c = proj.toUV(wx, wy);
      if (c.u < 0.01 || c.u > 0.99 || c.v < 0.01 || c.v > 0.99) continue;
      out.push({
        id: `tre-${i}-${j}`,
        cx: c.u,
        cy: c.v,
        r: (rLat * TREE_KM) / vp.widthKm,
        confidence: 0.82 + 0.16 * rng(),
        heightM: 4 + 14 * cellRand(i, j, s + 991),
      });
      if (out.length >= max * 3) break;
    }
  }
  // Shuffle-free deterministic thinning to `max`.
  const step = Math.max(1, Math.floor(out.length / max));
  return out.filter((_, idx) => idx % step === 0).slice(0, max);
}

/* ------------------------------------------------------------------ *
 * SAM-style segmentation — instance masks over mixed content
 * ------------------------------------------------------------------ */
export function extractSegments(vp: Viewport, opts: { max?: number } = {}): SegmentMask[] {
  const { max = 26 } = opts;
  const fields = extractFields(vp, { max: max * 2 });
  const solar = extractSolar(vp, { max: 8 });
  const rng = makeRng(vp.seed + 1301);

  const segs: SegmentMask[] = [];
  // Fields become "everything" masks with slightly irregular boundaries —
  // SAM 3 does not produce perfectly straight parcel edges.
  for (const f of fields.slice(0, max - solar.length)) {
    const jitter = 0.0035;
    segs.push({
      id: `seg-${f.id}`,
      points: f.points.flatMap((p, i, arr) => {
        const n = arr[(i + 1) % arr.length]!;
        const mid: UV = {
          u: (p.u + n.u) / 2 + (rng() - 0.5) * jitter,
          v: (p.v + n.v) / 2 + (rng() - 0.5) * jitter,
        };
        return [{ u: p.u + (rng() - 0.5) * jitter, v: p.v + (rng() - 0.5) * jitter }, mid];
      }),
      label: f.crop,
      confidence: 0.79 + 0.19 * rng(),
    });
  }
  for (const d of solar) {
    const hw = d.w / 2;
    const hh = d.h / 2;
    const cr = Math.cos(d.rot);
    const sr = Math.sin(d.rot);
    const corner = (sx: number, sy: number): UV => ({
      u: d.cx + (sx * hw * cr - sy * hh * sr),
      v: d.cy + (sx * hw * sr + sy * hh * cr),
    });
    segs.push({
      id: `seg-${d.id}`,
      points: [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)],
      label: 'Solar array',
      confidence: d.confidence,
    });
  }
  return segs;
}

/* ------------------------------------------------------------------ *
 * Building footprints — mirrors `built()` block placement
 * ------------------------------------------------------------------ *
 * Unlike the other extractors this one has to agree with a *continuous* gate:
 * the shader only draws a block if `occ <= urbanity * 0.86 + 0.06`, and it
 * orients the block lattice by the district's own rotation. Both are mirrored in
 * lib/geo/field.ts, so footprints land on the buildings that were drawn.
 *
 * `epoch` is the change-detection lever: bumping it re-rolls only the occupancy
 * salt, so a second epoch shares every street and district with the first and
 * differs only in which plots are built — which is exactly what urban growth
 * looks like from orbit.
 */
export interface BuildingFootprint {
  id: string;
  /** Rotated rectangle corners in 0..1 viewport space. */
  points: UV[];
  cx: number;
  cy: number;
  areaM2: number;
  confidence: number;
  /** Present only in the later epoch: this footprint is new. */
  isNew?: boolean;
}

const BLOCK_KM = 1.7;
const BLDG_KM = 0.055;

export function extractBuildings(
  vp: Viewport,
  opts: { max?: number; epoch?: number; markNewVs?: number } = {},
): BuildingFootprint[] {
  const { max = 320, epoch = 0, markNewVs } = opts;
  const proj = makeProjector(vp);
  const s = vp.seed;
  const occSalt = s + 283 + epoch * 1009;
  const prevSalt = markNewVs === undefined ? null : s + 283 + markNewVs * 1009;

  const out: BuildingFootprint[] = [];

  // Walk the building lattice over the viewport, in *district-local* frames.
  const i0 = Math.floor((vp.cx - vp.widthKm / 2) / BLDG_KM) - 1;
  const i1 = Math.ceil((vp.cx + vp.widthKm / 2) / BLDG_KM) + 1;
  const j0 = Math.floor((vp.cy - proj.heightKm / 2) / BLDG_KM) - 1;
  const j1 = Math.ceil((vp.cy + proj.heightKm / 2) / BLDG_KM) + 1;

  // Bail out if the requested area would need an unreasonable walk: at wide
  // zooms individual buildings are sub-pixel anyway and the shader folds them
  // into an averaged urban tone, so there is nothing to outline.
  if ((i1 - i0) * (j1 - j0) > 90000) return out;

  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      // The shader works in the district's rotated frame; to place a block we
      // need the district that owns its *approximate* world position.
      const approxX = (i + 0.5) * BLDG_KM;
      const approxY = (j + 0.5) * BLDG_KM;
      const urb = urbanity(approxX, approxY, s);
      if (urb <= 0.004) continue;

      const occ = cellRand(i, j, occSalt);
      if (occ > urb * 0.86 + 0.06) continue;

      const { id: did, site } = nearestSite(approxX / BLOCK_KM, approxY / BLOCK_KM, s + 131);
      const rot = cellRand(did.x, did.y, s + 271) * (Math.PI / 2);

      // Block centre and half-extents, in district-local units of BLDG_KM.
      const [ox, oy] = cellRand2(i, j, s + 287);
      const lx = (i + 0.5 + (ox - 0.5) * 0.3) * BLDG_KM;
      const ly = (j + 0.5 + (oy - 0.5) * 0.3) * BLDG_KM;
      const [ex, ey] = cellRand2(i, j, s + 293);
      const hex = (0.2 + 0.22 * ex) * BLDG_KM;
      const hey = (0.2 + 0.22 * ey) * BLDG_KM;

      // Local → world: rotate about the district site, which is where the
      // shader's rot2(P − site, −rot) inverse puts it.
      const sx = site.x * BLOCK_KM;
      const sy = site.y * BLOCK_KM;
      const corner = (a: number, b: number): UV => {
        const r = rot2(a * hex, b * hey, rot);
        return proj.toUV(sx + lx + r.x, sy + ly + r.y);
      };

      const c = proj.toUV(sx + lx, sy + ly);
      if (c.u < -0.12 || c.u > 1.12 || c.v < -0.12 || c.v > 1.12) continue;

      out.push({
        id: `bld-${i}-${j}`,
        points: [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)],
        cx: c.u,
        cy: c.v,
        areaM2: hex * 2 * hey * 2 * 1e6,
        confidence: 0.86 + 0.13 * cellRand(i, j, s + 457),
        isNew: prevSalt === null ? undefined : cellRand(i, j, prevSalt) > urb * 0.86 + 0.06,
      });
    }
  }

  out.sort(
    (a, b) => Math.hypot(a.cx - 0.5, a.cy - 0.5) - Math.hypot(b.cx - 0.5, b.cy - 0.5),
  );
  return out.slice(0, max);
}

export interface UrbanStats {
  structures: number;
  newStructures: number;
  footprintM2: number;
  newFootprintM2: number;
  builtUpGainPct: number;
}

export function urbanStats(b: BuildingFootprint[]): UrbanStats {
  const news = b.filter((x) => x.isNew);
  const total = b.reduce((a, x) => a + x.areaM2, 0);
  const newArea = news.reduce((a, x) => a + x.areaM2, 0);
  return {
    structures: b.length,
    newStructures: news.length,
    footprintM2: total,
    newFootprintM2: newArea,
    builtUpGainPct: total > newArea ? (newArea / (total - newArea)) * 100 : 0,
  };
}

/* ------------------------------------------------------------------ *
 * Aggregate statistics — what the result panels display
 * ------------------------------------------------------------------ */
export interface SolarStats {
  objects: number;
  areaM2: number;
  coverageKm2: number;
  meanConfidence: number;
  estimatedKwp: number;
}

export function solarStats(dets: Detection[], vp: Viewport): SolarStats {
  const heightKm = vp.widthKm / vp.aspect;
  const areaM2 = dets.reduce((a, d) => a + d.areaM2, 0);
  return {
    objects: dets.length,
    areaM2,
    coverageKm2: vp.widthKm * heightKm,
    meanConfidence: dets.length
      ? dets.reduce((a, d) => a + d.confidence, 0) / dets.length
      : 0,
    // ~200 Wp/m² of module area — a defensible utility-scale figure.
    estimatedKwp: (areaM2 * 200) / 1000,
  };
}

export interface FieldStats {
  fields: number;
  totalHa: number;
  meanHa: number;
  changedFields: number;
  changedHa: number;
  meanNdvi: number;
}

export function fieldStats(fields: FieldPolygon[]): FieldStats {
  const totalHa = fields.reduce((a, f) => a + f.areaHa, 0);
  const changed = fields.filter((f) => f.changed);
  return {
    fields: fields.length,
    totalHa,
    meanHa: fields.length ? totalHa / fields.length : 0,
    changedFields: changed.length,
    changedHa: changed.reduce((a, f) => a + f.areaHa, 0),
    meanNdvi: fields.length ? fields.reduce((a, f) => a + f.ndvi, 0) / fields.length : 0,
  };
}
