'use client';

import { useEffect, useState } from 'react';
import { CONTACT_SECTION as S, OFFICES } from '@/data/content';
import { socialPlatformFromHref, trackSocialClick } from '@/lib/analytics';
import Reveal from '@/components/common/Reveal';

/**
 * Contact — a booking embed plus direct channels. When CONTACT_BOOKING_URL is
 * set (Calendly or similar) it renders the scheduler inline; until then it shows
 * the channels and a "book by email" fallback so the section is always useful.
 */
export default function ContactSection() {
  const hasBooking = !!S.bookingUrl;

  return (
    <section id="contact" className="relative w-full overflow-hidden bg-void py-28 md:py-36" aria-label="Contact">

      <div className="relative mx-auto grid max-w-[1200px] items-start gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
        {/* left: copy + channels */}
        <div>
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal/60" />
              <span className="label text-signal/90">{S.eyebrow}</span>
            </div>
            <h2 className="display text-[clamp(2.2rem,5.4vw,4.4rem)] text-chalk">{S.headline}</h2>
            <p className="mt-6 max-w-[42ch] text-[1rem] leading-relaxed text-mist">{S.body}</p>
          </Reveal>

          <Reveal delay={100}>
            <ul className="mt-10 space-y-4">
              {S.channels.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    onClick={() => {
                      const platform = socialPlatformFromHref(c.href);
                      if (platform) trackSocialClick(platform, { location: 'contact', href: c.href });
                    }}
                    {...(/^https?:\/\//.test(c.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-center justify-between border-b border-white/[0.08] pb-4 transition-colors duration-300 hover:border-signal/40"
                  >
                    <span className="label-sm text-graphite">{c.label}</span>
                    <span className="flex items-center gap-2 text-[0.98rem] text-chalk transition-colors group-hover:text-signal">
                      {c.value}
                      <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* offices — RASID is based in France and Lebanon */}
          <Reveal delay={150}>
            <div className="mt-12">
              <span className="label-sm text-graphite">Offices</span>
              <div className="mt-5 grid gap-8 sm:grid-cols-2">
                {OFFICES.map((office) => (
                  <address key={office.city} className="not-italic">
                    <div className="label text-signal/90">{office.city}</div>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-mist">
                      {office.lines.map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                  </address>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* right: booking */}
        <Reveal delay={120}>
          {hasBooking ? (
            <BookingEmbed url={S.bookingUrl} />
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center border border-white/[0.1] bg-white/[0.015] p-10 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-signal/30 bg-signal/[0.06] text-signal">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="4.5" width="18" height="16" rx="1.5" />
                  <path d="M3 9h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-[1.05rem] font-medium text-chalk">Book a call</div>
              <p className="mt-2 max-w-[32ch] text-[0.9rem] leading-relaxed text-mist">
                Scheduling opens here shortly. In the meantime, email us and we’ll set up a time.
              </p>
              <a
                href="mailto:info@rasid.ai?subject=Booking a call with RASID"
                className="group mt-6 inline-flex items-center gap-2.5 bg-chalk px-6 py-3 text-[12px] font-medium tracking-wider text-void transition-colors duration-500 hover:bg-signal"
              >
                Email to book
                <span aria-hidden className="transition-transform duration-500 ease-cinema group-hover:translate-x-1">→</span>
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Calendly booking embed.
 *
 * The scheduler is a heavy third-party SPA we can't speed up, so we minimise the
 * time the reader stares at a blank frame:
 *  - `preconnect` to Calendly the moment this section mounts. It's a lazily-
 *    mounted section (~0.9 screens before it enters view), so the DNS lookup +
 *    TLS handshake happen well ahead of the iframe request — no cold connection.
 *  - the iframe loads eagerly on mount (not `loading="lazy"`), for the same
 *    head-start reason, so Calendly is usually booted by the time it's on screen.
 *  - a skeleton shows until `onLoad`, and the frame fades in, so any residual
 *    wait reads as intentional rather than broken.
 */
function BookingEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const hosts = ['https://calendly.com', 'https://assets.calendly.com'];
    const links = hosts.map((href) => {
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      l.crossOrigin = 'anonymous';
      document.head.appendChild(l);
      return l;
    });
    return () => links.forEach((l) => l.remove());
  }, []);

  return (
    <div className="relative h-[640px] overflow-hidden border border-white/[0.1] bg-white/[0.015]">
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-mist">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-signal" />
          <span className="label-sm">Loading scheduler…</span>
        </div>
      )}
      <iframe
        src={url}
        title="Book a call with RASID"
        className={[
          'h-full w-full transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
