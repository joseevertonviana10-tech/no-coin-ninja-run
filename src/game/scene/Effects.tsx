import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MapDef } from "../data/maps";
import { runtime } from "../runtime";
import { dotTexture } from "./textures";

const vert = /* glsl */ `
attribute float aAlpha;
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
varying float vA;
varying vec3 vC;
void main() {
  vC = aColor;
  vA = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
uniform sampler2D uMap;
varying float vA;
varying vec3 vC;
void main() {
  float a = texture2D(uMap, gl_PointCoord).a * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vC, a);
}`;

export function Particles() {
  const pool = runtime.particles;
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pool.pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(pool.col, 3));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(pool.alpha, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(pool.size, 1));
    return g;
  }, [pool]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: { uMap: { value: dotTexture() }, uScale: { value: 400 } },
      }),
    [],
  );
  useEffect(() => {
    mat.uniforms['uScale']!.value = (size.height * dpr) / 2.2;
  }, [size.height, dpr, mat]);
  useEffect(() => () => {
    geom.dispose();
    mat.dispose();
  }, [geom, mat]);
  useFrame(() => {
    for (const k of ["position", "aColor", "aAlpha", "aSize"]) (geom.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
  });
  return <points geometry={geom} material={mat} frustumCulled={false} />;
}

/** Ambient weather per map: snow, embers, sand, leaves, neon motes, confetti. */
export function Weather({ map, count }: { map: MapDef; count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const palette: Record<string, string[]> = {
      snow: ["#ffffff", "#eaf4ff"],
      embers: ["#ff7a1a", "#ffb030", "#ff4010"],
      sand: ["#e8c48a", "#d9a860"],
      leaves: ["#6ab04c", "#badc58", "#f9ca24"],
      neon: ["#2be0ff", "#ff3df2", "#9d7bff"],
      confetti: ["#e63946", "#ffd166", "#06d6a0", "#118ab2", "#ffffff"],
      none: ["#ffffff"],
    };
    const pal = palette[map.weather];
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = -Math.random() * 90 + 10;
      c.set(pal[i % pal.length] ?? "#ffffff");
      col.set([c.r, c.g, c.b], i * 3);
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { g, pos, seed };
  }, [map, count]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: map.weather === "snow" ? 0.22 : map.weather === "sand" ? 0.12 : map.weather === "confetti" ? 0.18 : 0.15,
        map: dotTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        opacity: map.weather === "sand" ? 0.55 : 0.9,
        blending: map.weather === "embers" || map.weather === "neon" ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [map],
  );
  useEffect(() => () => {
    data.g.dispose();
    mat.dispose();
  }, [data, mat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const sim = runtime.sim;
    const scroll = sim && runtime.mode === "playing" ? sim.speed : 0;
    const { pos, seed } = data;
    const w = map.weather;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      const sd = seed[i]!;
      let vx = 0;
      let vy = 0;
      if (w === "snow") {
        vy = -1.5 - sd;
        vx = Math.sin(t + sd * 10) * 0.6;
      } else if (w === "embers") {
        vy = 1 + sd * 1.5;
        vx = Math.sin(t * 2 + sd * 10) * 0.5;
      } else if (w === "sand") {
        vx = 9 + sd * 6;
        vy = Math.sin(t * 3 + sd * 20) * 0.4;
      } else if (w === "leaves") {
        vy = -0.8 - sd * 0.5;
        vx = Math.sin(t * 1.5 + sd * 10) * 1.2;
      } else if (w === "neon") {
        vy = Math.sin(t + sd * 6) * 0.4;
      } else if (w === "confetti") {
        vy = -1.2 - sd;
        vx = Math.sin(t * 4 + sd * 10) * 1.5;
      }
      pos[j] = pos[j]! + vx * dt;
      pos[j + 1] = pos[j + 1]! + vy * dt;
      pos[j + 2] = pos[j + 2]! + scroll * dt;
      if (pos[j + 1]! < 0) pos[j + 1] = pos[j + 1]! + 16;
      if (pos[j + 1]! > 16) pos[j + 1] = pos[j + 1]! - 16;
      if (pos[j]! > 20) pos[j] = pos[j]! - 40;
      if (pos[j]! < -20) pos[j] = pos[j]! + 40;
      if (pos[j + 2]! > 10) pos[j + 2] = pos[j + 2]! - 100;
    }
    (data.g.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  });
  if (map.weather === "none") return null;
  return <points ref={ref} geometry={data.g} material={mat} frustumCulled={false} />;
}
