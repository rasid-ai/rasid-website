'use client';

import { useState } from 'react';
import { PARTNERS_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §27 — Partners. A clean, unified monochrome wordmark wall.
 *
 * Each partner renders as a wordmark by default. If a partner has a `logo` path
 * (see PARTNERS_SECTION in content.ts) the real image is used instead, and if
 * that file is missing it falls back to the wordmark — so dropping a file into
 * public/partners/ is all it takes to switch from text to a real logo.
 */
function PartnerMark({ name, logo }: { name: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  if (logo && !failed) {
    // Fixed box per logo so mixed aspect ratios (horizontal wordmarks *and*
    // stacked icon-over-text lockups like AWS / World Bank) each get equal room
    // and read at a comparable visual weight — object-contain fits within.
    return (
      <div className="flex h-14 w-32 items-center justify-center sm:h-16 sm:w-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={name}
          onError={() => setFailed(true)}
          className="partner-logo max-h-full max-w-full object-contain opacity-70 transition-opacity duration-300 hover:opacity-100"
        />
      </div>
    );
  }
  return (
    <span className="whitespace-nowrap text-[1.15rem] font-medium tracking-tight text-mist/70 transition-colors duration-300 hover:text-chalk sm:text-[1.4rem]">
      {name}
    </span>
  );
}

export default function Partners() {
  // The track carries two identical sets of logos back to back; the marquee
  // animation shifts it by exactly one set, so it loops forever with no seam.
  // No flex gap — each mark carries its own horizontal padding so the two sets
  // tile at an exact 50% boundary (a gap would desync the loop by half a gap).
  const loop = [...S.partners, ...S.partners];

  return (
    <section id="partners" className="relative w-full bg-void py-24 md:py-32" aria-label="Partners">
      <div className="mx-auto max-w-[1200px] px-6 text-center md:px-10">
        <Reveal>
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display mx-auto max-w-[20ch] text-[clamp(1.9rem,4.4vw,3.4rem)] text-chalk">
            {S.headline}
          </h2>
        </Reveal>
      </div>

      {/* Full-bleed marquee (outside the max-width wrap so it spans the viewport). */}
      <Reveal delay={120}>
        <div className="group relative mt-14 w-full overflow-hidden sm:mt-16">
          {/* edge fades — themed via --c-void so they work in both modes */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32"
            style={{ background: 'linear-gradient(to right, rgb(var(--c-void)), transparent)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32"
            style={{ background: 'linear-gradient(to left, rgb(var(--c-void)), transparent)' }}
          />

          <ul className="flex w-max animate-marquee items-center [animation-play-state:running] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]">
            {loop.map((p, i) => (
              <li key={i} className="shrink-0 px-6 sm:px-9" aria-hidden={i >= S.partners.length}>
                <PartnerMark name={p.name} logo={p.logo} />
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
