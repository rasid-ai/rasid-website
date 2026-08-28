'use client';

import { useState } from 'react';
import { TEAM_SECTION as S } from '@/data/content';
import { trackSocialClick } from '@/lib/analytics';
import Reveal from '@/components/common/Reveal';

/**
 * Team — refined grid (1a).
 *
 * 3-up on desktop with a bigger heading. Each portrait shows the name below with
 * an emerald tick that grows under it (fully on hover). Hovering the portrait
 * fades the photo down and reveals a hover card: expertise tag, one-line bio and
 * LinkedIn / Email links. The row is flex-wrapped and centred so five members
 * read as 3-over-2 with the bottom pair centred (no dangling gap).
 */
const COMPANY_LINKEDIN = 'https://www.linkedin.com/company/rasid-ai/';
const COMPANY_EMAIL = 'info@rasid.ai';

export default function TeamSection() {
  return (
    <section id="team" className="relative w-full bg-void py-28 md:py-36" aria-label="Team">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <Reveal className="mx-auto mb-16 max-w-[46ch] text-center md:mb-24">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-signal/60" />
            <span className="label text-signal/90">{S.eyebrow}</span>
            <span className="h-px w-8 bg-signal/60" />
          </div>
          <h2 className="display text-[clamp(2.6rem,6.4vw,5.2rem)] leading-[0.95] text-chalk">{S.headline}</h2>
          <p className="mx-auto mt-6 max-w-[48ch] text-[1.05rem] leading-relaxed text-mist">{S.body}</p>
        </Reveal>

        {/* Flex-wrap + justify-center so 5 members read 3-over-2 with the bottom
            pair centred. Basis makes 2-up on mobile, 3-up from sm. */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-12 md:gap-x-7">
          {S.members.map((m, i) => (
            <Reveal
              key={`${m.name}-${i}`}
              delay={(i % 3) * 80}
              className="basis-[calc((100%-1.5rem)/2)] sm:basis-[calc((100%-3rem)/3)] md:basis-[calc((100%-3.5rem)/3)]"
            >
              <Member {...m} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Member({
  name,
  role,
  initials,
  photo,
  expertise,
  bio,
  linkedin,
  email,
}: {
  name: string;
  role: string;
  initials: string;
  photo?: string;
  expertise?: string;
  bio?: string;
  linkedin?: string;
  email?: string;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = photo && !photoFailed;
  const li = linkedin || COMPANY_LINKEDIN;
  const mail = email || COMPANY_EMAIL;

  return (
    <div className="group">
      {/* portrait well */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover object-top grayscale-[0.12] transition-all duration-700 ease-cinema group-hover:scale-[1.04] group-hover:opacity-25"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-signal/[0.06] font-mono text-[2.4rem] tracking-wide text-signal transition-opacity duration-500 group-hover:opacity-20">
            {initials}
          </span>
        )}

        {/* hover card — fades/rises in as the photo dims */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-5 opacity-0 transition-opacity duration-500 ease-cinema group-hover:opacity-100">
          {expertise && (
            <span className="mb-3 w-fit border border-signal/40 bg-signal/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-signal">
              {expertise}
            </span>
          )}
          {bio && <p className="text-[0.9rem] leading-relaxed text-chalk/90">{bio}</p>}
          <div className="pointer-events-auto mt-4 flex items-center gap-2">
            <a
              href={li}
              onClick={() => trackSocialClick('linkedin', { location: 'team', member: name })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} on LinkedIn`}
              className="flex h-8 w-8 items-center justify-center border border-white/15 text-chalk transition-colors duration-300 hover:border-signal hover:text-signal"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 21 11 21 14.1V21h-4v-6.1c0-1.45-.03-3.3-2-3.3s-2.3 1.57-2.3 3.2V21H9z" />
              </svg>
            </a>
            <a
              href={`mailto:${mail}`}
              aria-label={`Email ${name}`}
              className="flex h-8 w-8 items-center justify-center border border-white/15 text-chalk transition-colors duration-300 hover:border-signal hover:text-signal"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                <path d="m3.5 6.5 8.5 6 8.5-6" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* name + emerald tick + role */}
      <div className="mt-4">
        <div className="text-[1.05rem] font-medium tracking-tight text-chalk">{name}</div>
        <span className="mt-1.5 block h-px w-6 origin-left scale-x-100 bg-signal/70 transition-all duration-500 ease-cinema group-hover:w-12" />
        <div className="mt-2 text-[0.85rem] text-mist">{role}</div>
      </div>
    </div>
  );
}
