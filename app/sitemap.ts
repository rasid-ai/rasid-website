import type { MetadataRoute } from 'next';
import { CASE_STUDIES } from '@/data/content';

/**
 * sitemap.xml — served by Next at /sitemap.xml.
 *
 * Only real, indexable routes are listed; in-page hash anchors (/#pricing,
 * /products#mcps, …) are NOT separate URLs. Draft case studies are excluded
 * until they're published (they render noindex). Keep in sync with app routes.
 */
const BASE = 'https://rasid.ai';

/**
 * Date of the last meaningful content change per static route, hand-maintained.
 *
 * This was `new Date()`, which stamped every route with the build time: each
 * deploy claimed all five pages had just changed, and a lastmod that always
 * reads "now" gets discounted as a signal. Deriving it from git history doesn't
 * work here either, because the page copy is centralised in data/content.ts, so
 * one edit there would bump every route at once, the same lie told less often.
 *
 * Bump a date only when that page's visible content actually changes. Refactors,
 * styling passes and dependency bumps should leave it alone. Date-only (rather
 * than a full timestamp) keeps it honest about the precision we really have.
 */
const ROUTE_UPDATED = {
  '/': '2026-09-25',
  '/products': '2026-09-25',
  '/services': '2026-09-25',
  '/about': '2026-09-25',
  '/publications': '2026-09-25',
} as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const publishedStudies = CASE_STUDIES.filter((c) => c.status === 'published');

  // The index page's freshness *is* the newest study listed on it, so unlike the
  // static routes this one stays derived. ISO dates sort lexicographically.
  const newestStudy = publishedStudies.map((c) => c.date).sort().at(-1);

  return [
    { url: `${BASE}/`, lastModified: ROUTE_UPDATED['/'], changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/products`, lastModified: ROUTE_UPDATED['/products'], changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/services`, lastModified: ROUTE_UPDATED['/services'], changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`, lastModified: ROUTE_UPDATED['/about'], changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/publications`, lastModified: ROUTE_UPDATED['/publications'], changeFrequency: 'monthly', priority: 0.6 },
    // The case-studies index + individual studies only enter the sitemap once at
    // least one study is published.
    ...(publishedStudies.length && newestStudy
      ? [{ url: `${BASE}/case-studies`, lastModified: newestStudy, changeFrequency: 'monthly' as const, priority: 0.6 }]
      : []),
    ...publishedStudies.map((c) => ({
      url: `${BASE}/case-studies/${c.slug}`,
      // Passed through as the plain date, not `new Date(...)`, which would emit
      // a midnight-UTC timestamp implying a precision we don't have.
      lastModified: c.date,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
