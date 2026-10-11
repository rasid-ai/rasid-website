import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // A stray lockfile in the user profile above this directory makes Next infer
  // the wrong workspace root; pin it to this project.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  compiler: {
    // Strip console noise from production bundles, keep errors/warnings.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    // three.js and gsap are large; let Next split them optimally.
    optimizePackageImports: ['motion', 'gsap'],
  },
  /**
   * The GoPilot case study was replaced by the GoSuite one (GoPilot is now the
   * centre of the suite rather than the whole product). Its URL was published
   * and indexed, so it redirects permanently instead of 404ing. Keep this entry
   * even after the old URL drops out of search results: external links to it do
   * not expire.
   */
  async redirects() {
    return [
      {
        source: '/case-studies/gopilot-ai-geospatial-agent',
        destination: '/case-studies/gosuite-agentic-geospatial-platform',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
