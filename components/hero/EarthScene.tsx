'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ATMO_FRAGMENT,
  ATMO_VERTEX,
  EARTH_FRAGMENT,
  EARTH_VERTEX,
} from '@/lib/webgl/glsl/earth';
import { getLandTexture } from '@/lib/geo/landTexture';
import { useIsLight } from '@/lib/theme/useIsLight';
import { BUDGET, type Capabilities } from '@/lib/hooks/useCapabilities';
import { DIVE_TARGET, ORBIT_STAGES, getProgress, onProgress, type Channel } from '@/lib/story/store';
import {
  clamp,
  damp,
  degToRad,
  easeInOutCubic,
  latLonToVec3,
  range,
  smootherstep,
} from '@/lib/utils/math';
import Starfield from './Starfield';
import OrbitalPaths from './OrbitalPaths';
import DataPoints from './DataPoints';

/**
 * EarthScene — the hero planet and the camera that dives into it.
 *
 * Camera choreography (Act I). Altitudes are in Earth radii above the surface;
 * the planet has radius 1. The dive spans ~4 orders of magnitude, which is why
 * every interpolation below is done in log-altitude — linear interpolation of
 * distance would spend the entire scroll crossing the first thousand km and
 * then teleport the last hundred.
 *
 *   idle      alt 2.10  slow rotation, full planet in frame
 *   approach  alt 1.05  planet grows, rotation eases toward the target meridian
 *   target    alt 0.55  target hemisphere squarely framed, reticle locks
 *   dive      alt 0.006 descent; FOV narrows, motion blur-ish streaking
 *   surface   alt 0.0008 imagery regime; hands off to the flat panel
 *
 * The scene is also reused for Act VIII (`mode="final"`) with data layers on
 * and no dive — same shader, different uniforms, so the "return" genuinely is
 * the same planet.
 */

const R = 1;

/**
 * How far short of the dive target the idle rotation begins, in radians.
 *
 * Group rotation.y = s puts longitude −(90° + s) under the camera, so increasing
 * s walks the sub-camera point west — the same direction a prograde Earth moves
 * it. A positive lead therefore starts east of the target and closes on it.
 * 0.42 rad ≈ 24° of longitude ≈ 19 s of idle drift.
 */
const IDLE_LEAD = 0.42;

interface Props {
  caps: Capabilities;
  /** Story channel that drives this instance. */
  channel: Channel;
  mode?: 'hero' | 'final';
  /** Paused when off-screen. */
  active?: boolean;
  className?: string;
}

export default function EarthScene({
  caps,
  channel,
  mode = 'hero',
  active = true,
  className,
}: Props) {
  const budget = BUDGET[caps.tier];

  /* --- render gating: visibility-only -------------------------------------
     The Earth is a full-viewport fragment shader, so we don't want it drawing
     while the reader is elsewhere on the page. But it MUST keep drawing the
     whole time it's on screen: the hero globe idly rotates (an animation, not a
     scroll-scrub), and the dive is scrubbed frame-by-frame — so an idle-sleep
     timer froze the planet the moment you stopped scrolling. Instead we render
     continuously while the canvas intersects the viewport and stop when it
     leaves. The hero pins the canvas in view for the whole descent, so this
     covers both the idle spin at the top and the entire dive; once you scroll
     past into the product sections it goes off-screen and stops. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  // R3F's invalidate(), captured on create. We render in 'demand' mode and drive
  // frames ourselves (see the two effects below) rather than toggling R3F's
  // shared 'always'/'never' loop: that loop did NOT reliably restart after the
  // canvas scrolled off-screen and back, so the globe stayed frozen on its last
  // frame (only a reload fixed it). In 'demand' mode invalidate() always
  // schedules a frame, so scrolling — in either direction — or returning to view
  // reliably resumes rendering.
  const invalidateRef = useRef<(() => void) | null>(null);

  // Visibility gate for the idle-spin ticker (B) below.
  useEffect(() => {
    if (!active) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen((prev) => (prev === e.isIntersecting ? prev : e.isIntersecting)),
      { rootMargin: '2% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  /* (A) Scroll-driven frames. Any change on this story channel demands a render,
     in BOTH directions — this is what makes the reverse scroll work. It is
     independent of the visibility gate, so scrolling back into the hero from
     below revives the globe the instant the scrub resumes. */
  useEffect(() => {
    if (!active) return;
    return onProgress(channel, () => invalidateRef.current?.());
  }, [active, channel]);

  /* (B) Idle animation. The globe rotates on its own with no scroll input, so
     while it is on-screen we tick invalidate() on a RAF — throttled to 30fps at
     idle and 60fps once the dive is being scrubbed (the shader is fill-rate
     bound and the slow rotation is imperceptible above 30fps). Stopped while
     off-screen, so nothing renders there — the GPU saving the old gate intended,
     now without the freeze. */
  useEffect(() => {
    if (!active || !onScreen) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const p = getProgress(channel);
      const scrolling = mode === 'final' ? p > 0.01 : p > ORBIT_STAGES.idle[1];
      if (t - last < (scrolling ? 1000 / 60 : 1000 / 30)) return;
      last = t;
      invalidateRef.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, onScreen, channel, mode]);

  return (
    <div ref={wrapRef} className={className}>
      <Canvas
        /* We drive frames explicitly via invalidate() — see effects (A)/(B)
           above. 'demand' renders only when we ask, which is what fixed the
           off-screen freeze while keeping the off-screen GPU saving. */
        frameloop="demand"
        /* Same reasoning as ImageryPanel's maxDpr: the Earth fragment shader is
           the most expensive on the page and it covers most of the viewport, so
           fragment count is what decides whether the hero holds 60fps. MSAA is
           off everywhere too — the shader antialiases its own edges via fwidth,
           and the limb is the only hard geometric edge in frame. */
        dpr={caps.tier === 'low' ? [1, 1] : caps.tier === 'mid' ? [1, 1.1] : [1, 1.25]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 32, near: 0.0002, far: 400, position: [0, 0, 3.1] }}
        onCreated={({ gl, scene, invalidate }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.NoToneMapping; // the shader grades internally
          scene.matrixWorldAutoUpdate = true;
          invalidateRef.current = invalidate;
        }}
      >
        <Suspense fallback={null}>
          <SceneContents caps={caps} channel={channel} mode={mode} budget={budget} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function SceneContents({
  caps,
  channel,
  mode,
  budget,
}: {
  caps: Capabilities;
  channel: Channel;
  mode: 'hero' | 'final';
  budget: (typeof BUDGET)[keyof typeof BUDGET];
}) {
  const { camera, invalidate } = useThree();
  const light = useIsLight();
  const [landTex, setLandTex] = useState<THREE.CanvasTexture | null>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const atmoRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  /* --- land data texture (rasterised once, shared, disposed on unmount) --- */
  useEffect(() => {
    let live = true;
    let created: THREE.CanvasTexture | null = null;
    /* 1024 for every tier: this rasterises on the main thread at mount (a
       ~2M-px loop + blurs + getImageData), and at 2048 it was one of the worst
       load-blocking long tasks. It's a coastline *data* mask sampled on a globe
       — the shader synthesises biome, bathymetry and lights on top — so 1024 is
       visually identical to 2048 here while costing ~4× less to build. */
    getLandTexture(1024)
      .then(({ canvas }) => {
        if (!live) return;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.NoColorSpace; // it's data, not colour
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = 4;
        created = tex;
        setLandTex(tex);
        invalidate();
      })
      .catch((err: unknown) => {
        /* Vector data unavailable — the shader still renders ocean + clouds, so
           the page survives. But a silent fallback here looks identical to a
           correctly-rendered ocean-facing globe, which hides the single most
           damaging failure the scene has; say so out loud. */
        console.error('[EarthScene] land texture unavailable — globe will render without continents:', err);
      });
    return () => {
      live = false;
      created?.dispose();
    };
  }, [caps.tier, invalidate]);

  /* --- uniforms (stable object; mutated per frame, never recreated) ------ */
  const uniforms = useMemo(
    () => ({
      uLand: { value: null as THREE.Texture | null },
      uSunDir: { value: new THREE.Vector3(1, 0.28, 0.55).normalize() },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uAltitude: { value: mode === 'final' ? 1.4 : 2.1 },
      uTargetLL: { value: new THREE.Vector2(DIVE_TARGET.lon, DIVE_TARGET.lat) },
      uTargetGlow: { value: 0 },
      uGridOpacity: { value: mode === 'final' ? 0.5 : 0.28 },
      uDataOpacity: { value: 0 },
      uScanSweep: { value: -1 },
      uSurfaceMix: { value: 0 },
      uNightLights: { value: 1 },
      // surface.ts uniforms
      uSunAz: { value: 2.44 },
      uSunEl: { value: 0.62 },
      uSeedF: { value: 1337 },
      uDetail: { value: caps.tier === 'low' ? 0.4 : caps.tier === 'mid' ? 0.75 : 1 },
      uSharpen: { value: 1 },
    }),
    [caps.tier, mode],
  );

  const atmoUniforms = useMemo(
    () => ({
      uSunDir: { value: uniforms.uSunDir.value },
      uIntensity: { value: 1 },
    }),
    [uniforms.uSunDir.value],
  );

  /* --- materials are constructed here, NOT declared as JSX -----------------
     This looks less idiomatic than <rawShaderMaterial uniforms={…} /> and is
     deliberate. R3F does not assign a `uniforms` prop through: to keep a stable
     reference for the renderer it *copies* each holder into the material's own
     object (`uniforms[name] = {...uniform}` in applyProps). The object we then
     mutate every frame is therefore not the object that gets uploaded, so every
     write — uTime, uAltitude, uLand — is silently discarded and the globe
     renders one dead frame of initial values. Owning the material means our
     uniform holders *are* the ones the renderer reads. */
  const earthMat = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        vertexShader: EARTH_VERTEX,
        fragmentShader: EARTH_FRAGMENT,
        uniforms,
        glslVersion: THREE.GLSL3,
      }),
    [uniforms],
  );

  const atmoMat = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        vertexShader: ATMO_VERTEX,
        fragmentShader: ATMO_FRAGMENT,
        uniforms: atmoUniforms,
        glslVersion: THREE.GLSL3,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [atmoUniforms],
  );

  useEffect(
    () => () => {
      earthMat.dispose();
      atmoMat.dispose();
    },
    [earthMat, atmoMat],
  );

  useEffect(() => {
    uniforms.uLand.value = landTex;
  }, [landTex, uniforms]);

  /* --- geometry: one shared sphere, tessellation by tier ---------------- */
  const sphereGeo = useMemo(
    () => new THREE.SphereGeometry(R, budget.sphereSeg, budget.sphereSeg / 2),
    [budget.sphereSeg],
  );
  const atmoGeo = useMemo(
    () => new THREE.SphereGeometry(R * 1.055, 64, 32),
    [],
  );
  useEffect(() => () => {
    sphereGeo.dispose();
    atmoGeo.dispose();
  }, [sphereGeo, atmoGeo]);

  /* --- target basis ------------------------------------------------------ */
  const targetDir = useMemo(() => {
    const [x, y, z] = latLonToVec3(DIVE_TARGET.lat, DIVE_TARGET.lon, 1);
    return new THREE.Vector3(x, y, z).normalize();
  }, []);

  // Reusable scratch — no per-frame allocation inside useFrame.
  const scratch = useMemo(
    () => ({
      camPos: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      axis: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      q: new THREE.Quaternion(),
      sun: new THREE.Vector3(),
      m3: new THREE.Matrix3(),
    }),
    [],
  );

  const smoothed = useRef({ alt: mode === 'final' ? 1.4 : 2.1, spin: 0, init: false });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = getProgress(channel);
    const dtc = Math.min(dt, 1 / 30); // clamp so a stutter can't jump the camera

    // Frame cadence (30fps idle / 60fps scrubbing) is governed by the demand
    // ticker in the parent — effect (B) — so useFrame just does the work.
    uniforms.uTime.value = t;
    uniforms.uResolution.value.set(state.size.width, state.size.height);

    if (mode === 'final') {
      /* ---- Act VIII: slow orbit, data layers reveal with scroll ---- */
      const reveal = smootherstep(range(p, 0.05, 0.6));
      uniforms.uDataOpacity.value = reveal;
      uniforms.uScanSweep.value = reveal > 0.05 ? (t * 0.035) % 1 : -1;
      uniforms.uGridOpacity.value = 0.28 + 0.34 * reveal;
      uniforms.uAltitude.value = 1.35 - 0.25 * smootherstep(range(p, 0, 0.9));

      const spin = t * 0.018 + p * 0.5;
      if (groupRef.current) {
        groupRef.current.rotation.y = spin;
        // Slight axial tilt reads as a real planet rather than a spinning ball.
        groupRef.current.rotation.z = degToRad(-14);
      }
      const alt = uniforms.uAltitude.value;
      camera.position.set(0, 0.16, 1 + alt);
      camera.lookAt(0, 0, 0);
      (camera as THREE.PerspectiveCamera).fov = 30;
      camera.updateProjectionMatrix();
      atmoUniforms.uIntensity.value = 1.1;
      return;
    }

    /* ================= Act I — the dive ================= */

    const { idle, approach, target, dive, surface } = ORBIT_STAGES;

    // Stage progresses.
    const pApproach = smootherstep(range(p, approach[0], approach[1]));
    const pTarget = smootherstep(range(p, target[0], target[1]));
    const pDive = range(p, dive[0], dive[1]);
    const pSurface = smootherstep(range(p, surface[0], surface[1]));

    /* --- altitude: interpolate in log space across the whole descent ---- */
    // Keyframes (altitude in Earth radii above surface).
    const A0 = 2.1; // idle
    const A1 = 1.05; // end of approach
    const A2 = 0.55; // target locked
    const A3 = 0.006; // end of dive
    const A4 = 0.0008; // surface

    const logLerp = (a: number, b: number, k: number) =>
      Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * k);

    let alt = A0;
    if (p <= idle[1]) {
      alt = A0;
    } else if (p < target[0]) {
      alt = logLerp(A0, A1, pApproach);
    } else if (p < dive[0]) {
      alt = logLerp(A1, A2, pTarget);
    } else if (p < surface[0]) {
      // Ease-in so the dive accelerates — gravity, not a lift.
      alt = logLerp(A2, A3, easeInOutCubic(pDive));
    } else {
      alt = logLerp(A3, A4, pSurface);
    }

    // Temporal smoothing: absorbs scroll jitter without adding lag at rest.
    if (!smoothed.current.init) {
      smoothed.current.alt = alt;
      smoothed.current.init = true;
    }
    smoothed.current.alt = damp(smoothed.current.alt, alt, 9, dtc);
    const A = smoothed.current.alt;
    uniforms.uAltitude.value = A;

    /* --- rotation: free spin, then lock the target under the camera ----- */
    // Angle needed to bring the target to the camera-facing meridian (+Z).
    const targetSpin = Math.atan2(targetDir.x, targetDir.z) * -1;
    /* The idle spin is *phased off the target*, not off zero — and it must not be
       phased off `t` alone. With no offset the first frame sits at spin 0, whose
       facing meridian is lon −90°: the empty east Pacific. Worse, the face on
       screen at load would be a function of elapsed clock time, so which side of
       the planet greets a visitor was effectively arbitrary. Starting IDLE_LEAD
       short of the lock puts lon ≈ 59°E under the camera on frame one — the
       Africa-through-Asia hemisphere, the densest land on Earth — and because the
       drift direction matches the sign of the lock, the planet turns *toward*
       Beirut rather than arriving there from a random azimuth. */
    const freeSpin = targetSpin - IDLE_LEAD + t * 0.0225;
    // Choose the shortest path, and only start converging during approach.
    const lockAmount = smootherstep(range(p, approach[0] + 0.02, target[1]));
    let spin = freeSpin;
    if (lockAmount > 0) {
      // Unwrap so we always take the short way round.
      const base = freeSpin;
      let delta = targetSpin - base;
      delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
      spin = base + delta * lockAmount;
    }
    smoothed.current.spin = spin;

    if (groupRef.current) {
      groupRef.current.rotation.y = spin;
      groupRef.current.rotation.z = degToRad(-14 + 6 * pTarget);
      // Bring the target's latitude toward frame centre as we descend.
      groupRef.current.rotation.x = degToRad(
        -DIVE_TARGET.lat * (0.35 * pTarget + 0.62 * smootherstep(pDive)),
      );
    }

    /* --- camera: pull in along +Z, with a slow lateral drift ------------ */
    // A small parallax offset early on keeps the planet off-axis (more
    // cinematic than dead-centre), and unwinds as we commit to the dive.
    const off = (1 - smootherstep(range(p, approach[0], dive[0]))) * 0.28;
    const driftX = Math.sin(t * 0.06) * 0.035 * (1 - smootherstep(pDive));
    const driftY = Math.cos(t * 0.048) * 0.028 * (1 - smootherstep(pDive));

    camera.position.set(off * 0.6 + driftX, 0.12 + driftY + 0.05 * pTarget, R + A);

    // Look slightly ahead of centre during the dive so the horizon tips.
    const lookY = -0.02 * smootherstep(pDive);
    camera.lookAt(driftX * 0.5, lookY, 0);

    /* --- FOV: narrows through the dive (telephoto compression) ---------- */
    const cam = camera as THREE.PerspectiveCamera;
    const fov = 32 - 12 * smootherstep(pDive) - 6 * pSurface;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    /* --- target highlight ---------------------------------------------- */
    // Appears as the region resolves, fades once we're inside the atmosphere.
    uniforms.uTargetGlow.value =
      smootherstep(range(p, target[0], target[0] + 0.08)) * (1 - smootherstep(range(p, 0.62, 0.78)));
    uniforms.uGridOpacity.value = 0.3 * (1 - smootherstep(range(p, 0.42, 0.66)));
    uniforms.uSurfaceMix.value = pSurface;
    // Imagery "sharpens" through the last third of the dive.
    uniforms.uSharpen.value = 0.25 + 0.75 * smootherstep(range(p, 0.55, 0.95));
    uniforms.uNightLights.value = 1 - smootherstep(range(p, 0.3, 0.6));

    /* --- sun: swings round slightly so the terminator moves ------------ */
    const sunAngle = 0.55 + p * 0.5;
    scratch.sun.set(Math.cos(sunAngle), 0.26 - 0.12 * p, Math.sin(sunAngle)).normalize();
    // Shader wants view-space light: transform by the camera's inverse basis.
    scratch.m3.setFromMatrix4(camera.matrixWorldInverse);
    uniforms.uSunDir.value.copy(scratch.sun).applyMatrix3(scratch.m3).normalize();

    // Atmosphere fades as we pass through it.
    atmoUniforms.uIntensity.value = clamp(1.15 * (1 - smootherstep(range(p, 0.5, 0.8))), 0, 1.2);
    if (atmoRef.current) atmoRef.current.visible = atmoUniforms.uIntensity.value > 0.01;
  });

  return (
    <>
      {/* Starfield sits outside the rotating group so stars stay fixed. Hidden
          in light mode — bright points on a white sky read as dust, not stars. */}
      {!light && <Starfield count={budget.stars} tier={caps.tier} channel={channel} mode={mode} />}

      <group ref={groupRef}>
        {/* material={} not a <rawShaderMaterial> child — see the note above the
            useMemo: a `uniforms` prop would be copied, not adopted. */}
        <mesh ref={earthRef} geometry={sphereGeo} material={earthMat} frustumCulled={false} />

        <DataPoints
          count={budget.dataPoints}
          channel={channel}
          mode={mode}
          tier={caps.tier}
        />
      </group>

      {/* Atmosphere: additive shell, front faces culled so we see the far side. */}
      <mesh ref={atmoRef} geometry={atmoGeo} material={atmoMat} frustumCulled={false} />

      <OrbitalPaths
        satellites={budget.satellites}
        channel={channel}
        mode={mode}
        tier={caps.tier}
      />
    </>
  );
}
