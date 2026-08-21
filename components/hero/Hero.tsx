'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { HERO } from '@/data/content';
import { DIVE_TARGET, ORBIT_STAGES, onProgress } from '@/lib/story/store';
import { useStoryTrigger } from '@/lib/hooks/useStoryTrigger';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { convergeScroll } from '@/lib/story/anchorScroll';
import { range, smootherstep, clamp } from '@/lib/utils/math';
import EarthFallback from './EarthFallback';
import HeroOverlay from './HeroOverlay';
import HeroDataReveal from './HeroDataReveal';

/**
 * Hero — Act I.
 *
 * A 5.5-viewport pinned sequence. The DOM here is deliberately thin: the copy,
 * the reticle and the instrument readouts. Everything spatial happens in the
 * WebGL scene, driven by the `orbit` channel.
 *
 * Copy choreography is imperative (direct style writes from a store
 * subscription) rather than React state, because it updates every scroll frame.
 */

// The globe is the single heaviest thing on the page: never server-rendered,
// and only requested once the client has reported its capabilities.
const EarthScene = dynamic(() => import('./EarthScene'), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const titleLine1 = useRef<HTMLSpanElement>(null);
  const titleLine2 = useRef<HTMLSpanElement>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const { caps } = useScrollContext();
  const [mounted, setMounted] = useState(false);

  // The dive carries the "Earth is data" beats. Trimmed from 7.5→5.5 (desktop)
  // so the intro feels shorter (feedback #7) while still giving each beat room.
  const length = caps.mobile ? 4 : 5.5;

  useStoryTrigger(sectionRef, 'orbit', { length, pin: true, enabled: caps.ready });

  useEffect(() => setMounted(true), []);

  /* --- entrance: a single staged reveal, once, on load ------------------ */
  useEffect(() => {
    if (!caps.ready) return;
    const els = [titleLine1.current, titleLine2.current].filter(Boolean) as HTMLElement[];
    if (caps.reducedMotion) {
      gsap.set(els, { yPercent: 0, opacity: 1 });
      gsap.set('[data-hero-fade]', { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    // Mask reveal: lines rise out of their own clipping box.
    tl.fromTo(
      els,
      { yPercent: 108 },
      { yPercent: 0, duration: 1.5, stagger: 0.12 },
      0.15,
    ).fromTo(
      '[data-hero-fade]',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 },
      0.75,
    );
    return () => {
      tl.kill();
    };
  }, [caps.ready, caps.reducedMotion]);

  /* --- scroll-linked copy release -------------------------------------- */
  useEffect(() => {
    const copy = copyRef.current;
    const wrap = sceneWrapRef.current;
    const flash = flashRef.current;
    if (!copy) return;

    return onProgress('orbit', (p) => {
      const { approach, dive } = ORBIT_STAGES;

      // Copy releases during the approach: rises, blurs slightly, fades.
      const out = smootherstep(range(p, approach[0], approach[0] + 0.16));
      copy.style.opacity = String(1 - out);
      copy.style.transform = `translate3d(0, ${-out * 70}px, 0)`;
      // Blur is expensive; only apply it while it is actually visible.
      copy.style.filter = out > 0.02 && out < 0.98 ? `blur(${out * 7}px)` : 'none';
      copy.style.pointerEvents = out > 0.5 ? 'none' : 'auto';

      if (wrap) {
        // The canvas scales up marginally through the dive — it amplifies the
        // sense of speed without touching the 3D camera.
        const s = 1 + 0.14 * smootherstep(range(p, dive[0], 1));
        wrap.style.transform = `scale(${s})`;
      }

      if (flash) {
        // Atmospheric entry bloom, peaking as we cross into the troposphere.
        const f = Math.exp(-Math.pow((p - 0.7) / 0.055, 2));
        flash.style.opacity = String(clamp(f * 0.5));
      }
    });
  }, []);

  const showScene = mounted && caps.ready && caps.webgl2 && caps.tier !== 'low';
  const showFallback = mounted && caps.ready && (!caps.webgl2 || caps.tier === 'low');

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative h-[100svh] w-full overflow-hidden bg-void"
      aria-label="RASID — Seeing Earth smarter"
    >
      {/* ---------- WebGL / fallback ---------- */}
      <div
        ref={sceneWrapRef}
        className="absolute inset-0 will-transform"
        style={{ transformOrigin: '58% 50%' }}
      >
        {showScene && (
          <EarthScene
            caps={caps}
            channel="orbit"
            mode="hero"
            className="absolute inset-0"
          />
        )}
        {showFallback && <EarthFallback caps={caps} className="absolute inset-0" />}
      </div>

      {/* Entry bloom */}
      <div
        ref={flashRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        style={{
          background:
            'radial-gradient(60% 50% at 58% 52%, rgba(190,225,235,0.9), rgba(120,190,210,0.25) 45%, transparent 72%)',
        }}
      />

      {/* Vignette + floor gradient: keeps type legible over the planet and
          hides the canvas edge. Themed via --c-void so it's a dark scrim in dark
          mode and a *white* scrim in light mode — the headline stays readable on
          the left while the Earth shows through on the right, in both modes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 20% 45%, rgb(var(--c-void) / 0.94) 0%, rgb(var(--c-void) / 0.55) 34%, transparent 62%), linear-gradient(to top, rgb(var(--c-void) / 0.9), transparent 32%)',
        }}
      />

      {/* ---------- "Earth is data" beats, revealed over the descent ---------- */}
      {showScene && <HeroDataReveal />}

      {/* ---------- Instrument overlay (reticle, readouts, stage) ---------- */}
      <HeroOverlay caps={caps} />

      {/* ---------- Copy ----------
          Vertically centred, but with top/bottom padding so on short (laptop)
          viewports the block never collides with the fixed navbar above or the
          instrument/telemetry strip below — the CTAs were landing exactly on the
          STAGE/ALTITUDE readout. */}
      <div
        ref={copyRef}
        className="pointer-events-auto absolute inset-0 z-30 flex items-center pb-28 pt-24 will-transform md:pb-32"
      >
        <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10">
          <div className="max-w-[46rem]">
            {/* Eyebrow */}
            <div data-hero-fade className="mb-5 flex items-center gap-3 opacity-0 md:mb-7">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{HERO.eyebrow}</span>
              <span className="label-sm hidden sm:inline">
                {DIVE_TARGET.latLabel} / {DIVE_TARGET.lonLabel}
              </span>
            </div>

            {/* Title — two mask-revealed lines.
                The mask boxes are `overflow-hidden`, and `.display` sets
                line-height 0.88 — tight enough that the box shaved the cap tops
                ("SEEING" read as "SFEING") before the reveal settled. Giving the
                animated lines leading-[1.05] fits the full glyph inside the mask;
                a small negative margin between the boxes keeps the tight stack. */}
            <h1 className="display text-[clamp(2.3rem,6.6vw,5.6rem)] text-chalk">
              <span className="block overflow-hidden">
                <span ref={titleLine1} className="block leading-[1.05] will-transform">
                  {HERO.title[0]}
                </span>
              </span>
              <span className="-mt-[0.12em] block overflow-hidden">
                <span ref={titleLine2} className="block leading-[1.05] will-transform">
                  {HERO.title[1]}
                </span>
              </span>
            </h1>

            {/* Tagline */}
            <p
              data-hero-fade
              className="mt-5 text-[clamp(1.05rem,2.1vw,1.5rem)] font-normal leading-snug tracking-tight text-chalk/90 opacity-0 md:mt-6"
            >
              {HERO.tagline}
            </p>

            {/* Supporting copy */}
            <p
              data-hero-fade
              className="mt-4 max-w-[30rem] text-[0.94rem] leading-relaxed text-mist opacity-0"
            >
              {HERO.body}
            </p>

            {/* Buttons */}
            <div data-hero-fade className="mt-7 flex flex-wrap items-center gap-3 opacity-0 md:mt-8">
              <HeroButton href={HERO.primary.href} variant="primary">
                {HERO.primary.label}
              </HeroButton>
              <HeroButton href={HERO.secondary.href} variant="ghost">
                {HERO.secondary.label}
              </HeroButton>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint + skip control */}
      <ScrollHint label={HERO.scrollHint} />
      <SkipIntro />
    </section>
  );
}

/** Lets readers jump past the scroll-jacked intro straight to the product. */
function SkipIntro() {
  const { lenis } = useScrollContext();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fades out as the descent begins — the nav takes over from there.
    return onProgress('orbit', (p) => {
      const out = smootherstep(range(p, 0.02, 0.14));
      el.style.opacity = String(1 - out);
      el.style.pointerEvents = out > 0.5 ? 'none' : 'auto';
    });
  }, []);

  // Wrapped in the same centred max-w-[1600px] / px container as the telemetry
  // strip (which holds "RASID / EO"), so SKIP INTRO's right edge aligns with it
  // on every width — a fixed right-N would drift right of it above 1600px.
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 md:bottom-28">
      <div className="mx-auto flex max-w-[1600px] justify-end px-6 md:px-10">
        <button
          ref={ref}
          type="button"
          onClick={() =>
            // Instant jump to the GoPilot studio (now a normal, unpinned section
            // right after the hero). `immediate` jumps rather than replaying the
            // intro; -76 clears the fixed navbar.
            convergeScroll(lenis, '#gopilot', -76, true)
          }
          className="group pointer-events-auto hidden items-center gap-2 text-[11px] uppercase tracking-widest text-mist transition-colors duration-300 hover:text-chalk md:flex"
        >
          Skip intro
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HeroButton({
  href,
  variant,
  children,
}: {
  href: string;
  variant: 'primary' | 'ghost';
  children: React.ReactNode;
}) {
  const { scrollTo } = useScrollContext();
  const external = !href.startsWith('#');
  const onClick = (e: React.MouseEvent) => {
    if (href.startsWith('#') && document.querySelector(href)) {
      e.preventDefault();
      scrollTo(href, { offset: -10 });
    }
  };
  // The primary CTA points at the SaaS app once GOPILOT_APP_URL is real — open
  // it in a new tab and leave the marketing page in place behind it.
  const extAttrs = external ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {};

  if (variant === 'primary') {
    return (
      <a
        href={href}
        onClick={onClick}
        {...extAttrs}
        className="group relative inline-flex items-center gap-2.5 overflow-hidden bg-chalk px-7 py-3.5 text-[13px] font-medium tracking-wide text-void transition-colors duration-500"
      >
        <span className="relative z-10">{children}</span>
        <span
          aria-hidden
          className="relative z-10 transition-transform duration-500 ease-cinema group-hover:translate-x-1"
        >
          →
        </span>
        <span className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-600 ease-cinema group-hover:scale-x-100" />
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      {...extAttrs}
      className="group relative inline-flex items-center gap-2.5 border border-white/15 px-7 py-3.5 text-[13px] font-medium tracking-wide text-chalk transition-all duration-500 hover:border-signal/50 hover:text-signal"
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-signal/80" />
        <span className="absolute inset-0 animate-ping rounded-full bg-signal/50" />
      </span>
      {children}
    </a>
  );
}

function ScrollHint({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fades out the moment the descent begins — it has served its purpose.
    return onProgress('orbit', (p) => {
      el.style.opacity = String(1 - smootherstep(range(p, 0.005, 0.06)));
    });
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute bottom-7 left-1/2 z-30 -translate-x-1/2 md:bottom-9"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="label-sm tracking-widest">{label}</span>
        {/* A slow travelling tick inside a fixed rail — implies descent, not bounce. */}
        <div className="relative h-10 w-px overflow-hidden bg-white/12">
          <div className="absolute inset-x-0 top-0 h-3 animate-sweep bg-signal" />
        </div>
      </div>
    </div>
  );
}
