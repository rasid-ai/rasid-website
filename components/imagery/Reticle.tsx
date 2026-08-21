'use client';

import { useEffect, useRef } from 'react';
import { cellRand } from '@/lib/utils/rng';

/**
 * Reticle — the targeting cursor over satellite imagery.
 *
 * Design constraints taken seriously: it must feel like an instrument, not a
 * gimmick. So it is small, monochrome, snaps to nothing, and its readout is
 * *plausible* — the values are derived from a hash of the hovered position, so
 * moving back to the same spot reports the same object. A random number that
 * changes on every mousemove is what makes this kind of cursor feel fake.
 *
 * Implementation: one rAF-coalesced transform write, no React state per move.
 * The label only rerenders when the hovered cell changes (a few times a second
 * at most), which is what keeps it cheap.
 */

type Scope = 'data' | 'map' | 'model';

interface Readout {
  title: string;
  rows: [string, string][];
}

/** Deterministic pseudo-detection for the hovered cell. */
function readoutFor(scope: Scope, cx: number, cy: number): Readout {
  const r = cellRand(cx, cy, 9001);
  const r2 = cellRand(cx, cy, 9002);
  const r3 = cellRand(cx, cy, 9003);

  if (scope === 'map') {
    if (r < 0.34) {
      return {
        title: 'Object detected',
        rows: [
          ['Type', 'Solar panel'],
          ['Confidence', `${(88 + r2 * 11).toFixed(0)}%`],
          ['Area', `${(120 + r3 * 780).toFixed(0)} m²`],
        ],
      };
    }
    return {
      title: 'Field',
      rows: [
        ['Area', `${(1.2 + r2 * 8.4).toFixed(1)} ha`],
        ['NDVI', (0.24 + r3 * 0.6).toFixed(2)],
      ],
    };
  }

  if (scope === 'model') {
    const labels = ['Cropland', 'Structure', 'Canopy', 'Bare soil', 'Solar array'];
    return {
      title: labels[Math.floor(r * labels.length)] ?? 'Segment',
      rows: [
        ['Confidence', `${(76 + r2 * 22).toFixed(0)}%`],
        ['Instance', `#${Math.floor(r3 * 8999 + 1000)}`],
      ],
    };
  }

  // Default: raw pixel inspection — appropriate to "Earth is data".
  return {
    title: 'Pixel',
    rows: [
      ['B04·B03·B02', `${(0.04 + r * 0.3).toFixed(3)}`],
      ['B08 (NIR)', `${(0.12 + r2 * 0.5).toFixed(3)}`],
      ['NDVI', (r3 * 0.82 - 0.05).toFixed(2)],
    ],
  };
}

export default function Reticle({ scope = 'data' }: { scope?: Scope }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const pending = useRef({ x: 0, y: 0, active: false });
  const lastCell = useRef('');

  useEffect(() => {
    const wrap = wrapRef.current;
    const cursor = cursorRef.current;
    const label = labelRef.current;
    const coord = coordRef.current;
    if (!wrap || !cursor) return;

    // The reticle covers its parent section.
    const host = wrap.parentElement;
    if (!host) return;
    host.classList.add('reticle-zone');

    const apply = () => {
      raf.current = 0;
      const { x, y, active } = pending.current;
      const rect = host.getBoundingClientRect();
      const lx = x - rect.left;
      const ly = y - rect.top;

      cursor.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      cursor.style.opacity = active ? '1' : '0';
      if (label) {
        // Flip the panel to the other side near the right/bottom edge so it
        // never leaves the section.
        const flipX = lx > rect.width - 190;
        const flipY = ly > rect.height - 120;
        label.style.transform = `translate(${flipX ? 'calc(-100% - 22px)' : '22px'}, ${
          flipY ? 'calc(-100% - 6px)' : '6px'
        })`;
      }

      // Quantise to a coarse lattice so the readout is stable while hovering.
      const cellSize = 44;
      const cx = Math.floor(lx / cellSize);
      const cy = Math.floor(ly / cellSize);
      const key = `${cx}:${cy}`;
      if (key !== lastCell.current && label) {
        lastCell.current = key;
        const data = readoutFor(scope, cx, cy);
        label.innerHTML = '';
        const title = document.createElement('div');
        title.className = 'text-[11px] font-medium tracking-wide text-chalk';
        title.textContent = data.title;
        label.appendChild(title);
        for (const [k, v] of data.rows) {
          const row = document.createElement('div');
          row.className = 'mt-1 flex items-baseline justify-between gap-4 font-mono text-[9px] uppercase tracking-widest';
          const kk = document.createElement('span');
          kk.className = 'text-graphite';
          kk.textContent = k;
          const vv = document.createElement('span');
          vv.className = 'text-signal';
          vv.textContent = v;
          row.append(kk, vv);
          label.appendChild(row);
        }
      }

      if (coord) {
        // Pseudo-coordinates that move sensibly with the pointer.
        const lat = 33.8938 + (0.5 - ly / rect.height) * 0.012;
        const lon = 35.5018 + (lx / rect.width - 0.5) * 0.014;
        coord.textContent = `${lat.toFixed(4)}°N  ${lon.toFixed(4)}°E`;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pending.current = { x: e.clientX, y: e.clientY, active: true };
      if (!raf.current) raf.current = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      pending.current.active = false;
      if (!raf.current) raf.current = requestAnimationFrame(apply);
    };

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.classList.remove('reticle-zone');
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [scope]);

  return (
    <div ref={wrapRef} aria-hidden className="pointer-events-none absolute inset-0 z-30">
      <div
        ref={cursorRef}
        className="absolute left-0 top-0 opacity-0 transition-opacity duration-200"
      >
        {/* the reticle mark: ⊕ built from vectors so it stays crisp */}
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <svg width="34" height="34" viewBox="0 0 34 34" className="block">
            <circle cx="17" cy="17" r="8.5" fill="none" stroke="rgb(var(--c-signal) / 0.85)" strokeWidth="1" />
            <circle cx="17" cy="17" r="1.4" fill="#7CFFE6" />
            <path
              d="M17 2.5 L17 8 M17 26 L17 31.5 M2.5 17 L8 17 M26 17 L31.5 17"
              stroke="rgb(var(--c-signal) / 0.7)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* contextual readout */}
        <div
          ref={labelRef}
          className="absolute left-0 top-0 min-w-[152px] border border-signal/25 bg-void/85 px-2.5 py-2 backdrop-blur-md"
        />

        {/* live coordinates */}
        <div
          ref={coordRef}
          className="absolute left-0 top-0 -translate-y-[26px] translate-x-[22px] whitespace-nowrap font-mono text-[9px] uppercase tracking-widest text-signal/70"
        />
      </div>
    </div>
  );
}
