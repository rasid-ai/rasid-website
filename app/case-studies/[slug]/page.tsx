import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import { pageMetadata } from '@/lib/seo';
import { CASE_STUDIES, TEAM_SECTION } from '@/data/content';

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

const getStudy = (slug: string) => CASE_STUDIES.find((c) => c.slug === slug) ?? null;
const getAuthor = (initials: string) =>
  TEAM_SECTION.members.find((m) => m.initials === initials) ?? null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getStudy(slug);
  if (!c) return {};
  // Keep every article title inside the ~50-60 char window search engines show:
  // pad short titles, brand-suffix medium ones, leave long ones alone.
  const n = c.title.length;
  const title =
    n < 40 ? `${c.title} | RASID Case Study` : n <= 52 ? `${c.title} | RASID` : c.title;
  return pageMetadata({
    title,
    description: c.seoDescription ?? c.summary,
    path: `/case-studies/${c.slug}`,
    type: 'article',
    // Each article shares with its own cover rather than the generic site card.
    // No width/height: the covers are all 1600px wide but vary in height, and a
    // wrong og:image:height is worse than none (crawlers trust the declared size).
    image: c.hero ? { url: c.hero.src, alt: c.hero.alt } : undefined,
    // Drafts render (so they can be previewed) but stay out of search until real
    // content lands and status flips to 'published'.
    index: c.status === 'published',
  });
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getStudy(slug);
  if (!c) notFound();
  const author = getAuthor(c.authorInitials);
  const base = 'https://rasid.ai';

  /* Figures are spread through the body rather than dumped in a gallery: image k
     is rendered after an evenly-spaced section, so the article reads as prose
     with illustrations. Keyed by section index. */
  const gallery = c.images ?? [];
  const figures = new Map<number, (typeof gallery)[number]>();
  if (gallery.length) {
    const spacing = Math.max(1, Math.floor(c.sections.length / (gallery.length + 1)));
    gallery.forEach((img, k) => {
      // Walk forward to the next free slot so more images than sections can never
      // silently overwrite (and drop) an earlier figure.
      let idx = Math.min(c.sections.length - 1, (k + 1) * spacing - 1);
      while (idx < c.sections.length && figures.has(idx)) idx += 1;
      if (idx < c.sections.length) figures.set(idx, img);
    });
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.summary,
    ...(c.hero ? { image: [`${base}${c.hero.src}`] } : {}),
    datePublished: c.date,
    dateModified: c.date,
    articleSection: c.sector,
    mainEntityOfPage: `${base}/case-studies/${c.slug}`,
    isPartOf: { '@id': `${base}/#website` },
    author: author
      ? { '@id': `${base}/#person-${author.initials.toLowerCase()}` }
      : { '@id': `${base}/#organization` },
    publisher: { '@id': `${base}/#organization` },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Case Studies', item: `${base}/case-studies` },
      { '@type': 'ListItem', position: 3, name: c.title, item: `${base}/case-studies/${c.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <main className="relative w-full bg-void">
        <article className="mx-auto max-w-[760px] px-6 pb-28 pt-32 md:px-10 md:pb-36 md:pt-44">
          {/* breadcrumb / back */}
          <Link
            href="/case-studies"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-graphite transition-colors hover:text-signal"
          >
            <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
            Case studies
          </Link>

          {/* meta row */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="label text-signal/90">{c.sector}</span>
            <span aria-hidden className="h-3 w-px bg-white/15" />
            <span className="label-sm text-graphite">
              {c.status === 'published'
                ? new Date(c.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Draft'}
            </span>
            {author && (
              <>
                <span aria-hidden className="h-3 w-px bg-white/15" />
                <span className="label-sm text-graphite">{author.name}</span>
              </>
            )}
          </div>

          <h1 className="mt-5 display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.06] text-chalk">
            {c.title}
          </h1>
          <p className="mt-6 text-[1.1rem] leading-relaxed text-chalk/85">{c.summary}</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-graphite">
            {c.context}
          </p>

          {c.status === 'draft' && (
            <div className="mt-8 border border-signal/25 bg-signal/[0.05] px-5 py-4 text-[0.9rem] leading-relaxed text-mist">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal/90">Draft</span>
              <p className="mt-1.5">
                This case study is a scaffold. This page is not indexed by search engines until
                it&rsquo;s published.
              </p>
            </div>
          )}

          {/* hero */}
          {c.hero && (
            <figure className="mt-10">
              <div className="overflow-hidden border border-white/[0.09] bg-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.hero.src}
                  alt={c.hero.alt}
                  decoding="async"
                  className="block h-auto w-full"
                />
              </div>
              {c.hero.caption && (
                <figcaption className="mt-2.5 text-[0.82rem] leading-snug text-graphite">
                  {c.hero.caption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="hairline my-12" />

          <div className="space-y-10">
            {c.sections.map((sec, i) => {
              const fig = figures.get(i);
              return (
                <section key={sec.h}>
                  <h2 className="text-[1.3rem] font-medium tracking-tight text-chalk">{sec.h}</h2>
                  <p className="mt-3 text-[1rem] leading-relaxed text-mist">{sec.p}</p>
                  {fig && (
                    <figure className="mt-7">
                      <div className="overflow-hidden border border-white/[0.09] bg-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fig.src}
                          alt={fig.alt}
                          loading="lazy"
                          decoding="async"
                          className="block h-auto w-full"
                        />
                      </div>
                      <figcaption className="mt-2.5 text-[0.82rem] leading-snug text-graphite">
                        {fig.caption}
                      </figcaption>
                    </figure>
                  )}
                </section>
              );
            })}
          </div>

          {/* author byline */}
          {author && (
            <div className="mt-16 flex items-center gap-4 border-t border-white/[0.08] pt-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 font-mono text-[12px] tracking-wider text-chalk/80">
                {author.initials}
              </span>
              <div>
                <div className="text-[0.98rem] font-medium tracking-tight text-chalk">{author.name}</div>
                <div className="mt-0.5 text-[0.85rem] text-mist">{author.role}</div>
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
