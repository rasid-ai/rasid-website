import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/**
 * Inter for display and body — a grotesque with tight apertures that holds up at
 * 12rem without looking decorative. JetBrains Mono for every piece of
 * instrumentation text (coordinates, bands, model ids), which is what gives the
 * page its scientific register.
 */
const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  axes: ['opsz'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--font-mono',
});

const title = 'RASID — Seeing Earth smarter.';
const description =
  'RASID turns satellite imagery into decisions. GoPilot is an AI geospatial agent that plans the workflow, retrieves imagery, runs models and returns insight — from one sentence.';

export const metadata: Metadata = {
  title,
  description,
  applicationName: 'RASID',
  metadataBase: new URL('https://rasid.earth'),
  keywords: [
    'geospatial AI',
    'satellite imagery',
    'Earth observation',
    'remote sensing',
    'GoPilot',
    'MCP',
    'SAM 3',
    'change detection',
    'solar detection',
    'field delineation',
  ],
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'RASID',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#060C0A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // The hero relies on a stable viewport height; allowing zoom is still
  // required for accessibility, so only the initial scale is fixed.
  maximumScale: 5,
};

/* Applies the persisted palette to <html> before first paint, so a non-default
   theme doesn't flash the default on reload. Kept tiny and dependency-free. */
const themeInit = `(function(){try{var t=localStorage.getItem('rasid-theme');if(t&&t!=='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-void text-chalk">{children}</body>
    </html>
  );
}
