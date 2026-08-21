/**
 * Scene seeds and viewports.
 *
 * One seed per narrative location. Because the imagery is deterministic, the
 * same seed always renders the same ground — so "Beirut" is recognisably the
 * same place in the hero dive, the data plate, the GoPilot map and the solar
 * use case. That continuity is doing real narrative work; don't shuffle these.
 *
 * When real RASID imagery replaces the procedural surface, these become tile
 * source + AOI descriptors instead of seeds.
 */
export const SCENE_SEEDS = {
  /** The dive target. Mixed peri-urban / agricultural / coastal. */
  beirut: 1337,
  /** Agricultural: dense parcel structure. */
  bekaa: 4021,
  /** Energy: utility-scale solar in arid terrain. */
  solarField: 8802,
  /** Urban: rapid development corridor. */
  urbanEdge: 6410,
  /** Model showcase: deliberately mixed content so every model has something. */
  showcase: 2718,
} as const;

export type SceneKey = keyof typeof SCENE_SEEDS;

/** Default framing per scene, in kilometres of visible width. */
export const SCENE_VIEWS: Record<SceneKey, { widthKm: number; centerX: number; centerY: number }> = {
  beirut: { widthKm: 1.35, centerX: 0.42, centerY: -0.28 },
  bekaa: { widthKm: 3.1, centerX: 12.4, centerY: -6.2 },
  solarField: { widthKm: 2.4, centerX: -8.1, centerY: 4.7 },
  urbanEdge: { widthKm: 2.0, centerX: 5.5, centerY: 9.3 },
  showcase: { widthKm: 2.2, centerX: 3.2, centerY: -1.4 },
};
