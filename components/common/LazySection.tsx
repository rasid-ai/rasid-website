'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollTrigger } from '@/lib/story/gsap';
import { MOUNT_ALL_EVENT } from '@/lib/story/anchorScroll';

/**
 * Mounts children when the section approaches the viewport.
 *
 * The placeholder reserves height so ScrollTrigger's measurements are stable
 * before and after mount — the alternative (mounting into zero height) shifts
 * every downstream pin and makes the page jump. After mounting we refresh
 * ScrollTrigger once, on the next frame, so the new section's own triggers
 * measure against final layout.
 */
export default function LazySection({
  children,
  id,
  minHeight = '100svh',
  margin = '90% 0px',
}: {
  children: ReactNode;
  id?: string;
  minHeight?: string;
  margin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    // A nav/anchor jump needs every section mounted so target positions are real
    // (see anchorScroll.convergeScroll). Mount immediately when asked.
    const onMountAll = () => {
      setMounted(true);
      io.disconnect();
    };
    window.addEventListener(MOUNT_ALL_EVENT, onMountAll);
    return () => {
      io.disconnect();
      window.removeEventListener(MOUNT_ALL_EVENT, onMountAll);
    };
  }, [margin]);

  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  return (
    <div ref={ref} id={id} style={mounted ? undefined : { minHeight }}>
      {mounted ? children : null}
    </div>
  );
}
