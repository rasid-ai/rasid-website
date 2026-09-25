import type { Metadata } from 'next';

/* Debug probe: keep it reachable locally but out of search engines and AI
   crawlers. The page itself is a client component and so cannot export
   metadata, hence this layout. */
export const metadata: Metadata = {
  title: { absolute: 'Debug: earth shader probe' },
  robots: { index: false, follow: false },
};

export default function DebugShaderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
