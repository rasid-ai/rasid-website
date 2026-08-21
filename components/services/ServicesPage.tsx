'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SERVICES_PAGE as S } from '@/data/content';
import Reveal from '@/components/common/Reveal';

/**
 * /services — bespoke projects, presented as an editorial case-study list.
 *
 * Each service is a full-width row (image + description) separated by hairline
 * dividers; the image side alternates for rhythm. Images live at
 * public/services/<id>.webp — a labelled placeholder shows until they're added.
 * The navbar dropdown and footer anchor to each row via /services#<id>.
 */
export default function ServicesPage() {
  return (
    <div className="relative w-full bg-void">
      {/* header */}
      <section className="relative overflow-hidden px-6 pb-8 pt-32 md:px-10 md:pb-10 md:pt-44">
        <div className="relative mx-auto max-w-[1100px] text-center">
          <Reveal>
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{S.eyebrow}</span>
              <span className="h-px w-8 bg-signal/60" />
            </div>
            <h1 className="display text-[clamp(2.4rem,6vw,5rem)] leading-[1.02] text-chalk">{S.headline}</h1>
            <p className="mx-auto mt-6 max-w-[56ch] text-[1.05rem] leading-relaxed text-mist">{S.body}</p>
          </Reveal>
        </div>
      </section>

      {/* project rows */}
      <section className="relative mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="border-b border-white/[0.08]">
          {S.services.map((svc, i) => (
            <ProjectRow key={svc.id} svc={svc} flip={i % 2 === 1} />
          ))}
        </div>

        <Reveal delay={80} className="py-20 text-center md:py-28">
          <p className="mx-auto mb-7 max-w-[42ch] text-[1.05rem] text-mist">
            Have a project in mind? We scope bespoke work across every sector.
          </p>
          <Link
            href={S.cta.href}
            className="group inline-flex items-center gap-2.5 bg-chalk px-7 py-3.5 text-[13px] font-medium tracking-wide text-void transition-colors duration-500 hover:bg-signal"
          >
            {S.cta.label}
            <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}

function ProjectRow({
  svc,
  flip,
}: {
  svc: {
    id: string;
    name: string;
    summary: string;
    examples: string[];
    image: string;
    partner?: string;
  };
  flip: boolean;
}) {
  return (
    <article id={svc.id} className="scroll-mt-28 border-t border-white/[0.08] py-14 first:border-t-0 md:py-20">
      <Reveal>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          {/* media */}
          <div className={flip ? 'lg:order-2' : ''}>
            <ProjectImage src={svc.image} label={svc.name} />
          </div>

          {/* content */}
          <div className={flip ? 'lg:order-1' : ''}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-medium tracking-tight text-chalk">{svc.name}</h2>
              {svc.partner && (
                <span className="border border-signal/40 bg-signal/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-signal">
                  {svc.partner}
                </span>
              )}
            </div>
            <p className="max-w-[46ch] text-[1rem] leading-relaxed text-mist">{svc.summary}</p>
            <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {svc.examples.map((ex) => (
                <li key={ex} className="flex items-baseline gap-2.5 text-[0.9rem] leading-snug text-chalk/85">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </article>
  );
}

/** Representative image over an always-present labelled placeholder. The image
 *  is preloaded and only rendered once it actually loads, so a missing file
 *  never flashes a broken-image state — drop the real file in and it appears. */
function ProjectImage({ src, label }: { src: string; label: string }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let live = true;
    const im = new window.Image();
    im.onload = () => live && setOk(true);
    im.onerror = () => live && setOk(false);
    im.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  return (
    <div className="group/img relative aspect-[16/10] w-full overflow-hidden border border-white/[0.06] bg-ink">
      {/* base placeholder — always rendered underneath */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135% 120% at 25% 15%, rgb(var(--c-signal-deep) / 0.35) 0%, rgb(var(--c-ink)) 55%, rgb(var(--c-abyss)) 100%)',
        }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal/50">{label}</span>
      </div>

      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${label} project imagery`}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-cinema group-hover/img:scale-[1.03]"
        />
      )}
    </div>
  );
}
