/**
 * Scroll progress store.
 *
 * ScrollTrigger writes into this store on every scroll frame. WebGL scenes and
 * imperative animations *read* from it inside their own render loops. Nothing
 * here goes through React state — a 60fps scroll must never trigger a rerender.
 *
 * Channels are named story beats, so any component can subscribe to "the dive"
 * without knowing which DOM element drives it.
 */

export type Channel =
  | 'orbit' // Act I — hero: rotate → approach → target → dive → surface
  | 'data' // Act II — Earth is data
  | 'gopilot' // Act III — the question
  | 'network' // Act IV — tool ecosystem
  | 'models' // Act V — one image, infinite questions
  | 'case0' // Act VI — Agriculture
  | 'case1' // Act VI — Energy
  | 'case2' // Act VI — Urban
  | 'decision' // Act VII — editorial
  | 'finalEarth'; // Act VIII — return to Earth

type Listener = (value: number) => void;

const values: Record<Channel, number> = {
  orbit: 0,
  data: 0,
  gopilot: 0,
  network: 0,
  models: 0,
  case0: 0,
  case1: 0,
  case2: 0,
  decision: 0,
  finalEarth: 0,
};

const listeners: Record<Channel, Set<Listener>> = {
  orbit: new Set(),
  data: new Set(),
  gopilot: new Set(),
  network: new Set(),
  models: new Set(),
  case0: new Set(),
  case1: new Set(),
  case2: new Set(),
  decision: new Set(),
  finalEarth: new Set(),
};

export function setProgress(channel: Channel, value: number): void {
  if (values[channel] === value) return;
  values[channel] = value;
  const set = listeners[channel];
  if (set.size === 0) return;
  for (const fn of set) fn(value);
}

export function getProgress(channel: Channel): number {
  return values[channel];
}

/** Subscribe to a channel. Returns an unsubscribe function. */
export function onProgress(channel: Channel, fn: Listener): () => void {
  listeners[channel].add(fn);
  return () => {
    listeners[channel].delete(fn);
  };
}

/* ------------------------------------------------------------------ *
 * Act I stage map
 * ------------------------------------------------------------------ *
 * The single most important piece of choreography on the site. One 0→1
 * progress value drives five overlapping stages; keeping the boundaries in
 * one place is what lets the camera, the copy, the reticle and the shader
 * LOD stay in agreement.
 */
export const ORBIT_STAGES = {
  /** Stage 1 — Earth simply turns. Hero copy is fully legible. */
  idle: [0.0, 0.1],
  /** Stage 2 — camera begins its approach; hero copy starts to release. */
  approach: [0.1, 0.36],
  /** Stage 3 — a location resolves out of the terrain and is marked. */
  target: [0.3, 0.5],
  /** Stage 4 — the dive. Altitude falls by three orders of magnitude. */
  dive: [0.48, 0.84],
  /** Stage 5 — surface. Sphere LOD has fully become satellite imagery. */
  surface: [0.8, 1.0],
} as const;

/** The dive target — Beirut. Also the subject of the GoPilot question. */
export const DIVE_TARGET = {
  name: 'BEIRUT',
  region: 'LEBANON',
  lat: 33.8938,
  lon: 35.5018,
  /** Displayed alongside the reticle. */
  latLabel: '33.8938° N',
  lonLabel: '35.5018° E',
} as const;
