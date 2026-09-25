import { ABOUT_CONTENT as A, FAQ, PRICING_SECTION } from '@/data/content';

/**
 * AboutContent — the server-rendered SEO/GEO content layer.
 *
 * This is a plain SERVER component (no 'use client', not behind a mount gate or
 * ssr:false), so its text, heading hierarchy (h2/h3), and structured data land
 * in the initial HTML that search crawlers and LLMs read. Everything else below
 * the hero is client-only/scroll-gated and therefore invisible to non-JS
 * crawlers — this section is what makes the page substantive and citable.
 *
 * The copy lives in data/content.ts (single source of truth), so the visible
 * text and the FAQPage JSON-LD can never drift apart (Google flags FAQ markup
 * whose Q&A isn't visible on the page).
 */

// One Offer per plan that has a real price (the "Custom" Enterprise plan has no
// number, so it isn't emitted as a fixed Offer). Per-plan Offers are more
// extractable than a single price range — an engine can quote "Pro, €149".
const offers = PRICING_SECTION.plans.flatMap((p) => {
  const digits = String(p.price).replace(/[^0-9]/g, '');
  if (!digits) return [];
  return [
    {
      '@type': 'Offer',
      name: p.name,
      price: digits,
      priceCurrency: 'EUR',
      description: `${p.tokens} ${p.unit}${p.cadence ? ` · ${p.cadence}` : ''}`,
    },
  ];
});

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GoPilot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://rasid.ai/products#gopilot',
  description:
    'GoPilot is RASID’s AI geospatial agent. Ask a question about Earth in plain language and it finds the right satellite data, selects the right AI models, runs the analysis, and returns raster and vector answers.',
  provider: { '@type': 'Organization', name: 'RASID', '@id': 'https://rasid.ai/#organization' },
  offers,
  featureList: [
    'Natural-language geospatial queries',
    'Automated Earth-observation data discovery',
    'AI model selection and inference',
    'Raster and vector outputs',
    'MCP servers and API access (GoServers)',
    'QGIS and ArcGIS Pro plugins',
  ],
};

export default function AboutContent() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative w-full bg-void pt-36 pb-28 md:pt-44 md:pb-36"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />

      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        {/* ---- header ---- */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{A.eyebrow}</span>
          </div>
          <span className="label-sm hidden sm:inline">RASID / EO</span>
        </div>

        {/* This component is the whole /about page's content, so its lead
            heading is the page H1; section blocks are H2, FAQ questions H3. */}
        <h1 id="about-heading" className="mt-6 display text-[clamp(2.3rem,5.4vw,4.4rem)] text-chalk">
          {A.headline}
        </h1>
        <p className="mt-6 max-w-[64ch] text-[1.08rem] leading-relaxed text-chalk/85">{A.intro}</p>

        <div className="hairline mt-12 md:mt-16" />

        {/* ---- numbered instrument cards ---- */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
          {A.blocks.map((b, i) => (
            <div
              key={b.h}
              className="brackets relative flex flex-col border border-white/[0.09] bg-white/[0.012] p-6 md:p-7"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[11px] tracking-widest text-signal/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>
              <h2 className="text-[1.12rem] font-medium tracking-tight text-chalk">{b.h}</h2>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-mist">{b.p}</p>
            </div>
          ))}
        </div>

        {/* ---- FAQ (native <details> accordion — no JS, still in server HTML) ---- */}
        <div className="mt-20 md:mt-28">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">Frequently asked</span>
          </div>
          <h2 className="display text-[clamp(1.8rem,4vw,3rem)] text-chalk">Questions &amp; answers</h2>

          <div className="mt-8 border-t border-white/[0.08]">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-white/[0.08]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[1.02rem] font-medium tracking-tight text-chalk transition-colors group-hover:text-signal">
                    {f.q}
                  </h3>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[1.1rem] leading-none text-signal transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[70ch] pb-6 text-[0.95rem] leading-relaxed text-mist">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
