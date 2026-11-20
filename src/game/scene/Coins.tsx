import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COIN_BY_ID } from "../data/coins";
import { runtime } from "../runtime";
import { COIN_R, LANE_W } from "../sim/constants";
import { useSettings } from "../store";
import { coinFaceTexture } from "./textures";

const MAX = 320;

export function Coins() {
  const coinColor = useSettings((s) => s.coinColor);
  const coinSize = useSettings((s) => s.coinSize);
  const coinGlow = useSettings((s) => s.coinGlow);
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const rim = useRef<THREE.InstancedMesh>(null!);
  const fx = useRef<THREE.Mesh>(null!);
  const geom = useMemo(() => {
    const g = new THREE.CylinderGeometry(COIN_R, COIN_R, 0.105, 48, 1, false);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const rimGeom = useMemo(() => new THREE.TorusGeometry(COIN_R * 0.82, 0.024, 8, 40), []);
  const rimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: COIN_BY_ID[coinColor].color, metalness: 0.95, roughness: 0.2, emissive: COIN_BY_ID[coinColor].emissive, emissiveIntensity: 0.5 * coinGlow, toneMapped: false }), [coinColor, coinGlow]);
  const mats = useMemo(() => {
    const def = COIN_BY_ID[coinColor];
    const rainbow = coinColor === "rainbow";
    const emissive = new THREE.Color(rainbow ? "#ffffff" : def.emissive);
    const mk = (map?: THREE.Texture) =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map: map ?? null,
        metalness: coinColor === "black" ? 0.6 : 0.85,
        roughness: 0.22,
        flatShading: false,
        emissive,
        emissiveIntensity: (rainbow ? 0.95 : 0.35) * coinGlow,
        toneMapped: false,
      });
    const face = mk(coinFaceTexture());
    const side = mk();
    return [side, face, face] as THREE.Material[];
  }, [coinColor, coinGlow]);
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  useEffect(() => () => rimMat.dispose(), [rimMat]);

  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color() }), []);

  useEffect(() => {
    const base = new THREE.Color(COIN_BY_ID[coinColor].color);
    for (let i = 0; i < MAX; i++) { mesh.current.setColorAt(i, base); rim.current.setColorAt(i, base); }
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [coinColor]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const sim = runtime.sim;
    const im = mesh.current;
    let n = 0;
    const rainbow = coinColor === "rainbow";
    if (sim) {
      for (const c of sim.coins) {
        if (!c.alive) continue;
        const z = -(c.s - sim.dist);
        if (z > 10 || z < -180) continue;
        if (n >= MAX) break;
        const bob = Math.sin(t * 4.2 + c.id * 0.8) * 0.075;
        const pulse = 1 + Math.sin(t * 5 + c.id) * 0.045;
        tmp.o.position.set(c.lane * LANE_W, c.y + bob, z);
        tmp.o.rotation.set(Math.sin(t * 1.7 + c.id) * 0.035, t * 3.8 + c.id * 0.35, Math.sin(t * 2 + c.id) * 0.025);
        tmp.o.scale.setScalar(coinSize * pulse);
        tmp.o.updateMatrix();
        im.setMatrixAt(n, tmp.o.matrix);
        rim.current.setMatrixAt(n, tmp.o.matrix);
        if (rainbow) {
          const hue = (t * 0.42 + c.id * 0.11) % 1;
          im.setColorAt(n, tmp.c.setHSL(hue, 1, 0.58));
          rim.current.setColorAt(n, tmp.c.setHSL(hue, 0.95, 0.68));
        }
        n++;
      }
    }
    im.count = n;
    rim.current.count = n;
    im.instanceMatrix.needsUpdate = true;
    rim.current.instanceMatrix.needsUpdate = true;
    if (rainbow && im.instanceColor) im.instanceColor.needsUpdate = true;
    if (rainbow && rim.current.instanceColor) rim.current.instanceColor.needsUpdate = true;

    // Collected coin flies up and fades.
    const f = runtime.coinFx;
    if (f) {
      f.t += Math.min(delta, 0.05);
      fx.current.visible = true;
      fx.current.position.set(f.x, f.y + f.t * 3, f.z);
      fx.current.rotation.y = t * 14;
      fx.current.scale.setScalar(coinSize * (1 + f.t * 1.5));
    } else fx.current.visible = false;
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[geom, mats, MAX]} castShadow frustumCulled={false} />
      <instancedMesh ref={rim} args={[rimGeom, rimMat, MAX]} castShadow frustumCulled={false} />
      <mesh ref={fx} geometry={geom} material={mats} visible={false} />
    </>
  );
}
