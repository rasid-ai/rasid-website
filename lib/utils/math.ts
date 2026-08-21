/** Small, allocation-free math helpers shared by scenes and overlays. */

export const clamp = (v: number, min = 0, max = 1): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const invLerp = (a: number, b: number, v: number): number =>
  a === b ? 0 : (v - a) / (b - a);

/** Normalised, clamped progress of `v` across [a,b]. The workhorse of the story. */
export const range = (v: number, a: number, b: number): number => clamp(invLerp(a, b, v));

export const smoothstep = (t: number): number => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/** Smoother than smoothstep — zero 1st *and* 2nd derivative at both ends. */
export const smootherstep = (t: number): number => {
  const x = clamp(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t: number): number => Math.pow(clamp(t), 3);
export const easeInOutCubic = (t: number): number => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutExpo = (t: number): number => {
  const x = clamp(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

/** Frame-rate independent exponential approach. `smoothing` ≈ per-second decay. */
export const damp = (current: number, target: number, smoothing: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-smoothing * dt));

export const degToRad = (d: number): number => (d * Math.PI) / 180;

/**
 * Geographic → unit-sphere cartesian.
 * Matches the equirectangular texture convention used by the Earth shader:
 * u = (lon + 180) / 360, v = (90 - lat) / 180, with u=0 at the −X seam.
 */
export function latLonToVec3(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = degToRad(90 - lat);
  const theta = degToRad(lon + 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/** Formats a number with thin-space thousands grouping, e.g. 1,284. */
export const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
