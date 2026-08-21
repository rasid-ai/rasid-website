'use client';

import { PROOF_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §26 — Proof: AWS recognition + the Phil Cooper testimonial.
 *
 * The quote is rendered verbatim from content.ts (attributed to a real person —
 * no paraphrasing here). The key phrase is highlighted in place by splitting the
 * quote on `emphasis`. Pure DOM/CSS (§34); large and premium (§26).
 */
function renderQuote() {
  const { quote, emphasis } = S;
  const i = emphasis ? quote.indexOf(emphasis) : -1;
  if (i < 0) return quote;
  return (
    <>
      {quote.slice(0, i)}
      <span className="text-signal">{emphasis}</span>
      {quote.slice(i + emphasis.length)}
    </>
  );
}

export default function Proof() {
  return (
    <section id="proof" className="relative w-full overflow-hidden bg-void py-28 md:py-44" aria-label="Recognition">
      <div className="relative mx-auto max-w-[1100px] px-6 text-center md:px-10">
        <Reveal>
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display mx-auto max-w-[20ch] text-[clamp(2rem,5vw,4rem)] text-chalk">
            {S.headline}
          </h2>
        </Reveal>

        {/* accolades */}
        <Reveal delay={100} className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {S.markers.map((m, i) => (
            <div key={m.k} className="flex items-center gap-10">
              {i > 0 && <span aria-hidden className="hidden h-8 w-px bg-white/10 sm:block" />}
              <div className="text-center">
                <div className="label-sm text-graphite">{m.k}</div>
                <div className="mt-1.5 font-mono text-[13px] tracking-wide text-chalk">{m.v}</div>
              </div>
            </div>
          ))}
        </Reveal>

        {/* the testimonial */}
        <Reveal delay={160} className="mx-auto mt-16 max-w-[46rem] md:mt-24">
          <span aria-hidden className="block font-serif text-[4rem] leading-[0.2] text-signal/40">
            “
          </span>
          <blockquote className="mt-6 text-[clamp(1.4rem,3.1vw,2.5rem)] font-medium leading-[1.28] tracking-tight text-chalk">
            {renderQuote()}
          </blockquote>

          <figcaption className="mt-10 flex items-center justify-center gap-4">
            {/* replaceable initials avatar */}
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 font-mono text-[12px] tracking-wider text-chalk/80">
              {S.initials}
            </span>
            <div className="text-left">
              <div className="text-[0.98rem] font-medium tracking-tight text-chalk">{S.author}</div>
              <div className="mt-0.5 max-w-[24rem] text-[0.85rem] leading-snug text-mist">{S.role}</div>
            </div>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
