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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publishedStudies = CASE_STUDIES.filter((c) => c.status === 'published');

  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/publications`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // The case-studies index + individual studies only enter the sitemap once at
    // least one study is published.
    ...(publishedStudies.length
      ? [{ url: `${BASE}/case-studies`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 }]
      : []),
    ...publishedStudies.map((c) => ({
      url: `${BASE}/case-studies/${c.slug}`,
      lastModified: new Date(c.date),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
