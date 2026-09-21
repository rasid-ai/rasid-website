import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import { CASE_STUDIES, CASE_STUDIES_PAGE as S } from '@/data/content';

// Until at least one study is published, the section is placeholder-only, so we
// keep the index out of search (noindex) and out of the sitemap.
const hasPublished = CASE_STUDIES.some((c) => c.status === 'published');

export const metadata: Metadata = {
  title: 'Case Studies',
  description:
    'RASID case studies: real geospatial-AI projects, the approach, the data and models used, and the results.',
  alternates: { canonical: '/case-studies' },
  openGraph: { url: '/case-studies', title: 'RASID Case Studies' },
  robots: hasPublished ? { index: true, follow: true } : { index: false, follow: true },
};

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
                className="brackets group relative flex flex-col border border-white/[0.09] bg-white/[0.012] p-6 transition-colors duration-500 hover:border-signal/40 md:p-7"
              >
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
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
