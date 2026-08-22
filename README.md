# RASID — Landing page

Cinematic, scroll-driven landing for RASID / GoPilot (Next.js 15, React 19,
TypeScript, Tailwind, Three.js/R3F, GSAP + Lenis).

## Develop
    npm install
    npm run dev        # http://localhost:3312

## Build
    npm run build && npm start

## Content
All copy lives in `data/content.ts`. Case/service imagery is in `public/`.
Source rasters (`raw_data/`, not committed) are composited into `public/*.webp`
via `scripts/build_gopilot.py`.
