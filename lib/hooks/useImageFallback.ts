'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Broken-image fallback that survives server rendering.
 *
 * `onError` alone is not enough for an <img> that ships in the server HTML: the
 * browser starts (and can finish) the request before React hydrates, so a 404
 * fires its error event with no handler attached and the reader is left with the
 * browser's broken-image glyph instead of our fallback.
 *
 * So this pairs the handler with a one-shot check on mount: a decoded image has
 * `naturalWidth > 0`, so `complete && naturalWidth === 0` means it already
 * failed before we got here.
 *
 * Usage:
 *   const { ref, failed, onError } = useImageFallback();
 *   return failed ? <Placeholder /> : <img ref={ref} onError={onError} ... />;
 */
export function useImageFallback() {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  const onError = useCallback(() => setFailed(true), []);

  return { ref, failed, onError };
}
