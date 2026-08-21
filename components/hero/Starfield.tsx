'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getProgress, type Channel } from '@/lib/story/store';
import { makeRng } from '@/lib/utils/rng';
import { range, smootherstep } from '@/lib/utils/math';
import type { Tier } from '@/lib/hooks/useCapabilities';

/**
 * Starfield — a single Points draw call.
 *
 * Stars are placed on a large sphere with a magnitude distribution (many faint,
 * few bright) and slight colour temperature variation, because a uniform white
 * dot field is the fastest way to make space look cheap. During the dive they
 * wash out: atmosphere scatters daylight and stars disappear, which also hides
 * the moment the camera passes inside the atmospheric shell.
 */
export default function Starfield({
  count,
  tier,
  channel,
  mode,
}: {
  count: number;
  tier: Tier;
  channel: Channel;
  mode: 'hero' | 'final';
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const rng = makeRng(0x5eed);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Uniform on a sphere: acos of a uniform gives equal-area latitudes.
      const u = rng();
      const v = rng();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 120 + rng() * 60;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Magnitude: heavily skewed toward faint. pow(rng, 3.2) does that neatly.
      const mag = Math.pow(rng(), 3.2);
      size[i] = 0.35 + mag * 2.3;

      // Colour temperature — mostly white, some blue-white, a few warm.
      const tint = rng();
      if (tint > 0.86) c.setRGB(1, 0.82, 0.68);
      else if (tint > 0.62) c.setRGB(0.82, 0.88, 1);
      else c.setRGB(0.95, 0.97, 1);
      const b = 0.35 + mag * 0.75;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const p = getProgress(channel);
    const mat = matRef.current;
    if (!mat) return;
    if (mode === 'final') {
      mat.opacity = 0.85;
    } else {
      // Stars fade out as we descend into the atmosphere.
      mat.opacity = 0.9 * (1 - smootherstep(range(p, 0.4, 0.72)));
    }
    const pts = pointsRef.current;
    if (pts) {
      // Extremely slow drift — enough to feel alive, never enough to notice.
      pts.rotation.y = state.clock.elapsedTime * 0.0035;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        vertexColors
        size={tier === 'low' ? 0.55 : 0.42}
        sizeAttenuation={false}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
