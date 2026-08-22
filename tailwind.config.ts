import type { Config } from 'tailwindcss';

/**
 * RASID design tokens.
 *
 * The palette is deliberately austere: a near-black navy substrate, a single
 * white type colour, and exactly one accent ("signal") used at varying
 * intensities. Anything that looks like a second hue is the signal desaturated.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './data/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /* Every colour is backed by a CSS variable (see app/themes.css) so the
         whole palette flips via `data-theme` on <html>. The `<alpha-value>`
         placeholder lets opacity utilities keep working (bg-void/50, etc.).
         `white`/`black` are intentionally overridden too: the codebase uses them
         only as *-white/opacity overlays for borders and subtle fills, so
         routing them through a token makes those overlays theme-aware as well
         (there are no solid white/black surfaces to break). */
      colors: {
        void: 'rgb(var(--c-void) / <alpha-value>)',
        abyss: 'rgb(var(--c-abyss) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        slate: {
          line: 'rgb(var(--c-line) / <alpha-value>)',
          edge: 'rgb(var(--c-edge) / <alpha-value>)',
        },
        signal: {
          DEFAULT: 'rgb(var(--c-signal) / <alpha-value>)',
          bright: 'rgb(var(--c-signal-bright) / <alpha-value>)',
          dim: 'rgb(var(--c-signal-dim) / <alpha-value>)',
          deep: 'rgb(var(--c-signal-deep) / <alpha-value>)',
        },
        chalk: 'rgb(var(--c-chalk) / <alpha-value>)',
        mist: 'rgb(var(--c-mist) / <alpha-value>)',
        graphite: 'rgb(var(--c-graphite) / <alpha-value>)',
        white: 'rgb(var(--c-white) / <alpha-value>)',
        black: 'rgb(var(--c-black) / <alpha-value>)',
        /* Semantic aliases — prefer these in new code. */
        accent: 'rgb(var(--c-signal) / <alpha-value>)',
        surface: 'rgb(var(--c-ink) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.055em',
        tighter: '-0.035em',
        wider: '0.14em',
        widest: '0.28em',
      },
      transitionTimingFunction: {
        cinema: 'cubic-bezier(0.16, 1, 0.3, 1)',
        drift: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        // Button wipes read as deliberate at 600ms; 500 is too eager, 700 lags
        // behind the cursor. Not a default Tailwind step, so it lives here.
        '600': '600ms',
      },
      animation: {
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        sweep: 'sweep 6s linear infinite',
        'blink-caret': 'blink-caret 1.1s step-end infinite',
        // Seamless logo marquee: the track holds two identical sets, so shifting
        // by exactly one set (-50%) loops with no visible jump.
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        sweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'blink-caret': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
