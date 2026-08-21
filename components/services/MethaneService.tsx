'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { METHANE_SECTION as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * Environmental service — methane monitoring. The one service featured in the
 * landing story (the rest live on /services). Deliberately NOT scroll-pinned:
 * it's a Reveal section, so it stays off the per-frame budget and keeps the
 * total scroll shorter. The map reveals GoPilot's methane detection — a real
 * satellite base with a plume/column overlay wiped in on view.
 */
export default function MethaneService() {
  return (
    <section id="service" className="relative w-full overflow-hidden bg-void py-28 md:py-40" aria-label="Environmental service">

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
        {/* copy */}
        <div className="order-2 lg:order-1">
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{S.eyebrow}</span>
            </div>
            <h2 className="display text-[clamp(2rem,5vw,4rem)] leading-[1.02] text-chalk">{S.headline}</h2>
            <p className="mt-6 max-w-[40ch] text-[1rem] leading-relaxed text-mist">{S.body}</p>
          </Reveal>

          <Reveal delay={100}>
            <ul className="mt-9 space-y-3">
              {S.steps.map((step) => (
                <li key={step.id} className="flex items-baseline gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <span className="text-[0.95rem] text-chalk/90">
                    {step.label}
                    <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-graphite">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={180}>
            <Link
              href={S.cta.href}
              className="group mt-10 inline-flex items-center gap-2.5 border border-signal/40 px-6 py-3 text-[12px] font-medium tracking-wider text-signal transition-all duration-500 hover:border-signal hover:bg-signal hover:text-void"
            >
              {S.cta.label}
              <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>
        </div>

        {/* map */}
        <div className="order-1 lg:order-2">
          <Reveal delay={80}>
            <MethaneMap />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MethaneMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [baseFailed, setBaseFailed] = useState(false);
  const [overlayFailed, setOverlayFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          // small delay so the wipe reads as the model "running", not a load
          window.setTimeout(() => setRevealed(true), 250);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const edge = (revealed ? 1 : 0) * 114 - 7;
  const mask = `linear-gradient(to bottom, #000 ${edge}%, rgba(0,0,0,0) ${edge + 8}%)`;

  return (
    <div
      ref={ref}
      data-scene="dark"
      className="brackets relative aspect-[16/10] w-full overflow-hidden border border-white/[0.08] bg-ink"
    >
      {/* grey plate / fallback (shows until the real base scene is dropped in) */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(150% 120% at 30% 20%, #33403b 0%, #29332f 42%, #1d2422 100%)' }} />

      {/* satellite base */}
      {!baseFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={S.baseImage}
          alt=""
          aria-hidden
          decoding="async"
          onError={() => setBaseFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* methane plume / column overlay, wiped in on reveal */}
      {!overlayFailed && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
          <div className="absolute inset-0 bg-void" style={{ opacity: revealed ? 0.35 : 0, transition: 'opacity 1200ms ease' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={S.overlayImage}
            alt=""
            decoding="async"
            onError={() => setOverlayFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0.92, WebkitMaskImage: mask, maskImage: mask, transition: 'mask-image 1600ms ease, -webkit-mask-image 1600ms ease' }}
          />
        </div>
      )}

      {/* if there's no real overlay yet, a placeholder plume so it's not empty */}
      {overlayFailed && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            opacity: revealed ? 0.9 : 0.35,
            transition: 'opacity 1400ms ease',
            background:
              'radial-gradient(24% 30% at 58% 46%, rgba(255,64,54,0.6) 0%, rgba(255,150,40,0.42) 34%, rgba(90,200,255,0.24) 60%, transparent 76%)',
          }}
        />
      )}

      {/* chrome */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-signal/90">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" /> Methane · Live
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-chalk/40">{S.source}</span>
        </div>
      </div>

      {/* result badge */}
      <div
        className="absolute bottom-3 right-3 z-20 border border-signal/30 bg-void/85 p-3 backdrop-blur-sm transition-all duration-700"
        style={{ opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(8px)' }}
      >
        <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-signal">
          <span className="h-1 w-1 rounded-full bg-signal" /> {S.resultTitle}
        </div>
        <dl className="space-y-1.5">
          {S.stats.map((s) => (
            <div key={s.k} className="flex items-center justify-between gap-6 text-[11px]">
              <dt className="text-graphite">{s.k}</dt>
              <dd className="font-mono tabular-nums text-chalk/90">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

