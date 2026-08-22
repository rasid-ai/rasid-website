'use client';

import { useEffect, useRef } from 'react';
import type { TreeDetection } from '@/lib/geo/detections';
import { clamp } from '@/lib/utils/math';

/**
 * TreeLayer — crown delineation.
 *
 * Canvas rather than SVG: crown detection produces *hundreds* of instances, and
 * hundreds of SVG circles animating together is the one case where the DOM
 * genuinely gives out. Same coordinate space (0..1 of the container), so it
 * registers with the imagery exactly like the SVG layers do.
 *
 * Crowns pop in from the centre outward, each with a brief overshoot — the
 * visual signature of per-instance detection rather than a mask fade.
 */
export default function TreeLayer({
  trees,
  progress,
  color = 'rgb(var(--c-signal))',
}: {
  trees: TreeDetection[];
  progress: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const p = clamp(progressRef.current);
      ctx.clearRect(0, 0, w, h);
      if (p <= 0) return;

      const n = trees.length || 1;
      ctx.lineWidth = 1;

      for (let i = 0; i < trees.length; i++) {
        const t = trees[i]!;
        const start = (i / n) * 0.7;
        const local = clamp((p - start) / 0.22);
        if (local <= 0) continue;

        // Overshoot then settle: 1.18 peak at local≈0.55.
        const scale = local < 0.55 ? (local / 0.55) * 1.18 : 1.18 - ((local - 0.55) / 0.45) * 0.18;

        // r is expressed against viewport width; keep crowns circular on screen.
        const rr = t.r * w * scale;
        const x = t.cx * w;
        const y = t.cy * h;

        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgb(var(--c-signal) / ${0.28 + 0.42 * local * t.confidence})`;
        ctx.stroke();

        if (local > 0.6) {
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(var(--c-signal) / ${0.09 * (local - 0.6) / 0.4})`;
          ctx.fill();
          // apex dot — the estimated stem position
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150,255,236,${0.6 * local})`;
          ctx.fill();
        }
      }
    };

    raf = requestAnimationFrame(draw);
    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [trees, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}
