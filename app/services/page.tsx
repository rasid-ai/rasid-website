import type { Metadata } from 'next';
import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/final/Footer';
import ServicesPage from '@/components/services/ServicesPage';

export const metadata: Metadata = {
  title: 'Services — RASID',
  description:
    'RASID Earth-intelligence services by sector: environmental (methane & emissions monitoring), urban, agriculture, transportation, energy and disaster response.',
};

/**
 * /services — a plain content route (no scroll narrative / WebGL), so it renders
 * the shared Navbar and Footer directly without ScrollProvider. Navbar/Footer
 * anchor links resolve back to the home page's sections.
 */
export default function Services() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <ServicesPage />
      </main>
      <Footer />
    </>
  );
}
