'use client';

/**
 * SceneParseOverlay — the GoPilot scene-parse result, over the map.
 *
 * This is the whole segmentation as ONE image (public/beirut-parse.webp), not a
 * vector layer: the real GeoJSON is enormous, and a raster overlay is what a
 * scene-parse actually is — a per-pixel class map. So the entire "AI discovering
 * the scene" reveal costs one <img>, one mask, one scrim (§19/§31), instead of
 * thousands of DOM nodes.
 *
 * `reveal` (0→1) wipes the parse in top→bottom, tracking the model's scan sweep.
 * A dark scrim fades in beneath it so the semi-transparent classes read cleanly
 * over the satellite base, and a thin signal-coloured line rides the reveal
 * front to sell the sweep.
 */
export default function SceneParseOverlay({
  reveal,
  compact,
}: {
  reveal: number;
  compact?: boolean;
}) {
  const r = Math.max(0, Math.min(1, reveal));
  // Reveal edge in %, padded so it starts fully hidden and ends fully shown.
  const edge = r * 114 - 7;
  const src = compact ? '/beirut-parse-sm.webp' : '/beirut-parse.webp';
  const mask = `linear-gradient(to bottom, #000 ${edge}%, rgba(0,0,0,0) ${edge + 7}%)`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
      {/* darken the satellite base so the parse colours pop */}
      <div className="absolute inset-0 bg-void" style={{ opacity: r * 0.42 }} />

      {/* the scene parse itself */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: 0.92,
          WebkitMaskImage: mask,
          maskImage: mask,
          mixBlendMode: 'normal',
        }}
      />

      {/* scan front riding the reveal edge */}
      {r > 0.02 && r < 0.99 && (
        <div
          className="absolute inset-x-0"
          style={{
            top: `calc(${edge}% - 20px)`,
            height: 40,
            background:
              'linear-gradient(to bottom, transparent, rgb(var(--c-signal) / 0.35) 46%, rgba(180,255,244,0.85) 50%, rgb(var(--c-signal) / 0.35) 54%, transparent)',
          }}
        />
      )}
    </div>
  );
}
