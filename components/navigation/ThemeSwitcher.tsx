'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme/themes';

/**
 * Light / dark mode toggle.
 *
 * Sets `data-theme` on <html> ('light', or removed for the default dark). Dark
 * "media" sections (hero, imagery, final Earth) opt out via data-scene="dark"
 * and stay dark in both modes. The choice is persisted and re-applied before
 * paint by the inline script in layout.tsx, so there's no flash on reload.
 */
export default function ThemeSwitcher() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMode(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    if (next === DEFAULT_THEME) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore private-mode storage errors */
    }
    // Let the WebGL scenes (which can't read CSS vars) react to the switch.
    window.dispatchEvent(new Event('rasid:themechange'));
    setMode(next);
  };

  const nextLabel = mode === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${nextLabel} mode`}
      aria-label={`Switch to ${nextLabel} mode`}
      className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-mist transition-colors duration-300 hover:border-signal/50 hover:text-chalk"
    >
      {mode === 'dark' ? (
        /* sun — click for light */
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
          />
        </svg>
      ) : (
        /* moon — click for dark */
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  );
}
