import type { Metadata } from 'next';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import ServicesPage from '@/components/services/ServicesPage';
import { SERVICES_PAGE } from '@/data/content';

export const metadata: Metadata = {
  title: 'Services', // → "Services · RASID"
  description:
    'RASID Earth-intelligence services by sector: environmental (methane & emissions), urban, agriculture, defense, and transportation, powered by GoPilot.',
  alternates: { canonical: '/services' },
  openGraph: {
    url: '/services',
    title: 'RASID Services: Applied GeoAI by sector',
    description:
      'Earth-intelligence projects across environmental, urban, agriculture, defense, and transportation, powered by GoPilot.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rasid.ai/' },
    { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://rasid.ai/services' },
  ],
};

// The five service sectors as Service entities, provided by RASID — lets answer
// engines enumerate what RASID offers and by whom.
const servicesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'RASID geospatial services',
  itemListElement: SERVICES_PAGE.services.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Service',
      name: s.name,
      serviceType: `${s.name} geospatial intelligence`,
      description: s.summary,
      url: `https://rasid.ai/services#${s.id}`,
      provider: { '@id': 'https://rasid.ai/#organization' },
      areaServed: 'Worldwide',
    },
  })),
};

/**
 * /services — a plain content route (no scroll narrative / WebGL), so it renders
 * the shared Navbar and Footer directly without ScrollProvider. Navbar/Footer
 * anchor links resolve back to the home page's sections.
 */
export default function Services() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <Navbar />
      <main className="relative">
        <ServicesPage />
      </main>
      <Footer />
    </>
  );
}
