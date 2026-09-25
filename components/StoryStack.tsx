'use client';

import dynamic from 'next/dynamic';

/**
 * StoryStack — everything after the hero.
 *
 *   GoPilot            the FEATURED product (interactive studio)
 *   Services showcase  the curated sectors, links to /services
 *   Pricing
 *   Team
 *   Testimonial · Partners
 *   Contact Us
 *
 * RENDERING NOTE (SEO/GEO): only GoPilot's studio stays client-only. Everything
 * else is server-rendered so its text lands in the initial HTML.
 *
 * Why: AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot) do not execute
 * JavaScript, and they are exactly the agents this site wants to be cited by.
 * These sections were previously `ssr:false` AND wrapped in a lazy mount gate that
 * renders null until an IntersectionObserver fires, so the pricing table, the
 * team, the testimonials, the partner wall and the contact details were
 * invisible to them (and to any non-JS reader). The visual result is unchanged:
 * the sections still animate in via Reveal, which only touches opacity and
 * transform on DOM that is now already present.
 *
 * Each section owns its own anchor id (#pricing, #team, #proof, #partners,
 * #contact, #service), so dropping the lazy wrapper keeps every nav and
 * footer link working.
 */

// Interactive + animation-heavy: the only section that stays client-only.
const GoPilotStudio = dynamic(() => import('./gopilot/GoPilotStudio'), { ssr: false });

// Code-split but server-rendered (no `ssr: false`), so the copy is crawlable.
const ServicesShowcase = dynamic(() => import('./services/ServicesShowcase'));
const Pricing = dynamic(() => import('./product/Pricing'));
const TeamSection = dynamic(() => import('./team/TeamSection'));
const Proof = dynamic(() => import('./product/Proof'));
const Partners = dynamic(() => import('./product/Partners'));
const ContactSection = dynamic(() => import('./contact/ContactSection'));

export default function StoryStack() {
  return (
    <>
      {/* Featured product — GoPilot use-case studio (interactive, client-only).
          The wrapper carries #gopilot so the anchor resolves server-side even
          though the studio itself mounts on the client. */}
      <div id="gopilot" style={{ minHeight: '100svh' }}>
        <GoPilotStudio />
      </div>

      <ServicesShowcase />
      <Pricing />
      <TeamSection />
      <Proof />
      <Partners />
      <ContactSection />
    </>
  );
}
