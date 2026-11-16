import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function Accessories({ accessoryId }: { accessoryId?: string }) {
  const swing = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    if (!swing.current) return;
    const t = state.clock.elapsedTime;
    const target = accessoryId === "straw-neck" ? Math.sin(t * 8) * 0.32 : accessoryId === "scarf" ? Math.sin(t * 9) * 0.2 : 0;
    swing.current.rotation.z = THREE.MathUtils.damp(swing.current.rotation.z, target, 8, delta);
    swing.current.rotation.x = THREE.MathUtils.damp(swing.current.rotation.x, Math.sin(t * 7) * 0.12, 6, delta);
  });
  if (!accessoryId) return null;
  return (
    <group>
      {accessoryId === "straw-neck" && (
        <group ref={swing} position={[0, 0.48, -0.27]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><torusGeometry args={[0.2, 0.035, 8, 24]} /><meshStandardMaterial color="#d6ad55" roughness={0.9} /></mesh>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.09, 0.12, 0.16, 12]} /><meshStandardMaterial color="#e9c875" roughness={0.9} /></mesh>
          <mesh position={[0, 0.19, 0]}><torusGeometry args={[0.1, 0.018, 6, 16]} /><meshStandardMaterial color="#9a5c28" /></mesh>
          <mesh position={[0, 0.02, 0.14]}><boxGeometry args={[0.035, 0.3, 0.025]} /><meshStandardMaterial color="#70451f" /></mesh>
        </group>
      )}
      {accessoryId === "gloves" && [-1, 1].map((side) => (
        <group key={side} position={[side * 0.31, 0.12, -0.23]}>
          <mesh><sphereGeometry args={[0.105, 12, 10]} /><meshStandardMaterial color="#252832" roughness={0.8} /></mesh>
          <mesh position={[0, -0.08, 0]}><boxGeometry args={[0.13, 0.08, 0.12]} /><meshStandardMaterial color="#b53a3a" /></mesh>
        </group>
      ))}
      {accessoryId === "scarf" && (
        <group ref={swing} position={[0, 0.47, -0.23]}>
          <mesh position={[0, -0.18, 0]} rotation={[0.1, 0, -0.12]}><boxGeometry args={[0.34, 0.38, 0.045]} /><meshStandardMaterial color="#a52c35" roughness={0.85} /></mesh>
          <mesh position={[0.17, -0.28, 0.02]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.11, 0.48, 0.04]} /><meshStandardMaterial color="#d7bd73" /></mesh>
        </group>
      )}
      {accessoryId === "wristbands" && [-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.32, 0.25, -0.16]} rotation={[0, 0, side * 0.2]}>
          <torusGeometry args={[0.09, 0.025, 8, 16]} /><meshStandardMaterial color="#39d5b0" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}
