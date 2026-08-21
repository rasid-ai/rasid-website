'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getProgress, type Channel } from '@/lib/story/store';
import { range, smootherstep } from '@/lib/utils/math';
import { makeRng } from '@/lib/utils/rng';
import type { Tier } from '@/lib/hooks/useCapabilities';
import { OBSERVATION_SITES } from '@/data/sites';

/**
 * DataPoints — observation markers sitting on the globe.
 *
 * In the hero these are sparse and quiet: evidence that the planet is being
 * *measured*. In Act VIII they are dense and pulsing: the planet has been
 * analysed. Same component, different density and reveal curve, which is what
 * makes the loop legible.
 *
 * Points are a single additive Points draw with per-vertex phase, so the twinkle
 * costs one uniform update per frame rather than N object updates.
 */

/* Raw shaders — see the convention note in lib/webgl/glsl/earth.ts. No
   `#version` line here: Three prepends it for a rawShaderMaterial. */
const POINT_VERT = /* glsl */ `
precision highp float;
in vec3 position;
in float aPhase;
in float aScale;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uTime;
uniform float uReveal;
uniform float uSize;
out float vAlpha;
out float vKind;
void main(){
  // Back-face rejection: hide points on the far hemisphere.
  vec3 n = normalize(normalMatrix * normalize(position));
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 viewDir = normalize(-mv.xyz);
  float facing = smoothstep(-0.05, 0.28, dot(n, viewDir));

  // Staggered reveal: each point has its own threshold.
  float appear = smoothstep(aPhase * 0.85, aPhase * 0.85 + 0.15, uReveal);
  float twinkle = 0.65 + 0.35 * sin(uTime * 1.6 + aPhase * 42.0);

  vAlpha = facing * appear * twinkle;
  vKind = aScale;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * (1.0 + 0.35 * sin(uTime * 2.0 + aPhase * 30.0));
}
`;

const POINT_FRAG = /* glsl */ `
precision highp float;
in float vAlpha;
in float vKind;
out vec4 fragColor;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;
  // Small hard core + soft halo — reads as an instrument marker, not a blob.
  float core = 1.0 - smoothstep(0.10, 0.20, r);
  float halo = exp(-r * 7.0) * 0.55;
  float a = (core + halo) * vAlpha;
  vec3 c = mix(vec3(0.21, 0.88, 0.77), vec3(0.75, 1.0, 0.95), core);
  fragColor = vec4(c * a, a);
}
`;

export default function DataPoints({
  count,
  channel,
  mode,
  tier,
}: {
  count: number;
  channel: Channel;
  mode: 'hero' | 'final';
  tier: Tier;
}) {
  const geometry = useMemo(() => {
    const rng = makeRng(0xda7a);
    // Named sites first (real coordinates), then procedural fill.
    const sites = OBSERVATION_SITES;
    const total = mode === 'final' ? count : Math.min(count, Math.round(count * 0.4));
    const pos = new Float32Array(total * 3);
    const phase = new Float32Array(total);
    const scale = new Float32Array(total);

    for (let i = 0; i < total; i++) {
      let lat: number;
      let lon: number;
      let big = false;
      if (i < sites.length) {
        const s = sites[i]!;
        lat = s.lat;
        lon = s.lon;
        big = true;
      } else {
        // Land-biased scatter: cluster around named sites so points don't fall
        // uniformly into oceans (we have no land lookup on the CPU here).
        const anchor = sites[Math.floor(rng() * sites.length)]!;
        const spread = 26;
        lat = anchor.lat + (rng() - 0.5) * spread;
        lon = anchor.lon + (rng() - 0.5) * spread * 1.6;
        lat = Math.max(-78, Math.min(78, lat));
      }
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lon + 180) * Math.PI) / 180;
      const r = 1.004;
      pos[i * 3] = -r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      phase[i] = rng();
      scale[i] = big ? 1.5 + rng() * 0.5 : 0.5 + rng() * 0.6;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    return g;
  }, [count, mode]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: tier === 'low' ? 5 : 7 },
    }),
    [tier],
  );

  /* Constructed, not JSX: a `uniforms` prop is copied rather than adopted by
     R3F, so the per-frame writes below would never reach the GPU. Full
     explanation in components/hero/EarthScene.tsx. */
  const material = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms,
        glslVersion: THREE.GLSL3,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const p = getProgress(channel);
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uReveal.value =
      mode === 'final'
        ? smootherstep(range(p, 0.08, 0.72))
        : // In the hero, a few points are already present, then they fade as we
          // enter the atmosphere (they're an orbital-scale annotation).
          0.55 * smootherstep(range(p, 0.02, 0.2)) * (1 - smootherstep(range(p, 0.34, 0.55)));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
