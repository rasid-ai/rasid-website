'use client';

import { useEffect, useState } from 'react';

/**
 * Reactive "is the light theme active?" for the WebGL scenes.
 *
 * The scenes render dark space by default; in light mode they need to adapt
 * (hide stars, lift the backdrop, etc.). CSS variables can't reach into a
 * shader, so scenes read this hook instead. It updates when the navbar toggle
 * fires `rasid:themechange`, and on cross-tab storage changes.
 */
export function useIsLight(): boolean {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const read = () => setLight(document.documentElement.dataset.theme === 'light');
    read();
    window.addEventListener('rasid:themechange', read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('rasid:themechange', read);
      window.removeEventListener('storage', read);
    };
  }, []);

  return light;
}
