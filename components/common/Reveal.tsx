'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Reveal — a cheap, one-shot scroll-in.
 *
 * The lightweight product sections (How-it-works, GoBox, Pricing, …) don't need
 * scroll-scrubbing — that would put them on the per-frame budget for no reason.
 * Instead each block observes itself once, flips to shown, and disconnects. The
 * only animated properties are opacity + transform (§31), and under
 * prefers-reduced-motion the global stylesheet clamps the transition to ~0ms so
 * it becomes a plain appearance rather than movement (§9).
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger, in ms. */
  delay?: number;
  /** Initial downward offset, in px. */
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 720ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 720ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: shown ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
