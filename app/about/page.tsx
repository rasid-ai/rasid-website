import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import AboutContent from '@/components/content/AboutContent';

export const metadata: Metadata = pageMetadata({
  title: 'About RASID: GoPilot and Applied Earth Observation',
  description:
    'What RASID does and how GoPilot works: the data and AI models behind it, the sectors it serves, pricing, and answers to common questions.',
  path: '/about',
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rasid.ai/' },
    { '@type': 'ListItem', position: 2, name: 'About', item: 'https://rasid.ai/about' },
  ],
};

/**
 * /about — a plain content route (no scroll narrative / WebGL). Hosts the
 * substantive, crawlable About + FAQ content and its FAQPage / SoftwareApplication
 * structured data (all inside AboutContent). Kept off the home page so the
 * cinematic landing stays short; discoverable via the navbar + sitemap.
 */
export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navbar />
      <main className="relative">
        <AboutContent />
      </main>
      <Footer />
    </>
  );
}
