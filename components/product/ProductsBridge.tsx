'use client';

import Link from 'next/link';
import { PRODUCTS_BRIDGE as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * A slim band on the landing page, right after the featured GoPilot demo. It
 * signals that GoPilot is one of three products and links to the full /products
 * page (where GoServers and Plugins now live).
 */
export default function ProductsBridge() {
  return (
    <section className="relative w-full overflow-hidden bg-void py-20 md:py-28" aria-label="Product suite">
      <div className="relative mx-auto flex max-w-[1100px] flex-col items-start gap-8 px-6 md:flex-row md:items-center md:justify-between md:px-10">
        <Reveal>
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
          </div>
          <h2 className="display max-w-[16ch] text-[clamp(1.8rem,4vw,3rem)] text-chalk">{S.headline}</h2>
          <p className="mt-4 max-w-[52ch] text-[0.98rem] leading-relaxed text-mist">{S.body}</p>
        </Reveal>
        <Reveal delay={100} className="shrink-0">
          <Link
            href={S.cta.href}
            className="group inline-flex items-center gap-2.5 border border-signal/40 px-6 py-3.5 text-[12px] font-medium tracking-wider text-signal transition-all duration-500 hover:border-signal hover:bg-signal hover:text-void"
          >
            {S.cta.label}
            <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
