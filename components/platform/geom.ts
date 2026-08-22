/**
 * Shared layout for the tool graph.
 *
 * The canvas draws the edges and the DOM places the labels; if they computed
 * their positions independently they would eventually disagree (different
 * rounding, different breakpoint guesses). One function, two consumers.
 *
 * Both layers measure the *same* full-bleed container, so a single (w, h) pair
 * describes both coordinate systems.
 */
export interface NetworkGeom {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export function NETWORK_GEOM(w: number, h: number, mobile: boolean): NetworkGeom {
  return {
    cx: w / 2,
    // On mobile the headline occupies more of the top, so the graph sits lower.
    cy: mobile ? h * 0.54 : h * 0.5,
    rx: Math.min(w * (mobile ? 0.34 : 0.3), 460),
    ry: Math.min(h * (mobile ? 0.24 : 0.3), 320),
  };
}

/** Quadratic bezier from the centre to a node, with a slight outward bow. */
export function edgePoint(
  g: NetworkGeom,
  angleDeg: number,
  t: number,
): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  const ex = g.cx + Math.cos(a) * g.rx;
  const ey = g.cy + Math.sin(a) * g.ry;
  // Bowing the control point perpendicular to the ray keeps four edges from
  // reading as a plus sign.
  const mx = g.cx + (ex - g.cx) * 0.5 - Math.sin(a) * g.rx * 0.1;
  const my = g.cy + (ey - g.cy) * 0.5 + Math.cos(a) * g.ry * 0.1;
  const u = 1 - t;
  return {
    x: u * u * g.cx + 2 * u * t * mx + t * t * ex,
    y: u * u * g.cy + 2 * u * t * my + t * t * ey,
  };
}
