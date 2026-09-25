import type { Metadata } from 'next';

/**
 * One place that builds per-page metadata.
 *
 * Why this exists: Next.js does NOT deep-merge `openGraph`. As soon as a page
 * declares its own `openGraph` block, the root's is replaced wholesale, which
 * silently dropped the `og:image` produced by the app/opengraph-image.tsx file
 * convention on every page except the home page. Routing every page through
 * `pageMetadata()` guarantees og:image, twitter:image, a canonical and
 * page-specific twitter title/description are always present together.
 *
 * `/opengraph-image` is referenced as a plain route (it really does serve the
 * generated 1200x630 PNG), resolved to an absolute URL via `metadataBase`.
 */

const SITE_NAME = 'RASID';

const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'RASID: GoPilot, the AI geospatial agent for Earth observation',
} as const;

export interface PageMetaInput {
  /** Full <title>, used verbatim. Aim for 50-60 characters. */
  title: string;
  /** Meta description. Aim for 140-160 characters. */
  description: string;
  /** Route path, e.g. '/about'. Becomes the canonical and og:url. */
  path: string;
  /** Override the social image (e.g. a case study's own cover). */
  image?: { url: string; width?: number; height?: number; alt: string };
  /** 'article' for case studies, otherwise 'website'. */
  type?: 'website' | 'article';
  /** Set false for pages that must stay out of search (debug routes, drafts). */
  index?: boolean;
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  index = true,
}: PageMetaInput): Metadata {
  const img = image ?? OG_IMAGE;
  return {
    // `absolute` so the root's '%s · RASID' template does not append a second brand.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title,
      description,
      images: [img],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [img],
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
  };
}
