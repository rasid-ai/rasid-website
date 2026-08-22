'use client';

import { useEffect, type RefObject } from 'react';
// Imported via lib/story/gsap so the plugin is registered before any trigger is
// created — child effects run before parent effects, so the provider cannot be
// the thing that registers it.
import { gsap, ScrollTrigger } from '@/lib/story/gsap';
import { setProgress, type Channel } from '@/lib/story/store';

/**
 * Binds a pinned section to a story channel.
 *
 * The pattern used by every act: a tall wrapper is pinned, and its scroll
 * progress is written into the store on each update. Scenes read the store in
 * their own render loops — React never rerenders during the scroll.
 */
export function useStoryTrigger(
  ref: RefObject<HTMLElement | null>,
  channel: Channel,
  options: {
    /** Multiples of viewport height of scroll distance. */
    length?: number;
    pin?: boolean | RefObject<HTMLElement | null>;
    start?: string;
    end?: string;
    enabled?: boolean;
    onUpdate?: (p: number) => void;
    /** Snap points (0..1) — used sparingly, only where a beat should settle. */
    snap?: number[];
  } = {},
): void {
  const {
    length = 3,
    pin = true,
    start = 'top top',
    end,
    enabled = true,
    onUpdate,
    snap,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: el,
        start,
        end: end ?? `+=${length * 100}%`,
        pin: pin === true ? el : pin ? (pin.current ?? undefined) : false,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        invalidateOnRefresh: true,
        snap: snap
          ? { snapTo: snap, duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut', delay: 0.08 }
          : undefined,
        onUpdate: (self) => {
          setProgress(channel, self.progress);
          onUpdate?.(self.progress);
        },
        onRefresh: (self) => {
          setProgress(channel, self.progress);
        },
      });

      /* Registry for the verification harness (scripts/verify.mjs), so it can
         scroll to "68% through the dive" instead of guessing a document
         fraction. Every act is a pinned trigger, so doc-fraction → channel
         progress depends on pin spacing and viewport height; only the trigger
         knows its own extent. Dev-only, and read-only from outside. */
      if (process.env.NODE_ENV !== 'production') {
        const w = window as unknown as { __rasidTriggers?: Record<string, ScrollTrigger> };
        (w.__rasidTriggers ??= {})[channel] = trigger;
      }

      return () => trigger.kill();
    });

    return () => ctx.revert();
  }, [ref, channel, length, pin, start, end, enabled, onUpdate, snap]);
}
