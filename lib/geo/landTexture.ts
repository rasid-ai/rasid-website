import { decodeRings, type Topology } from './topojson';

/**
 * Builds the Earth's land data texture at runtime from Natural Earth vectors.
 *
 * Why generate rather than ship an image: a convincing globe needs *real*
 * coastlines (a noise sphere always reads as fake), but shipping 4K day/night/
 * specular maps costs megabytes. Rasterising a 100KB vector topology into one
 * canvas gives accurate continents for a fraction of the payload, and the
 * shader synthesises biome colour, bathymetry and city lights from it.
 *
 * Channel layout of the returned RGBA texture (equirectangular, lon −180→180):
 *   R  land mask            1 = land, 0 = ocean
 *   G  "inland-ness"        blurred mask → distance from coast (fake elevation,
 *                           continental shelf, and where cities cluster)
 *   B  coastal band         narrow ring around coastlines (beaches, shallows)
 *   A  1
 */

export interface LandTextureResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

let cache: Promise<LandTextureResult> | null = null;

/** Cached so the hero globe and the final globe never rasterise twice. */
export function getLandTexture(size: 1024 | 2048 = 1024): Promise<LandTextureResult> {
  cache ??= buildLandTexture(size);
  return cache;
}

async function buildLandTexture(width: number): Promise<LandTextureResult> {
  const height = width / 2;

  // Loaded lazily and only in the browser — keeps it out of the server bundle.
  const topo = (await import('world-atlas/land-110m.json')) as unknown as {
    default?: Topology;
  } & Topology;
  const topology: Topology = topo.default ?? topo;
  const rings = decodeRings(topology, 'land');

  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const mctx = mask.getContext('2d', { willReadFrequently: false })!;
  mctx.fillStyle = '#000';
  mctx.fillRect(0, 0, width, height);
  mctx.fillStyle = '#fff';

  // Equirectangular: x = (lon+180)/360, y = (90-lat)/180.
  const sx = width / 360;
  const sy = height / 180;
  mctx.beginPath();
  for (const ring of rings) {
    const n = ring.length / 2;
    for (let i = 0; i < n; i++) {
      const lon = ring[i * 2]!;
      const lat = ring[i * 2 + 1]!;
      const x = (lon + 180) * sx;
      const y = (90 - lat) * sy;
      if (i === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    }
    mctx.closePath();
  }
  // nonzero winding: Natural Earth encodes lakes as reversed rings, so holes
  // come out as ocean automatically.
  mctx.fill('nonzero');

  /* --- inland-ness: successive blurs approximate a distance transform ---- */
  const blurStage = (src: HTMLCanvasElement, radius: number): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d')!;
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(src, 0, 0);
    ctx.filter = 'none';
    return c;
  };

  const near = blurStage(mask, Math.max(1, Math.round(width / 512)));
  const mid = blurStage(mask, Math.max(2, Math.round(width / 128)));
  const far = blurStage(mask, Math.max(4, Math.round(width / 44)));

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const octx = out.getContext('2d', { willReadFrequently: false })!;

  const readData = (c: HTMLCanvasElement): Uint8ClampedArray =>
    c.getContext('2d')!.getImageData(0, 0, width, height).data;

  const mData = readData(mask);
  const nData = readData(near);
  const midData = readData(mid);
  const fData = readData(far);

  const img = octx.createImageData(width, height);
  const d = img.data;
  for (let i = 0; i < width * height; i++) {
    const j = i * 4;
    const land = mData[j]!;
    // Multi-scale sum → smooth ramp that peaks at continental interiors.
    const inland = (nData[j]! * 0.25 + midData[j]! * 0.4 + fData[j]! * 0.35) | 0;
    // Coastal band: high where the near-blur is mid-valued (i.e. at an edge).
    const nb = nData[j]! / 255;
    const coast = Math.round(255 * Math.max(0, 1 - Math.abs(nb - 0.5) * 4));
    d[j] = land;
    d[j + 1] = inland;
    d[j + 2] = coast;
    d[j + 3] = 255;
  }
  octx.putImageData(img, 0, 0);

  return { canvas: out, width, height };
}
