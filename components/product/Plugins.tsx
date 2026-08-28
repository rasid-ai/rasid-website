'use client';

import { useState } from 'react';
import { PLUGINS_SECTION as S } from '@/data/content';
import { trackPluginDownload } from '@/lib/analytics';
import Reveal from '@/components/common/Reveal';

/**
 * §24 — QGIS + ArcGIS Pro. Two columns: a large media frame on the left (the
 * "opening ArcGIS Pro" video once handed — a screenshot stands in until then),
 * and the pitch + QGIS media + two links on the right.
 *
 * Media resolves from public/plugins/. Missing files fall back to a clean
 * labelled placeholder, so this looks intentional before the assets exist and
 * swaps to the real screenshot/video the moment a file is dropped in.
 */
function PluginMedia({
  img,
  video,
  label,
  caption,
  play,
}: {
  img: string;
  video?: string;
  label: string;
  caption: string;
  play?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = img && !failed;

  return (
    <figure className="brackets relative overflow-hidden border border-white/[0.1] bg-ink">
      <div className="relative aspect-[16/9]">
        {video ? (
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={caption}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // placeholder until the screenshot/video is added
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{
              background:
                'radial-gradient(70% 70% at 50% 40%, #101a1d 0%, transparent 70%), linear-gradient(180deg,#080d11,#0c1318)',
            }}
          >
            <span className="text-[1.05rem] font-medium tracking-tight text-chalk/80">{label}</span>
            <span className="label-sm text-graphite">media coming</span>
          </div>
        )}

        {play && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-void/40 backdrop-blur-sm">
              <span
                aria-hidden
                className="ml-1 h-0 w-0 border-y-[9px] border-l-[15px] border-y-transparent border-l-chalk"
              />
            </span>
          </span>
        )}
      </div>
      <figcaption className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-2.5">
        <span className="h-1 w-1 rounded-full bg-signal" />
        <span className="label-sm normal-case tracking-normal text-mist">{caption}</span>
      </figcaption>
    </figure>
  );
}

export default function Plugins() {
  const ext = (href: string) =>
    /^https?:\/\//.test(href) ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {};

  return (
    <section id="plugins" className="relative w-full bg-void py-28 md:py-40" aria-label="QGIS and ArcGIS Pro">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        {/* left: ArcGIS Pro media (video when handed) */}
        <Reveal>
          <PluginMedia
            img={S.primary.img}
            video={S.primary.video || undefined}
            label={S.primary.label}
            caption={S.primary.caption}
            play={!S.primary.video}
          />
        </Reveal>

        {/* right: pitch + QGIS media + links */}
        <Reveal delay={120}>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
          </div>
          <h2 className="display text-[clamp(2rem,4.6vw,3.6rem)] text-chalk">{S.headline}</h2>
          <p className="mt-5 max-w-[42ch] text-[0.98rem] leading-relaxed text-mist">{S.body}</p>

          <div className="mt-8">
            <PluginMedia
              img={S.secondary.img}
              video={S.secondary.video || undefined}
              label={S.secondary.label}
              caption={S.secondary.caption}
              play={!S.secondary.video}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {S.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => trackPluginDownload(l.label, l.href)}
                {...ext(l.href)}
                className={[
                  'group inline-flex items-center gap-2 px-5 py-3 text-[12px] font-medium tracking-wider transition-colors duration-500',
                  i === 0
                    ? 'bg-chalk text-void hover:bg-signal'
                    : 'border border-white/15 text-chalk hover:border-signal/50 hover:text-signal',
                ].join(' ')}
              >
                {l.label}
                <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">
                  →
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
