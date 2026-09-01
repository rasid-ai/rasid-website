import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { PostHogProvider } from './providers'
import { OFFICES } from '@/data/content';
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

const title = 'RASID | Seeing Earth, Smarter.';
const description =
  'Meet GoPilot, RASID’s AI geospatial agent. Ask a geospatial question in plain language, and GoPilot finds the right data, selects the right models, runs the analysis, and returns the answer.';

export const metadata: Metadata = {
  title,
  description,
  applicationName: 'RASID',
  metadataBase: new URL('https://rasid.ai'),
  // Favicon / app icons live in public/logo/ (the green R). Declared here since
  // we don't use the app/icon.png file convention.
  icons: {
    icon: '/logo/favicon.png',
    apple: '/logo/apple-touch-icon.png',
  },
  
  keywords: [
    'geospatial AI',
	  'GeoAI',
	  'AI geospatial agent',
    'satellite imagery',
	  'satellite data',
    'Earth observation',
    'remote sensing',
    'GoPilot',
	  'RASID',
    'MCP',
	  'QGIS',
	  'ArcGIS Pro',
    'SAM3',
	  'DINOv3',
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

/* Organization structured data. This is how search engines associate RASID with
   its France and Lebanon offices (rich results / Knowledge Panel / local
   relevance). */
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RASID',
  url: 'https://rasid.ai',
  logo: 'https://rasid.ai/logo/apple-touch-icon.png',
  email: 'info@rasid.ai',
  sameAs: [
    'https://www.linkedin.com/company/rasid-ai/',
    'https://www.youtube.com/@RASIDAI',
  ],
  address: OFFICES.map((o) => ({
    '@type': 'PostalAddress',
    streetAddress: o.postal.streetAddress,
    postalCode: o.postal.postalCode,
    addressLocality: o.postal.addressLocality,
    addressCountry: o.postal.addressCountry,
  })),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="bg-void text-chalk">
        <PostHogProvider>  
          {children}  
        </PostHogProvider>  
      </body>
    </html>
  );
}