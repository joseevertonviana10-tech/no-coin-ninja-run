import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const CARTOON_RAMP = (() => {
  const data = new Uint8Array([78, 78, 78, 255, 142, 142, 142, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

export function Accessories({ accessoryId }: { accessoryId?: string }) {
  const swing = useRef<THREE.Group>(null!);
  const materials = useMemo(() => ({
    straw: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#d6ad55" }),
    strawLight: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#f0d48a" }),
    strawDark: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#80502a" }),
    red: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#a52c35" }),
    redLight: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#d85a57" }),
    gold: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#d7bd73" }),
    glove: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#252832" }),
    gloveEdge: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#454b58" }),
    teal: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#39d5b0" }),
    darkTeal: new THREE.MeshToonMaterial({ gradientMap: CARTOON_RAMP, color: "#147f78" }),
  }), []);
  useFrame((state, delta) => {
    if (!swing.current) return;
    const t = state.clock.elapsedTime;
    const target = accessoryId === "straw-neck" ? Math.sin(t * 8) * 0.18 : accessoryId === "scarf" ? Math.sin(t * 9) * 0.26 : 0;
    swing.current.rotation.z = THREE.MathUtils.damp(swing.current.rotation.z, target, 8, delta);
    swing.current.rotation.x = THREE.MathUtils.damp(swing.current.rotation.x, Math.sin(t * 7) * 0.16, 6, delta);
  });
  if (!accessoryId) return null;
  return (
    <group>
      {accessoryId === "straw-neck" && (
        <group position={[0, 0.49, -0.25]} rotation={[0.04, 0, 0]}>
          <mesh position={[0, 0.02, 0]} material={materials.straw} castShadow scale={[1.28, 1, 1]}><cylinderGeometry args={[0.32, 0.32, 0.055, 32]} /></mesh>
          <mesh position={[0, 0.105, 0]} material={materials.strawLight} castShadow><cylinderGeometry args={[0.17, 0.2, 0.17, 24]} /></mesh>
          <mesh position={[0, 0.19, 0]} material={materials.straw} castShadow><cylinderGeometry args={[0.12, 0.17, 0.055, 24]} /></mesh>
          <mesh position={[0, 0.13, -0.01]} material={materials.strawDark}><torusGeometry args={[0.174, 0.018, 6, 24]} /></mesh>
          <mesh position={[0, 0.04, 0]} material={materials.strawDark}><torusGeometry args={[0.29, 0.008, 5, 32]} /></mesh>
          {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => <mesh key={x} position={[x, 0.05, 0]} material={materials.strawLight}><boxGeometry args={[0.008, 0.012, 0.48]} /></mesh>)}
          <mesh position={[0, 0.2, -0.17]} material={materials.red}><boxGeometry args={[0.09, 0.045, 0.025]} /></mesh>
        </group>
      )}
      {accessoryId === "gloves" && [-1, 1].map((side) => (
        <group key={side} position={[side * 0.31, 0.12, -0.23]} rotation={[0, 0, side * -0.12]}>
          <mesh material={materials.glove} castShadow><capsuleGeometry args={[0.085, 0.12, 5, 10]} /></mesh>
          <mesh position={[0, -0.075, -0.018]} material={materials.gloveEdge}><boxGeometry args={[0.17, 0.045, 0.13]} /></mesh>
          {[-0.045, 0, 0.045].map((x) => <mesh key={x} position={[x, -0.145, -0.01]} material={materials.glove} castShadow><capsuleGeometry args={[0.025, 0.085, 4, 7]} /></mesh>)}
          <mesh position={[side * -0.09, -0.045, 0.01]} rotation={[0, 0, side * 0.8]} material={materials.glove}><capsuleGeometry args={[0.027, 0.075, 4, 7]} /></mesh>
          <mesh position={[0, 0.045, -0.015]} material={materials.red}><boxGeometry args={[0.13, 0.025, 0.025]} /></mesh>
        </group>
      ))}
      {accessoryId === "scarf" && (
        <>
          <mesh position={[0, 0.43, -0.22]} rotation={[Math.PI / 2, 0, 0]} material={materials.red} castShadow><torusGeometry args={[0.16, 0.065, 10, 28]} /></mesh>
          <group ref={swing} position={[0, 0.44, -0.25]}>
            <mesh position={[-0.11, -0.25, 0.02]} rotation={[0.04, 0, 0.08]} material={materials.red} castShadow><boxGeometry args={[0.13, 0.48, 0.055]} /></mesh>
            <mesh position={[0.09, -0.31, 0.015]} rotation={[0.05, 0, -0.22]} material={materials.redLight} castShadow><boxGeometry args={[0.12, 0.58, 0.05]} /></mesh>
            <mesh position={[0.09, -0.6, 0.015]} rotation={[0, 0, -0.22]} material={materials.gold}><boxGeometry args={[0.12, 0.045, 0.055]} /></mesh>
            {[-0.11, 0.09].map((x) => <mesh key={x} position={[x, -0.2, -0.011]} material={materials.gold}><boxGeometry args={[0.075, 0.018, 0.008]} /></mesh>)}
          </group>
        </>
      )}
      {accessoryId === "wristbands" && [-1, 1].map((side) => (
        <group key={side} position={[side * 0.32, 0.25, -0.16]} rotation={[0, 0, side * 0.2]}>
          <mesh material={materials.darkTeal}><torusGeometry args={[0.09, 0.036, 10, 20]} /></mesh>
          <mesh position={[0, 0, -0.012]} material={materials.teal}><torusGeometry args={[0.09, 0.022, 8, 20]} /></mesh>
          <mesh position={[0, 0, -0.03]} material={materials.gold}><boxGeometry args={[0.055, 0.035, 0.018]} /></mesh>
          <mesh position={[0, -0.035, -0.018]} material={materials.teal}><boxGeometry args={[0.1, 0.018, 0.02]} /></mesh>
        </group>
      ))}
    </group>
  );
}
