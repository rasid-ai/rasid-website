'use client';

import { GOBOX_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §21 — GoBox: direct model/tool access for GIS professionals.
 *
 * Frames the distinction from GoPilot ("tell us what you want" vs "tell us what
 * to run") and shows the model catalogue. Pure DOM/CSS (§34).
 */
export default function GoBox() {
  return (
    <section className="relative w-full bg-void py-28 md:py-40" aria-label="GoBox">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* left: pitch + the GoPilot/GoBox distinction */}
          <div>
            <Reveal>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-signal/60" />
                <span className="label text-signal/90">{S.eyebrow}</span>
              </div>
              <h2 className="display text-[clamp(2.2rem,5.4vw,4.4rem)] text-chalk">{S.headline}</h2>
              <p className="mt-6 max-w-[42ch] text-[0.98rem] leading-relaxed text-mist">{S.body}</p>
            </Reveal>

            <Reveal delay={120} className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-white/[0.07]">
              {S.compare.map((c, i) => (
                <div
                  key={c.name}
                  className={[
                    'bg-white/[0.015] p-6',
                    i === 1 ? 'border-l border-signal/20' : '',
                  ].join(' ')}
                >
                  <div className="label text-graphite">{i === 0 ? 'Conversational' : 'Direct'}</div>
                  <div className="mt-3 text-[1.05rem] font-medium tracking-tight text-chalk">{c.name}</div>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-mist">{c.line}</p>
                </div>
              ))}
            </Reveal>
          </div>

          {/* right: the model catalogue */}
          <Reveal delay={80}>
            <div className="brackets relative border border-white/[0.08] bg-white/[0.01]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <span className="label">{S.catalogueTitle}</span>
                <span className="label-sm text-signal/70">{S.models.length} models</span>
              </div>
              <ul>
                {S.models.map((m) => (
                  <li
                    key={m.name}
                    className="group flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-4 transition-colors duration-300 last:border-b-0 hover:bg-signal/[0.03]"
                  >
                    <div className="min-w-0">
                      <div className="text-[0.98rem] font-medium tracking-tight text-chalk">{m.name}</div>
                      <div className="label-sm mt-1 normal-case tracking-normal text-graphite">
                        {m.kind}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-mist/70">
                      {m.io}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
