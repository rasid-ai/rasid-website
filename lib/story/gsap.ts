'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * The single place ScrollTrigger is registered.
 *
 * Registration must happen at *module evaluation* time, not in an effect. React
 * runs child effects before parent effects, so a section's `ScrollTrigger.create`
 * would otherwise execute before the provider above it had registered the plugin
 * — and ScrollTrigger resolves its internal `_context` reference during
 * `register()`, so creating a trigger first throws "_context is not a function"
 * and takes the whole page down.
 *
 * `ScrollTrigger.register` guards on `window.document` internally, so importing
 * this from a client module is SSR-safe, and repeat calls are a no-op.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
