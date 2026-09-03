import type { MetadataRoute } from 'next';

/**
 * robots.txt — served by Next at /robots.txt. Allows all crawlers and points
 * them at the sitemap.
 */
const BASE = 'https://rasid.ai';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
