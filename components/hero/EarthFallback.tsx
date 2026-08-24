'use client';

import { useEffect, useRef } from 'react';
import { onProgress } from '@/lib/story/store';
import { clamp, range, smootherstep } from '@/lib/utils/math';
import type { Capabilities } from '@/lib/hooks/useCapabilities';

/**
 * EarthFallback — the low-tier / no-WebGL2 hero planet.
 *
 * Not a disabled scene: it keeps the same narrative beats (rotate → approach →
 * target → descend) using only compositor-friendly CSS, so it holds up on a
 * weak phone. Continents come from the same land raster used by the WebGL globe
 * when it is available; if that fails, layered gradients still read as a planet.
 *
 * Cost: one <canvas> drawn a handful of times (not per frame) plus transforms.
 */
export default function EarthFallback({
  caps,
  className,
}: {
  caps: Capabilities;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  /* Paint continents into a repeating equirectangular strip we can pan. */
  useEffect(() => {
    let cancelled = false;
    const el = mapRef.current;
    if (!el) return;

    import('@/lib/geo/landTexture')
      .then(({ getLandTexture }) => getLandTexture(1024))
      .then(({ canvas }) => {
        if (cancelled) return;
        // Convert the data raster into a visible land silhouette.
        const w = canvas.width;
        const h = canvas.height;
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        const ctx = out.getContext('2d')!;
        const src = canvas.getContext('2d')!.getImageData(0, 0, w, h);
        const img = ctx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) {
          const j = i * 4;
          const land = src.data[j]! / 255;
          const inland = src.data[j + 1]! / 255;
          // Land: desaturated green-grey, brighter inland. Ocean: transparent.
          img.data[j] = Math.round((36 + inland * 46) * land);
          img.data[j + 1] = Math.round((52 + inland * 40) * land);
          img.data[j + 2] = Math.round((44 + inland * 30) * land);
          img.data[j + 3] = Math.round(255 * land);
        }
        ctx.putImageData(img, 0, 0);
        el.style.backgroundImage = `url(${out.toDataURL('image/png')})`;
        el.style.backgroundSize = 'auto 100%';
        el.style.backgroundRepeat = 'repeat-x';
      })
      .catch(() => {
        /* Gradients below remain — still reads as a planet. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Slow rotation: pan the strip. rAF, but only while visible and unreduced. */
  useEffect(() => {
    if (caps.reducedMotion) return;
    const el = mapRef.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last < 1000 / 30) { raf = requestAnimationFrame(tick); return; }
      const dt = Math.min(now - last, 100);
      last = now;
      x = (x + dt * 0.0022) % 100;
      el.style.backgroundPosition = `${-x}% 50%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [caps.reducedMotion]);

  /* Scroll choreography — same beats as the 3D scene. */
  useEffect(() => {
    return onProgress('orbit', (p) => {
      const globe = globeRef.current;
      const glow = glowRef.current;
      const wrap = wrapRef.current;
      if (!globe || !wrap) return;

      // Approach: the disc grows. Dive: it grows dramatically and drifts off
      // frame, as the camera passes into it.
      const approach = smootherstep(range(p, 0.1, 0.36));
      const dive = smootherstep(range(p, 0.48, 0.9));
      const scale = 1 + approach * 0.55 + dive * 6.2;
      const y = dive * 26;
      globe.style.transform = `translate3d(0, ${y}%, 0) scale(${scale})`;
      // Fade the globe out at the very end, as the imagery section takes over.
      globe.style.opacity = String(1 - smootherstep(range(p, 0.86, 1)));
      if (glow) glow.style.opacity = String(clamp(0.85 - dive * 0.8));
      wrap.style.filter = dive > 0.9 ? `blur(${(dive - 0.9) * 30}px)` : 'none';
    });
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      {/* starfield: two tiled radial-gradient layers, zero JS */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5) 50%, transparent), radial-gradient(1px 1px at 70% 15%, rgba(255,255,255,0.35) 50%, transparent), radial-gradient(1px 1px at 45% 70%, rgba(255,255,255,0.4) 50%, transparent), radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.28) 50%, transparent), radial-gradient(1px 1px at 12% 82%, rgba(255,255,255,0.3) 50%, transparent)',
          backgroundSize: '340px 340px, 260px 260px, 420px 420px, 300px 300px, 380px 380px',
        }}
      />

      {/* atmosphere glow */}
      <div
        ref={glowRef}
        aria-hidden
        className="absolute left-[58%] top-1/2 h-[92vmin] w-[92vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 38% 34%, rgba(70,150,220,0.20) 42%, rgba(40,110,190,0.14) 58%, transparent 70%)',
          filter: 'blur(18px)',
        }}
      />

      {/* the planet */}
      <div
        ref={globeRef}
        className="absolute left-[58%] top-1/2 h-[74vmin] w-[74vmin] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full will-transform"
        style={{
          background:
            'radial-gradient(circle at 34% 30%, #143046 0%, #0d2233 45%, #071320 72%, #04090f 100%)',
          boxShadow:
            'inset -26px -18px 60px rgba(0,0,0,0.85), inset 14px 10px 40px rgba(90,170,220,0.10), 0 0 70px rgba(50,130,190,0.16)',
        }}
      >
        {/* continents */}
        <div ref={mapRef} aria-hidden className="absolute inset-0 opacity-90" />
        {/* graticule */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgb(var(--c-signal) / 0.55) 0 1px, transparent 1px 11.11%), repeating-linear-gradient(0deg, rgb(var(--c-signal) / 0.55) 0 1px, transparent 1px 16.66%)',
          }}
        />
        {/* terminator: the day/night shading that makes it read spherical */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, transparent 34%, rgba(4,7,10,0.55) 58%, rgba(4,7,10,0.92) 78%)',
          }}
        />
        {/* specular highlight */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(28% 24% at 30% 26%, rgba(190,225,240,0.16), transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}
