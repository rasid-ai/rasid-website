'use client';

import { useMemo } from 'react';

/**
 * GoPilotChat — the natural-language surface.
 *
 * The typing is scroll-linked, not time-linked: `typed` is 0→1 from the parent's
 * progress, so scrubbing backwards un-types the question. That is the detail
 * that makes the whole section feel driven rather than played.
 *
 * Typing advances by whole characters (Math.floor) so the caret lands between
 * glyphs and never renders a half-character.
 */
export default function GoPilotChat({
  question,
  typed,
  compact,
}: {
  question: string;
  typed: number;
  compact?: boolean;
}) {
  const chars = Math.floor(typed * question.length);
  const shown = useMemo(() => question.slice(0, chars), [question, chars]);
  const done = chars >= question.length;

  return (
    <div className="glass relative">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* agent mark: a small aperture, not a chat bubble */}
          <span className="relative flex h-4 w-4 items-center justify-center">
            <svg viewBox="0 0 16 16" className="h-4 w-4">
              <circle cx="8" cy="8" r="6.4" fill="none" stroke="rgb(var(--c-signal) / 0.55)" strokeWidth="0.9" />
              <circle cx="8" cy="8" r="2.2" fill="rgb(var(--c-signal) / 0.9)" />
            </svg>
          </span>
          <span className="text-[12px] font-medium tracking-wide text-chalk">GoPilot</span>
          <span className="label-sm">Agent</span>
        </div>
        <span className="label-sm">MCP · 14 tools</span>
      </div>

      {/* the prompt */}
      <div className="px-3.5 py-3.5">
        <div className="label-sm mb-2">You</div>
        <div
          className={[
            'font-sans tracking-tight text-chalk',
            compact ? 'text-[0.95rem]' : 'text-[1.02rem]',
          ].join(' ')}
        >
          <span>{shown}</span>
          {/* caret: solid while typing, blinking once idle */}
          <span
            aria-hidden
            className={[
              'ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.16em] bg-signal',
              done ? 'animate-blink-caret' : '',
              typed <= 0.001 ? 'opacity-0' : 'opacity-100',
            ].join(' ')}
          />
        </div>

        {/* affordances that make it read as a real input, revealed once typed */}
        <div
          className="mt-3.5 flex items-center justify-between transition-opacity duration-500"
          style={{ opacity: done ? 1 : 0.25 }}
        >
          <div className="flex items-center gap-3">
            <span className="label-sm">⌘↵ Send</span>
            <span className="label-sm hidden sm:inline">Natural language</span>
          </div>
          <div
            className="flex items-center gap-1.5 transition-opacity duration-500"
            style={{ opacity: done ? 1 : 0 }}
          >
            <span className="label-sm text-signal/85">Planning</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 animate-pulse-slow rounded-full bg-signal"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
