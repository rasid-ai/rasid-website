import Navbar from '@/components/navigation/Navbar';
import ScrollProvider from '@/lib/story/ScrollProvider';
import Hero from '@/components/hero/Hero';
import StoryStack from '@/components/StoryStack';
import Footer from '@/components/final/Footer';

/**
 * The page is one continuous scroll narrative:
 *
 *   Act I    Hero        Earth → region → target → dive → imagery
 *   Act II   GoPilot     the question, the agent, the answer
 *   …         (product · services · pricing · team · proof · partners · contact)
 *
 * Act I is server-rendered as the shell (its copy is real HTML, so the page has
 * meaningful content and LCP text without waiting on WebGL). Everything in the
 * StoryStack is code-split but server-rendered too — only the GoPilot studio is
 * client-only, because it needs the DOM. That matters for SEO and for AI
 * crawlers, which do not execute JavaScript: the copy has to be in the HTML.
 *
 * Footer is rendered here directly so its nav links + contact land in the
 * crawlable HTML even if the stack below it changes. The
 * substantive About/FAQ + product/service content lives on the dedicated
 * /about, /products and /services pages (kept off the home page to keep the
 * cinematic landing short) — all discoverable via the sitemap.
 */
export default function Page() {
  return (
    <ScrollProvider>
      <Navbar />
      <main className="relative">
        <Hero />
        <StoryStack />
      </main>
      <Footer />
    </ScrollProvider>
  );
}
