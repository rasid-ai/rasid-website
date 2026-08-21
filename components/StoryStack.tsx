'use client';

import dynamic from 'next/dynamic';

/**
 * StoryStack — everything after the hero, code-split.
 *
 * New (curated) narrative — one featured product, one featured service, then
 * the commercial close:
 *
 *   GoPilot            the FEATURED product — the question, the agent, the answer
 *   Products bridge    a slim link to the full /products page (GoServers, Plugins)
 *   Environmental      the featured service — methane monitoring
 *   Pricing
 *   Team
 *   Testimonial · Partners
 *   Contact Us
 *
 * GoServers and Plugins moved to the /products page; Products in the nav routes
 * there. Retired: DataSection (folded into the hero), MCP/Models/UseCases, GoBox,
 * How-It-Works, the Decision editorial, and the FinalEarth closer — the landing
 * now ends on Contact. Each act is a lazily-mounted chunk.
 */
import LazySection from './common/LazySection';

const GoPilotStudio = dynamic(() => import('./gopilot/GoPilotStudio'), { ssr: false });
const ServicesShowcase = dynamic(() => import('./services/ServicesShowcase'), { ssr: false });
const Pricing = dynamic(() => import('./product/Pricing'), { ssr: false });
const TeamSection = dynamic(() => import('./team/TeamSection'), { ssr: false });
const Proof = dynamic(() => import('./product/Proof'), { ssr: false });
const Partners = dynamic(() => import('./product/Partners'), { ssr: false });
const ContactSection = dynamic(() => import('./contact/ContactSection'), { ssr: false });
const Footer = dynamic(() => import('./final/Footer'), { ssr: false });

export default function StoryStack() {
  return (
    <>
      {/* Featured product — GoPilot use-case studio (interactive) */}
      <LazySection id="gopilot" minHeight="100svh">
        <GoPilotStudio />
      </LazySection>

      {/* Services showcase — the full range, links to /services */}
      <LazySection id="service" minHeight="60svh">
        <ServicesShowcase />
      </LazySection>

      <LazySection id="pricing" minHeight="60svh">
        <Pricing />
      </LazySection>

      <LazySection id="team" minHeight="60svh">
        <TeamSection />
      </LazySection>

      {/* Testimonial + Partners sit between Team and Contact */}
      <LazySection id="proof" minHeight="60svh">
        <Proof />
      </LazySection>

      <LazySection id="partners" minHeight="40svh">
        <Partners />
      </LazySection>

      <LazySection id="contact" minHeight="60svh">
        <ContactSection />
      </LazySection>

      <LazySection id="contact-footer" minHeight="40svh">
        <Footer />
      </LazySection>
    </>
  );
}
