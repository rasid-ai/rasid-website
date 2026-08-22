import type Lenis from 'lenis';

/** Fired to make every LazySection mount immediately (see LazySection). */
export const MOUNT_ALL_EVENT = 'rasid:mountall';

/**
 * Anchor scroll that lands accurately without fighting the user.
 *
 * Sections mount lazily and the hero is pinned, so a target's position can shift
 * for a moment after a click (the reserved placeholder height differs from the
 * real content). To land accurately we:
 *   1. fire MOUNT_ALL_EVENT so every LazySection mounts now and heights settle;
 *   2. aim a FEW times over ~0.8s, re-resolving the target each time so the last
 *      aim lands on the settled position.
 *
 * The scroll is an INSTANT jump, corrected a couple of times as heights settle.
 * Smooth scrolling is deliberately avoided here: lenis' animated scrollTo
 * undershoots when it crosses the pinned hero's unpin boundary (the layout
 * shifts mid-tween), which both lands short AND janks. A direct window.scrollTo
 * lands exactly and lenis re-syncs on the next frame.
 *
 * Crucially, ANY user scroll intent (wheel / touch / arrow keys) aborts the
 * remaining corrections immediately — otherwise the re-aim loop yanks the reader
 * back to the target every time they try to scroll away.
 *
 * `hash` is a selector like '#pricing'. `offset` clears the fixed header.
 * (`immediate` is accepted for API compatibility; the jump is always instant.)
 */
export function convergeScroll(
  lenis: Lenis | null,
  hash: string,
  offset = -76,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  immediate = false,
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(MOUNT_ALL_EVENT));

  const timers: number[] = [];
  let aborted = false;

  const cleanup = () => {
    timers.forEach((t) => clearTimeout(t));
    window.removeEventListener('wheel', abort);
    window.removeEventListener('touchstart', abort);
    window.removeEventListener('pointerdown', abort);
    window.removeEventListener('keydown', onKey);
  };
  const abort = () => {
    if (aborted) return;
    aborted = true;
    cleanup();
  };
  const onKey = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(e.key)) abort();
  };

  // User intent cancels the programmatic scroll so we never fight them.
  window.addEventListener('wheel', abort, { passive: true });
  window.addEventListener('touchstart', abort, { passive: true });
  window.addEventListener('pointerdown', abort, { passive: true });
  window.addEventListener('keydown', onKey);

  // Re-aim every ~180ms until the target's position stops moving (lazy mounts
  // and image loads keep pushing it down for a beat), then stop. Hard cap so it
  // can't run forever, and abort the moment the user scrolls.
  let last: number | null = null;
  let stable = 0;
  let elapsed = 0;
  const tick = () => {
    if (aborted) return;
    const el = document.querySelector(hash);
    if (el) {
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY + offset);
      window.scrollTo(0, top);
      lenis?.scrollTo(top, { immediate: true }); // keep lenis in sync (no drift-back)
      if (last != null && Math.abs(top - last) < 4) stable += 1;
      else stable = 0;
      last = top;
    }
    elapsed += 180;
    if (stable >= 2 || elapsed > 2600) {
      cleanup();
      return;
    }
    timers.push(window.setTimeout(tick, 180));
  };
  timers.push(window.setTimeout(tick, 40));
}
