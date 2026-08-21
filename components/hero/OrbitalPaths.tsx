'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getProgress, type Channel } from '@/lib/story/store';
import { range, smootherstep } from '@/lib/utils/math';
import type { Tier } from '@/lib/hooks/useCapabilities';

/**
 * OrbitalPaths — inclined orbital rings plus the satellites that ride them.
 *
 * Orbits use real-ish inclinations (sun-synchronous ~98°, an ISS-like 51.6°, a
 * near-equatorial) so the geometry reads as an actual constellation rather than
 * decorative rings. Satellites are small buses with panels and a faint sensor
 * cone pointed at nadir — the cone is what tells the viewer these things are
 * *looking* at the planet, which is the whole point of the section.
 *
 * The ring geometry is built as THREE.Line objects and mounted via <primitive>:
 * R3F's `line` intrinsic collides with SVG's `line` in JSX typing, and building
 * the objects directly is both type-safe and one less reconciliation layer.
 */

interface OrbitDef {
  radius: number;
  inclination: number; // degrees
  raan: number; // right ascension of ascending node, degrees
  speed: number;
  opacity: number;
}

const ORBITS: OrbitDef[] = [
  { radius: 1.34, inclination: 98.2, raan: 18, speed: 0.115, opacity: 0.5 }, // sun-synchronous
  { radius: 1.52, inclination: 51.6, raan: 122, speed: 0.088, opacity: 0.36 },
  { radius: 1.22, inclination: 8.5, raan: 264, speed: 0.15, opacity: 0.26 },
  { radius: 1.78, inclination: 74.0, raan: 205, speed: 0.062, opacity: 0.2 },
  { radius: 1.66, inclination: 28.5, raan: 61, speed: 0.072, opacity: 0.16 },
];

export default function OrbitalPaths({
  satellites,
  channel,
  mode,
  tier,
}: {
  satellites: number;
  channel: Channel;
  mode: 'hero' | 'final';
  tier: Tier;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const satRefs = useRef<(THREE.Group | null)[]>([]);

  const orbits = useMemo(() => ORBITS.slice(0, Math.max(2, satellites)), [satellites]);

  /** One THREE.Line per orbit, pre-transformed by inclination and RAAN. */
  const rings = useMemo(() => {
    const segments = tier === 'low' ? 96 : 192;
    return orbits.map((orbit) => {
      const pts = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts[i * 3] = Math.cos(a) * orbit.radius;
        pts[i * 3 + 1] = 0;
        pts[i * 3 + 2] = Math.sin(a) * orbit.radius;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x35e0c4,
        transparent: true,
        opacity: orbit.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      return { line, mat, geo, base: orbit.opacity };
    });
  }, [orbits, tier]);

  /* Satellite parts — shared geometry across all instances. */
  const parts = useMemo(() => {
    const bus = new THREE.BoxGeometry(0.017, 0.012, 0.013);
    const panel = new THREE.PlaneGeometry(0.052, 0.018);
    // Sensor footprint cone: apex at the bus, opening toward nadir (−Y).
    const cone = new THREE.ConeGeometry(0.05, 0.26, 18, 1, true);
    cone.translate(0, -0.13, 0);
    return { bus, panel, cone };
  }, []);

  const materials = useMemo(
    () => ({
      body: new THREE.MeshBasicMaterial({ color: 0xc8d4d8 }),
      panel: new THREE.MeshBasicMaterial({
        color: 0x18384a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      }),
      cone: new THREE.MeshBasicMaterial({
        color: 0x35e0c4,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    }),
    [],
  );

  useEffect(
    () => () => {
      rings.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });
      parts.bus.dispose();
      parts.panel.dispose();
      parts.cone.dispose();
      materials.body.dispose();
      materials.panel.dispose();
      materials.cone.dispose();
    },
    [rings, parts, materials],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = getProgress(channel);

    // Orbital infrastructure recedes as we dive past it, and returns in Act VIII.
    const vis =
      mode === 'final'
        ? smootherstep(range(p, 0.0, 0.45))
        : 1 - smootherstep(range(p, 0.3, 0.58));

    const g = groupRef.current;
    if (g) g.visible = vis > 0.01;
    rings.forEach((r) => {
      r.mat.opacity = r.base * vis;
    });

    orbits.forEach((orbit, i) => {
      const s = satRefs.current[i];
      if (!s) return;
      const a = t * orbit.speed + i * 2.4;
      // Position in the orbit's own plane; the parent group applies inclination.
      s.position.set(Math.cos(a) * orbit.radius, 0, Math.sin(a) * orbit.radius);
      // Point the sensor cone at nadir.
      s.lookAt(0, 0, 0);
      s.rotateX(Math.PI / 2); // the cone's −Y now faces the planet centre
      s.visible = vis > 0.02;
    });
  });

  return (
    <group ref={groupRef}>
      {orbits.map((orbit, i) => (
        <group
          key={i}
          rotation={[
            THREE.MathUtils.degToRad(orbit.inclination),
            THREE.MathUtils.degToRad(orbit.raan),
            0,
          ]}
        >
          <primitive object={rings[i]!.line} />

          <group
            ref={(el: THREE.Group | null) => {
              satRefs.current[i] = el;
            }}
          >
            <mesh geometry={parts.bus} material={materials.body} />
            <mesh geometry={parts.panel} material={materials.panel} />
            {tier !== 'low' && <mesh geometry={parts.cone} material={materials.cone} />}
          </group>
        </group>
      ))}
    </group>
  );
}
