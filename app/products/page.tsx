import type { Metadata } from 'next';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import ScrollProvider from '@/lib/story/ScrollProvider';
import ProductsPage from '@/components/products/ProductsPage';
import { GOSERVERS_SECTION } from '@/data/content';

export const metadata: Metadata = {
  title: 'Products', // → "Products · RASID" via the root title template
  description:
    'The RASID product suite: GoPilot, the geospatial AI agent; GoServers, every capability over MCP; and plugins for QGIS and ArcGIS Pro.',
  alternates: { canonical: '/products' },
  openGraph: {
    url: '/products',
    title: 'RASID Products: GoPilot, GoServers & Plugins',
    description:
      'GoPilot (AI geospatial agent), GoServers (capabilities over MCP), and plugins for QGIS and ArcGIS Pro.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rasid.ai/' },
    { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://rasid.ai/products' },
  ],
};

// The three GoServers (MCP servers) as developer SoftwareApplications, so answer
// engines can enumerate RASID's API surface. Provider links back to the org.
const goServersJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'RASID GoServers (MCP servers)',
  itemListElement: GOSERVERS_SECTION.servers.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'SoftwareApplication',
      name: s.name,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: s.desc,
      featureList: [...s.caps],
      provider: { '@id': 'https://rasid.ai/#organization' },
    },
  })),
};

/**
 * /products — wrapped in ScrollProvider because it hosts GoPilot's pinned scroll
 * demo, which is driven by Lenis + ScrollTrigger just like the home page.
 */
export default function Products() {
  return (
    <ScrollProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(goServersJsonLd) }}
      />
      <Navbar />
      <main className="relative">
        <ProductsPage />
      </main>
      <Footer />
    </ScrollProvider>
  );
}
