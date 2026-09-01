'use client';

import { PROOF_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §26 — Proof: AWS recognition + testimonials.
 *
 * Quotes are rendered verbatim from content.ts (attributed to real people — no
 * paraphrasing here). The key phrase in each is highlighted in place by
 * splitting the quote on its `emphasis`. Pure DOM/CSS (§34); premium (§26).
 */
function renderQuote(quote: string, emphasis?: string) {
  const i = emphasis ? quote.indexOf(emphasis) : -1;
  if (i < 0 || !emphasis) return quote;
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

        {/* the testimonials — a horizontal row of equal-height cards (stacks to
            one column on mobile). The quote grows and the attribution is pinned
            to the card foot so every card's author line sits on one baseline. */}
        <div className="mt-14 grid gap-5 text-left md:mt-20 md:gap-6 sm:grid-cols-2">
          {S.testimonials.map((t, i) => (
            <Reveal key={t.author} delay={140 + i * 80} className="h-full">
              <figure className="flex h-full flex-col border border-white/[0.09] bg-white/[0.012] p-7 md:p-8">
                <span aria-hidden className="block font-serif text-[3rem] leading-[0.2] text-signal/40">
                  “
                </span>
                <blockquote className="mt-4 text-[0.98rem] leading-relaxed text-chalk/90">
                  {renderQuote(t.quote, t.emphasis)}
                </blockquote>

                {/* spacer keeps the attribution on a shared baseline across cards */}
                <div className="flex-grow" />

                <figcaption className="mt-8 flex items-center gap-4">
                  {/* initials avatar */}
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 font-mono text-[12px] tracking-wider text-chalk/80">
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-[0.95rem] font-medium tracking-tight text-chalk">{t.author}</div>
                    <div className="mt-0.5 text-[0.8rem] leading-snug text-mist">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
