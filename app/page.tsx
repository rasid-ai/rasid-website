import Navbar from '@/components/navigation/Navbar';
import ScrollProvider from '@/lib/story/ScrollProvider';
import Hero from '@/components/hero/Hero';
import StoryStack from '@/components/StoryStack';

/**
 * The page is one continuous scroll narrative:
 *
 *   Act I    Hero            Earth → region → target → dive → imagery
 *   Act II   DataSection     "Earth is data" — the imagery becomes legible
 *   Act III  GoPilot         the question, the agent, the answer
 *   Act IV   MCPNetwork      how it does it — the tool ecosystem
 *   Act V    ModelShowcase   one image, infinite questions
 *   Act VI   UseCases        agriculture · solar · urban
 *   Act VII  Decision        pixels → decisions (editorial)
 *   Act VIII FinalEarth      the return, now instrumented
 *
 * Act I is server-rendered as the shell (its copy is real HTML, so the page has
 * meaningful content and LCP text without waiting on WebGL). Everything below
 * the fold is code-split and mounted as it approaches the viewport.
 */
export default function Page() {
  return (
    <ScrollProvider>
      <Navbar />
      <main className="relative">
        <Hero />
        <StoryStack />
      </main>
    </ScrollProvider>
  );
}
