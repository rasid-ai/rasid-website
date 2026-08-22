'use client';

import { GOSERVERS_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §23 — GoServers / MCP. GoPilot branches into three MCP servers (Fetch · Geo ·
 * AI), each a card listing its real capabilities. Light DOM/SVG only (§34): the
 * connector is a single non-scaling-stroke path, the cards are plain flexbox.
 */
export default function GoServers() {
  return (
    <section id="platform" className="relative w-full bg-void py-28 md:py-40" aria-label="GoServers and MCP">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <Reveal className="text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display text-[clamp(2.2rem,5.4vw,4.4rem)] text-chalk">{S.headline}</h2>
          <p className="mx-auto mt-6 max-w-[54ch] text-[0.98rem] leading-relaxed text-mist">{S.body}</p>
        </Reveal>

        {/* GoPilot → three GoServers */}
        <Reveal delay={120} className="mt-16">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 border border-signal/40 bg-signal/[0.05] px-5 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              <span className="text-[0.95rem] font-medium tracking-tight text-chalk">{S.center}</span>
            </div>
          </div>

          {/* three-way connector — non-scaling-stroke keeps 1px lines under the
              non-uniform stretch of preserveAspectRatio="none" */}
          <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-11 w-full" aria-hidden>
            <path
              d="M50 0 V22 M16.66 22 H83.34 M16.66 22 V44 M50 22 V44 M83.34 22 V44"
              fill="none"
              stroke="rgb(var(--c-signal) / 0.32)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {S.servers.map((srv) => (
              <div key={srv.name} className="brackets relative flex flex-col border border-white/[0.1] bg-white/[0.015] p-5 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                    <span className="text-[1.02rem] font-medium tracking-tight text-chalk">{srv.name}</span>
                  </div>
                  <span className="shrink-0 border border-signal/25 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal/85">
                    {srv.tag}
                  </span>
                </div>
                <p className="mt-2.5 text-[0.85rem] leading-relaxed text-mist">{srv.desc}</p>

                <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                  {srv.caps.map((cap) => (
                    <li key={cap} className="flex items-start gap-2.5 text-[0.85rem] text-chalk/80">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 bg-signal/70" />
                      <span className="leading-snug">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        {/* consumption flow + API note */}
        <Reveal delay={160} className="mx-auto mt-20 max-w-[720px]">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            {S.flow.map((step, i) => (
              <div key={step} className="flex items-center gap-3 sm:flex-1 sm:justify-center">
                {i > 0 && (
                  <span aria-hidden className="hidden text-signal/50 sm:block">
                    →
                  </span>
                )}
                <div
                  className={[
                    'flex-1 border px-4 py-3 text-center text-[0.85rem] tracking-tight sm:flex-none',
                    i === 1 ? 'border-signal/30 text-chalk' : 'border-white/[0.08] text-mist',
                  ].join(' ')}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[0.9rem] leading-relaxed text-graphite">{S.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
