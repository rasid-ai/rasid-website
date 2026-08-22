/**
 * RasidMark — the RASID "R" brand glyph shown before the wordmark.
 *
 * Uses the supplied white R asset (public/logo/navbar-mark.png). It's decorative here —
 * the adjacent "RASID" text is the accessible name — so it's aria-hidden to
 * avoid a screen reader announcing "RASID" twice.
 *
 * Size it by HEIGHT (pass an `h-*` class); width is auto so the mark's natural
 * ~1.29:1 aspect is preserved and never squashed. To swap the asset later,
 * replace public/logo/navbar-mark.png (or point `src` elsewhere).
 */
export default function RasidMark({ className }: { className?: string }) {
  // `rasid-mark`: the asset is white-on-transparent; in light mode globals.css
  // inverts it to a dark mark so it stays visible on light chrome.
  return (
    // A tiny, fixed, decorative brand mark — next/image would be pure overhead.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/navbar-mark.png"
      alt=""
      aria-hidden
      draggable={false}
      width={676}
      height={525}
      className={['rasid-mark', className].filter(Boolean).join(' ')}
    />
  );
}
