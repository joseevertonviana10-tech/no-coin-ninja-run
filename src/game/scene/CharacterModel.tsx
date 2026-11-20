import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterDef } from "../data/characters";
import { patternTexture } from "./textures";

const CARTOON_RAMP = (() => {
  const data = new Uint8Array([78, 78, 78, 255, 142, 142, 142, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

export interface Mats {
  main: THREE.MeshToonMaterial;
  second: THREE.MeshToonMaterial;
  accent: THREE.MeshToonMaterial;
  skin: THREE.MeshToonMaterial;
  dark: THREE.MeshToonMaterial;
  white: THREE.MeshToonMaterial;
  steel: THREE.MeshToonMaterial;
  glow: THREE.MeshToonMaterial;
}

export function useCharacterMats(def: CharacterDef): Mats {
  const mats = useMemo(() => {
    const tex = patternTexture(def.pattern);
    const metal = def.metal ?? 0;
    const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
      const params: THREE.MeshToonMaterialParameters = { color, gradientMap: CARTOON_RAMP };
      if (o.map) params.map = o.map;
      if (o.emissive) params.emissive = o.emissive;
      if (o.emissiveMap) params.emissiveMap = o.emissiveMap;
      if (o.emissiveIntensity !== undefined) params.emissiveIntensity = o.emissiveIntensity;
      if (o.transparent !== undefined) params.transparent = o.transparent;
      if (o.opacity !== undefined) params.opacity = o.opacity;
      if (o.side !== undefined) params.side = o.side;
      if (o.depthWrite !== undefined) params.depthWrite = o.depthWrite;
      return new THREE.MeshToonMaterial(params);
    };
    return {
      main: std(def.main, { map: tex, metalness: metal, roughness: metal > 0.3 ? 0.35 : 0.75 }),
      second: std(def.second, { map: tex, metalness: metal * 0.6, roughness: 0.7 }),
      accent: std(def.accent, { metalness: 0.3, roughness: 0.45 }),
      skin: std(def.skin, {
        roughness: 0.6,
        map: def.style === "zombie" ? patternTexture("stains") : (def.style === "alien" || def.style === "lizard" || def.style === "dinosaur") ? patternTexture("scales") : null,
        emissive: new THREE.Color(def.id === "zombie-rad" ? (def.glow ?? "#000000") : "#000000"),
        emissiveIntensity: def.id === "zombie-rad" ? 0.25 : 0,
      }),
      dark: std("#141418", { roughness: 0.5 }),
      white: std("#f4f4f4", { roughness: 0.3 }),
      steel: std("#d8dde4", { metalness: 0.9, roughness: 0.2 }),
      glow: std(def.glow ?? def.accent, {
        emissive: new THREE.Color(def.glow ?? def.accent),
        emissiveIntensity: def.glow ? 2.2 : 0.3,
        roughness: 0.3,
      }),
    } satisfies Mats;
  }, [def]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

const Cap = ({ r, len, m, pos = [0, 0, 0], scale = [1, 1, 1] }: { r: number; len: number; m: THREE.Material; pos?: [number, number, number]; scale?: [number, number, number] }) => (
  <mesh position={pos} scale={scale} material={m} castShadow>
    <capsuleGeometry args={[r, len, 6, 14]} />
  </mesh>
);
const Box = ({ s, m, pos = [0, 0, 0], rot = [0, 0, 0] }: { s: [number, number, number]; m: THREE.Material; pos?: [number, number, number]; rot?: [number, number, number] }) => (
  <mesh position={pos} rotation={rot} material={m} castShadow>
    <boxGeometry args={s} />
  </mesh>
);
const Ball = ({ r, m, pos = [0, 0, 0], scale = [1, 1, 1] }: { r: number; m: THREE.Material; pos?: [number, number, number]; scale?: [number, number, number] }) => (
  <mesh position={pos} scale={scale} material={m} castShadow>
    <sphereGeometry args={[r, 24, 18]} />
  </mesh>
);

function MonkeyTail({ material }: { material: THREE.Material }) {
  const tail = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    if (!tail.current) return;
    const t = state.clock.elapsedTime;
    tail.current.rotation.z = THREE.MathUtils.damp(tail.current.rotation.z, Math.sin(t * 6.2) * 0.32, 7, delta);
    tail.current.rotation.x = THREE.MathUtils.damp(tail.current.rotation.x, 0.22 + Math.sin(t * 4.1) * 0.18, 5, delta);
  });
  return (
    <group ref={tail} position={[0.16, -0.08, 0.22]}>
      <mesh position={[0, 0.12, 0]} rotation={[0.5, 0, 0]} material={material} castShadow><capsuleGeometry args={[0.052, 0.22, 5, 10]} /></mesh>
      <mesh position={[0, 0.29, 0.04]} rotation={[0.9, 0, 0]} material={material} castShadow><capsuleGeometry args={[0.046, 0.2, 5, 10]} /></mesh>
      <mesh position={[0, 0.43, 0.09]} rotation={[1.2, 0, 0]} material={material} castShadow><capsuleGeometry args={[0.04, 0.16, 5, 10]} /></mesh>
      <Ball r={0.055} m={material} pos={[0, 0.54, 0.14]} />
    </group>
  );
}

export function CharacterDetails({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.style === "monkey") return null;
  if (def.style === "skeleton") return (
    <group>
      <Box s={[0.28, 0.035, 0.035]} m={m.main} pos={[0, 0.56, -0.015]} />
      <Ball r={0.035} m={m.glow} pos={[-0.16, 0.52, 0]} />
      <Ball r={0.035} m={m.glow} pos={[0.16, 0.52, 0]} />
    </group>
  );
  if (def.style === "stick") return <Box s={[0.12, 0.08, 0.035]} m={m.accent} pos={[0, 0.34, -0.035]} />;
  return (
    <group>
      <Box s={[0.43, 0.065, 0.34]} m={m.second} pos={[0, 0.045, 0]} />
      <Box s={[0.09, 0.09, 0.035]} m={m.accent} pos={[0, 0.05, -0.19]} />
      <Ball r={0.025} m={m.glow} pos={[0, 0.37, -0.19]} />
      {def.id === "ninja-oni" && (
        <>
          {[-1, 1].map((side) => <mesh key={side} position={[side * 0.15, 0.58, 0.02]} rotation={[0, 0, side * 0.22]} material={m.accent} castShadow><coneGeometry args={[0.055, 0.2, 6]} /></mesh>)}
          <Box s={[0.28, 0.1, 0.035]} m={m.second} pos={[0, 0.36, -0.22]} />
          <Ball r={0.035} m={m.glow} pos={[-0.08, 0.37, -0.245]} />
          <Ball r={0.035} m={m.glow} pos={[0.08, 0.37, -0.245]} />
        </>
      )}
      {def.id === "samurai-storm" && (
        <>
          {[-1, 1].map((side) => <Box key={side} s={[0.2, 0.18, 0.28]} m={m.accent} pos={[side * 0.3, 0.5, 0]} rot={[0, 0, side * 0.25]} />)}
          <Box s={[0.1, 0.28, 0.035]} m={m.glow} pos={[0, 0.28, -0.21]} />
        </>
      )}
      {def.id === "robot-titan" && (
        <>
          <Box s={[0.5, 0.18, 0.38]} m={m.second} pos={[0, 0.36, 0]} />
          <Box s={[0.18, 0.16, 0.045]} m={m.glow} pos={[0, 0.35, -0.22]} />
          {[-1, 1].map((side) => <Box key={side} s={[0.09, 0.3, 0.12]} m={m.accent} pos={[side * 0.28, 0.3, 0]} />)}
        </>
      )}
      {def.id === "zombie-mummy" && (
        <>
          {[-0.12, 0, 0.12].map((x) => <Box key={x} s={[0.42, 0.045, 0.04]} m={m.accent} pos={[x, 0.28 + x * 0.35, -0.22]} rot={[0, 0, x * 1.4]} />)}
          <Box s={[0.3, 0.045, 0.04]} m={m.second} pos={[0, 0.08, -0.22]} rot={[0, 0, -0.12]} />
        </>
      )}
      {def.id === "monkey-cyber" && (
        <>
          <Box s={[0.34, 0.1, 0.035]} m={m.glow} pos={[0, 0.43, -0.22]} />
          <Box s={[0.08, 0.32, 0.035]} m={m.accent} pos={[-0.2, 0.25, -0.2]} />
          <Box s={[0.08, 0.32, 0.035]} m={m.accent} pos={[0.2, 0.25, -0.2]} />
        </>
      )}
      {def.id === "alien-crystal" && (
        <>
          {[-0.18, 0, 0.18].map((x, i) => <mesh key={x} position={[x, 0.44 + (i % 2) * 0.06, -0.02]} rotation={[0.1, 0, x * 1.5]} material={m.glow} castShadow><octahedronGeometry args={[0.075, 0]} /></mesh>)}
        </>
      )}
      {def.style === "ninja" && (
        <>
          <Box s={[0.36, 0.045, 0.035]} m={m.accent} pos={[0, 0.28, -0.2]} rot={[0, 0, -0.22]} />
          <Box s={[0.36, 0.045, 0.035]} m={m.accent} pos={[0, 0.19, -0.2]} rot={[0, 0, 0.22]} />
          <Ball r={0.045} m={m.glow} pos={[0, 0.27, -0.225]} />
        </>
      )}
      {def.style === "coat" && (
        <>
          {[-0.08, 0.08, 0.24].map((y) => <Ball key={y} r={0.025} m={m.accent} pos={[0, y, -0.205]} />)}
          <Box s={[0.08, 0.24, 0.025]} m={m.second} pos={[0.2, 0.25, -0.16]} rot={[0, 0, -0.18]} />
        </>
      )}
      {def.style === "zombie" && (
        <>
          <Box s={[0.13, 0.08, 0.035]} m={m.accent} pos={[-0.18, 0.25, -0.18]} rot={[0, 0, 0.35]} />
          <Box s={[0.1, 0.12, 0.035]} m={m.second} pos={[0.17, 0.12, -0.18]} rot={[0, 0, -0.28]} />
          <Ball r={0.035} m={m.glow} pos={[0.1, 0.32, -0.2]} />
        </>
      )}
      {def.style === "explorer" && (
        <>
          <Box s={[0.46, 0.075, 0.36]} m={m.accent} pos={[0, 0.12, 0]} />
          <Box s={[0.1, 0.14, 0.045]} m={m.second} pos={[0.23, 0.12, -0.18]} />
          <Ball r={0.035} m={m.glow} pos={[0.23, 0.14, -0.21]} />
        </>
      )}
      {(def.style === "lizard" || def.style === "dinosaur") && (
        <>
          {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
            <mesh key={x} position={[x, 0.43 + (i % 2) * 0.035, 0.04]} rotation={[0.12, 0, 0]} material={m.accent} castShadow>
              <coneGeometry args={[0.045, 0.12, 5]} />
            </mesh>
          ))}
          <Box s={[0.28, 0.06, 0.04]} m={m.second} pos={[0, 0.08, -0.19]} />
        </>
      )}
      {def.style === "scientist" && (
        <>
          <Box s={[0.13, 0.18, 0.08]} m={m.second} pos={[0.24, 0.18, 0.04]} />
          <Box s={[0.06, 0.12, 0.035]} m={m.glow} pos={[0.24, 0.2, -0.02]} />
        </>
      )}
      {(def.style === "knight" || def.style === "samurai" || def.style === "soldier" || def.style === "robot") && (
        <>
          <Ball r={0.105} m={def.style === "knight" ? m.steel : m.accent} pos={[-0.28, 0.52, 0]} scale={[1.2, 0.7, 1]} />
          <Ball r={0.105} m={def.style === "knight" ? m.steel : m.accent} pos={[0.28, 0.52, 0]} scale={[1.2, 0.7, 1]} />
        </>
      )}
    </group>
  );
}


/* ---------- Torso ---------- */
export function Torso({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.id === "hacker-code") return (
    <group>
      <Cap r={0.22} len={0.38} m={m.main} pos={[0, 0.3, 0]} scale={[1.22, 1.05, 0.9]} />
      <Ball r={0.11} m={m.main} pos={[-0.24, 0.48, 0]} scale={[1, 1.2, 1]} />
      <Ball r={0.11} m={m.main} pos={[0.24, 0.48, 0]} scale={[1, 1.2, 1]} />
      <Box s={[0.28, 0.12, 0.035]} m={m.second} pos={[0, 0.12, -0.18]} />
      <Box s={[0.025, 0.34, 0.018]} m={m.glow} pos={[0, 0.31, -0.205]} />
      <Box s={[0.3, 0.025, 0.02]} m={m.dark} pos={[0, 0.02, -0.19]} />
      <Box s={[0.1, 0.1, 0.025]} m={m.glow} pos={[-0.12, 0.35, -0.205]} />
      <Box s={[0.1, 0.1, 0.025]} m={m.glow} pos={[0.12, 0.35, -0.205]} />
      <Cap r={0.012} len={0.16} m={m.accent} pos={[-0.09, 0.48, -0.18]} />
      <Cap r={0.012} len={0.16} m={m.accent} pos={[0.09, 0.48, -0.18]} />
    </group>
  );
  switch (def.style) {
    case "robot":
      return (
        <group>
          <Box s={[0.5, 0.5, 0.32]} m={m.main} pos={[0, 0.32, 0]} />
          <Box s={[0.36, 0.16, 0.26]} m={m.second} pos={[0, 0.03, 0]} />
          <Box s={[0.14, 0.1, 0.02]} m={m.glow} pos={[0, 0.4, -0.17]} />
          <Box s={[0.06, 0.3, 0.02]} m={m.glow} pos={[-0.18, 0.3, -0.165]} />
          <Box s={[0.06, 0.3, 0.02]} m={m.glow} pos={[0.18, 0.3, -0.165]} />
          <Box s={[0.32, 0.28, 0.08]} m={m.second} pos={[0, 0.34, 0.19]} />
          {[0, 1, 2].map((i) => (
            <Box key={i} s={[0.26, 0.03, 0.02]} m={m.glow} pos={[0, 0.26 + i * 0.07, 0.235]} />
          ))}
          <Ball r={0.11} m={m.second} pos={[-0.27, 0.5, 0]} />
          <Ball r={0.11} m={m.second} pos={[0.27, 0.5, 0]} />
          {def.armor === "full" && (
            <>
              <Box s={[0.2, 0.08, 0.3]} m={m.accent} pos={[-0.3, 0.6, 0]} rot={[0, 0, 0.3]} />
              <Box s={[0.2, 0.08, 0.3]} m={m.accent} pos={[0.3, 0.6, 0]} rot={[0, 0, -0.3]} />
            </>
          )}
        </group>
      );
    case "monk":
      return (
        <group>
          <Cap r={0.21} len={0.38} m={m.main} pos={[0, 0.3, 0]} scale={[1.15, 1, 0.95]} />
          <Box s={[0.38, 0.07, 0.34]} m={m.second} pos={[0, 0.09, 0]} />
          <Box s={[0.08, 0.34, 0.025]} m={m.accent} pos={[0, 0.3, -0.19]} />
          <Box s={[0.3, 0.035, 0.025]} m={m.accent} pos={[0, 0.46, -0.19]} />
          <Ball r={0.06} m={m.glow} pos={[0, 0.28, -0.22]} />
        </group>
      );
    case "monkey":
      return (
        <group>
          <Cap r={0.235} len={0.4} m={m.main} pos={[0, 0.3, 0]} scale={[1.2, 1.02, 1.04]} />
          <Ball r={0.17} m={m.second} pos={[0, 0.16, -0.18]} scale={[1.18, 1.08, 0.55]} />
          <Ball r={0.13} m={m.second} pos={[0, 0.39, -0.17]} scale={[1.12, 0.88, 0.48]} />
          <Ball r={0.1} m={m.main} pos={[-0.25, 0.48, 0]} scale={[1, 1.2, 1]} />
          <Ball r={0.1} m={m.main} pos={[0.25, 0.48, 0]} scale={[1, 1.2, 1]} />
          <Box s={[0.32, 0.055, 0.035]} m={m.accent} pos={[0, 0.49, -0.18]} />
          <Ball r={0.055} m={m.accent} pos={[0, 0.29, -0.235]} />
          <Box s={[0.08, 0.06, 0.035]} m={m.second} pos={[0, 0.035, -0.18]} />
          <MonkeyTail material={m.main} />
        </group>
      );
    case "lizard":
      return (
        <group>
          <Cap r={0.18} len={0.38} m={m.main} pos={[0, 0.3, 0]} scale={[1.25, 0.85, 0.9]} />
          <Ball r={0.12} m={m.second} pos={[0, 0.14, -0.16]} scale={[1.25, 0.75, 0.55]} />
          <group rotation={[0.8, 0, 0]}><Cap r={0.07} len={0.65} m={m.main} pos={[0, 0.02, 0.43]} /></group>
          <Ball r={0.075} m={m.accent} pos={[-0.22, 0.48, -0.02]} />
          <Ball r={0.075} m={m.accent} pos={[0.22, 0.48, -0.02]} />
          <Box s={[0.12, 0.08, 0.08]} m={m.second} pos={[0, 0.5, -0.12]} />
        </group>
      );
    case "dinosaur":
      return (
        <group>
          <Cap r={0.25} len={0.42} m={m.main} pos={[0, 0.3, 0]} scale={[1.25, 1, 1.1]} />
          <group rotation={[0.9, 0, 0]}><Cap r={0.08} len={0.62} m={m.main} pos={[0, 0.12, 0.45]} /></group>
          {[-0.22, -0.08, 0.08, 0.22].map((x, i) => (
            <mesh key={x} position={[x, 0.58 + (i % 2) * 0.04, 0]} material={m.accent} castShadow>
              <coneGeometry args={[0.07, 0.2, 6]} />
            </mesh>
          ))}
          <Box s={[0.16, 0.1, 0.12]} m={m.second} pos={[0, 0.12, -0.2]} />
        </group>
      );
    case "coat":
      return (
        <group>
          <Cap r={0.2} len={0.3} m={m.main} pos={[0, 0.3, 0]} scale={[1.2, 1, 0.9]} />
          <Box s={[0.18, 0.46, 0.035]} m={m.second} pos={[0, 0.28, -0.18]} />
          <Box s={[0.18, 0.46, 0.035]} m={m.main} pos={[-0.13, 0.28, -0.18]} rot={[0, 0, -0.08]} />
          <Box s={[0.18, 0.46, 0.035]} m={m.main} pos={[0.13, 0.28, -0.18]} rot={[0, 0, 0.08]} />
          <Box s={[0.08, 0.28, 0.025]} m={m.accent} pos={[0, 0.32, -0.22]} />
          <Box s={[0.42, 0.06, 0.32]} m={m.second} pos={[0, 0.52, 0]} />
        </group>
      );
    case "skeleton":
      return (
        <group>
          <Cap r={0.035} len={0.5} m={m.main} pos={[0, 0.3, 0.04]} />
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, 0.24 + i * 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.7, 1]} material={m.main} castShadow>
              <torusGeometry args={[0.15 - i * 0.008, 0.022, 6, 14]} />
            </mesh>
          ))}
          <Box s={[0.28, 0.1, 0.14]} m={m.main} pos={[0, 0.02, 0]} />
          {def.glow && <Ball r={0.055} m={m.glow} pos={[0, 0.3, -0.12]} />}
          <Cap r={0.03} len={0.42} m={m.main} pos={[0, 0.54, 0]} scale={[1, 1, 1]} />
        </group>
      );
    case "stick":
      return (
        <group>
          <Cap r={0.035} len={0.55} m={m.main} pos={[0, 0.3, 0]} />
          <mesh position={[0, 0.52, 0]} rotation={[0, 0, Math.PI / 2]} material={m.main}>
            <capsuleGeometry args={[0.03, 0.5, 4, 8]} />
          </mesh>
        </group>
      );
    case "alien":
      return (
        <group>
          <Cap r={0.15} len={0.3} m={m.main} pos={[0, 0.3, 0]} scale={[1.1, 1, 0.8]} />
          <Ball r={0.05} m={m.glow} pos={[0, 0.38, -0.12]} />
          <Box s={[0.32, 0.06, 0.24]} m={m.second} pos={[0, 0.05, 0]} />
        </group>
      );
    default: {
      const armored = def.style === "knight" || def.style === "samurai";
      return (
        <group>
          <Cap r={0.19} len={0.28} m={m.main} pos={[0, 0.3, 0]} scale={[1.18, 1, 0.78]} />
          <mesh position={[0, 0.06, 0]} material={def.style === "ninja" ? m.accent : m.second} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 16]} />
          </mesh>
          {def.style === "ninja" && (
            <>
              <Box s={[0.06, 0.18, 0.03]} m={m.accent} pos={[0.06, -0.04, 0.16]} rot={[0.3, 0, 0.3]} />
              <Box s={[0.06, 0.2, 0.03]} m={m.accent} pos={[-0.04, -0.06, 0.16]} rot={[0.3, 0, -0.2]} />
              <Box s={[0.42, 0.06, 0.32]} m={m.second} pos={[0, 0.46, 0]} rot={[0, 0, 0.5]} />
            </>
          )}
          {armored && (
            <>
              <Box s={[0.42, 0.34, 0.08]} m={def.style === "knight" ? m.steel : m.main} pos={[0, 0.34, -0.14]} />
              <Box s={[0.4, 0.32, 0.06]} m={def.style === "knight" ? m.steel : m.second} pos={[0, 0.34, 0.15]} />
              <Box s={[0.2, 0.06, 0.24]} m={m.accent} pos={[-0.29, 0.56, 0]} rot={[0, 0, 0.35]} />
              <Box s={[0.2, 0.06, 0.24]} m={m.accent} pos={[0.29, 0.56, 0]} rot={[0, 0, -0.35]} />
              {def.style === "samurai" && (
                <>
                  <Box s={[0.16, 0.2, 0.26]} m={m.main} pos={[-0.32, 0.4, 0]} rot={[0, 0, 0.25]} />
                  <Box s={[0.16, 0.2, 0.26]} m={m.main} pos={[0.32, 0.4, 0]} rot={[0, 0, -0.25]} />
                  {[-1, 0, 1].map((i) => (
                    <Box key={i} s={[0.16, 0.24, 0.04]} m={m.main} pos={[i * 0.15, -0.1, -0.17]} rot={[-0.15, 0, 0]} />
                  ))}
                  {[-1, 0, 1].map((i) => (
                    <Box key={"b" + i} s={[0.16, 0.24, 0.04]} m={m.main} pos={[i * 0.15, -0.1, 0.17]} rot={[0.15, 0, 0]} />
                  ))}
                </>
              )}
              {def.style === "knight" && <Box s={[0.12, 0.12, 0.02]} m={m.accent} pos={[0, 0.38, -0.185]} rot={[0, 0, Math.PI / 4]} />}
            </>
          )}
          {def.style === "scientist" && (
            <>
              <mesh position={[0, -0.12, 0]} material={m.main} castShadow>
                <cylinderGeometry args={[0.22, 0.29, 0.42, 14, 1, true]} />
              </mesh>
              <Box s={[0.1, 0.24, 0.02]} m={m.second} pos={[0, 0.38, -0.155]} />
              <Box s={[0.05, 0.07, 0.02]} m={m.accent} pos={[0.12, 0.42, -0.155]} />
            </>
          )}
          {(def.style === "soldier" || def.id === "zombie-military") && (
            <>
              <Box s={[0.44, 0.32, 0.34]} m={m.second} pos={[0, 0.32, 0]} />
              {[-0.1, 0.1].map((x) => (
                <Box key={x} s={[0.08, 0.08, 0.04]} m={m.accent} pos={[x, 0.26, -0.19]} />
              ))}
            </>
          )}
          {(def.style === "soldier" || def.style === "explorer") && (
            <group position={[0, 0.3, 0.22]}>
              <Box s={[0.34, 0.38, 0.16]} m={def.style === "explorer" ? m.second : m.second} />
              <Box s={[0.26, 0.12, 0.06]} m={m.accent} pos={[0, -0.08, 0.09]} />
              {def.style === "explorer" && (
                <mesh position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]} material={m.accent} castShadow>
                  <cylinderGeometry args={[0.07, 0.07, 0.42, 10]} />
                </mesh>
              )}
            </group>
          )}
          {def.style === "zombie" && (
            <>
              <Box s={[0.1, 0.06, 0.02]} m={m.accent} pos={[-0.08, 0.2, -0.16]} rot={[0, 0, 0.4]} />
              <Box s={[0.08, 0.05, 0.02]} m={m.accent} pos={[0.1, 0.4, -0.155]} rot={[0, 0, -0.6]} />
              {def.glow && <Ball r={0.06} m={m.glow} pos={[0, 0.34, -0.15]} />}
            </>
          )}
        </group>
      );
    }
  }
}

/* ---------- Back weapons ---------- */
export function BackGear({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.weapon === "katana")
    return (
      <group position={[0, 0.35, 0.2]} rotation={[0, 0, 0.75]}>
        <Box s={[0.05, 0.62, 0.02]} m={m.steel} pos={[0, -0.08, 0]} />
        <Box s={[0.07, 0.6, 0.05]} m={m.second} pos={[0, -0.08, 0.01]} />
        <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.accent}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 10]} />
        </mesh>
        <Cap r={0.025} len={0.18} m={m.dark} pos={[0, 0.38, 0]} />
      </group>
    );
  if (def.weapon === "sword")
    return (
      <group position={[0, 0.3, 0.2]}>
        <Box s={[0.36, 0.44, 0.05]} m={m.second} pos={[0, 0, 0.03]} />
        <Box s={[0.1, 0.3, 0.02]} m={m.accent} pos={[0, 0, 0.065]} />
        <Box s={[0.3, 0.08, 0.02]} m={m.accent} pos={[0, 0.04, 0.065]} />
      </group>
    );
  if (def.weapon === "shotgun")
    return (
      <group position={[0, 0.32, 0.34]} rotation={[0, 0, -0.72]}>
        <Box s={[0.12, 0.66, 0.1]} m={m.dark} pos={[0, 0.02, 0]} />
        <Box s={[0.08, 0.24, 0.09]} m={m.second} pos={[0, -0.25, 0]} />
        <mesh position={[0, 0.38, 0]} material={m.steel}><cylinderGeometry args={[0.035, 0.035, 0.28, 10]} /></mesh>
        <mesh position={[0.055, 0.38, 0]} material={m.steel}><cylinderGeometry args={[0.025, 0.025, 0.28, 10]} /></mesh>
        <Box s={[0.16, 0.06, 0.12]} m={m.accent} pos={[0, 0.08, 0.01]} />
      </group>
    );
  if (def.weapon === "rifle")
    return (
      <group position={[0, 0.3, 0.33]} rotation={[0, 0, -0.8]}>
        <Box s={[0.065, 0.78, 0.075]} m={m.dark} />
        <Box s={[0.075, 0.2, 0.08]} m={m.accent} pos={[0, -0.28, 0]} />
        <Box s={[0.12, 0.13, 0.1]} m={m.second} pos={[0, 0.16, 0]} />
        <Box s={[0.045, 0.19, 0.045]} m={m.steel} pos={[0, 0.39, 0]} />
        <Box s={[0.1, 0.045, 0.045]} m={m.accent} pos={[0, 0.39, 0]} />
      </group>
    );
  return null;
}

/* ---------- Head ---------- */
export function Head({ def, m }: { def: CharacterDef; m: Mats }) {
  const eyes = (mat: THREE.Material, r = 0.03, y = 0.22, z = -0.18, dx = 0.075) => (
    <>
      <Ball r={r} m={mat} pos={[-dx, y, z]} />
      <Ball r={r} m={mat} pos={[dx, y, z]} />
    </>
  );
  if (def.id === "hacker-code") return (
    <group>
      <Ball r={0.245} m={m.dark} pos={[0, 0.2, 0.025]} scale={[1.28, 1.38, 1.12]} />
      <Ball r={0.195} m={m.white} pos={[0, 0.19, -0.145]} scale={[1.02, 1.08, 0.55]} />
      <mesh position={[0, 0.19, -0.235]} material={m.dark}><torusGeometry args={[0.198, 0.022, 8, 28]} /></mesh>
      <Box s={[0.14, 0.027, 0.018]} m={m.dark} pos={[-0.078, 0.295, -0.235]} rot={[0, 0, 0.24]} />
      <Box s={[0.14, 0.027, 0.018]} m={m.dark} pos={[0.078, 0.295, -0.235]} rot={[0, 0, -0.24]} />
      <Ball r={0.026} m={m.glow} pos={[-0.078, 0.235, -0.244]} scale={[1.35, 0.72, 0.45]} />
      <Ball r={0.026} m={m.glow} pos={[0.078, 0.235, -0.244]} scale={[1.35, 0.72, 0.45]} />
      <Box s={[0.025, 0.09, 0.02]} m={m.dark} pos={[0, 0.16, -0.235]} rot={[0, 0, 0.04]} />
      <Cap r={0.025} len={0.085} m={m.dark} pos={[-0.075, 0.105, -0.242]} rot={[0, 0, -1.12]} />
      <Cap r={0.025} len={0.085} m={m.dark} pos={[0.075, 0.105, -0.242]} rot={[0, 0, 1.12]} />
      <mesh position={[0, 0.065, -0.242]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.075, 0.009, 6, 20, Math.PI]} /></mesh>
      <Ball r={0.018} m={m.dark} pos={[-0.105, 0.13, -0.24]} />
      <Ball r={0.018} m={m.dark} pos={[0.105, 0.13, -0.24]} />
    </group>
  );
  switch (def.style) {
    case "monk":
      return (
        <group>
          <Ball r={0.205} m={m.skin} pos={[0, 0.2, 0]} />
          <Ball r={0.035} m={m.dark} pos={[-0.075, 0.23, -0.18]} />
          <Ball r={0.035} m={m.dark} pos={[0.075, 0.23, -0.18]} />
          <Box s={[0.25, 0.045, 0.025]} m={m.main} pos={[0, 0.38, -0.02]} />
          <Ball r={0.045} m={m.accent} pos={[0, 0.41, -0.035]} />
          <Box s={[0.16, 0.025, 0.025]} m={m.dark} pos={[0, 0.12, -0.18]} />
        </group>
      );
    case "ninja":
      return (
        <group>
          <Ball r={0.215} m={m.main} pos={[0, 0.2, 0]} />
          <Box s={[0.3, 0.075, 0.08]} m={m.skin} pos={[0, 0.23, -0.17]} />
          {eyes(m.dark, 0.026, 0.235, -0.215)}
          <mesh position={[0, 0.3, 0]} material={m.accent}>
            <cylinderGeometry args={[0.222, 0.222, 0.05, 18]} />
          </mesh>
          <Box s={[0.05, 0.22, 0.02]} m={m.accent} pos={[0.04, 0.2, 0.24]} rot={[0.6, 0, 0.25]} />
          <Box s={[0.05, 0.26, 0.02]} m={m.accent} pos={[-0.04, 0.18, 0.25]} rot={[0.7, 0, -0.2]} />
        </group>
      );
    case "samurai":
      return (
        <group>
          <Ball r={0.19} m={m.skin} pos={[0, 0.19, 0]} />
          {def.glow ? eyes(m.glow, 0.028, 0.22, -0.17) : eyes(m.dark, 0.024, 0.22, -0.17)}
          <Box s={[0.26, 0.1, 0.06]} m={def.glow ? m.dark : m.second} pos={[0, 0.1, -0.16]} />
          <mesh position={[0, 0.25, 0]} material={m.second} castShadow>
            <sphereGeometry args={[0.235, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.22, 0.02]} rotation={[-0.15, 0, 0]} material={m.main} castShadow>
            <cylinderGeometry args={[0.31, 0.33, 0.035, 18]} />
          </mesh>
          <Box s={[0.03, 0.26, 0.02]} m={m.accent} pos={[-0.08, 0.44, -0.2]} rot={[0, 0, 0.45]} />
          <Box s={[0.03, 0.26, 0.02]} m={m.accent} pos={[0.08, 0.44, -0.2]} rot={[0, 0, -0.45]} />
          <Ball r={0.035} m={m.accent} pos={[0, 0.34, -0.22]} />
          {def.armor === "full" && <Box s={[0.42, 0.14, 0.34]} m={m.main} pos={[0, 0.05, 0.05]} />}
        </group>
      );
    case "robot":
      return (
        <group>
          <Box s={[0.36, 0.3, 0.32]} m={m.main} pos={[0, 0.2, 0]} />
          <Box s={[0.3, 0.08, 0.03]} m={m.glow} pos={[0, 0.23, -0.165]} />
          <Box s={[0.2, 0.05, 0.02]} m={m.second} pos={[0, 0.11, -0.165]} />
          <mesh position={[-0.2, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} material={m.second}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          </mesh>
          <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} material={m.second}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          </mesh>
          <Cap r={0.012} len={0.16} m={m.second} pos={[0.1, 0.44, 0]} />
          <Ball r={0.035} m={m.glow} pos={[0.1, 0.54, 0]} />
        </group>
      );
    case "zombie":
      return (
        <group>
          <Ball r={0.205} m={m.skin} pos={[0, 0.2, 0]} scale={[1, 0.95, 1]} />
          <Ball r={0.042} m={def.glow ? m.glow : m.white} pos={[-0.075, 0.23, -0.17]} />
          <Ball r={0.026} m={def.glow ? m.glow : m.accent} pos={[0.08, 0.22, -0.18]} />
          <Box s={[0.12, 0.04, 0.04]} m={m.dark} pos={[0, 0.1, -0.18]} rot={[0, 0, 0.1]} />
          <Box s={[0.12, 0.08, 0.12]} m={m.second} pos={[-0.06, 0.38, 0.04]} rot={[0.3, 0.2, 0.2]} />
          <Box s={[0.1, 0.07, 0.1]} m={m.second} pos={[0.08, 0.37, -0.04]} rot={[-0.2, 0.1, -0.3]} />
          {def.id === "zombie-military" && (
            <mesh position={[0, 0.27, 0]} rotation={[0.1, 0, 0.1]} material={m.main}>
              <sphereGeometry args={[0.225, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          )}
        </group>
      );
    case "skeleton":
      return (
        <group>
          <Ball r={0.2} m={m.main} pos={[0, 0.23, 0]} scale={[0.95, 1, 1]} />
          <Ball r={0.055} m={def.glow ? m.glow : m.dark} pos={[-0.075, 0.25, -0.155]} />
          <Ball r={0.055} m={def.glow ? m.glow : m.dark} pos={[0.075, 0.25, -0.155]} />
          <Box s={[0.03, 0.05, 0.03]} m={m.dark} pos={[0, 0.17, -0.19]} />
          <Box s={[0.2, 0.08, 0.16]} m={m.main} pos={[0, 0.07, -0.06]} />
          {[-0.06, -0.02, 0.02, 0.06].map((x) => (
            <Box key={x} s={[0.015, 0.04, 0.01]} m={m.dark} pos={[x, 0.1, -0.142]} />
          ))}
          {def.id === "skeleton-gold" && (
            <group position={[0, 0.43, 0]}>
              <mesh position={[0, 0.02, 0]} material={m.accent}><torusGeometry args={[0.16, 0.025, 8, 20]} /></mesh>
              <mesh position={[0, 0.1, 0]} material={m.accent}><cylinderGeometry args={[0.14, 0.16, 0.13, 8]} /></mesh>
              {[-0.1, 0, 0.1].map((x) => <mesh key={x} position={[x, 0.23, 0]} material={m.accent}><coneGeometry args={[0.045, 0.18, 5]} /></mesh>)}
              <Ball r={0.055} m={m.glow} pos={[0, 0.13, -0.14]} />
            </group>
          )}
        </group>
      );
    case "monkey":
      return (
        <group>
          <Ball r={0.235} m={m.main} pos={[0, 0.23, 0]} scale={[1.08, 1.14, 0.98]} />
          <Ball r={0.085} m={m.main} pos={[-0.215, 0.35, -0.005]} scale={[1, 1.08, 0.62]} />
          <Ball r={0.085} m={m.main} pos={[0.215, 0.35, -0.005]} scale={[1, 1.08, 0.62]} />
          <Ball r={0.052} m={m.accent} pos={[-0.22, 0.35, -0.055]} />
          <Ball r={0.052} m={m.accent} pos={[0.22, 0.35, -0.055]} />
          <Ball r={0.125} m={m.second} pos={[0, 0.105, -0.175]} scale={[1.28, 0.8, 0.68]} />
          <Ball r={0.085} m={m.second} pos={[-0.07, 0.145, -0.225]} scale={[1, 0.9, 0.75]} />
          <Ball r={0.085} m={m.second} pos={[0.07, 0.145, -0.225]} scale={[1, 0.9, 0.75]} />
          <Ball r={0.035} m={m.dark} pos={[0, 0.19, -0.285]} />
          <Ball r={0.042} m={m.white} pos={[-0.078, 0.29, -0.19]} />
          <Ball r={0.042} m={m.white} pos={[0.078, 0.29, -0.19]} />
          <Ball r={0.022} m={m.dark} pos={[-0.078, 0.29, -0.229]} />
          <Ball r={0.022} m={m.dark} pos={[0.078, 0.29, -0.229]} />
          <Box s={[0.11, 0.018, 0.018]} m={m.dark} pos={[0, 0.065, -0.25]} />
          <Ball r={0.035} m={m.main} pos={[-0.12, 0.43, -0.09]} />
          <Ball r={0.035} m={m.main} pos={[0.12, 0.43, -0.09]} />
        </group>
      );
    case "lizard":
      return (
        <group>
          <Ball r={0.2} m={m.main} pos={[0, 0.22, 0]} scale={[1.15, 0.9, 1.2]} />
          <Ball r={0.15} m={m.second} pos={[0, 0.13, -0.17]} scale={[1.35, 0.7, 0.7]} />
          <Ball r={0.065} m={m.accent} pos={[-0.17, 0.34, -0.04]} />
          <Ball r={0.065} m={m.accent} pos={[0.17, 0.34, -0.04]} />
          <Ball r={0.028} m={m.dark} pos={[-0.17, 0.35, -0.095]} />
          <Ball r={0.028} m={m.dark} pos={[0.17, 0.35, -0.095]} />
          <Box s={[0.16, 0.025, 0.02]} m={m.dark} pos={[0, 0.1, -0.22]} />
        </group>
      );
    case "dinosaur":
      return (
        <group>
          <Ball r={0.22} m={m.main} pos={[0, 0.23, 0]} scale={[1.1, 1.05, 1.15]} />
          <group rotation={[Math.PI / 2, 0, 0]}><Cap r={0.13} len={0.22} m={m.main} pos={[0, 0.11, -0.2]} /></group>
          <Ball r={0.035} m={m.white} pos={[-0.12, 0.28, -0.18]} />
          <Ball r={0.035} m={m.white} pos={[0.12, 0.28, -0.18]} />
          <Ball r={0.02} m={m.dark} pos={[-0.12, 0.28, -0.21]} />
          <Ball r={0.02} m={m.dark} pos={[0.12, 0.28, -0.21]} />
          {[-0.16, -0.04, 0.08, 0.2].map((x, i) => (
            <mesh key={x} position={[x, 0.43 + (i % 2) * 0.035, 0]} material={m.accent}>
              <coneGeometry args={[0.045, 0.13, 6]} />
            </mesh>
          ))}
        </group>
      );
    case "coat":
      return (
        <group>
          <Ball r={0.19} m={m.skin} pos={[0, 0.19, 0]} />
          {eyes(m.dark, 0.022, 0.21, -0.175)}
          <Box s={[0.38, 0.045, 0.32]} m={m.main} pos={[0, 0.38, 0]} />
          <Box s={[0.23, 0.12, 0.24]} m={m.main} pos={[0, 0.44, 0]} />
          <Box s={[0.07, 0.08, 0.02]} m={m.accent} pos={[0, 0.23, -0.18]} />
        </group>
      );
    case "stick":
      return <Ball r={0.18} m={m.main} pos={[0, 0.2, 0]} />;
    case "knight":
      return (
        <group>
          <mesh position={[0, 0.17, 0]} material={m.main} castShadow>
            <cylinderGeometry args={[0.2, 0.21, 0.34, 18]} />
          </mesh>
          <mesh position={[0, 0.34, 0]} material={m.main} castShadow>
            <sphereGeometry args={[0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <Box s={[0.3, 0.035, 0.04]} m={m.dark} pos={[0, 0.22, -0.2]} />
          <Box s={[0.03, 0.14, 0.04]} m={m.dark} pos={[0, 0.12, -0.2]} />
          <mesh position={[0, 0.58, 0.05]} rotation={[0.5, 0, 0]} material={m.accent} castShadow>
            <coneGeometry args={[0.06, 0.32, 8]} />
          </mesh>
          <mesh position={[0, 0.55, 0.16]} rotation={[1.2, 0, 0]} material={m.second} castShadow>
            <coneGeometry args={[0.05, 0.28, 8]} />
          </mesh>
          {def.id === "king-emerald" && (
            <group position={[0, 0.55, 0]}>
              <mesh position={[0, 0.06, 0]} material={m.accent}><torusGeometry args={[0.17, 0.025, 8, 20]} /></mesh>
              <mesh position={[0, 0.14, 0]} material={m.accent}><cylinderGeometry args={[0.14, 0.17, 0.14, 8]} /></mesh>
              {[-0.1, 0, 0.1].map((x) => <mesh key={x} position={[x, 0.27, 0]} material={m.accent}><coneGeometry args={[0.045, 0.18, 5]} /></mesh>)}
              <mesh position={[0, 0.16, -0.145]} material={m.glow}><octahedronGeometry args={[0.07, 0]} /></mesh>
            </group>
          )}
        </group>
      );
    case "soldier":
      return (
        <group>
          <Ball r={0.19} m={m.skin} pos={[0, 0.19, 0]} />
          {eyes(m.dark, 0.022, 0.21, -0.175)}
          <mesh position={[0, 0.25, 0]} material={m.main} castShadow>
            <sphereGeometry args={[0.235, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.25, 0]} material={m.main}>
            <cylinderGeometry args={[0.245, 0.245, 0.03, 18]} />
          </mesh>
          <Box s={[0.2, 0.05, 0.03]} m={m.dark} pos={[0, 0.3, -0.22]} />
        </group>
      );
    case "explorer":
      return (
        <group>
          <Ball r={0.19} m={m.skin} pos={[0, 0.19, 0]} />
          {eyes(m.dark, 0.022, 0.21, -0.175)}
          <Box s={[0.14, 0.03, 0.03]} m={m.second} pos={[0, 0.12, -0.17]} />
          <mesh position={[0, 0.32, 0]} material={m.main} castShadow>
            <cylinderGeometry args={[0.37, 0.37, 0.025, 20]} />
          </mesh>
          <mesh position={[0, 0.41, 0]} material={m.main} castShadow>
            <cylinderGeometry args={[0.16, 0.19, 0.17, 16]} />
          </mesh>
          <mesh position={[0, 0.35, 0]} material={m.second}>
            <cylinderGeometry args={[0.192, 0.192, 0.045, 16]} />
          </mesh>
        </group>
      );
    case "scientist":
      return (
        <group>
          <Ball r={0.19} m={m.skin} pos={[0, 0.19, 0]} />
          {eyes(m.dark, 0.02, 0.22, -0.18)}
          <mesh position={[-0.07, 0.22, -0.185]} material={m.accent}>
            <torusGeometry args={[0.045, 0.01, 6, 14]} />
          </mesh>
          <mesh position={[0.07, 0.22, -0.185]} material={m.accent}>
            <torusGeometry args={[0.045, 0.01, 6, 14]} />
          </mesh>
          <Box s={[0.05, 0.012, 0.012]} m={m.accent} pos={[0, 0.225, -0.19]} />
          <mesh position={[0, 0.24, 0.03]} rotation={[-0.4, 0, 0]} material={m.white} castShadow>
            <sphereGeometry args={[0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          </mesh>
          <Ball r={0.07} m={m.white} pos={[-0.17, 0.26, 0.04]} />
          <Ball r={0.07} m={m.white} pos={[0.17, 0.26, 0.04]} />
        </group>
      );
    case "alien":
      return (
        <group>
          <Ball r={0.22} m={m.skin} pos={[0, 0.26, 0]} scale={[1, 1.3, 1.05]} />
          <mesh position={[-0.09, 0.26, -0.18]} rotation={[0, 0.3, 0.5]} scale={[1.5, 0.85, 0.5]} material={m.dark}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </mesh>
          <mesh position={[0.09, 0.26, -0.18]} rotation={[0, -0.3, -0.5]} scale={[1.5, 0.85, 0.5]} material={m.dark}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </mesh>
          <Cap r={0.01} len={0.18} m={m.skin} pos={[-0.08, 0.6, 0]} />
          <Cap r={0.01} len={0.18} m={m.skin} pos={[0.08, 0.6, 0]} />
          <Ball r={0.035} m={m.glow} pos={[-0.08, 0.71, 0]} />
          <Ball r={0.035} m={m.glow} pos={[0.08, 0.71, 0]} />
        </group>
      );
  }
}

/* ---------- Limbs ---------- */
export function UpperArm({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.style === "monkey") return <group><Ball r={0.095} m={m.main} pos={[0, -0.03, 0]} /><Cap r={0.078} len={0.2} m={m.main} pos={[0, -0.15, 0]} /></group>;
  if (def.style === "monk") return <Cap r={0.085} len={0.22} m={m.main} pos={[0, -0.14, 0]} />;
  if (def.style === "robot")
    return <Box s={[0.12, 0.26, 0.12]} m={m.second} pos={[0, -0.13, 0]} />;
  if (def.style === "skeleton" || def.style === "stick") return <Cap r={0.03} len={0.24} m={m.main} pos={[0, -0.14, 0]} />;
  const mat = def.style === "alien" ? m.skin : def.style === "knight" ? m.steel : m.main;
  return <Cap r={def.style === "alien" ? 0.045 : 0.065} len={0.17} m={mat} pos={[0, -0.13, 0]} />;
}
export function Forearm({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.style === "monkey") return <group><Cap r={0.07} len={0.23} m={m.main} pos={[0, -0.12, 0]} /><Ball r={0.075} m={m.second} pos={[0, -0.28, -0.01]} />{[-1, 0, 1].map((i) => <Cap key={i} r={0.018} len={0.08} m={m.second} pos={[i * 0.035, -0.32, -0.055]} />)}</group>;
  if (def.style === "monk") return <group><Cap r={0.07} len={0.18} m={m.main} pos={[0, -0.12, 0]} /><Ball r={0.065} m={m.skin} pos={[0, -0.27, -0.015]} /></group>;
  if (def.style === "robot")
    return (
      <group>
        <Box s={[0.13, 0.24, 0.13]} m={m.main} pos={[0, -0.12, 0]} />
        <Box s={[0.13, 0.03, 0.135]} m={m.glow} pos={[0, -0.05, 0]} />
        <Box s={[0.1, 0.1, 0.1]} m={m.second} pos={[0, -0.29, 0]} />
      </group>
    );
  if (def.style === "skeleton" || def.style === "stick")
    return (
      <group>
        <Cap r={0.026} len={0.22} m={m.main} pos={[0, -0.13, 0]} />
        {def.style === "skeleton" && <Ball r={0.045} m={m.main} pos={[0, -0.28, 0]} />}
      </group>
    );
  const sleeve = def.style === "zombie" || def.style === "alien" || def.style === "explorer" ? m.skin : def.style === "knight" ? m.steel : m.main;
  const glove =
    def.style === "ninja" || def.style === "samurai" || def.style === "soldier" ? m.second : def.style === "knight" ? m.steel : m.skin;
  return (
    <group>
      <Cap r={0.066} len={0.17} m={sleeve} pos={[0, -0.12, 0]} />
      <Ball r={0.078} m={glove} pos={[0, -0.28, 0]} />
    </group>
  );
}
export function Thigh({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.style === "monkey") return <group><Ball r={0.09} m={m.main} pos={[0, -0.04, 0]} /><Cap r={0.09} len={0.31} m={m.main} pos={[0, -0.22, 0]} /></group>;
  if (def.style === "monk") return <Cap r={0.085} len={0.3} m={m.main} pos={[0, -0.22, 0]} />;
  if (def.style === "robot") return <Box s={[0.15, 0.36, 0.15]} m={m.second} pos={[0, -0.2, 0]} />;
  if (def.style === "skeleton" || def.style === "stick") return <Cap r={0.035} len={0.36} m={m.main} pos={[0, -0.22, 0]} />;
  const mat = def.style === "ninja" || def.style === "scientist" || def.style === "alien" ? m.second : def.style === "knight" ? m.steel : m.second;
  return <Cap r={0.096} len={0.28} m={mat} pos={[0, -0.22, 0]} />;
}
export function Sneakers({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.style === "monkey" || def.style === "lizard" || def.style === "dinosaur" || def.style === "skeleton") return null;
  const upper = def.style === "robot" ? m.second : def.style === "knight" ? m.steel : m.main;
  return (
    <group position={[0, -0.43, -0.09]}>
      <Ball r={0.105} m={upper} scale={[1.28, 0.78, 1.62]} />
      <Box s={[0.17, 0.035, 0.27]} m={m.white} pos={[0, -0.055, 0.005]} />
      <Box s={[0.12, 0.018, 0.025]} m={m.accent} pos={[0, 0.005, -0.09]} />
      <Box s={[0.075, 0.022, 0.09]} m={m.white} pos={[0, 0.03, -0.105]} />
      {[-0.035, 0.035].map((x) => <Box key={x} s={[0.045, 0.008, 0.012]} m={m.accent} pos={[x, 0.038, -0.1]} />)}
    </group>
  );
}

export function Shin({ def, m }: { def: CharacterDef; m: Mats }) {
  if (def.style === "monkey") return <group><Cap r={0.07} len={0.25} m={m.main} pos={[0, -0.2, 0]} /><Ball r={0.09} m={m.second} pos={[0, -0.4, -0.08]} scale={[1.2, 0.65, 1.5]} /></group>;
  if (def.style === "monk") return <group><Cap r={0.07} len={0.27} m={m.main} pos={[0, -0.2, 0]} /><Box s={[0.15, 0.08, 0.23]} m={m.second} pos={[0, -0.4, -0.04]} /></group>;
  if (def.style === "robot")
    return (
      <group>
        <Box s={[0.16, 0.36, 0.16]} m={m.main} pos={[0, -0.2, 0]} />
        <Box s={[0.17, 0.08, 0.28]} m={m.second} pos={[0, -0.41, -0.04]} />
        <Box s={[0.04, 0.2, 0.02]} m={m.glow} pos={[0, -0.2, -0.085]} />
      </group>
    );
  if (def.style === "skeleton" || def.style === "stick")
    return (
      <group>
        <Cap r={0.03} len={0.34} m={m.main} pos={[0, -0.22, 0]} />
        <Box s={[0.08, 0.05, 0.18]} m={m.main} pos={[0, -0.43, -0.04]} />
      </group>
    );
  const shin = def.style === "knight" ? m.steel : def.style === "samurai" && def.armor === "full" ? m.main : def.style === "alien" ? m.skin : m.second;
  return (
    <group>
      <Cap r={0.084} len={0.26} m={shin} pos={[0, -0.2, 0]} />

    </group>
  );
}
