import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MapDef, MapId } from "../data/maps";
import { runtime } from "../runtime";
import { LANE_W } from "../sim/constants";
import type { Sim } from "../sim/sim";
import type { Obstacle } from "../sim/types";
import { crowdTexture, stripeTexture, windowsTexture } from "./textures";

type M = ReturnType<typeof makeMats>;

function makeMats(map: MapDef) {
  const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
  const glow = (color: string, i = 2) => std(color, { emissive: new THREE.Color(color), emissiveIntensity: i, roughness: 0.3 });
  const id = map.id;
  const trainColor: Record<MapId, string> = { city: "#d9dde3", snow: "#c8202a", volcano: "#3a3330", jungle: "#6b4a2b", race: "#f4f4f4", desert: "#8a5a32", future: "#eef2ff" };
  const stripe: Record<MapId, string> = { city: "#f28c28", snow: "#f4f4f4", volcano: "#ff5a1f", jungle: "#3e7a2a", race: "#e63946", desert: "#d9b26a", future: "#2be0ff" };
  const carColor: Record<MapId, string> = { city: "#ffcc00", snow: "#2a6fdb", volcano: "#6a4a30", jungle: "#4a6b2a", race: "#e63946", desert: "#c9a06a", future: "#ff3df2" };
  const train = std(trainColor[id], { metalness: id === "jungle" ? 0 : 0.5, roughness: id === "jungle" ? 0.95 : 0.35 });
  const windows = std("#ffffff", {
    map: windowsTexture(id === "future" ? "#9ff" : "#ffe9a8", "#1b2333"),
    emissive: new THREE.Color(id === "future" ? "#2be0ff" : "#000000"),
    emissiveIntensity: id === "future" ? 0.6 : 0,
    roughness: 0.2,
    metalness: 0.4,
  });
  return {
    id,
    train,
    stripe: id === "future" ? glow(stripe[id], 2.5) : std(stripe[id]),
    windows,
    car: std(carColor[id], { metalness: 0.5, roughness: 0.3 }),
    glass: std("#20303f", { metalness: 0.8, roughness: 0.1 }),
    tire: std("#151515", { roughness: 0.9 }),
    metal: std("#8a9099", { metalness: 0.8, roughness: 0.3 }),
    wood: std("#9a6a3a", { roughness: 0.9 }),
    darkwood: std("#5a3a1e", { roughness: 0.95 }),
    rock: std(id === "volcano" ? "#2a2422" : id === "desert" ? "#c9a06a" : "#6f6a64", { roughness: 0.95, flatShading: true }),
    moss: std("#4a8a2a", { roughness: 1 }),
    snow: std("#f6fbff", { roughness: 0.9 }),
    ice: std("#a8dcff", { transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.1 }),
    lava: glow("#ff5a10", 2.5),
    red: std("#d62828"),
    orange: std("#ff7a1a"),
    white: std("#f4f4f4"),
    yellow: std("#ffcc00"),
    sand: std("#d8b27a", { roughness: 1 }),
    sandstone: std("#c9945a", { roughness: 0.95, flatShading: true }),
    barricade: std("#ffffff", { map: stripeTexture("#d62828", "#f4f4f4") }),
    hazard: std("#ffffff", { map: stripeTexture("#111111", "#ffcc00") }),
    crowd: std("#ffffff", { map: crowdTexture() }),
    laser: glow("#ff2040", 3),
    holo: std("#ff3df2", { emissive: new THREE.Color("#ff3df2"), emissiveIntensity: 1.6, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    neon: glow("#2be0ff", 2.5),
    cargo: std("#2a2f45", { metalness: 0.6, roughness: 0.3 }),
    vine: std("#2f7a2a", { roughness: 1 }),
    water: std(id === "snow" ? "#1d3f66" : "#2a6aa0", { roughness: 0.05, metalness: 0.3 }),
    oil: std("#050505", { roughness: 0.05, metalness: 0.9 }),
    pit: std("#0a0a0c", { roughness: 1 }),
    quicksand: std("#8a6232", { roughness: 1 }),
    void: glow("#5a1aff", 1.8),
    barrelBlue: std("#2a6fdb", { metalness: 0.4, roughness: 0.4 }),
    barrelRed: std("#c92a2a", { metalness: 0.4, roughness: 0.4 }),
    clay: std("#b5603a", { roughness: 0.9 }),
  };
}

const B = ({ s, m, p, r }: { s: [number, number, number]; m: THREE.Material; p: [number, number, number]; r?: [number, number, number] }) => (
  <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);
const Cyl = ({ a, m, p, r }: { a: [number, number, number, number?]; m: THREE.Material; p: [number, number, number]; r?: [number, number, number] }) => (
  <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
    <cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 14]} />
  </mesh>
);
const Rock = ({ r, m, p, s }: { r: number; m: THREE.Material; p: [number, number, number]; s?: [number, number, number] }) => (
  <mesh position={p} scale={s} material={m} castShadow receiveShadow>
    <dodecahedronGeometry args={[r, 0]} />
  </mesh>
);
const RX = Math.PI / 2;

function Low({ m, v }: { m: M; v: number }) {
  switch (m.id) {
    case "city":
      return (
        <group>
          <B s={[0.12, 1, 0.4]} m={m.metal} p={[-0.85, 0.5, 0]} />
          <B s={[0.12, 1, 0.4]} m={m.metal} p={[0.85, 0.5, 0]} />
          <B s={[2, 0.28, 0.08]} m={m.barricade} p={[0, 0.82, 0]} />
          <B s={[2, 0.28, 0.08]} m={m.barricade} p={[0, 0.45, 0]} />
        </group>
      );
    case "snow":
      return (
        <group>
          <Cyl a={[0.42, 0.42, 2.1]} m={m.darkwood} p={[0, 0.42, 0]} r={[0, 0, RX]} />
          <B s={[2.1, 0.18, 0.5]} m={m.snow} p={[0, 0.88, 0]} />
        </group>
      );
    case "volcano":
      return (
        <group>
          <Rock r={0.55} m={m.rock} p={[-0.6, 0.45, 0]} />
          <Rock r={0.6} m={m.rock} p={[0.5, 0.5, 0.05]} />
          <Rock r={0.22} m={m.lava} p={[0, 0.25, -0.2]} />
        </group>
      );
    case "jungle":
      return (
        <group>
          <Cyl a={[0.45, 0.5, 2.2]} m={m.darkwood} p={[0, 0.45, 0]} r={[0, 0.1, RX]} />
          <Rock r={0.25} m={m.moss} p={[-0.4, 0.85, 0]} s={[1.4, 0.5, 1]} />
          <Rock r={0.2} m={m.moss} p={[0.5, 0.82, 0]} s={[1.4, 0.5, 1]} />
        </group>
      );
    case "race":
      return (
        <group>
          <B s={[2, 0.55, 0.5]} m={m.barricade} p={[0, 0.28, 0]} />
          {[-0.7, 0, 0.7].map((x) => (
            <mesh key={x} position={[x, 0.78, 0]} material={m.orange} castShadow>
              <coneGeometry args={[0.18, 0.45, 12]} />
            </mesh>
          ))}
        </group>
      );
    case "desert":
      return (
        <group>
          {[-0.65, 0, 0.65].map((x) => (
            <mesh key={x} position={[x, 0.22, 0]} rotation={[0, 0, RX]} material={m.sand} castShadow>
              <capsuleGeometry args={[0.2, 0.42, 4, 8]} />
            </mesh>
          ))}
          {[-0.32, 0.32].map((x) => (
            <mesh key={x} position={[x, 0.6, 0]} rotation={[0, 0, RX]} material={m.sand} castShadow>
              <capsuleGeometry args={[0.2, 0.42, 4, 8]} />
            </mesh>
          ))}
          {v === 1 && <Cyl a={[0.1, 0.12, 1]} m={m.moss} p={[0.95, 0.5, 0]} />}
        </group>
      );
    default:
      return (
        <group>
          <B s={[0.14, 1.05, 0.3]} m={m.cargo} p={[-0.95, 0.52, 0]} />
          <B s={[0.14, 1.05, 0.3]} m={m.cargo} p={[0.95, 0.52, 0]} />
          {[0.3, 0.6, 0.9].map((y) => (
            <B key={y} s={[1.9, 0.05, 0.05]} m={m.laser} p={[0, y, 0]} />
          ))}
        </group>
      );
  }
}

function High({ m }: { m: M }) {
  const posts = (mat: THREE.Material) => (
    <>
      <B s={[0.16, 3.4, 0.3]} m={mat} p={[-1.02, 1.7, 0]} />
      <B s={[0.16, 3.4, 0.3]} m={mat} p={[1.02, 1.7, 0]} />
    </>
  );
  switch (m.id) {
    case "city":
      return (
        <group>
          {posts(m.metal)}
          <B s={[2.1, 1.1, 0.12]} m={m.hazard} p={[0, 1.8, 0]} />
          <B s={[2.2, 0.2, 0.3]} m={m.metal} p={[0, 3.3, 0]} />
        </group>
      );
    case "snow":
      return (
        <group>
          {posts(m.ice)}
          <B s={[2.1, 1.3, 0.5]} m={m.ice} p={[0, 1.9, 0]} />
          <B s={[2.2, 0.25, 0.55]} m={m.snow} p={[0, 2.65, 0]} />
        </group>
      );
    case "volcano":
      return (
        <group>
          <Rock r={0.5} m={m.rock} p={[-1, 0.9, 0]} s={[0.6, 2, 0.7]} />
          <Rock r={0.5} m={m.rock} p={[1, 0.9, 0]} s={[0.6, 2, 0.7]} />
          <Rock r={0.9} m={m.rock} p={[0, 2.1, 0]} s={[1.3, 0.75, 0.5]} />
          <B s={[1.4, 0.08, 0.1]} m={m.lava} p={[0, 1.5, -0.2]} />
        </group>
      );
    case "jungle":
      return (
        <group>
          <Cyl a={[0.28, 0.28, 2.6]} m={m.darkwood} p={[0, 2.2, 0]} r={[0, 0, RX]} />
          {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
            <Cyl key={x} a={[0.04, 0.04, 0.9 + (i % 2) * 0.3, 6]} m={m.vine} p={[x, 1.65 - (i % 2) * 0.15, 0]} />
          ))}
          {posts(m.darkwood)}
        </group>
      );
    case "race":
      return (
        <group>
          {posts(m.metal)}
          <B s={[2.1, 1.0, 0.1]} m={m.crowd} p={[0, 1.75, 0]} />
          <B s={[2.2, 0.3, 0.3]} m={m.red} p={[0, 2.4, 0]} />
        </group>
      );
    case "desert":
      return (
        <group>
          <B s={[0.45, 3.4, 0.6]} m={m.sandstone} p={[-1, 1.7, 0]} />
          <B s={[0.45, 2.8, 0.6]} m={m.sandstone} p={[1, 1.4, 0]} />
          <B s={[2.5, 0.9, 0.6]} m={m.sandstone} p={[0, 1.65, 0]} r={[0, 0, 0.06]} />
        </group>
      );
    default:
      return (
        <group>
          {posts(m.neon)}
          <B s={[2, 1.2, 0.05]} m={m.holo} p={[0, 1.8, 0]} />
          <B s={[2.1, 0.06, 0.06]} m={m.neon} p={[0, 1.2, 0]} />
        </group>
      );
  }
}

function Crate({ m, v }: { m: M; v: number }) {
  switch (m.id) {
    case "city":
      if (v === 1)
        return (
          <group>
            <Cyl a={[0.42, 0.42, 1.2]} m={m.barrelBlue} p={[-0.5, 0.6, -0.8]} />
            <Cyl a={[0.42, 0.42, 1.2]} m={m.barrelRed} p={[0.45, 0.6, -0.8]} />
          </group>
        );
      return (
        <group>
          <B s={[1.9, 1.2, 1.6]} m={m.wood} p={[0, 0.6, -0.8]} />
          <B s={[1.95, 0.12, 1.65]} m={m.darkwood} p={[0, 1.1, -0.8]} />
          <B s={[1.95, 0.12, 1.65]} m={m.darkwood} p={[0, 0.1, -0.8]} />
        </group>
      );
    case "snow":
      if (v === 2)
        return (
          <group>
            <mesh position={[0, 0.4, -0.8]} material={m.snow} castShadow><sphereGeometry args={[0.5, 14, 10]} /></mesh>
            <mesh position={[0, 0.95, -0.8]} material={m.snow} castShadow><sphereGeometry args={[0.33, 14, 10]} /></mesh>
            <mesh position={[0, 0.95, -1.15]} rotation={[-RX, 0, 0]} material={m.orange}><coneGeometry args={[0.06, 0.25, 8]} /></mesh>
            <B s={[1.9, 0.4, 1.6]} m={m.ice} p={[0, 0.2, -0.8]} />
          </group>
        );
      return <B s={[1.9, 1.2, 1.6]} m={m.ice} p={[0, 0.6, -0.8]} />;
    case "volcano":
      return <Rock r={0.95} m={m.rock} p={[0, 0.6, -0.8]} s={[1.05, 0.68, 0.9]} />;
    case "jungle":
      return v === 0 ? (
        <group>
          <Cyl a={[0.85, 0.95, 1.2]} m={m.darkwood} p={[0, 0.6, -0.8]} />
          <Cyl a={[0.8, 0.8, 0.05]} m={m.wood} p={[0, 1.21, -0.8]} />
        </group>
      ) : (
        <group>
          <Rock r={0.95} m={m.rock} p={[0, 0.6, -0.8]} s={[1.05, 0.66, 0.9]} />
          <Rock r={0.6} m={m.moss} p={[0, 1.05, -0.8]} s={[1.3, 0.3, 1]} />
        </group>
      );
    case "race":
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <group key={i}>
              <mesh position={[-0.48, 0.15 + i * 0.3, -0.8]} rotation={[RX, 0, 0]} material={m.tire} castShadow>
                <torusGeometry args={[0.35, 0.15, 8, 16]} />
              </mesh>
              <mesh position={[0.48, 0.15 + i * 0.3, -0.8]} rotation={[RX, 0, 0]} material={i % 2 ? m.white : m.tire} castShadow>
                <torusGeometry args={[0.35, 0.15, 8, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "desert":
      return (
        <group>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.6, -0.8]} material={m.clay} castShadow scale={[1, 1.3, 1]}>
              <sphereGeometry args={[0.46, 14, 10]} />
            </mesh>
          ))}
          <Cyl a={[0.15, 0.2, 0.2]} m={m.clay} p={[-0.5, 1.2, -0.8]} />
          <Cyl a={[0.15, 0.2, 0.2]} m={m.clay} p={[0.5, 1.2, -0.8]} />
        </group>
      );
    default:
      return (
        <group>
          <B s={[1.9, 1.2, 1.6]} m={m.cargo} p={[0, 0.6, -0.8]} />
          <B s={[1.92, 0.05, 1.62]} m={m.neon} p={[0, 1.18, -0.8]} />
          <B s={[1.92, 0.05, 1.62]} m={m.neon} p={[0, 0.05, -0.8]} />
        </group>
      );
  }
}

function Car({ m }: { m: M }) {
  const hover = m.id === "future";
  const wheels = !hover && (
    <>
      {[-0.85, 0.85].map((x) =>
        [-0.8, -3.4].map((z) => <Cyl key={`${x}${z}`} a={[0.34, 0.34, 0.25, 12]} m={m.tire} p={[x, 0.34, z]} r={[0, 0, RX]} />),
      )}
    </>
  );
  if (m.id === "race")
    return (
      <group>
        <B s={[1.8, 0.55, 4.0]} m={m.car} p={[0, 0.55, -2.1]} />
        <B s={[0.9, 0.45, 1.3]} m={m.glass} p={[0, 1.0, -2.3]} />
        <B s={[1.9, 0.1, 0.5]} m={m.car} p={[0, 1.4, -0.3]} />
        <B s={[0.1, 0.55, 0.3]} m={m.tire} p={[-0.6, 1.1, -0.3]} />
        <B s={[0.1, 0.55, 0.3]} m={m.tire} p={[0.6, 1.1, -0.3]} />
        <B s={[0.3, 0.05, 4.05]} m={m.white} p={[0, 0.84, -2.1]} />
        {wheels}
      </group>
    );
  if (m.id === "volcano")
    return (
      <group>
        <B s={[1.8, 1.0, 4.0]} m={m.metal} p={[0, 0.85, -2.1]} />
        <Rock r={0.7} m={m.rock} p={[0, 1.3, -1.4]} />
        <Rock r={0.6} m={m.lava} p={[0, 1.2, -2.8]} />
        {wheels}
      </group>
    );
  return (
    <group position={[0, hover ? 0.25 : 0, 0]}>
      <B s={[1.8, 0.7, 4.1]} m={m.car} p={[0, 0.65, -2.1]} />
      <B s={[1.6, 0.55, 2.2]} m={m.glass} p={[0, 1.22, -2.3]} />
      <B s={[1.55, 0.04, 2.0]} m={m.car} p={[0, 1.5, -2.3]} />
      <B s={[0.3, 0.12, 0.05]} m={m.yellow} p={[-0.6, 0.75, -4.16]} />
      <B s={[0.3, 0.12, 0.05]} m={m.yellow} p={[0.6, 0.75, -4.16]} />
      {hover ? <B s={[1.6, 0.06, 3.8]} m={m.neon} p={[0, 0.28, -2.1]} /> : wheels}
      {m.id === "city" && <B s={[0.5, 0.15, 0.3]} m={m.white} p={[0, 1.6, -2.3]} />}
    </group>
  );
}

function Train({ m, len }: { m: M; len: number }) {
  const zc = -len / 2;
  if (m.id === "jungle")
    return (
      <group>
        <Cyl a={[1.15, 1.15, len, 12]} m={m.darkwood} p={[0, 1.15, zc]} r={[RX, 0, 0]} />
        <Cyl a={[1.0, 1.0, 0.1, 12]} m={m.wood} p={[0, 1.15, 0.02]} r={[RX, 0, 0]} />
        <Rock r={0.4} m={m.moss} p={[0.3, 2.2, zc * 0.6]} s={[1.8, 0.3, 2]} />
      </group>
    );
  const cars = Math.max(1, Math.round(len / 10));
  const cl = len / cars;
  return (
    <group>
      {Array.from({ length: cars }).map((_, i) => (
        <group key={i} position={[0, 0, -i * cl]}>
          <B s={[2.05, 2.05, cl - 0.3]} m={m.train} p={[0, 1.2, -cl / 2]} />
          <B s={[2.08, 0.6, cl - 0.6]} m={m.windows} p={[0, 1.55, -cl / 2]} />
          <B s={[2.08, 0.18, cl - 0.3]} m={m.stripe} p={[0, 0.85, -cl / 2]} />
          <B s={[1.7, 0.12, cl - 0.8]} m={m.metal} p={[0, 2.29, -cl / 2]} />
          {m.id === "race" && i === 0 && <B s={[2.06, 1.0, 0.1]} m={m.crowd} p={[0, 1.5, -0.1]} />}
        </group>
      ))}
      <B s={[1.4, 0.7, 0.05]} m={m.glass} p={[0, 1.7, 0.01]} />
      <B s={[0.25, 0.15, 0.05]} m={m.yellow} p={[-0.7, 0.6, 0.01]} />
      <B s={[0.25, 0.15, 0.05]} m={m.yellow} p={[0.7, 0.6, 0.01]} />
      {m.id === "snow" && <B s={[2.2, 0.8, 0.8]} m={m.metal} p={[0, 0.4, 0.1]} r={[-0.5, 0, 0]} />}
      {m.id === "volcano" && <B s={[1.6, 0.2, len - 1]} m={m.lava} p={[0, 2.25, zc]} />}
      {m.id === "future" && <B s={[2.1, 0.06, len]} m={m.neon} p={[0, 0.2, zc]} />}
    </group>
  );
}

function Ramp({ m, len, top }: { m: M; len: number; top: number }) {
  const ang = Math.atan2(top, len);
  const L = Math.hypot(len, top);
  return (
    <group>
      <B s={[2, 0.12, L]} m={m.id === "jungle" ? m.wood : m.metal} p={[0, top / 2, -len / 2]} r={[ang, 0, 0]} />
      <B s={[0.1, top * 0.9, 0.12]} m={m.metal} p={[-0.9, top * 0.45, -len + 0.1]} />
      <B s={[0.1, top * 0.9, 0.12]} m={m.metal} p={[0.9, top * 0.45, -len + 0.1]} />
    </group>
  );
}

function Hole({ m, len }: { m: M; len: number }) {
  const mat: Record<MapId, THREE.Material> = {
    city: m.pit,
    snow: m.water,
    volcano: m.lava,
    jungle: m.water,
    race: m.oil,
    desert: m.quicksand,
    future: m.void,
  };
  return (
    <group>
      <mesh position={[0, 0.015, -len / 2]} rotation={[-RX, 0, 0]} material={mat[m.id as MapId]} receiveShadow>
        <planeGeometry args={[2.3, len]} />
      </mesh>
      <B s={[2.4, 0.06, 0.12]} m={m.id === "city" ? m.hazard : m.rock} p={[0, 0.03, 0]} />
      <B s={[2.4, 0.06, 0.12]} m={m.id === "city" ? m.hazard : m.rock} p={[0, 0.03, -len]} />
    </group>
  );
}

const ObstacleView = memo(function ObstacleView({ o, m }: { o: Obstacle; m: M }) {
  const len = o.s1 - o.s0;
  let body: React.ReactNode = null;
  switch (o.kind) {
    case "low":
      body = <Low m={m} v={o.variant} />;
      break;
    case "high":
      body = <High m={m} />;
      break;
    case "crate":
      body = <Crate m={m} v={o.variant} />;
      break;
    case "car":
      body = <Car m={m} />;
      break;
    case "train":
      body = <Train m={m} len={len} />;
      break;
    case "ramp":
      body = <Ramp m={m} len={len} top={o.y1} />;
      break;
    case "hole":
      body = <Hole m={m} len={len} />;
      break;
  }
  const zOff = o.kind === "low" || o.kind === "high" ? -len / 2 : 0;
  return <group position={[o.lane * LANE_W, 0, -o.s0 + zOff]}>{body}</group>;
});

export function Obstacles({ map }: { map: MapDef }) {
  const group = useRef<THREE.Group>(null!);
  const [list, setList] = useState<Obstacle[]>([]);
  const seen = useRef<{ sim: Sim | null; v: number }>({ sim: null, v: -1 });
  const mats = useMemo(() => makeMats(map), [map]);
  useEffect(
    () => () => Object.values(mats).forEach((x) => (x instanceof THREE.Material ? x.dispose() : undefined)),
    [mats],
  );
  useFrame(() => {
    const sim = runtime.sim;
    const s = seen.current;
    if (sim !== s.sim || (sim && sim.version !== s.v)) {
      s.sim = sim;
      s.v = sim?.version ?? -1;
      setList(sim ? sim.obstacles.slice() : []);
    }
    group.current.position.z = sim ? sim.dist : 0;
  });
  return (
    <group ref={group}>
      {list.map((o) => (
        <ObstacleView key={o.id} o={o} m={mats} />
      ))}
    </group>
  );
}
