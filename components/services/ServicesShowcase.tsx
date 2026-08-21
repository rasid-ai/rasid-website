'use client';

import Link from 'next/link';
import { SERVICES_PAGE as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * Services showcase (landing) — the breadth of RASID's bespoke work.
 *
 * Replaces the single methane deep-dive (which duplicated the GoPilot studio and
 * implied environmental was the only service). Shows all sectors as compact image
 * cards linking to /services#<id>, mirroring the Products treatment. Keeps the
 * #service anchor so existing nav/links still land here.
 */
export default function ServicesShowcase() {
  return (
    <section id="service" className="relative w-full bg-void py-24 md:py-32" aria-label="Services">
      <div className="mx-auto max-w-[1300px] px-6 md:px-10">
        <Reveal className="mx-auto mb-14 max-w-[46ch] text-center md:mb-16">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display text-[clamp(2rem,5vw,4rem)] text-chalk">{S.headline}</h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-mist">{S.body}</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {S.services.map((svc, i) => (
            <Reveal key={svc.id} delay={(i % 3) * 80}>
              <Link
                href={`/services#${svc.id}`}
                className="group block h-full overflow-hidden border border-white/[0.08] bg-white/[0.012] transition-colors duration-500 hover:border-signal/40"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={svc.image}
                    alt={`${svc.name} — RASID project`}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.04]"
                  />
                  <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(var(--c-void) / 0.5), transparent 55%)' }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[1.05rem] font-medium tracking-tight text-chalk transition-colors group-hover:text-signal">
                      {svc.name}
                    </h3>
                    {svc.partner && (
                      <span className="border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-signal">
                        {svc.partner}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[0.88rem] leading-snug text-mist">{svc.summary}</p>
                </div>
              </Link>
            </Reveal>
          ))}

          {/* trailing CTA card — fills the 6th grid cell */}
          <Reveal delay={160}>
            <Link
              href="/services"
              className="group flex h-full min-h-[220px] flex-col items-center justify-center gap-3 border border-signal/30 bg-signal/[0.04] p-6 text-center transition-colors duration-500 hover:bg-signal/[0.09]"
            >
              <span className="text-[1.1rem] font-medium tracking-tight text-chalk">See all services</span>
              <span className="text-[0.85rem] text-mist">Bespoke projects across every sector</span>
              <span aria-hidden className="mt-1 text-signal transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
