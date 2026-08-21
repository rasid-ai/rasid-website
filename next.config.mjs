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
};

export default nextConfig;
