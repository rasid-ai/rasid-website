'use client';

import { useCallback, useState } from 'react';
import { USE_CASES } from '@/data/content';
import { CASE_CHANNELS } from '@/lib/story/store';
import UseCaseSection from './UseCaseSection';
import Agriculture from './Agriculture';
import Solar from './Solar';
import Urban from './Urban';

/**
 * Act VI — three questions, answered.
 *
 * Each case is a pinned viewport of its own with its own scroll channel, so the
 * three read as chapters rather than a list. They deliberately share the
 * `UseCaseSection` shell (see its notes) and differ only in the analysis their
 * plate performs — which is the argument this act is making: one platform, three
 * questions.
 *
 * Order matters. Agriculture introduces two-epoch comparison, Energy re-runs a
 * model the visitor has already seen at regional scale, Urban combines both. By
 * the third the layout is invisible and only the finding is left.
 */
export default function UseCases() {
  return (
    <>
      <Case index={0}>
        {(p) => <Agriculture progress={p} />}
      </Case>
      <Case index={1}>
        {(p) => <Solar progress={p} />}
      </Case>
      <Case index={2}>
        {(p) => <Urban progress={p} />}
      </Case>
    </>
  );
}

/**
 * One case.
 *
 * The analysis progress is held in state here rather than pushed imperatively:
 * the plates drive SVG/canvas overlays whose geometry depends on it, so they need
 * to render. The value is quantised to 1% steps before it reaches state, which
 * caps the rerender rate at ~100 across the whole section — cheap, because the
 * WebGL panel underneath is never part of that rerender (it reads its own state
 * through a ref).
 */
function Case({
  index,
  children,
}: {
  index: 0 | 1 | 2;
  children: (progress: number) => React.ReactNode;
}) {
  const [p, setP] = useState(0);

  const onAnalysis = useCallback((next: number) => {
    setP((prev) => {
      const q = Math.round(next * 100) / 100;
      return q === prev ? prev : q;
    });
  }, []);

  const data = USE_CASES[index];

  return (
    <UseCaseSection data={data} channel={CASE_CHANNELS[index]} onAnalysis={onAnalysis}>
      {children(p)}
    </UseCaseSection>
  );
}
