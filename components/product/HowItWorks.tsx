'use client';

import { HOWITWORKS_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §22 — How GoPilot works, in three steps.
 *
 * Deliberately light: no WebGL, no scroll-scrubbing (§34) — plain DOM/CSS with a
 * one-shot reveal. This is the recap beat between the cinematic demo and the
 * product/pricing half of the page.
 */
export default function HowItWorks() {
  return (
    <section className="relative w-full bg-void py-28 md:py-40" aria-label="How GoPilot works">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <Reveal className="mb-14 md:mb-20">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
          </div>
          <h2 className="display max-w-[16ch] text-[clamp(2.2rem,5.6vw,4.6rem)] text-chalk">
            {S.headline}
          </h2>
        </Reveal>

        <ol className="grid grid-cols-1 gap-px overflow-hidden border border-white/[0.06] md:grid-cols-3">
          {S.steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 90}>
              <li className="relative flex h-full min-h-[15rem] flex-col justify-between gap-10 bg-white/[0.015] p-7 md:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] tracking-widest text-signal">{step.n}</span>
                  {i < S.steps.length - 1 && (
                    <span aria-hidden className="text-mist/40 md:hidden">
                      ↓
                    </span>
                  )}
                  {i < S.steps.length - 1 && (
                    <span aria-hidden className="hidden text-mist/40 md:block">
                      →
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-[1.35rem] font-medium tracking-tight text-chalk">{step.title}</h3>
                  <p className="mt-3 max-w-[26ch] text-[0.95rem] leading-relaxed text-mist">
                    {step.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
