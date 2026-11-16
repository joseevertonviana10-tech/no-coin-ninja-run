import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { patternTexture } from "./textures";

const COLS = 5;
const ROWS = 9;
const SEG = 0.105;
const ITER = 4;

/**
 * Verlet cloth cape. The top row is pinned to points on the torso each frame;
 * apparent wind from the run speed pushes it back, gravity pulls it down, and
 * it is pushed out of a sphere around the torso so it never clips the body.
 */
export function Cape({
  color,
  long = false,
  torso,
  getWind,
  getFloor,
}: {
  color: string;
  long?: boolean;
  torso: React.RefObject<THREE.Group | null>;
  getWind: () => number;
  getFloor: () => number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const segmentLength = long ? 0.145 : SEG;
  const state = useMemo(() => {
    const n = COLS * ROWS;
    return { pos: new Float32Array(n * 3), prev: new Float32Array(n * 3), init: false, acc: 0, t: 0 };
  }, []);
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, COLS - 1, ROWS - 1);
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COLS * ROWS * 3), 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.85, map: patternTexture("fabric") });
    return m;
  }, [color]);
  useEffect(() => () => {
    geom.dispose();
    mat.dispose();
  }, [geom, mat]);

  const anchor = useMemo(() => new THREE.Vector3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const hip = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const t = torso.current;
    if (!t) return;
    t.updateWorldMatrix(true, false);
    const { pos, prev } = state;
    const pin = (i: number) => {
      const u = i / (COLS - 1) - 0.5;
      anchor.set(u * 0.4, 0.52, 0.15);
      t.localToWorld(anchor);
      return anchor;
    };
    if (!state.init) {
      for (let c = 0; c < COLS; c++) {
        const a = pin(c);
        for (let r = 0; r < ROWS; r++) {
          const k = (r * COLS + c) * 3;
          pos[k] = prev[k] = a.x;
          pos[k + 1] = prev[k + 1] = a.y - r * segmentLength;
          pos[k + 2] = prev[k + 2] = a.z + 0.02 * r;
        }
      }
      state.init = true;
    }
    state.acc += Math.min(delta, 0.05);
    const h = 1 / 60;
    const wind = getWind();
    const floor = getFloor();
    while (state.acc >= h) {
      state.acc -= h;
      state.t += h;
      const tt = state.t;
      for (let r = 1; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const k = (r * COLS + c) * 3;
          const flutter = Math.sin(tt * 11 + r * 0.9 + c * 1.7) * (0.6 + wind * 0.12);
          const ax = flutter * 1.2;
          const ay = -9.8 + flutter * 0.8;
          const az = wind * 0.8 * (r / ROWS) + 0.6;
          for (let a = 0; a < 3; a++) {
            const v = (pos[k + a]! - prev[k + a]!) * 0.965;
            prev[k + a] = pos[k + a]!;
            pos[k + a] = pos[k + a]! + v + (a === 0 ? ax : a === 1 ? ay : az) * h * h;
          }
        }
      center.set(0, 0.3, 0.02);
      t.localToWorld(center);
      hip.set(0, -0.05, 0.02);
      t.localToWorld(hip);
      for (let it = 0; it < ITER; it++) {
        for (let c = 0; c < COLS; c++) {
          const a = pin(c);
          pos[c * 3] = a.x;
          pos[c * 3 + 1] = a.y;
          pos[c * 3 + 2] = a.z;
        }
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            if (r > 0 && c < COLS - 1) solve(pos, i, i + 1, SEG * 0.95, false);
            if (r < ROWS - 1) solve(pos, i, i + COLS, segmentLength, r === 0);
          }
        for (let i = COLS; i < COLS * ROWS; i++) {
          const k = i * 3;
          push(pos, k, center, 0.27);
          push(pos, k, hip, 0.22);
          if (pos[k + 1]! < floor + 0.03) pos[k + 1] = floor + 0.03;
        }
      }
    }
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    (attr.array as Float32Array).set(pos);
    attr.needsUpdate = true;
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
  });

  return <mesh ref={meshRef} geometry={geom} material={mat} castShadow frustumCulled={false} />;
}

function solve(p: Float32Array, a: number, b: number, rest: number, aPinned: boolean) {
  const ia = a * 3;
  const ib = b * 3;
  const dx = p[ib]! - p[ia]!;
  const dy = p[ib + 1]! - p[ia + 1]!;
  const dz = p[ib + 2]! - p[ia + 2]!;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
  const diff = (d - rest) / d;
  const wa = aPinned ? 0 : 0.5;
  const wb = aPinned ? 1 : 0.5;
  p[ia] = p[ia]! + dx * diff * wa;
  p[ia + 1] = p[ia + 1]! + dy * diff * wa;
  p[ia + 2] = p[ia + 2]! + dz * diff * wa;
  p[ib] = p[ib]! - dx * diff * wb;
  p[ib + 1] = p[ib + 1]! - dy * diff * wb;
  p[ib + 2] = p[ib + 2]! - dz * diff * wb;
}

function push(p: Float32Array, k: number, c: THREE.Vector3, r: number) {
  const dx = p[k]! - c.x;
  const dy = p[k + 1]! - c.y;
  const dz = p[k + 2]! - c.z;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 < r * r) {
    const d = Math.sqrt(d2) || 1e-6;
    const s = r / d;
    p[k] = c.x + dx * s;
    p[k + 1] = c.y + dy * s;
    p[k + 2] = c.z + dz * s;
  }
}
