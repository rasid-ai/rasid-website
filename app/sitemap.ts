import type { MetadataRoute } from 'next';

/**
 * sitemap.xml — served by Next at /sitemap.xml.
 *
 * Only real routes are listed; in-page hash anchors (/#pricing, /products#mcps,
 * /services#defense, …) are NOT separate URLs and don't belong here. Keep this
 * in sync with the app's page routes.
 */
const BASE = 'https://rasid.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
