import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import { PUBLICATIONS, PUBLICATIONS_PAGE as S, TEAM_SECTION } from '@/data/content';

export const metadata: Metadata = pageMetadata({
  title: 'RASID Publications: Peer-Reviewed Geospatial AI Research',
  description:
    'Peer-reviewed research co-authored by the RASID team on Earth observation, remote sensing, geospatial AI and quantum SAR processing.',
  path: '/publications',
});

const BASE = 'https://rasid.ai';

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
    { '@type': 'ListItem', position: 2, name: 'Publications', item: `${BASE}/publications` },
  ],
};

/* Each paper as a ScholarlyArticle. This is the strongest E-E-A-T / expertise
   signal on the site: real peer-reviewed work, with authors resolved to the
   Person nodes already declared in the root layout where they are RASID team. */
const teamByName = new Map(TEAM_SECTION.members.map((m) => [m.name.toLowerCase(), m]));

const matchTeam = (author: string) => {
  const a = author.toLowerCase().replace(/^dr\.?\s+/, '');
  for (const [name, m] of teamByName) {
    const bare = name.replace(/^dr\.?\s+/, '');
    const lastA = a.split(/\s+/).pop() ?? '';
    const lastB = bare.split(/\s+/).pop() ?? '';
    if (bare === a || (lastA && lastA === lastB && bare.split(/\s+/)[0] === a.split(/\s+/)[0])) return m;
  }
  return null;
};

/* Newest first, so the list stays correctly ordered as papers are appended to
   the data array in whatever order. Stable sort keeps same-year insertion order. */
const ordered = [...PUBLICATIONS].sort((a, b) => Number(b.year) - Number(a.year));

const publicationsJsonLd = {
  '@context': 'https://schema.org',
  '@graph': ordered.map((p) => ({
    '@type': 'ScholarlyArticle',
    headline: p.title,
    name: p.title,
    datePublished: p.year,
    // A preprint has no peer-reviewed periodical; declare the repository as the
    // publisher instead of inventing a journal for it.
    ...(p.type === 'preprint'
      ? { publisher: { '@type': 'Organization', name: p.venue } }
      : {
          isPartOf: {
            '@type': 'PublicationIssue',
            ...(p.issue ? { issueNumber: p.issue } : {}),
            isPartOf: {
              '@type': 'PublicationVolume',
              ...(p.volume ? { volumeNumber: p.volume } : {}),
              isPartOf: { '@type': 'Periodical', name: p.venue },
            },
          },
        }),
    ...(p.pages ? { pagination: p.pages.replace('–', '-') } : {}),
    ...(p.doi ? { identifier: p.doi } : {}),
    url: p.url,
    ...(p.abstract ? { abstract: p.abstract } : {}),
    author: p.authors.map((a) => {
      const m = matchTeam(a);
      return m
        ? { '@type': 'Person', name: a, '@id': `${BASE}/#person-${m.initials.toLowerCase()}` }
        : { '@type': 'Person', name: a };
    }),
  })),
};

export default function Publications() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {PUBLICATIONS.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(publicationsJsonLd) }}
        />
      )}
      <Navbar />
      <main className="relative w-full bg-void">
        <section className="mx-auto max-w-[900px] px-6 pb-28 pt-32 md:px-10 md:pb-36 md:pt-44">
          {/* header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{S.eyebrow}</span>
            </div>
            <span className="label-sm hidden sm:inline">
              {PUBLICATIONS.length} {PUBLICATIONS.length === 1 ? 'paper' : 'papers'}
            </span>
          </div>

          <h1 className="mt-6 display text-[clamp(2.2rem,5vw,4rem)] text-chalk">{S.headline}</h1>
          <p className="mt-6 max-w-[64ch] text-[1.05rem] leading-relaxed text-chalk/85">{S.body}</p>

          {/* list */}
          <ol className="mt-14 border-t border-white/[0.08]">
            {ordered.map((p, i) => (
              <li key={p.url} className="border-b border-white/[0.08] py-8 md:py-10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-mono text-[11px] tracking-widest text-signal/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="label text-signal/90">{p.year}</span>
                  <span aria-hidden className="h-3 w-px bg-white/15" />
                  <span className="label-sm text-graphite">
                    {p.venue}
                    {p.volume && ` ${p.volume}`}
                    {p.issue && `(${p.issue})`}
                    {p.pages && `, ${p.pages}`}
                  </span>
                  {/* Type badge: journal article / conference paper / preprint. */}
                  <span className="border border-white/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-graphite">
                    {p.type.replace('-', ' ')}
                  </span>
                </div>

                <h2 className="mt-4 text-[1.15rem] font-medium leading-snug tracking-tight text-chalk md:text-[1.3rem]">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors duration-300 hover:text-signal"
                  >
                    {p.title}
                  </a>
                </h2>

                {/* authors — RASID team members emphasised */}
                <p className="mt-3 text-[0.9rem] leading-relaxed text-mist">
                  {p.authors.map((a, k) => (
                    <span key={a}>
                      {k > 0 && ', '}
                      <span className={matchTeam(a) ? 'text-chalk/90' : undefined}>{a}</span>
                    </span>
                  ))}
                </p>

                {p.summary && (
                  <p className="mt-4 max-w-[70ch] text-[0.95rem] leading-relaxed text-mist">{p.summary}</p>
                )}

                {/* Verbatim abstract behind a disclosure: it's long and belongs to the
                    publisher's record, so the plain-language summary leads instead. */}
                {p.abstract && (
                  <details className="group mt-4">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-graphite transition-colors hover:text-signal [&::-webkit-details-marker]:hidden">
                      Abstract
                      <span aria-hidden className="text-signal transition-transform duration-300 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-[70ch] border-l border-white/[0.1] pl-4 text-[0.9rem] leading-relaxed text-mist">
                      {p.abstract}
                    </p>
                  </details>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-[12px] font-medium tracking-wide text-signal"
                  >
                    {/* Say where the link actually goes: the open-access arXiv copy. */}
                    {p.url.includes('arxiv.org') ? 'View on arXiv' : 'View publication'}
                    <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
                  </a>
                  {p.pdfUrl && (
                    <a
                      href={p.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] tracking-wide text-graphite transition-colors hover:text-chalk"
                    >
                      PDF
                    </a>
                  )}
                  {p.doi && (
                    <span className="font-mono text-[11px] text-graphite">DOI {p.doi}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
