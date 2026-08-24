'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GOPILOT_STUDIO as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * GoPilot use-case studio — the interactive landing feature.
 *
 * A defined panel with three zones, left → right:
 *   1. use-case buttons (pick a question)
 *   2. GoPilot "thinking" — the question, then the plan ticking through
 *   3. the result — imagery + result overlay + stats
 *
 * Picking a case (re)plays a short thinking sequence, then reveals the result.
 * Not scroll-driven — it's a normal section, so it's light and works anywhere
 * (also used on /products). Only the first case has real imagery today; the
 * rest show a labelled placeholder until assets/stats are dropped in.
 */
type UseCase = (typeof S.cases)[number];

export default function GoPilotStudio() {
  const [activeId, setActiveId] = useState<string>(S.cases[0].id);
  const [phase, setPhase] = useState<'thinking' | 'done'>('thinking');
  const [step, setStep] = useState(0);
  const active: UseCase = S.cases.find((c) => c.id === activeId) ?? S.cases[0];

  // Drive the thinking → done sequence whenever the active case changes.
  useEffect(() => {
    setPhase('thinking');
    setStep(0);
    const steps = active.steps;
    const timers: number[] = [];
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < steps.length) {
        setStep(i);
        timers.push(window.setTimeout(tick, 460));
      } else {
        timers.push(window.setTimeout(() => setPhase('done'), 420));
      }
    };
    timers.push(window.setTimeout(tick, 520));
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <section id="gopilot" className="relative w-full overflow-hidden bg-void py-24 md:py-32" aria-label="GoPilot">
<div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10">
        <Reveal className="mx-auto mb-12 max-w-[52ch] text-center md:mb-16">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display text-[clamp(2.2rem,5.4vw,4.4rem)] leading-[1.0] text-chalk">{S.headline}</h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-mist">{S.body}</p>
          <Link
            href="/products"
            className="group mt-6 inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-signal transition-colors duration-300 hover:text-signal-bright"
          >
            See All Products
            <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>

        {/* the studio panel */}
        <Reveal delay={100}>
          <div
            data-scene="dark"
            className="brackets grid grid-cols-1 gap-px overflow-hidden border border-white/[0.08] bg-white/[0.06] lg:grid-cols-[236px_300px_1fr] lg:gap-px"
          >
            {/* 1 · use-case buttons */}
            <div className="bg-void p-3 md:p-4">
              <div className="label-sm mb-3 px-2 text-graphite">Use cases</div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
                {S.cases.map((c) => {
                  const on = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={[
                        'group shrink-0 whitespace-nowrap border px-3.5 py-2.5 text-left transition-all duration-300 lg:w-full lg:whitespace-normal',
                        on
                          ? 'border-signal/50 bg-signal/[0.08]'
                          : 'border-white/[0.06] bg-transparent hover:border-white/15',
                      ].join(' ')}
                    >
                      <span className={['block text-[13px] font-medium tracking-tight', on ? 'text-signal' : 'text-chalk'].join(' ')}>
                        {c.title}
                      </span>
                      <span className="mt-0.5 hidden text-[11px] text-graphite lg:block">{c.place}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2 · GoPilot thinking */}
            <div className="flex min-h-[360px] flex-col bg-void p-4 md:p-5">
              <ChatThinking active={active} phase={phase} step={step} />
            </div>

            {/* 3 · result */}
            <div className="relative min-h-[360px] bg-ink lg:min-h-[520px]">
              <ResultStage active={active} phase={phase} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** The middle zone: the question, then the plan ticking through. */
function ChatThinking({ active, phase, step }: { active: UseCase; phase: 'thinking' | 'done'; step: number }) {
  const done = phase === 'done';
  return (
    <>
      {/* header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-chalk">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-signal/40 bg-signal/10 text-[9px] text-signal">◇</span>
          GoPilot
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-graphite">
          {done ? 'complete' : 'thinking'}
          <span className={done ? 'text-signal' : ''}>{done ? ' ✓' : '…'}</span>
        </span>
      </div>

      {/* user question */}
      <div className="mb-5">
        <div className="label-sm mb-1.5 text-graphite">You</div>
        <p className="text-[0.95rem] leading-snug text-chalk">{active.question}</p>
      </div>

      {/* plan */}
      <div className="label-sm mb-2.5 text-graphite">Plan</div>
      <ol className="space-y-2.5">
        {active.steps.map((s, i) => {
          const state = done || i < step ? 'done' : i === step ? 'active' : 'pending';
          return (
            <li key={s} className="flex items-center gap-2.5">
              <StepDot state={state} />
              <span
                className={[
                  'text-[0.85rem] transition-colors duration-300',
                  state === 'pending' ? 'text-graphite' : state === 'active' ? 'text-chalk' : 'text-chalk/70',
                ].join(' ')}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[10px] uppercase tracking-wider text-graphite">
          <span>{active.model}</span>
          <span>{active.source}</span>
        </div>
      </div>
    </>
  );
}

function StepDot({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-signal/50 bg-signal/15">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
          <path d="M2.6 6.2 4.9 8.5 9.4 3.6" fill="none" stroke="rgb(var(--c-signal))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-signal/40" />
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-signal" />
      </span>
    );
  }
  return <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/10" />;
}

/** The right zone: imagery base + result overlay reveal + stats, or a placeholder. */
function ResultStage({ active, phase }: { active: UseCase; phase: 'thinking' | 'done' }) {
  const done = phase === 'done';
  const [baseOk, setBaseOk] = useState(false);
  const [resultOk, setResultOk] = useState(false);

  // Preload imagery per case (so a missing file never flashes broken).
  useEffect(() => {
    setBaseOk(false);
    setResultOk(false);
    let live = true;
    if (active.base) {
      const im = new window.Image();
      im.onload = () => live && setBaseOk(true);
      im.src = active.base;
    }
    if (active.result) {
      const im = new window.Image();
      im.onload = () => live && setResultOk(true);
      im.src = active.result;
    }
    return () => {
      live = false;
    };
  }, [active.base, active.result]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* grey plate */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(150% 120% at 30% 20%, #2b3330 0%, #212926 45%, #171d1b 100%)' }} />

      {/* satellite base */}
      {baseOk && active.base && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={active.base}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover will-transform"
          style={{
            // "analyzing" → sharpen into focus: blurred + dim while thinking,
            // crisp when done. Slight scale so the blur doesn't reveal edges.
            filter: done ? 'none' : 'blur(14px) brightness(0.6)',
            transform: done ? 'none' : 'scale(1.06)',
            transition: 'filter 800ms ease, transform 800ms ease',
          }}
        />
      )}

      {/* result overlay — fades in when done */}
      {resultOk && active.result && (
        <>
          <div aria-hidden className="absolute inset-0 bg-void transition-opacity duration-1000" style={{ opacity: done ? 0.35 : 0 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.result}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{ opacity: done ? 0.92 : 0 }}
          />
        </>
      )}

      {/* no-imagery placeholder label */}
      {!(baseOk && active.base) && !(resultOk && active.result) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal/40">{active.title}</span>
        </div>
      )}

      {/* chrome */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-signal/90">
          <span className={['h-1.5 w-1.5 rounded-full', done ? 'bg-signal' : 'animate-pulse bg-signal/70'].join(' ')} />
          {active.place || 'GoPilot'}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-chalk/40">{active.source}</span>
      </div>

      {/* result panel — appears when done */}
      <div
        className="absolute bottom-3 right-3 z-10 w-[min(220px,60%)] border border-signal/30 bg-void/85 p-3 backdrop-blur-sm transition-all duration-700"
        style={{ opacity: done ? 1 : 0, transform: done ? 'none' : 'translateY(8px)' }}
      >
        <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-signal">
          <span className="h-1 w-1 rounded-full bg-signal" /> {active.resultTitle}
        </div>
        <dl className="space-y-1.5">
          {active.stats.map((s) => (
            <div key={s.k} className="flex items-center justify-between gap-4 text-[11px]">
              <dt className="text-graphite">{s.k}</dt>
              <dd className="font-mono tabular-nums text-chalk/90">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
