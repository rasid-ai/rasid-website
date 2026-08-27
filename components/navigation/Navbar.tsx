'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/data/content';
import { trackGoPilotClick } from '@/lib/analytics';
import { useScrollContext } from '@/lib/story/ScrollProvider';
import { convergeScroll } from '@/lib/story/anchorScroll';
import RasidMark from './RasidMark';

/**
 * Navbar — transparent at rest, condensing into a translucent bar on scroll.
 *
 * Structure: Products (dropdown) · Services (dropdown + /services page) ·
 * Pricing · Team · Contact Us. Anchor hrefs are written as '/#id' so a link
 * works from any route:
 *   - on the home page ('/') we intercept and smooth-scroll to the section
 *     (with a header-height offset, plus one delayed re-resolve so lazily
 *     mounted sections that shift the document don't leave us short);
 *   - from another route the browser navigates to '/#id' and the home page
 *     scrolls to the hash on load (see app/page hash handler).
 * Real routes (/services) use next/link for client navigation.
 */

const HEADER_OFFSET = -76; // clears the (uncondensed) bar so sections aren't hidden

export default function Navbar() {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null); // desktop dropdown
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);
  const { lenis } = useScrollContext();
  const pathname = usePathname();
  const frame = useRef(0);
  const hoverTimer = useRef(0);

  useEffect(() => {
    const read = () => {
      frame.current = 0;
      setCondensed(window.scrollY > 40);
    };
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // Body scroll lock while the mobile sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  /** Smooth-scroll to an in-page section, re-resolving as lazy sections mount. */
  const scrollToSection = (hash: string) => {
    convergeScroll(lenis, hash, HEADER_OFFSET);
  };

  /**
   * Click handler for any nav target. Returns nothing special for external URLs
   * and real routes (the <a>/<Link> navigates normally); intercepts '/#id' /
   * '#id' anchors on the home page to smooth-scroll.
   */
  const onNav = (href: string) => (e: React.MouseEvent) => {
    setMenuOpen(false);
    setOpenIdx(null);
    if (/^https?:\/\//.test(href)) return; // external — let it navigate
    const h = href.indexOf('#');
    if (h === -1) return; // real route (/services) — let Link navigate
    const hash = href.slice(h); // '#id'
    if (pathname === '/') {
      e.preventDefault();
      if (document.querySelector(hash)) scrollToSection(hash);
      else scrollToSection(hash); // reserved LazySection ids exist even pre-mount
    }
    // else: navigate to '/#id' and let the home page resolve the hash on load
  };

  const openDropdown = (idx: number) => {
    window.clearTimeout(hoverTimer.current);
    setOpenIdx(idx);
  };
  const closeDropdownSoon = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpenIdx(null), 120);
  };

  const ctaExternal = !NAV.cta.href.startsWith('#') && /^https?:\/\//.test(NAV.cta.href);
  const ctaExtraProps = ctaExternal
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <>
      <header
        className={[
          'fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-cinema',
          condensed
            ? 'border-b border-white/[0.06] bg-void/70 backdrop-blur-xl backdrop-saturate-150'
            : 'border-b border-transparent bg-transparent',
        ].join(' ')}
      >
        <nav
          className={[
            'mx-auto flex max-w-[1600px] items-center justify-between px-6 transition-all duration-700 ease-cinema md:px-10',
            condensed ? 'h-14' : 'h-20',
          ].join(' ')}
          aria-label="Primary"
        >
          {/* Brand */}
          <Link
            href="/"
            onClick={onNav('/#top')}
            className="group flex items-center gap-2.5"
            aria-label="RASID home"
          >
            <RasidMark
              className={[
                'w-auto transition-all duration-700 ease-cinema',
                condensed ? 'h-[20px]' : 'h-[26px]',
              ].join(' ')}
            />
            <span
              className={[
                'font-sans font-semibold leading-none tracking-[0.2em] text-chalk transition-all duration-700 ease-cinema',
                condensed ? 'text-[15px]' : 'text-[17px]',
              ].join(' ')}
            >
              {NAV.brand}
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 md:flex">
            {NAV.items.map((item, idx) => {
              const children = 'children' in item ? item.children : undefined;
              const href = 'href' in item ? item.href : undefined;
              return (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => children && openDropdown(idx)}
                  onMouseLeave={() => children && closeDropdownSoon()}
                >
                  <NavTop
                    label={item.label}
                    href={href}
                    hasChildren={!!children}
                    open={openIdx === idx}
                    onClick={href ? onNav(href) : undefined}
                    onFocus={() => children && openDropdown(idx)}
                  />
                  {children && (
                    <div
                      className={[
                        'absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-200',
                        openIdx === idx
                          ? 'pointer-events-auto translate-y-0 opacity-100'
                          : 'pointer-events-none translate-y-1 opacity-0',
                      ].join(' ')}
                    >
                      <div className="min-w-[248px] border border-white/[0.08] bg-void/95 p-2 backdrop-blur-xl">
                        {children.map((c) => (
                          <NavChild key={c.label} label={c.label} href={c.href} note={c.note} onClick={onNav(c.href)} />
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href={NAV.cta.href}
              onClick={(e) => {
                trackGoPilotClick('navbar', { href: NAV.cta.href });
                onNav(NAV.cta.href)(e);
              }}
              {...ctaExtraProps}
              className="group relative hidden overflow-hidden border border-signal/35 px-5 py-2 text-[12px] font-medium tracking-wider text-signal transition-colors duration-500 hover:text-void md:block"
            >
              <span className="relative z-10">{NAV.cta.label}</span>
              <span className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-cinema group-hover:scale-x-100" />
            </a>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span className={['h-px w-5 bg-chalk transition-all duration-400 ease-cinema', menuOpen ? 'translate-y-[3px] rotate-45' : ''].join(' ')} />
              <span className={['h-px w-5 bg-chalk transition-all duration-400 ease-cinema', menuOpen ? '-translate-y-[3px] -rotate-45' : ''].join(' ')} />
            </button>
          </div>
        </nav>

        {/* Progress hairline — always visible now, so readers can see how far the
            story runs (feedback #7), and it doubles as the scroll instrument. */}
        <ScrollProgressLine />
      </header>

      {/* Mobile sheet */}
      <div
        className={[
          'fixed inset-0 z-40 transition-[opacity,visibility] duration-500 md:hidden',
          menuOpen ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0',
        ].join(' ')}
        aria-hidden={!menuOpen}
      >
        <div
          className={['absolute inset-0 bg-void/92 backdrop-blur-2xl transition-opacity duration-500', menuOpen ? 'opacity-100' : 'opacity-0'].join(' ')}
          onClick={() => setMenuOpen(false)}
        />
        <nav className="relative flex h-full flex-col justify-center overflow-y-auto px-8 py-24">
          <ul className="space-y-1">
            {NAV.items.map((item, i) => {
              const children = 'children' in item ? item.children : undefined;
              const href = 'href' in item ? item.href : undefined;
              const expanded = mobileExpanded === i;
              return (
                <li
                  key={item.label}
                  className="overflow-hidden border-b border-white/[0.06]"
                  style={{ transitionDelay: `${menuOpen ? 80 + i * 55 : 0}ms` }}
                >
                  <div className="flex items-center justify-between">
                    {href ? (
                      <Link
                        href={href}
                        onClick={onNav(href)}
                        className={['block flex-1 py-4 text-[1.7rem] font-medium leading-none tracking-tight text-chalk transition-all duration-700 ease-cinema', menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'].join(' ')}
                        style={{ transitionDelay: `${menuOpen ? 80 + i * 55 : 0}ms` }}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={['block flex-1 py-4 text-[1.7rem] font-medium leading-none tracking-tight text-chalk transition-all duration-700 ease-cinema', menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'].join(' ')}
                        style={{ transitionDelay: `${menuOpen ? 80 + i * 55 : 0}ms` }}
                      >
                        {item.label}
                      </span>
                    )}
                    {children && (
                      <button
                        type="button"
                        onClick={() => setMobileExpanded(expanded ? null : i)}
                        aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        className="p-3 text-signal"
                      >
                        <span className={['block transition-transform duration-300', expanded ? 'rotate-45' : ''].join(' ')}>+</span>
                      </button>
                    )}
                  </div>
                  {children && (
                    <ul className={['overflow-hidden transition-all duration-400 ease-cinema', expanded ? 'max-h-72 pb-3' : 'max-h-0'].join(' ')}>
                      {children.map((c) => (
                        <li key={c.label}>
                          <Link
                            href={c.href}
                            onClick={onNav(c.href)}
                            className="block py-2.5 pl-1 text-[1rem] text-mist transition-colors hover:text-chalk"
                          >
                            {c.label}
                            {c.note && <span className="ml-2 text-[0.8rem] text-graphite">· {c.note}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <a
            href={NAV.cta.href}
            onClick={(e) => {
              trackGoPilotClick('navbar_mobile', { href: NAV.cta.href });
              onNav(NAV.cta.href)(e);
            }}
            {...ctaExtraProps}
            className={['mt-10 inline-flex w-fit items-center gap-3 border border-signal/40 px-6 py-3 text-[13px] tracking-wider text-signal transition-all duration-700 ease-cinema', menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'].join(' ')}
            style={{ transitionDelay: menuOpen ? '420ms' : '0ms' }}
          >
            {NAV.cta.label}
            <span aria-hidden>→</span>
          </a>
        </nav>
      </div>
    </>
  );
}

/** A top-level nav entry: a link (Services, Pricing…) or a hover trigger (Products). */
function NavTop({
  label,
  href,
  hasChildren,
  open,
  onClick,
  onFocus,
}: {
  label: string;
  href?: string;
  hasChildren: boolean;
  open: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onFocus?: () => void;
}) {
  const inner = (
    <>
      {label}
      {hasChildren && (
        <span aria-hidden className={['ml-1.5 inline-block text-[0.65em] transition-transform duration-300', open ? 'rotate-180' : ''].join(' ')}>
          ▾
        </span>
      )}
      <span className={['absolute -bottom-0.5 left-0 h-px bg-signal/70 transition-all duration-500 ease-cinema', open ? 'w-full' : 'w-0 group-hover:w-full'].join(' ')} />
    </>
  );
  const cls = 'group relative flex items-center py-1 text-[13px] font-normal tracking-tight text-mist transition-colors duration-300 hover:text-chalk';
  if (href) {
    return (
      <Link href={href} onClick={onClick} onFocus={onFocus} className={cls} aria-expanded={hasChildren ? open : undefined}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} onFocus={onFocus} className={cls} aria-expanded={open}>
      {inner}
    </button>
  );
}

/** A dropdown row: label + one-line note. */
function NavChild({ label, href, note, onClick }: { label: string; href: string; note?: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group block rounded-sm px-3 py-2.5 transition-colors duration-200 hover:bg-signal/[0.08]"
    >
      <span className="block text-[13px] font-medium text-chalk transition-colors group-hover:text-signal">{label}</span>
      {note && <span className="mt-0.5 block text-[11px] leading-snug text-graphite">{note}</span>}
    </Link>
  );
}

/** Thin document-progress rule under the navbar. */
function ScrollProgressLine() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = barRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-signal/40 via-signal to-signal/50"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
