'use client';

import { useEffect, useRef } from 'react';
import { getProgress } from '@/lib/story/store';
import { clamp, easeOutCubic, range } from '@/lib/utils/math';
import { makeRng } from '@/lib/utils/rng';
import type { Capabilities } from '@/lib/hooks/useCapabilities';
import { NETWORK_GEOM, edgePoint } from './geom';

/**
 * NetworkCanvas — the edges, and the data moving along them.
 *
 * 2D canvas rather than SVG or WebGL: the workload is a few dozen additive
 * glowing packets on four bezier edges, redrawn per frame. SVG would thrash the
 * DOM; WebGL would mean a third GL context on the page for no visual gain.
 *
 * The animation is *scroll-gated but time-driven*: edges extend with scroll
 * (a deliberate, reader-controlled reveal), while packets flow on their own
 * clock once the network is live — because traffic shouldn't stop when the
 * reader stops. That mix is what makes the graph feel like a running system.
 */

export interface NodeDef {
  readonly id: string;
  readonly label: string;
  readonly angle: number;
  readonly items: readonly string[];
}

interface Packet {
  edge: number;
  t: number;
  speed: number;
  /** +1 = toward centre (a tool returning data), −1 = outbound (a call). */
  dir: number;
  size: number;
}

export default function NetworkCanvas({
  caps,
  nodes,
}: {
  caps: Capabilities;
  nodes: readonly NodeDef[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, caps.tier === 'low' ? 1.25 : 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const rng = makeRng(0x9ec7);
    const packetCount = caps.tier === 'low' ? 10 : caps.tier === 'mid' ? 22 : 38;
    const packets: Packet[] = Array.from({ length: packetCount }, () => ({
      edge: Math.floor(rng() * nodes.length),
      t: rng(),
      speed: 0.1 + rng() * 0.22,
      dir: rng() > 0.42 ? 1 : -1,
      size: 0.8 + rng() * 1.5,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;

      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      const p = getProgress('network');
      ctx.clearRect(0, 0, w, h);

      const g = NETWORK_GEOM(w, h, !!caps.mobile);
      const { cx, cy } = g;
      // Edge extension: staggered per branch.
      const flowLive = clamp((p - 0.5) / 0.16);

      nodes.forEach((node, i) => {
        const start = 0.16 + i * 0.055;
        const grow = easeOutCubic(clamp(range(p, start, start + 0.2)));
        if (grow <= 0.001) return;

        const bez = (t: number) => edgePoint(g, node.angle, t);

        /* --- the edge --- */
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        // Draw the partial curve by subdividing (canvas has no partial-bezier).
        const steps = 40;
        for (let s = 1; s <= steps; s++) {
          const t = (s / steps) * grow;
          const pt = bez(t);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = `rgb(var(--c-signal) / ${0.16 + 0.1 * flowLive})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // A brighter core along the same path once traffic is live.
        if (flowLive > 0.01) {
          ctx.strokeStyle = `rgba(124,255,230,${0.06 * flowLive})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        /* --- endpoint marker --- */
        const end = bez(grow);
        ctx.beginPath();
        ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(var(--c-signal) / ${0.5 + 0.5 * grow})`;
        ctx.fill();
        // ring
        ctx.beginPath();
        ctx.arc(end.x, end.y, 8 + Math.sin(now / 700 + i) * 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgb(var(--c-signal) / ${0.18 * grow})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        /* --- packets --- */
        if (flowLive > 0.02) {
          ctx.globalCompositeOperation = 'lighter';
          for (const pk of packets) {
            if (pk.edge !== i) continue;
            pk.t += pk.speed * dt * pk.dir;
            if (pk.t > 1) pk.t -= 1;
            if (pk.t < 0) pk.t += 1;
            const tt = pk.t * grow;
            const pt = bez(tt);
            // Fade at both ends so packets emerge and vanish, not pop.
            const fade = Math.sin(pk.t * Math.PI);
            const alpha = fade * flowLive;
            const r = pk.size * (1 + fade * 0.5);
            // Two-pass glow: core + soft halo, no per-frame gradient alloc.
            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle = 'rgba(150,255,236,1)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = 'rgba(124,255,230,1)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r * 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      });
    };

    raf = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });

    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, [caps.tier, caps.mobile, nodes]);

  return <canvas ref={canvasRef} aria-hidden className="h-full w-full" />;
}
