/**
 * Minimal TopoJSON decoder — just enough for Natural Earth land/coastlines.
 *
 * Written by hand rather than pulled in as a dependency because we need exactly
 * one operation (quantised arcs → lon/lat rings) and because the alternative
 * forces a multi-hundred-KB JSON literal through the type checker.
 *
 * Reference: github.com/topojson/topojson-specification
 */

export interface Topology {
  type: 'Topology';
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: number[][][];
  objects: Record<string, TopoGeometry>;
}

export interface TopoGeometry {
  type: string;
  arcs?: unknown;
  geometries?: TopoGeometry[];
}

export type Ring = Float64Array; // [lon, lat, lon, lat, ...]

/** Decode all polygon rings in a topology object into flat lon/lat arrays. */
export function decodeRings(topology: Topology, objectName: string): Ring[] {
  const obj = topology.objects[objectName];
  if (!obj) return [];

  const { scale, translate } = topology.transform ?? {
    scale: [1, 1] as [number, number],
    translate: [0, 0] as [number, number],
  };

  // Pre-decode every arc once: delta decode + dequantise.
  const arcs: Array<[number, number][]> = topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    const out: [number, number][] = new Array(arc.length);
    for (let i = 0; i < arc.length; i++) {
      const p = arc[i]!;
      x += p[0]!;
      y += p[1]!;
      out[i] = [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    }
    return out;
  });

  const rings: Ring[] = [];

  /** Stitch one ring's arc index list into a point list. */
  const buildRing = (indices: number[]): void => {
    const pts: [number, number][] = [];
    for (const raw of indices) {
      const reversed = raw < 0;
      const arc = arcs[reversed ? ~raw : raw];
      if (!arc) continue;
      const seq = reversed ? arc.slice().reverse() : arc;
      // Successive arcs share an endpoint — drop the duplicate.
      for (let i = pts.length === 0 ? 0 : 1; i < seq.length; i++) pts.push(seq[i]!);
    }
    if (pts.length < 3) return;
    const flat = new Float64Array(pts.length * 2);
    for (let i = 0; i < pts.length; i++) {
      flat[i * 2] = pts[i]![0];
      flat[i * 2 + 1] = pts[i]![1];
    }
    rings.push(flat);
  };

  const walk = (g: TopoGeometry): void => {
    if (g.type === 'GeometryCollection') {
      g.geometries?.forEach(walk);
      return;
    }
    if (g.type === 'Polygon') {
      (g.arcs as number[][] | undefined)?.forEach(buildRing);
      return;
    }
    if (g.type === 'MultiPolygon') {
      (g.arcs as number[][][] | undefined)?.forEach((poly) => poly.forEach(buildRing));
    }
  };

  walk(obj);
  return rings;
}
