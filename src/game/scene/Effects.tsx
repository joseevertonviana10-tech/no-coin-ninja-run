import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MapDef } from "../data/maps";
import { runtime } from "../runtime";
import { useSettings } from "../store";
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

function HackerGlyphs() {
  const group = useRef<THREE.Group>(null!);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = "#4dff91";
      ctx.shadowColor = "#12ff68";
      ctx.shadowBlur = 12;
      ctx.font = "bold 54px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.random() > 0.5 ? "0" : "1", 32, 32);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.x = runtime.sim?.player.x ?? 0;
    for (const glyph of group.current.children) {
      glyph.position.y -= delta * (0.5 + glyph.userData.fallSpeed);
      glyph.position.x += Math.sin(glyph.position.y * 2) * delta * 0.08;
      if (glyph.position.y < 0.05) {
        glyph.position.y = 1.8 + Math.random() * 0.9;
        glyph.position.x = (Math.random() - 0.5) * 1.05;
      }
    }
  });
  return (
    <group ref={group}>
      {Array.from({ length: 18 }, (_, i) => (
        <sprite key={i} userData={{ fallSpeed: 0.35 + (i % 5) * 0.16 }} position={[(Math.random() - 0.5) * 1.05, 0.15 + (i / 18) * 2.45, -0.18 + Math.random() * 0.12]} scale={[0.075, 0.18, 1]}>
          <spriteMaterial map={texture} color="#55ff91" transparent opacity={0.82} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

export function Particles() {
  const pool = runtime.particles;
  const isHacker = useSettings((s) => s.character === "hacker-code" && s.hackerSkinUnlocked);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const hackerEmit = useRef(0);
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
  useFrame((_, delta) => {
    const settings = useSettings.getState();
    if (settings.character === "hacker-code" && settings.hackerSkinUnlocked) {
      hackerEmit.current += Math.min(delta, 0.05);
      while (hackerEmit.current >= 0.045) {
        hackerEmit.current -= 0.045;
        const playerX = runtime.sim?.player.x ?? 0;
        const x = playerX + (Math.random() - 0.5) * 0.52;
        const g = 0.8 + Math.random() * 0.2;
        // Green digital fragments stream from the torso.
        pool.emit(x, 0.9 + Math.random() * 0.85, -0.12, (Math.random() - 0.5) * 0.35, -0.3 - Math.random() * 0.9, -0.25, 0.04, g, 0.16 + Math.random() * 0.22, 0.7 + Math.random() * 0.55, 0.12, -0.05);
        // Soft green smoke continuously rises from both shoes.
        if (Math.random() > 0.52) {
          const foot = playerX + (Math.random() > 0.5 ? -0.14 : 0.14);
          pool.emit(foot, 0.06, 0.12, (Math.random() - 0.5) * 0.16, 0.55 + Math.random() * 0.55, 0.1, 0.06, 0.72 + Math.random() * 0.2, 0.18, 1.15 + Math.random() * 0.7, 0.24 + Math.random() * 0.12, -0.45);
        }
      }
    } else hackerEmit.current = 0;
    for (const k of ["position", "aColor", "aAlpha", "aSize"]) (geom.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
  });
  return <><points geometry={geom} material={mat} frustumCulled={false} />{isHacker && <HackerGlyphs />}</>;
}

/** Ambient weather per map: rain, blizzards, ashfall, techno-rain and sandstorms. */
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
      dust: ["#d8c5a5", "#f2dfbd", "#bba88e"],
      rain: ["#8fb9df", "#c5e5ff", "#e5f4ff"],
      blizzard: ["#ffffff", "#eaf4ff", "#b9dcf5"],
      ash: ["#77716d", "#a69a8d", "#ff8a42"],
      "tech-rain": ["#2be0ff", "#ff3df2", "#8e7bff"],
      sandstorm: ["#e8c48a", "#d9a860", "#b98449"],
    };
    const pal = palette[map.weather] ?? ["#ffffff"];
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
        size: map.weather === "snow" || map.weather === "blizzard" ? 0.22 : map.weather === "sand" || map.weather === "sandstorm" ? 0.16 : map.weather === "confetti" ? 0.18 : map.weather === "rain" || map.weather === "tech-rain" ? 0.11 : 0.15,
        map: dotTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        opacity: map.weather === "sand" || map.weather === "dust" || map.weather === "sandstorm" ? 0.48 : map.weather === "rain" ? 0.72 : 0.9,
        blending: map.weather === "embers" || map.weather === "neon" || map.weather === "tech-rain" ? THREE.AdditiveBlending : THREE.NormalBlending,
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
      } else if (w === "dust") {
        vy = 0.08 + sd * 0.12;
        vx = 0.22 + Math.sin(t * 0.7 + sd * 10) * 0.22;
      } else if (w === "rain") {
        vy = -18 - sd * 8;
        vx = -2.8 - sd * 1.8;
      } else if (w === "blizzard") {
        vy = -3.8 - sd * 3.2;
        vx = 2.5 + Math.sin(t * 2 + sd * 18) * 3.5;
      } else if (w === "ash") {
        vy = -1.4 - sd * 2.2;
        vx = -1.1 + Math.sin(t * 0.8 + sd * 15) * 1.5;
      } else if (w === "tech-rain") {
        vy = -15 - sd * 9;
        vx = Math.sin(t * 0.4 + sd * 8) * 0.8;
      } else if (w === "sandstorm") {
        vx = 10 + sd * 9;
        vy = -0.2 + Math.sin(t * 2.5 + sd * 16) * 1.2;
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
