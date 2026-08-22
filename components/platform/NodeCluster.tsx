'use client';

import { useEffect, useRef, useState } from 'react';
import { clamp, range, smootherstep } from '@/lib/utils/math';
import type { Capabilities } from '@/lib/hooks/useCapabilities';
import type { NodeDef } from './NetworkCanvas';
import { NETWORK_GEOM } from './geom';

/**
 * NodeCluster — the four tool families, as real text.
 *
 * The edges and packets are canvas; the *content* is DOM. That split is
 * deliberate: tool names are the substance of this section, so they need to be
 * selectable, searchable and readable by a screen reader — not pixels.
 *
 * Positions are computed from the same geometry function the canvas uses
 * (lib-local `NETWORK_GEOM`), measured off this container, so a label can never
 * drift away from the edge that points at it.
 *
 * Orientation follows the node's angle: branches that leave vertically get a
 * wrapped row of tools (vertical space is the scarce axis); branches that leave
 * horizontally get a column, aligned away from the centre.
 */
export default function NodeCluster({
  nodes,
  progress,
  caps,
}: {
  nodes: readonly NodeDef[];
  progress: number;
  caps: Capabilities;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const r = host.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const g = NETWORK_GEOM(box.w, box.h, caps.mobile);

  return (
    <div ref={hostRef} className="relative h-full w-full">
      {box.w > 0 &&
        nodes.map((node, i) => {
          const a = (node.angle * Math.PI) / 180;
          const ex = g.cx + Math.cos(a) * g.rx;
          const ey = g.cy + Math.sin(a) * g.ry;
          const vertical = Math.abs(Math.sin(a)) >= Math.abs(Math.cos(a));
          const outX = Math.sign(Math.round(Math.cos(a) * 1000)) || 0;
          const outY = Math.sign(Math.round(Math.sin(a) * 1000)) || 0;
          const pad = caps.mobile ? 18 : 26;

          return (
            <Branch
              key={node.id}
              node={node}
              index={i}
              progress={progress}
              compact={!!caps.mobile}
              vertical={vertical}
              style={{
                left: ex + outX * pad,
                top: ey + outY * pad,
                transform: vertical
                  ? `translate(-50%, ${outY > 0 ? '0' : '-100%'})`
                  : `translate(${outX > 0 ? '0' : '-100%'}, -50%)`,
                textAlign: vertical ? 'center' : outX > 0 ? 'left' : 'right',
                maxWidth: vertical
                  ? Math.min(box.w - 32, caps.mobile ? 300 : 520)
                  : caps.mobile ? 132 : 200,
              }}
            />
          );
        })}
    </div>
  );
}

function Branch({
  node,
  index,
  progress,
  compact,
  vertical,
  style,
}: {
  node: NodeDef;
  index: number;
  progress: number;
  compact: boolean;
  vertical: boolean;
  style: React.CSSProperties;
}) {
  // Node resolves as its edge finishes extending; tools populate after.
  const resolve = smootherstep(clamp(range(progress, 0.2 + index * 0.055, 0.4 + index * 0.055)));
  const listBase = 0.36 + index * 0.05;
  const active = clamp(range(progress, 0.56, 0.68));

  // On small screens only the first few tools are listed — the point is the
  // shape of the capability, and four names make it as well as five.
  const items = compact ? node.items.slice(0, 3) : node.items;

  return (
    <div
      className="absolute will-transform"
      style={{
        ...style,
        opacity: resolve,
      }}
    >
      <div
        className={[
          'flex flex-col gap-2',
          vertical ? 'items-center' : style.textAlign === 'right' ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        {/* label */}
        <div className="flex items-center gap-2">
          <span
            className="h-1 w-1 rounded-full bg-signal"
            style={{ opacity: 0.4 + active * 0.6 }}
          />
          <span
            className={[
              'font-medium tracking-tight text-chalk',
              compact ? 'text-[12px]' : 'text-[13.5px]',
            ].join(' ')}
          >
            {node.label}
          </span>
          <span className="font-mono text-[9px] tabular-nums text-graphite">
            {String(node.items.length).padStart(2, '0')}
          </span>
        </div>

        {/* tools */}
        <ul
          className={[
            vertical
              ? 'flex flex-wrap justify-center gap-x-3 gap-y-1.5'
              : 'flex flex-col gap-1.5',
            style.textAlign === 'right' ? 'items-end' : vertical ? '' : 'items-start',
          ].join(' ')}
        >
          {items.map((item, j) => {
            const reveal = smootherstep(clamp(range(progress, listBase + j * 0.026, listBase + j * 0.026 + 0.1)));
            if (reveal <= 0.001) return <li key={item} className="hidden" />;
            return (
              <li
                key={item}
                className="flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  opacity: reveal * (0.62 + active * 0.38),
                  transform: `translate3d(${vertical ? 0 : (style.textAlign === 'right' ? 1 : -1) * (1 - reveal) * 10}px, ${vertical ? (1 - reveal) * 6 : 0}px, 0)`,
                }}
              >
                <span
                  aria-hidden
                  className="h-px w-2 shrink-0 bg-signal/50"
                  style={{ order: style.textAlign === 'right' ? 2 : 0 }}
                />
                <span
                  className={[
                    'font-mono uppercase tracking-[0.12em] text-mist',
                    compact ? 'text-[9px]' : 'text-[10px]',
                  ].join(' ')}
                >
                  {item}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
