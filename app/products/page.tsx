import type { Metadata } from 'next';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import ScrollProvider from '@/lib/story/ScrollProvider';
import ProductsPage from '@/components/products/ProductsPage';

export const metadata: Metadata = {
  title: 'Products — RASID',
  description:
    'The RASID product suite: GoPilot (the geospatial AI agent), GoServers (capabilities over MCP), and plugins for QGIS and ArcGIS Pro.',
};

/**
 * /products — wrapped in ScrollProvider because it hosts GoPilot's pinned scroll
 * demo, which is driven by Lenis + ScrollTrigger just like the home page.
 */
export default function Products() {
  return (
    <ScrollProvider>
      <Navbar />
      <main className="relative">
        <ProductsPage />
      </main>
      <Footer />
    </ScrollProvider>
  );
}
