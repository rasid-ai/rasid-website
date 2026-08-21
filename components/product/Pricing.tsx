'use client';

import { PRICING_SECTION as S, GOPILOT_APP_URL, CONTACT_HREF } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * §25 — Pricing. Three token-based plans.
 *
 * Structure follows a standard SaaS pricing card (name · description · price ·
 * token badge · feature list · CTA pinned to the bottom) but in RASID's dark,
 * sharp, single-accent language — no rounded pastel pills. The CTA is pushed
 * down by a flex-grow spacer so all three buttons align on one baseline with a
 * guaranteed gap above them, regardless of how many features each plan lists.
 */
const external = /^https?:\/\//.test(GOPILOT_APP_URL);
const extAttrs = external ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {};

/** Small coin glyph for the token badge. */
function TokenGlyph() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="h-3 w-3">
      <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="6" cy="6" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="relative w-full bg-void py-28 md:py-40" aria-label="Pricing">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <Reveal className="mx-auto mb-16 max-w-[40ch] text-center md:mb-20">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display text-[clamp(2.2rem,5.6vw,4.6rem)] text-chalk">{S.headline}</h2>
        </Reveal>

        {/* items-stretch (default) + h-full cards + the featured card's -my
            makes it stand slightly taller, the reference's "popular" lift. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch md:gap-5">
          {S.plans.map((plan, i) => {
            const isContact = plan.cta.toLowerCase().includes('sales');
            return (
              <Reveal key={plan.id} delay={i * 90} className={plan.featured ? 'md:-my-3' : ''}>
                <div
                  className={[
                    'relative flex h-full flex-col border p-7 md:p-8',
                    plan.featured
                      ? 'border-signal/45 bg-signal/[0.045]'
                      : 'border-white/[0.09] bg-white/[0.012]',
                  ].join(' ')}
                >
                  {/* name + popular flag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="label text-graphite">{plan.name}</span>
                    {plan.featured && (
                      <span className="border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal">
                        Most popular
                      </span>
                    )}
                  </div>

                  {/* positioning line — min height keeps the price row aligned */}
                  <p className="mt-3 min-h-[2.6rem] max-w-[26ch] text-[0.9rem] leading-snug text-mist">
                    {plan.desc}
                  </p>

                  {/* price */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-[2.7rem] font-medium leading-none tracking-tight text-chalk">
                      {plan.price}
                    </span>
                    {plan.cadence && <span className="text-[0.9rem] text-mist">{plan.cadence}</span>}
                  </div>

                  {/* token badge — sharp, bordered, on-brand (not a pastel pill) */}
                  <div className="mt-5">
                    <span className="inline-flex items-center gap-2 border border-signal/30 bg-signal/[0.06] px-3 py-1.5 text-signal">
                      <TokenGlyph />
                      <span className="font-mono text-[12px] tracking-wide">
                        {plan.tokens} {plan.unit}
                      </span>
                    </span>
                  </div>

                  <div className="hairline my-6" />

                  {/* what's included */}
                  <div className="label-sm mb-3.5 normal-case tracking-normal text-graphite">
                    {plan.tagline}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f.t} className="flex items-start gap-2.5 text-[0.88rem] leading-snug">
                        {f.on ? (
                          <span className="mt-px flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-signal/40 bg-signal/10">
                            <svg viewBox="0 0 12 12" aria-hidden className="h-2.5 w-2.5">
                              <path
                                d="M2.6 6.2 L4.9 8.5 L9.4 3.6"
                                fill="none"
                                stroke="rgb(var(--c-signal))"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="mt-px flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-white/10">
                            <span className="h-px w-2 bg-graphite/70" />
                          </span>
                        )}
                        <span className={f.on ? 'text-chalk/85' : 'text-graphite'}>{f.t}</span>
                      </li>
                    ))}
                  </ul>

                  {/* spacer pushes the CTA to a shared baseline with a real gap */}
                  <div className="flex-grow" />

                  <a
                    href={isContact ? CONTACT_HREF : GOPILOT_APP_URL}
                    {...(isContact ? {} : extAttrs)}
                    className={[
                      'group mt-8 inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[12px] font-medium tracking-wider transition-colors duration-500',
                      plan.featured
                        ? 'bg-chalk text-void hover:bg-signal'
                        : 'border border-white/15 text-chalk hover:border-signal/50 hover:text-signal',
                    ].join(' ')}
                  >
                    {plan.cta}
                    <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* one balance, spent across the ecosystem */}
        <Reveal delay={120} className="mx-auto mt-16 max-w-[46ch] text-center">
          <p className="text-[0.95rem] leading-relaxed text-mist">{S.note}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {S.spend.map((where, i) => (
              <span key={where} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="h-px w-5 bg-white/15" />}
                <span className="label text-chalk/70">{where}</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
