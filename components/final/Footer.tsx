'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { FOOTER, NAV, OFFICES } from '@/data/content';
import { socialPlatformFromHref, trackGoPilotClick, trackSocialClick } from '@/lib/analytics';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { convergeScroll } from '@/lib/story/anchorScroll';

/**
 * The footer.
 *
 * The only unpinned, un-choreographed section on the page — on purpose. The
 * narrative ended at FinalEarth; anything cinematic here would be a false ending
 * after the real one. So this is plain, quiet and useful: a wordmark, links, and
 * the two disclosures the page owes the reader.
 *
 * The one motion is a hairline that draws itself when the footer first appears,
 * which reads as the page closing rather than another act beginning.
 */
export default function Footer() {
  const ruleRef = useRef<HTMLSpanElement>(null);
  const { lenis } = useScrollContext();
  const pathname = usePathname();

  useEffect(() => {
    const el = ruleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transform = 'scaleX(1)';
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Anchor hrefs are '/#id'. On the home page we intercept and smooth-scroll to
  // the section; on other routes the browser navigates to '/#id' and the home
  // page lands on the hash (see ScrollProvider). External URLs and mailto: fall
  // through to normal navigation.
  const onAnchor = (href: string) => (e: React.MouseEvent) => {
    if (/^https?:\/\//.test(href)) return;
    const h = href.indexOf('#');
    if (h === -1) return; // real route (/services)
    const hash = href.slice(h);
    if (pathname === '/' && document.querySelector(hash)) {
      e.preventDefault();
      convergeScroll(lenis, hash);
    }
  };

  return (
    <footer className="relative w-full bg-void">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        {/* closing rule */}
        <div className="relative h-px w-full overflow-hidden bg-white/[0.05]">
          <span
            ref={ruleRef}
            aria-hidden
            className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-signal/40 via-signal/15 to-transparent transition-transform duration-[1400ms] ease-cinema"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 pb-10 pt-14 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))] md:pt-20">
          {/* brand */}
          <div className="col-span-2 md:col-span-1">
            <a
              href="/#top"
              onClick={onAnchor('/#top')}
              className="display inline-block text-[1.7rem] leading-none text-chalk transition-colors duration-500 hover:text-signal"
            >
              {FOOTER.brand}
            </a>
            <p className="mt-4 max-w-[18rem] text-[0.9rem] leading-relaxed text-mist">
              {FOOTER.tagline}
            </p>

            <a
              href={NAV.cta.href}
              onClick={(e) => {
                trackGoPilotClick('footer', { href: NAV.cta.href });
                onAnchor(NAV.cta.href)(e);
              }}
              {...(/^https?:\/\//.test(NAV.cta.href)
                ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                : {})}
              className="group mt-7 inline-flex items-center gap-2.5 border border-white/15 px-5 py-2.5 text-[12px] font-medium tracking-wide text-chalk transition-all duration-500 hover:border-signal/50 hover:text-signal"
            >
              {NAV.cta.label}
              <span
                aria-hidden
                className="transition-transform duration-500 ease-cinema group-hover:translate-x-1"
              >
                →
              </span>
            </a>

            {/* offices — France & Lebanon */}
            <p className="mt-7 text-[0.8rem] leading-relaxed text-graphite">
              {OFFICES.map((office, i) => (
                <span key={office.city}>
                  {i > 0 && <span aria-hidden className="mx-2 text-white/20">·</span>}
                  {office.city}, {office.country}
                </span>
              ))}
            </p>
          </div>

          {/* link columns */}
          {FOOTER.columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="label-sm text-graphite">{col.title}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {/* In-page anchors smooth-scroll; external URLs (LinkedIn)
                        open in a new tab; mailto: hands off to the mail client. */}
                    <a
                      href={link.href}
                      onClick={(e) => {
                        const platform = socialPlatformFromHref(link.href);
                        if (platform) trackSocialClick(platform, { location: 'footer', href: link.href });
                        onAnchor(link.href)(e);
                      }}
                      {...(/^https?:\/\//.test(link.href)
                        ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                        : {})}
                      className="group inline-flex text-[0.9rem] text-mist transition-colors duration-300 hover:text-chalk"
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-signal/60 transition-transform duration-500 ease-cinema group-hover:scale-x-100"
                        />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* disclosures */}
        <div className="flex flex-col gap-3 border-t border-white/[0.05] py-7 text-[11px] tracking-wide text-graphite md:flex-row md:items-center md:justify-between">
          <span>{FOOTER.legal}</span>
          <span className="font-mono uppercase tracking-wider">{FOOTER.note}</span>
        </div>
      </div>
    </footer>
  );
}
