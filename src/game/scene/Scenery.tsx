import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MapDef, MapId } from "../data/maps";
import { runtime } from "../runtime";
import { crowdTexture, windowsTexture } from "./textures";

const CARTOON_RAMP = (() => {
  const data = new Uint8Array([78, 78, 78, 255, 142, 142, 142, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

type Prop = { kind: string; side: number; x: number; s: number; v: number; h: number };

function mats(map: MapDef) {
  const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshToonMaterial({ color, gradientMap: CARTOON_RAMP, ...o } as THREE.MeshToonMaterialParameters);
  const glow = (c: string, i = 2) => std(c, { emissive: new THREE.Color(c), emissiveIntensity: i });
  return {
    b1: std("#ffffff", { map: windowsTexture("#ffe9a8", "#5a6b80"), roughness: 0.5 }),
    b2: std("#ffffff", { map: windowsTexture("#fff4cc", "#8a5a4a"), roughness: 0.5 }),
    b3: std("#ffffff", { map: windowsTexture("#d0f0ff", "#3a4a5a"), roughness: 0.4, metalness: 0.3 }),
    fb: std("#ffffff", { map: windowsTexture("#7ff", "#14122a"), emissive: new THREE.Color("#ffffff"), emissiveMap: windowsTexture("#7ff", "#14122a"), emissiveIntensity: 0.8 }),
    roof: std("#4a4f58"),
    pole: std("#3a3f48", { metalness: 0.6, roughness: 0.4 }),
    lamp: glow("#fff1b0", 1.5),
    trunk: std("#5a3a22"),
    pine: std("#2f5a3a"),
    snow: std("#f6fbff"),
    leaf: std("#2f7a2a"),
    leaf2: std("#3f9a34"),
    rock: std(map.id === "volcano" ? "#2a2220" : map.id === "desert" ? "#c08a50" : "#7a7670", { flatShading: true }),
    lava: glow("#ff5a10", 2.5),
    dune: std("#e4b672"),
    cactus: std("#4f8a3a"),
    ruin: std("#c9945a", { flatShading: true }),
    crowd: std("#ffffff", { map: crowdTexture() }),
    stand: std("#c8ccd4"),
    red: std("#e63946"),
    white: std("#f1faee"),
    neonC: glow("#2be0ff", 2.5),
    neonM: glow("#ff3df2", 2.5),
    holo: std("#2be0ff", { emissive: new THREE.Color("#2be0ff"), emissiveIntensity: 1.5, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    water: std("#2f7ab8", { roughness: 0.05, metalness: 0.4 }),
    parrot: std("#e63946"),
    parrotW: std("#2b7bff"),
    sign: std("#2a6a3a"),
    ice: std("#bfe6ff", { transparent: true, opacity: 0.8, roughness: 0.05 }),
    sky: std("#ffffff"),
    factory: std("#66717c"),
    factoryTrim: std("#d97732"),
    roofRed: std("#b94e3d"),
    houseWall: std(map.id === "snow" ? "#d6e5f0" : map.id === "jungle" ? "#a98a5a" : map.id === "desert" ? "#e0bd7c" : "#f0d7a7"),
    houseBlue: std(map.id === "snow" ? "#7b9db7" : map.id === "jungle" ? "#6d8b52" : "#8dbbd2"),
    parkWood: std("#795438"),
    parkGreen: std("#5b9b46"),
    fence: std("#e6dfc8"),
    pipe: std("#8b9ba6", { metalness: 0.55, roughness: 0.4 }),
    smoke: std("#cbd2d8", { transparent: true, opacity: 0.42 }),
  };
}
type SM = ReturnType<typeof mats>;

const DISTRICT_KINDS: Record<MapId, string[][]> = {
  city: [["building", "building", "lamp", "sign"], ["factory", "silo", "factory", "building"], ["house", "house", "fence", "pine"], ["parkTree", "bench", "bush", "parkTree"]],
  snow: [["pine", "pine", "snowrock"], ["house", "pine", "ice"], ["ice", "snowrock", "pine"], ["pine", "ice", "snowrock"]],
  volcano: [["spire", "lavarock"], ["silo", "spire", "lavarock"], ["house", "spire", "lavarock"], ["spire", "lavarock"]],
  jungle: [["bigtree", "bush", "parrot"], ["house", "bigtree", "bush"], ["ruin", "bigtree"], ["bigtree", "parrot", "bush"]],
  race: [["stand", "billboard"], ["tires", "flag", "stand"], ["building", "tires"], ["stand", "flag", "billboard"]],
  desert: [["dune", "cactus"], ["house", "dune", "cactus"], ["ruin", "cactus"], ["dune", "cactus", "ruin"]],
  future: [["tower", "holo"], ["building", "tower", "flyer"], ["holo", "flyer", "tower"], ["tower", "holo", "flyer"]],
};

function PropView({ p, m }: { p: Prop; m: SM }) {
  const s = p.side;
  switch (p.kind) {
    case "building": {
      const w = 6 + p.v * 4;
      const mat = [m.b1, m.b2, m.b3][Math.floor(p.v * 3)] ?? m.b1;
      return (
        <group position={[s * (8 + w / 2), 0, 0]}>
          <mesh position={[0, p.h / 2, 0]} material={mat} castShadow receiveShadow>
            <boxGeometry args={[w, p.h, 9]} />
          </mesh>
          <mesh position={[0, p.h + 0.4, 0]} material={m.roof}>
            <boxGeometry args={[w + 0.4, 0.8, 9.4]} />
          </mesh>
        </group>
      );
    }
    case "factory":
      return <group position={[s * (9 + p.v * 2), 0, 0]}>
        <mesh position={[0, p.h * 0.38, 0]} material={m.factory} castShadow receiveShadow><boxGeometry args={[7 + p.v * 3, p.h * 0.76, 11]} /></mesh>
        <mesh position={[0, p.h * 0.78, 0]} material={m.factoryTrim}><boxGeometry args={[7.2 + p.v * 3, 0.35, 11.2]} /></mesh>
        {[-2.2, 2.2].map((x) => <mesh key={x} position={[x, p.h + 2.2, -2]} material={m.pipe} castShadow><cylinderGeometry args={[0.48, 0.58, 4.4, 8]} /></mesh>)}
        <FactorySmoke material={m.smoke} y={p.h + 4.6} />
        <mesh position={[0, p.h * 0.38, 5.58]} material={m.factoryTrim}><boxGeometry args={[1.4, 1.6, 0.08]} /></mesh>
      </group>;
    case "silo":
      return <group position={[s * (8 + p.v * 4), 0, 0]}><mesh position={[0, 3.8, 0]} material={m.pipe} castShadow><cylinderGeometry args={[2.1, 2.1, 7.6, 12]} /></mesh><mesh position={[0, 7.7, 0]} material={m.factoryTrim}><coneGeometry args={[2.15, 1.5, 12]} /></mesh><mesh position={[0, 0.8, 0]} material={m.factory}><boxGeometry args={[4.6, 1.6, 4.6]} /></mesh></group>;
    case "house":
      return <group position={[s * (8 + p.v * 3), 0, 0]}><mesh position={[0, 2, 0]} material={p.v > 0.5 ? m.houseBlue : m.houseWall} castShadow receiveShadow><boxGeometry args={[5.4, 4, 5]} /></mesh><mesh position={[0, 4.5, 0]} rotation={[0, Math.PI / 4, 0]} material={m.roofRed} castShadow><coneGeometry args={[4.2, 2.1, 4]} /></mesh><mesh position={[0, 1.15, 2.54]} material={m.parkWood}><boxGeometry args={[0.95, 2.3, 0.12]} /></mesh><mesh position={[-1.35, 2.7, 2.56]} material={m.b3}><boxGeometry args={[0.95, 0.9, 0.1]} /></mesh></group>;
    case "fence":
      return <group position={[s * 6.2, 0, 0]}>{[-2, 0, 2].map((x) => <mesh key={x} position={[x, 0.65, 0]} material={m.fence}><boxGeometry args={[0.14, 1.3, 0.14]} /></mesh>)}{[0.35, 0.9].map((y) => <mesh key={y} position={[0, y, 0]} material={m.fence}><boxGeometry args={[4.2, 0.12, 0.12]} /></mesh>)}</group>;
    case "parkTree":
      return <group position={[s * (7 + p.v * 5), 0, 0]}><mesh position={[0, 1.5, 0]} material={m.trunk}><cylinderGeometry args={[0.3, 0.42, 3, 12]} /></mesh><mesh position={[0, 3.4, 0]} material={m.parkGreen} castShadow><sphereGeometry args={[2.1, 18, 14]} /></mesh><mesh position={[-1.1, 3, 0.5]} material={m.leaf2}><sphereGeometry args={[1.1, 16, 12]} /></mesh></group>;
    case "bench":
      return <group position={[s * 5.8, 0, 0]}><mesh position={[0, 0.7, 0]} material={m.parkWood}><boxGeometry args={[2.2, 0.16, 0.55]} /></mesh><mesh position={[0, 1.15, -0.22]} material={m.parkWood}><boxGeometry args={[2.2, 0.8, 0.12]} /></mesh>{[-0.8, 0.8].map((x) => <mesh key={x} position={[x, 0.35, 0]} material={m.pipe}><boxGeometry args={[0.12, 0.7, 0.45]} /></mesh>)}</group>;
    case "lamp":
      return (
        <group position={[s * 5, 0, 0]}>
          <mesh position={[0, 3, 0]} material={m.pole}>
            <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
          </mesh>
          <mesh position={[-s * 0.6, 6, 0]} material={m.lamp}>
            <boxGeometry args={[1.3, 0.2, 0.4]} />
          </mesh>
        </group>
      );
    case "sign":
      return (
        <group position={[s * 5.5, 0, 0]}>
          <mesh position={[0, 2, 0]} material={m.pole}>
            <cylinderGeometry args={[0.07, 0.07, 4, 6]} />
          </mesh>
          <mesh position={[0, 4.2, 0]} material={m.sign} castShadow>
            <boxGeometry args={[2.4, 1.2, 0.1]} />
          </mesh>
        </group>
      );
    case "pine": {
      const sc = 0.8 + p.v * 1.2;
      return (
        <group position={[s * (6 + p.v * 10), 0, 0]} scale={sc}>
          <mesh position={[0, 0.8, 0]} material={m.trunk}>
            <cylinderGeometry args={[0.25, 0.3, 1.6, 6]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 2 + i * 1.3, 0]} material={i === 2 ? m.snow : m.pine} castShadow>
              <coneGeometry args={[1.8 - i * 0.45, 2.2, 12]} />
            </mesh>
          ))}
          <mesh position={[0, 2.4, 0]} material={m.snow}>
            <coneGeometry args={[1.5, 0.6, 8]} />
          </mesh>
        </group>
      );
    }
    case "snowrock":
      return (
        <mesh position={[s * (6 + p.v * 6), 0.6, 0]} scale={[1.6, 0.9, 1.4]} material={m.snow} castShadow>
          <dodecahedronGeometry args={[1.2, 0]} />
        </mesh>
      );
    case "ice":
      return (
        <group position={[s * (6 + p.v * 5), 0, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.6 - 0.6, 1.2 + i * 0.3, 0]} rotation={[0, 0, (i - 1) * 0.3]} material={m.ice}>
              <octahedronGeometry args={[0.7 + i * 0.2, 0]} />
            </mesh>
          ))}
        </group>
      );
    case "spire":
      return (
        <mesh position={[s * (6 + p.v * 9), p.h / 2, 0]} material={m.rock} castShadow>
          <coneGeometry args={[1.5 + p.v, p.h, 6]} />
        </mesh>
      );
    case "lavarock":
      return (
        <group position={[s * (7 + p.v * 5), 0, 0]}>
          <mesh position={[0, 0.8, 0]} material={m.rock} castShadow>
            <dodecahedronGeometry args={[1.4, 0]} />
          </mesh>
          <mesh position={[0, 1.8, 0]} material={m.lava}>
            <octahedronGeometry args={[0.4, 0]} />
          </mesh>
        </group>
      );
    case "bigtree": {
      const sc = 0.8 + p.v * 0.8;
      return (
        <group position={[s * (6.5 + p.v * 9), 0, 0]} scale={sc}>
          <mesh position={[0, 6, 0]} material={m.trunk} castShadow>
            <cylinderGeometry args={[0.7, 1.2, 12, 8]} />
          </mesh>
          <mesh position={[0, 13, 0]} material={m.leaf} castShadow>
            <sphereGeometry args={[4.2, 18, 14]} />
          </mesh>
          <mesh position={[-s * 2.5, 11, 1]} material={m.leaf2}>
            <sphereGeometry args={[2.8, 16, 12]} />
          </mesh>
          <mesh position={[-s * 1.5, 5, 0]} rotation={[0, 0, -s * 0.4]} material={m.leaf}>
            <cylinderGeometry args={[0.05, 0.05, 9, 4]} />
          </mesh>
        </group>
      );
    }
    case "bush":
      return (
        <group position={[s * (5.2 + p.v * 2), 0, 0]}>
          <mesh position={[0, 0.6, 0]} material={m.leaf2} castShadow>
            <sphereGeometry args={[1.1, 8, 6]} />
          </mesh>
          <mesh position={[0.9, 0.5, 0.5]} material={m.leaf}>
            <sphereGeometry args={[0.8, 14, 10]} />
          </mesh>
        </group>
      );
    case "parrot":
      return <Parrot side={s} m={m} v={p.v} />;
    case "stand":
      return (
        <group position={[s * 11, 0, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[s * i * 1.4, 0.7 + i * 1.2, 0]} material={i % 2 ? m.stand : m.crowd} castShadow receiveShadow>
              <boxGeometry args={[1.4, 1.4 + i * 2.4, 14]} />
            </mesh>
          ))}
          <mesh position={[s * 2, 7.6, 0]} material={m.red}>
            <boxGeometry args={[6, 0.25, 14.5]} />
          </mesh>
        </group>
      );
    case "billboard":
      return (
        <group position={[s * 6.5, 0, 0]}>
          <mesh position={[0, 2.5, 0]} material={m.pole}>
            <boxGeometry args={[0.2, 5, 0.2]} />
          </mesh>
          <mesh position={[0, 5, 0]} rotation={[0, s * 0.3, 0]} material={p.v > 0.5 ? m.red : m.white} castShadow>
            <boxGeometry args={[0.3, 2.2, 6]} />
          </mesh>
        </group>
      );
    case "tires":
      return (
        <group position={[s * 5, 0, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.25 + i * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={i % 2 ? m.red : m.white}>
              <torusGeometry args={[0.5, 0.2, 6, 12]} />
            </mesh>
          ))}
        </group>
      );
    case "flag":
      return (
        <group position={[s * 6, 0, 0]}>
          <mesh position={[0, 3, 0]} material={m.pole}>
            <cylinderGeometry args={[0.05, 0.05, 6, 6]} />
          </mesh>
          <mesh position={[0, 5.4, 0.7]} material={p.v > 0.5 ? m.red : m.white}>
            <boxGeometry args={[0.04, 1, 1.4]} />
          </mesh>
        </group>
      );
    case "dune":
      return (
        <mesh position={[s * (9 + p.v * 10), -1, 0]} scale={[2.5 + p.v * 2, 1.2 + p.v, 2.5]} material={m.dune} receiveShadow>
          <sphereGeometry args={[2.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      );
    case "cactus": {
      const sc = 0.8 + p.v * 0.7;
      return (
        <group position={[s * (5.5 + p.v * 6), 0, 0]} scale={sc}>
          <mesh position={[0, 1.6, 0]} material={m.cactus} castShadow>
            <capsuleGeometry args={[0.32, 2.6, 4, 8]} />
          </mesh>
          <mesh position={[0.6, 2, 0]} material={m.cactus} castShadow>
            <capsuleGeometry args={[0.2, 0.9, 4, 8]} />
          </mesh>
          <mesh position={[-0.55, 2.4, 0]} material={m.cactus} castShadow>
            <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
          </mesh>
        </group>
      );
    }
    case "ruin":
      return (
        <group position={[s * (6.5 + p.v * 4), 0, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, (1.5 + i * 0.8) / 2, i * 2.2 - 2.2]} material={m.ruin} castShadow>
              <cylinderGeometry args={[0.45, 0.5, 1.5 + ((i * 1.7 + p.v * 3) % 3), 8]} />
            </mesh>
          ))}
          <mesh position={[0, 0.3, 0]} rotation={[0, 0.4, Math.PI / 2]} material={m.ruin}>
            <cylinderGeometry args={[0.45, 0.45, 2.2, 8]} />
          </mesh>
        </group>
      );
    case "tower": {
      const w = 4 + p.v * 4;
      return (
        <group position={[s * (8 + w / 2), 0, 0]}>
          <mesh position={[0, p.h / 2, 0]} material={m.fb} castShadow>
            <boxGeometry args={[w, p.h, 7]} />
          </mesh>
          <mesh position={[-s * (w / 2 + 0.05), p.h / 2, 0]} material={p.v > 0.5 ? m.neonC : m.neonM}>
            <boxGeometry args={[0.1, p.h, 0.25]} />
          </mesh>
          <mesh position={[0, p.h + 0.15, 0]} material={p.v > 0.5 ? m.neonM : m.neonC}>
            <boxGeometry args={[w, 0.3, 7]} />
          </mesh>
        </group>
      );
    }
    case "holo":
      return <Holo side={s} m={m} />;
    case "flyer":
      return <Flyer side={s} m={m} v={p.v} />;
  }
  return null;
}

function Parrot({ side, m, v }: { side: number; m: SM; v: number }) {
  const g = useRef<THREE.Group>(null!);
  const wl = useRef<THREE.Mesh>(null!);
  const wr = useRef<THREE.Mesh>(null!);
  useFrame((st) => {
    const t = st.clock.elapsedTime + v * 10;
    g.current.position.set(side * (4 + Math.sin(t * 0.5) * 2), 5 + Math.sin(t * 1.3) * 0.8, Math.cos(t * 0.5) * 3);
    wl.current.rotation.z = Math.sin(t * 14) * 0.8;
    wr.current.rotation.z = -Math.sin(t * 14) * 0.8;
  });
  return (
    <group ref={g}>
      <mesh material={m.parrot}>
        <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
      </mesh>
      <mesh ref={wl} position={[-0.25, 0.05, 0]} material={m.parrotW}>
        <boxGeometry args={[0.5, 0.04, 0.25]} />
      </mesh>
      <mesh ref={wr} position={[0.25, 0.05, 0]} material={m.parrotW}>
        <boxGeometry args={[0.5, 0.04, 0.25]} />
      </mesh>
    </group>
  );
}
function Holo({ side, m }: { side: number; m: SM }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((st) => {
    g.current.rotation.y = st.clock.elapsedTime * 1.2;
  });
  return (
    <group position={[side * 6.5, 4, 0]}>
      <group ref={g}>
        <mesh material={m.holo}>
          <torusGeometry args={[1.6, 0.05, 6, 32]} />
        </mesh>
        <mesh material={m.holo}>
          <icosahedronGeometry args={[0.9, 0]} />
        </mesh>
      </group>
      <mesh position={[0, -2.5, 0]} material={m.neonC}>
        <cylinderGeometry args={[0.6, 0.8, 0.3, 12]} />
      </mesh>
    </group>
  );
}
function Flyer({ side, m, v }: { side: number; m: SM; v: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((st) => {
    const t = st.clock.elapsedTime * (0.3 + v * 0.3) + v * 7;
    g.current.position.set(side * (3 + ((t * 8) % 20) - 6), 9 + v * 6, 0);
  });
  return (
    <group ref={g}>
      <mesh material={m.fb} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.6, 2.4, 4, 10]} />
      </mesh>
      <mesh position={[0, -0.55, 0]} material={side > 0 ? m.neonM : m.neonC}>
        <boxGeometry args={[2.6, 0.08, 0.8]} />
      </mesh>
    </group>
  );
}

const SPAN = 260;

export function Scenery({ map, perSide }: { map: MapDef; perSide: number }) {
  const m = useMemo(() => mats(map), [map]);
  useEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m]);
  const props = useMemo(() => {
    const list: Prop[] = [];
    const districtKinds = DISTRICT_KINDS[map.id];
    const step = SPAN / perSide;
    for (const side of [-1, 1])
      for (let i = 0; i < perSide; i++) {
        const v = Math.random();
        const worldS = -70 + i * step + Math.random() * step * 0.6;
        const segment = Math.floor((((worldS % SPAN) + SPAN) % SPAN) / 65);
        const kinds = districtKinds[segment] ?? districtKinds[0] ?? ["building"];
        list.push({
          kind: kinds[Math.floor(Math.random() * kinds.length)] ?? "building",
          side,
          x: 0,
          s: worldS,
          v,
          h: map.id === "city" ? 12 + v * 26 : map.id === "future" ? 18 + v * 40 : map.id === "volcano" ? 6 + v * 12 : 0,
        });
      }
    return list;
  }, [map, perSide]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const d = runtime.sim?.dist ?? 0;
    props.forEach((p, i) => {
      while (p.s < d - 70) p.s += SPAN;
      while (p.s > d + SPAN - 70) p.s -= SPAN;
      const g = refs.current[i];
      if (g) g.position.z = -(p.s - d);
    });
  });
  return (
    <group>
      {props.map((p, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <PropView p={p} m={m} />
        </group>
      ))}
      <AmbientPeople map={map} />
      <Overheads map={map} m={m} />
      <Backdrop map={map} m={m} />
    </group>
  );
}

/** Arches / tunnels / gantries spanning the track, far above any hitbox. */
function Overheads({ map, m }: { map: MapDef; m: SM }) {
  const items = useMemo(() => [0, 1, 2].map((i) => ({ s: 40 + i * 85 })), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const d = runtime.sim?.dist ?? 0;
    items.forEach((it, i) => {
      while (it.s < d - 40) it.s += 255;
      const g = refs.current[i];
      if (g) g.position.z = -(it.s - d);
    });
  });
  const body = (() => {
    switch (map.id) {
      case "city":
        return (
          <group>
            <mesh position={[-5.5, 4, -6]} material={m.b1} castShadow>
              <boxGeometry args={[1.6, 8, 12]} />
            </mesh>
            <mesh position={[5.5, 4, -6]} material={m.b1} castShadow>
              <boxGeometry args={[1.6, 8, 12]} />
            </mesh>
            <mesh position={[0, 8.6, -6]} material={m.roof} castShadow>
              <boxGeometry args={[12.6, 1.4, 12]} />
            </mesh>
            <mesh position={[0, 7.4, 0.05]} material={m.lamp}>
              <boxGeometry args={[9, 0.2, 0.1]} />
            </mesh>
          </group>
        );
      case "race":
        return (
          <group>
            <mesh position={[-5.5, 3.5, 0]} material={m.pole}>
              <boxGeometry args={[0.4, 7, 0.4]} />
            </mesh>
            <mesh position={[5.5, 3.5, 0]} material={m.pole}>
              <boxGeometry args={[0.4, 7, 0.4]} />
            </mesh>
            <mesh position={[0, 7, 0]} material={m.red} castShadow>
              <boxGeometry args={[11.4, 1.4, 0.5]} />
            </mesh>
            <mesh position={[0, 7, 0.26]} material={m.crowd}>
              <boxGeometry args={[10, 1, 0.05]} />
            </mesh>
          </group>
        );
      case "future":
        return (
          <mesh position={[0, 4, 0]} material={m.neonC}>
            <torusGeometry args={[6, 0.12, 6, 40, Math.PI]} />
          </mesh>
        );
      case "jungle":
        return (
          <group>
            <mesh position={[0, 9, 0]} rotation={[0, 0, Math.PI / 2]} material={m.trunk} castShadow>
              <cylinderGeometry args={[0.5, 0.6, 16, 8]} />
            </mesh>
            {[-3, -1, 1, 3].map((x) => (
              <mesh key={x} position={[x, 7, 0]} material={m.leaf}>
                <cylinderGeometry args={[0.05, 0.05, 4, 4]} />
              </mesh>
            ))}
          </group>
        );
      case "snow":
        return (
          <mesh position={[0, 0, 0]} material={m.ice}>
            <torusGeometry args={[6.5, 0.5, 6, 24, Math.PI]} />
          </mesh>
        );
      case "volcano":
        return (
          <mesh position={[0, 0, 0]} material={m.rock} castShadow>
            <torusGeometry args={[6.8, 1, 5, 14, Math.PI]} />
          </mesh>
        );
      default:
        return null;
    }
  })();
  if (!body) return null;
  return (
    <>
      {items.map((_, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          {body}
        </group>
      ))}
    </>
  );
}

/** Far, static silhouettes that give the map depth. */
function Backdrop({ map, m }: { map: MapDef; m: SM }) {
  switch (map.id) {
    case "snow":
      return (
        <group position={[0, 0, -170]}>
          {[-90, -45, 0, 50, 100].map((x, i) => (
            <group key={x}>
              <mesh position={[x, 25 + (i % 2) * 12, 0]} material={m.rock}>
                <coneGeometry args={[38, 55 + (i % 2) * 22, 6]} />
              </mesh>
              <mesh position={[x, 42 + (i % 2) * 22, 0]} material={m.snow}>
                <coneGeometry args={[17, 22, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "volcano":
      return (
        <group position={[0, 0, -160]}>
          {[-70, 60].map((x, i) => (
            <group key={x}>
              <mesh position={[x, 28, 0]} material={m.rock}>
                <cylinderGeometry args={[10 + i * 3, 42, 56, 10, 1]} />
              </mesh>
              <mesh position={[x, 56.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.lava}>
                <circleGeometry args={[9.5 + i * 3, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "desert":
      return (
        <group position={[0, 0, -165]}>
          {[-60, -25, 70].map((x, i) => (
            <mesh key={x} position={[x, 14 + i * 3, 0]} rotation={[0, Math.PI / 4, 0]} material={m.ruin}>
              <coneGeometry args={[22 + i * 4, 30 + i * 6, 4]} />
            </mesh>
          ))}
        </group>
      );
    case "jungle":
      return (
        <mesh position={[18, 0.02, -60]} rotation={[-Math.PI / 2, 0, 0]} material={m.water}>
          <planeGeometry args={[14, 400]} />
        </mesh>
      );
    case "city":
    case "future":
      return (
        <group position={[0, 0, -175]}>
          {Array.from({ length: 14 }).map((_, i) => {
            const h = 30 + ((i * 37) % 50);
            return (
              <mesh key={i} position={[-110 + i * 17, h / 2, (i % 3) * -8]} material={map.id === "future" ? m.fb : m.b3}>
                <boxGeometry args={[14, h, 10]} />
              </mesh>
            );
          })}
        </group>
      );
    default:
      return null;
  }
}


/** Stylized pedestrians, workers and locals, kept on the sidewalks. */
function AmbientPeople({ map }: { map: MapDef }) {
  const people = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const district = Math.floor(i / 2);
    const side = i % 2 === 0 ? -1 : 1;
    const palette: Record<MapId, string[]> = {
      city: ["#3b6da8", "#d97732", "#d6a66d", "#4c9a58"], snow: ["#3978bd", "#d34c4c", "#6a8a9c", "#e2a84a"],
      volcano: ["#c65a2e", "#6b5142", "#d28a38", "#8b3b2d"], jungle: ["#477a3e", "#b58a42", "#2f8b70", "#c65b37"],
      race: ["#e63946", "#f1f1f1", "#2878b8", "#f0b429"], desert: ["#c99b5b", "#6c8b54", "#b86c42", "#e1c58b"],
      future: ["#2be0ff", "#ff3df2", "#9b7bff", "#52e0a0"],
    };
    return { id: i, district, side, s: 12 + district * 65 + (side > 0 ? 25 : 0), color: palette[map.id][district] ?? "#4c83a8", phase: i * 1.7, helmet: (map.id === "city" && district === 1) || (map.id === "volcano" && district === 1), talk: (map.id === "city" && (district === 2 || district === 3)) || (map.id === "race" && district === 1) };
  }), [map]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const d = runtime.sim?.dist ?? 0;
    people.forEach((person, i) => {
      const g = refs.current[i];
      if (!g) return;
      let z = person.s;
      while (z < d - 70) z += SPAN;
      while (z > d + SPAN - 70) z -= SPAN;
      g.position.set(person.side * (5.8 + (person.id % 3) * 0.45), 0, -(z - d));
      const t = state.clock.elapsedTime * (person.talk ? 1.4 : 3.1) + person.phase;
      if (arms.current[i]) arms.current[i]!.rotation.z = person.talk ? Math.sin(t) * 0.45 : Math.sin(t) * 0.62;
      if (legs.current[i]) legs.current[i]!.rotation.x = person.talk ? 0 : Math.sin(t) * 0.42;
      g.rotation.y = person.side < 0 ? 0.28 : -0.28;
    });
  });
  return <group>{people.map((p, i) => <group key={p.id} ref={(el) => void (refs.current[i] = el)}>
    <mesh position={[0, 1.02, 0]} castShadow><capsuleGeometry args={[0.22, 0.58, 4, 8]} /><meshToonMaterial color={p.color} /></mesh>
    <mesh position={[0, 1.82, 0]} castShadow><sphereGeometry args={[0.23, 12, 10]} /><meshToonMaterial color="#d9a47d" /></mesh>
    <mesh position={[0, 1.9, -0.03]}><sphereGeometry args={[0.235, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshToonMaterial color={p.helmet ? "#f0b52e" : "#34313b"} /></mesh>
    {p.helmet && <mesh position={[0, 2.02, 0]}><cylinderGeometry args={[0.26, 0.25, 0.12, 10]} /><meshToonMaterial color="#e5a52b" /></mesh>}
    <group ref={(el) => void (arms.current[i] = el)} position={[0, 1.34, 0]}>
      <mesh position={[-0.28, -0.22, 0]} rotation={[0, 0, -0.18]}><capsuleGeometry args={[0.075, 0.42, 3, 6]} /><meshToonMaterial color={p.color} /></mesh>
      <mesh position={[0.28, -0.22, 0]} rotation={[0, 0, 0.18]}><capsuleGeometry args={[0.075, 0.42, 3, 6]} /><meshToonMaterial color={p.color} /></mesh>
    </group>
    <group ref={(el) => void (legs.current[i] = el)} position={[0, 0.66, 0]}>
      <mesh position={[-0.12, -0.24, 0]}><capsuleGeometry args={[0.085, 0.42, 3, 6]} /><meshToonMaterial color="#303440" /></mesh>
      <mesh position={[0.12, -0.24, 0]}><capsuleGeometry args={[0.085, 0.42, 3, 6]} /><meshToonMaterial color="#303440" /></mesh>
    </group>
  </group>)}</group>;
}


function FactorySmoke({ material, y }: { material: THREE.Material; y: number }) {
  const puff = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.55;
    if (!puff.current) return;
    puff.current.position.y = y + (t % 1.8) * 0.7;
    const scale = 0.72 + ((t % 1.8) / 1.8) * 0.55;
    puff.current.scale.setScalar(scale);
    puff.current.rotation.y = t * 0.3;
  });
  return <group ref={puff} position={[0, y, -2]}><mesh material={material}><sphereGeometry args={[1.05, 8, 6]} /></mesh><mesh position={[0.7, 0.35, 0]} material={material}><sphereGeometry args={[0.72, 14, 10]} /></mesh></group>;
}
