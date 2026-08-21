import type { MetadataRoute } from 'next';

/**
 * Web app manifest (served at /manifest.webmanifest; Next injects the <link>).
 *
 * Icons are the green RASID "R" mark cropped from public/logo.svg (wordmark
 * removed) on a transparent background; the 512 is also declared `maskable` for
 * Android adaptive icons. The splash uses white (theme_color stays dark chrome).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RASID — Seeing Earth smarter',
    short_name: 'RASID',
    description: 'GoPilot is an AI geospatial agent that turns satellite imagery into decisions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#060C0A',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
