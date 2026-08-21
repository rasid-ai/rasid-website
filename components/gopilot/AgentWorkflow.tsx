'use client';

/**
 * AgentWorkflow — the agent's plan, executing.
 *
 * `beat` is a fractional step index (0→5). Each row derives its own state from
 * it, which means the whole component is a pure function of scroll position:
 * scrub back and steps un-complete, exactly as they should.
 *
 * Deliberately restrained: a rail, a state dot, a label, a technical detail
 * line. No cards, no shadows, no bouncing. It should read like a task log from
 * a real system.
 */

export interface Step {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

export default function AgentWorkflow({
  steps,
  beat,
  compact,
}: {
  steps: readonly Step[];
  beat: number;
  compact?: boolean;
}) {
  return (
    <div className="glass relative">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
        <span className="label">Workflow</span>
        <span className="label-sm tabular-nums">
          {Math.min(steps.length, Math.floor(beat))} / {steps.length}
        </span>
      </div>

      <ol className="relative px-3.5 py-3">
        {/* continuous rail behind the state dots */}
        <span
          aria-hidden
          className="absolute left-[calc(0.875rem+5px)] top-5 bottom-5 w-px bg-white/[0.08]"
        />
        {/* the rail fills as work completes */}
        <span
          aria-hidden
          className="absolute left-[calc(0.875rem+5px)] top-5 w-px origin-top bg-signal/50 transition-transform duration-300 ease-out"
          style={{
            bottom: '1.25rem',
            transform: `scaleY(${Math.min(1, Math.max(0, beat / steps.length))})`,
          }}
        />

        {steps.map((step, i) => {
          // Each step occupies one unit of `beat`.
          const local = beat - i;
          const running = local > 0 && local < 1;
          const complete = local >= 1;
          const pending = local <= 0;

          return (
            <li
              key={step.id}
              className="relative flex gap-3 py-[0.42rem] transition-opacity duration-300"
              style={{ opacity: pending ? 0.3 : 1 }}
              aria-current={running ? 'step' : undefined}
            >
              {/* state dot */}
              <span className="relative mt-[0.28rem] flex h-[11px] w-[11px] shrink-0 items-center justify-center">
                {complete ? (
                  <svg viewBox="0 0 12 12" className="h-[11px] w-[11px]">
                    <circle cx="6" cy="6" r="5.2" fill="none" stroke="rgb(var(--c-signal) / 0.85)" strokeWidth="1" />
                    <path
                      d="M3.6 6.2 L5.2 7.8 L8.5 4.4"
                      fill="none"
                      stroke="rgb(var(--c-signal))"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : running ? (
                  <>
                    <span className="absolute inset-0 rounded-full border border-signal/70" />
                    <span className="absolute inset-0 animate-ping rounded-full border border-signal/40" />
                    <span className="h-[3px] w-[3px] rounded-full bg-signal" />
                  </>
                ) : (
                  <span className="h-[7px] w-[7px] rounded-full border border-white/25" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={[
                      compact ? 'text-[0.8rem]' : 'text-[0.845rem]',
                      'tracking-tight',
                      complete ? 'text-chalk/70' : running ? 'text-chalk' : 'text-mist',
                    ].join(' ')}
                  >
                    {step.label}
                    {running && <span className="ml-1 text-signal">…</span>}
                  </span>
                  {complete && <span className="font-mono text-[10px] text-signal">✓</span>}
                </div>

                {/* technical detail — appears with the step, holds after */}
                <div
                  className="overflow-hidden transition-all duration-500 ease-cinema"
                  style={{
                    maxHeight: pending ? 0 : '1.4rem',
                    opacity: pending ? 0 : 1,
                  }}
                >
                  <div className="label-sm mt-0.5 truncate normal-case tracking-normal">
                    {step.detail}
                  </div>
                </div>

                {/* per-step progress hairline while running */}
                {running && (
                  <div className="mt-1.5 h-px w-full overflow-hidden bg-white/10">
                    <div
                      className="h-full w-full origin-left bg-signal/70"
                      style={{ transform: `scaleX(${local})` }}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
