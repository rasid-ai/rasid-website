'use client';

import dynamic from 'next/dynamic';
import { PRODUCTS_PAGE as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * /products — the full product suite: GoPilot (the interactive agent demo),
 * GoServers and Plugins, rendered in full. These are the same sections that used
 * to live on the landing page; GoPilot remains featured on the landing, the
 * other two now live here. Code-split like the home story.
 *
 * The page is wrapped in ScrollProvider (see app/products/page) so GoPilot's
 * pinned scroll choreography works exactly as it does on the home page.
 */
const GoPilotStudio = dynamic(() => import('@/components/gopilot/GoPilotStudio'), { ssr: false });
const GoServers = dynamic(() => import('@/components/product/GoServers'), { ssr: false });
const Plugins = dynamic(() => import('@/components/product/Plugins'), { ssr: false });

export default function ProductsPage() {
  return (
    <div className="relative w-full bg-void">
      {/* header */}
      <section className="relative overflow-hidden px-6 pb-10 pt-32 md:px-10 md:pb-16 md:pt-44">
        <div className="relative mx-auto max-w-[1100px] text-center">
          <Reveal>
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{S.eyebrow}</span>
              <span className="h-px w-8 bg-signal/60" />
            </div>
            <h1 className="display text-[clamp(2.4rem,6vw,5rem)] leading-[1.02] text-chalk">{S.headline}</h1>
            <p className="mx-auto mt-6 max-w-[54ch] text-[1.05rem] leading-relaxed text-mist">{S.body}</p>
          </Reveal>
        </div>
      </section>

      {/* GoPilot — interactive use-case studio (carries its own #gopilot id) */}
      <GoPilotStudio />

      {/* GoServers and Plugins carry their own ids (#platform, #plugins) */}
      <GoServers />
      <Plugins />
    </div>
  );
}
