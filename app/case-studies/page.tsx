import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import { CASE_STUDIES, CASE_STUDIES_PAGE as S } from '@/data/content';

// Until at least one study is published, the section is placeholder-only, so we
// keep the index out of search (noindex) and out of the sitemap.
const hasPublished = CASE_STUDIES.some((c) => c.status === 'published');

export const metadata: Metadata = pageMetadata({
  title: 'RASID Case Studies: Delivered Geospatial AI Projects',
  description:
    'Real RASID projects with the problem, the approach and the result: methane detection, banana disease early warning, analysis-ready imagery and GoPilot.',
  path: '/case-studies',
  // Indexable as soon as anything is published; placeholder-only stays hidden.
  index: hasPublished,
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rasid.ai/' },
    { '@type': 'ListItem', position: 2, name: 'Case Studies', item: 'https://rasid.ai/case-studies' },
  ],
};

// Only published studies go into the ItemList (drafts aren't real content yet).
const publishedList = CASE_STUDIES.filter((c) => c.status === 'published');
const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'RASID case studies',
  itemListElement: publishedList.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://rasid.ai/case-studies/${c.slug}`,
    name: c.title,
  })),
};

export default function CaseStudies() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {publishedList.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <Navbar />
      <main className="relative w-full bg-void">
        <section className="mx-auto max-w-[1100px] px-6 pb-28 pt-32 md:px-10 md:pb-36 md:pt-44">
          {/* header */}
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
          </div>
          <h1 className="mt-6 display text-[clamp(2.3rem,5.4vw,4.4rem)] text-chalk">{S.headline}</h1>
          <p className="mt-6 max-w-[60ch] text-[1.05rem] leading-relaxed text-chalk/85">{S.body}</p>

          {/* grid of studies */}
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {CASE_STUDIES.map((c) => (
              <Link
                key={c.slug}
                href={`/case-studies/${c.slug}`}
                className="brackets group relative flex flex-col border border-white/[0.09] bg-white/[0.012] transition-colors duration-500 hover:border-signal/40"
              >
                {c.hero && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.hero.src}
                      alt={c.hero.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.03]"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgb(var(--c-void) / 0.45), transparent 60%)' }}
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6 md:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal/80">
                    {c.sector}
                  </span>
                  {c.status === 'draft' && (
                    <span className="border border-white/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-graphite">
                      Draft
                    </span>
                  )}
                </div>
                <h2 className="text-[1.2rem] font-medium leading-snug tracking-tight text-chalk transition-colors group-hover:text-signal">
                  {c.title}
                </h2>
                <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-mist">{c.summary}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-medium tracking-wide text-signal">
                  Read
                  <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
                </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
