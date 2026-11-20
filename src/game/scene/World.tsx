import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { audio } from "../audio";
import { CHARACTERS, CHARACTER_BY_ID } from "../data/characters";
import { COIN_BY_ID } from "../data/coins";
import { MAP_BY_ID, type MapDef } from "../data/maps";
import { updateInput } from "../input";
import { runtime } from "../runtime";
import { LANE_W } from "../sim/constants";
import { getTunnelBlend, TUNNEL_FIRST, TUNNEL_LENGTH, TUNNEL_SPACING, TUNNEL_VISUAL_LEAD } from "../sim/tunnels";
import { useSettings, useStats, useUI, type Quality } from "../store";
import { CharacterRig } from "./Character";
import { Coins } from "./Coins";
import { Particles, Weather } from "./Effects";
import { Obstacles } from "./Obstacles";
import { Scenery } from "./Scenery";
import { sideTexture, trackTexture } from "./textures";

const CARTOON_RAMP = (() => {
  const data = new Uint8Array([78, 78, 78, 255, 142, 142, 142, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

const TRACK_LEN = 260;
const TRACK_W = 8.4;

function Ground({ map }: { map: MapDef }) {
  const track = useMemo(() => trackTexture(map), [map]);
  const side = useMemo(() => sideTexture(map), [map]);
  const sideMat = useRef<THREE.MeshToonMaterial>(null!);
  useFrame((st) => {
    const d = runtime.sim?.dist ?? 0;
    track.offset.y = (d / TRACK_LEN) * track.repeat.y;
    side.offset.y = (d / TRACK_LEN) * side.repeat.y + (map.sideEmissive ? st.clock.elapsedTime * 0.01 : 0);
  });
  const edge = map.id === "race" ? "#e63946" : map.id === "future" ? "#2be0ff" : map.id === "snow" ? "#ffffff" : map.id === "volcano" ? "#2a2420" : "#6a6560";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -TRACK_LEN / 2 + 30]} receiveShadow>
        <planeGeometry args={[TRACK_W, TRACK_LEN]} />
        <meshToonMaterial map={track} gradientMap={CARTOON_RAMP} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, map.sideEmissive && map.id === "volcano" ? -0.6 : -0.02, -TRACK_LEN / 2 + 30]} receiveShadow>
        <planeGeometry args={[240, TRACK_LEN]} />
        <meshToonMaterial
          ref={sideMat}
          gradientMap={CARTOON_RAMP}
          map={side}
          emissive={map.sideEmissive ?? "#000000"}
          emissiveMap={map.sideEmissive ? side : null}
          emissiveIntensity={map.sideEmissive ? (map.id === "volcano" ? 1.6 : 0.6) : 0}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (TRACK_W / 2 + 0.1), map.id === "volcano" ? -0.3 : 0.08, -TRACK_LEN / 2 + 30]} receiveShadow castShadow>
          <boxGeometry args={[0.25, map.id === "volcano" ? 0.8 : 0.16, TRACK_LEN]} />
          <meshToonMaterial
            gradientMap={CARTOON_RAMP}
            color={edge}
            emissive={map.id === "future" ? edge : "#000000"}
            emissiveIntensity={map.id === "future" ? 2 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

function TrackArchitecture({ map }: { map: MapDef }) {
  const rails = useRef<THREE.Group>(null!);
  const arches = useRef<THREE.Group>(null!);
  const palette: Record<MapDef["id"], [string, string, string]> = {
    city: ["#65788b", "#e6a33c", "#d7e3ed"], snow: ["#8baec8", "#d9f2ff", "#f4fbff"],
    volcano: ["#4b3737", "#ff6b35", "#a83e32"], jungle: ["#72543b", "#e4b95f", "#47784a"],
    race: ["#53677d", "#ef4444", "#f6d365"], desert: ["#a87c50", "#e7c27c", "#f4dfb0"],
    future: ["#394b78", "#2be0ff", "#ff3df2"],
  };
  const [railColor, beamColor, lampColor] = palette[map.id];
  useFrame(() => {
    const distance = runtime.sim?.dist ?? 0;
    if (rails.current) rails.current.position.z = distance % TRACK_LEN;
    if (arches.current) arches.current.position.z = distance % 34;
  });
  return (
    <>
      <group ref={rails}>
        {Array.from({ length: 3 }, (_, segment) => (
          <group key={segment} position={[0, 0, -segment * TRACK_LEN]}>
            {[-1, 0, 1].flatMap((lane) => [-0.72, 0.72].map((offset) => (
              <mesh key={lane + ":" + offset} position={[lane * LANE_W + offset, 0.095, -TRACK_LEN / 2]} receiveShadow>
                <boxGeometry args={[0.105, 0.16, TRACK_LEN]} />
                <meshToonMaterial color={railColor} />
              </mesh>
            )))}
          </group>
        ))}
      </group>
      <group ref={arches}>
        {[-3.5, -1.2, 1.2, 3.5].map((x) => (
          <mesh key={x} position={[x, 5.42, -130]}>
            <boxGeometry args={[0.035, 0.035, 260]} />
            <meshToonMaterial color={map.id === "future" ? "#354d86" : "#303946"} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} position={[0, 0, -12 - i * 34]}>
            <mesh position={[-4.15, 2.55, 0]} castShadow><boxGeometry args={[0.22, 5.1, 0.24]} /><meshToonMaterial color={beamColor} /></mesh>
            <mesh position={[4.15, 2.55, 0]} castShadow><boxGeometry args={[0.22, 5.1, 0.24]} /><meshToonMaterial color={beamColor} /></mesh>
            <mesh position={[0, 5.05, 0]} castShadow><boxGeometry args={[8.5, 0.24, 0.3]} /><meshToonMaterial color={beamColor} /></mesh>
            <mesh position={[0, 4.78, 0]}><boxGeometry args={[1.55, 0.42, 0.12]} /><meshToonMaterial color={lampColor} emissive={lampColor} emissiveIntensity={map.id === "future" ? 1.2 : 0.18} /></mesh>
            {[-LANE_W, 0, LANE_W].map((x) => <mesh key={x} position={[x, 4.45, 0]}><boxGeometry args={[0.1, 0.5, 0.1]} /><meshToonMaterial color={railColor} /></mesh>)}
          </group>
        ))}
      </group>
    </>
  );
}

const TUNNEL_SEGMENT_LENGTH = TUNNEL_LENGTH + TUNNEL_VISUAL_LEAD;

function Tunnels({ map }: { map: MapDef }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const palette: Record<MapDef["id"], { wall: string; floor: string; rib: string; stripe: string; lamp: string }> = {
    city: { wall: "#263445", floor: "#72808c", rib: "#718397", stripe: "#ffbd45", lamp: "#ffcf7a" },
    snow: { wall: "#1d3449", floor: "#9ab7c9", rib: "#b3d3e5", stripe: "#eafaff", lamp: "#9be4ff" },
    volcano: { wall: "#241a1b", floor: "#51403b", rib: "#875044", stripe: "#ff5a26", lamp: "#ff713b" },
    jungle: { wall: "#172820", floor: "#5c5740", rib: "#5c7547", stripe: "#d2b66e", lamp: "#b2d47b" },
    race: { wall: "#202935", floor: "#66717e", rib: "#9aa5b3", stripe: "#f04e52", lamp: "#ffd36b" },
    desert: { wall: "#4b3327", floor: "#b38a5d", rib: "#d1a675", stripe: "#f5d18b", lamp: "#ffbd67" },
    future: { wall: "#10142d", floor: "#303455", rib: "#424d86", stripe: "#2be0ff", lamp: "#2be0ff" },
  };
  const p = palette[map.id];
  useFrame(() => {
    const d = runtime.sim?.dist ?? 0;
    const starts = runtime.sim?.gen.tunnelStarts ?? [];
    const visible = starts.filter((entrance) => {
      const start = entrance - TUNNEL_VISUAL_LEAD;
      return start < d + 190 && start + TUNNEL_SEGMENT_LENGTH > d - 24;
    });
    refs.current.forEach((group, i) => {
      if (!group) return;
      const entrance = visible[i];
      if (entrance === undefined) {
        group.visible = false;
        return;
      }
      const visualStart = entrance - TUNNEL_VISUAL_LEAD;
      group.position.z = d - visualStart;
      group.visible = true;
    });
  });
  return (
    <>
      {[0, 1, 2].map((index) => (
        <group key={index} ref={(el) => { refs.current[index] = el; }}>
          {/* Raised emergency platforms occupy only the first and third lanes. */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * LANE_W, 0.035, -TUNNEL_SEGMENT_LENGTH / 2]} receiveShadow>
                <boxGeometry args={[2.12, 0.12, TUNNEL_SEGMENT_LENGTH]} />
                <meshToonMaterial color={p.floor} />
              </mesh>
              <mesh position={[side * LANE_W, 0.105, -TUNNEL_SEGMENT_LENGTH / 2]} >
                <boxGeometry args={[1.86, 0.025, TUNNEL_SEGMENT_LENGTH]} />
                <meshToonMaterial color={map.id === "snow" ? "#c9e9f7" : map.id === "future" ? "#232f58" : "#8b9298"} />
              </mesh>
              {[-1, 1].map((edge) => (
                <mesh key={edge} position={[side * LANE_W + edge * 0.91, 0.13, -TUNNEL_SEGMENT_LENGTH / 2]}>
                  <boxGeometry args={[0.055, 0.035, TUNNEL_SEGMENT_LENGTH]} />
                  <meshBasicMaterial color={p.stripe} toneMapped={false} />
                </mesh>
              ))}
            </group>
          ))}
          {/* Central lane stays open for the train. */}
          <mesh position={[0, -0.08, -TUNNEL_SEGMENT_LENGTH / 2]}>
            <boxGeometry args={[2.75, 0.12, TUNNEL_SEGMENT_LENGTH]} />
            <meshToonMaterial color={p.wall} />
          </mesh>
          {/* Dark roof and side walls enclose the full track width. */}
          <mesh position={[0, 6.35, -TUNNEL_SEGMENT_LENGTH / 2]}>
            <boxGeometry args={[8.65, 0.42, TUNNEL_SEGMENT_LENGTH]} />
            <meshToonMaterial color={p.wall} />
          </mesh>
          {[-4.18, 4.18].map((x) => (
            <mesh key={x} position={[x, 3.15, -TUNNEL_SEGMENT_LENGTH / 2]}>
              <boxGeometry args={[0.38, 6.35, TUNNEL_SEGMENT_LENGTH]} />
              <meshToonMaterial color={p.wall} />
            </mesh>
          ))}
          {/* Repeating structural ribs make the tunnel depth readable. */}
          {Array.from({ length: 5 }, (_, i) => {
            const z = -3 - i * 14;
            return (
              <group key={i}>
                {[-4.0, 4.0].map((x) => (
                  <mesh key={x} position={[x, 3.1, z]}>
                    <boxGeometry args={[0.16, 6.0, 0.24]} />
                    <meshToonMaterial color={p.rib} />
                  </mesh>
                ))}
                <mesh position={[0, 6.05, z]}>
                  <boxGeometry args={[8.05, 0.18, 0.24]} />
                  <meshToonMaterial color={p.rib} />
                </mesh>
                <mesh position={[0, 5.8, z - 0.2]}>
                  <boxGeometry args={[1.25, 0.12, 0.08]} />
                  <meshBasicMaterial color={p.lamp} toneMapped={false} />
                </mesh>
              </group>
            );
          })}
          {[-3.35, 3.35].map((x) => (
            <mesh key={x} position={[x, 5.55, -TUNNEL_SEGMENT_LENGTH / 2]}>
              <boxGeometry args={[0.12, 0.08, TUNNEL_SEGMENT_LENGTH]} />
              <meshBasicMaterial color={p.lamp} toneMapped={false} />
            </mesh>
          ))}
          <pointLight position={[0, 4.85, -16]} color={p.lamp} intensity={4.2} distance={19} decay={2} />
          <pointLight position={[0, 4.85, -46]} color={p.lamp} intensity={4.2} distance={19} decay={2} />
          {/* Portal bands at both ends signal the tunnel entrance and exit. */}
          {[0, -TUNNEL_SEGMENT_LENGTH + 0.3].map((z) => (
            <group key={z}>
              {[-4.0, 4.0].map((x) => (
                <mesh key={x} position={[x, 3.2, z]}>
                  <boxGeometry args={[0.22, 6.3, 0.42]} />
                  <meshToonMaterial color={p.stripe} />
                </mesh>
              ))}
              <mesh position={[0, 6.3, z]}>
                <boxGeometry args={[8.2, 0.28, 0.42]} />
                <meshToonMaterial color={p.stripe} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

const SHADOW: Record<Quality, number> = { low: 0, medium: 1024, high: 2048, ultra: 2048 };

function Lights({ map, quality, timeOfDay }: { map: MapDef; quality: Quality; timeOfDay: "day" | "afternoon" | "night" }) {
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const ambient = useRef<THREE.AmbientLight>(null!);
  const { scene } = useThree();
  useEffect(() => {
    scene.add(sun.current.target);
    return () => {
      scene.remove(sun.current?.target);
    };
  }, [scene]);
  useFrame(() => {
    const x = runtime.sim?.player.x ?? 0;
    sun.current.position.set(x + 8, 18, 6);
    sun.current.target.position.set(x, 0, -8);
    const tunnel = getTunnelBlend(runtime.sim?.dist ?? 0, runtime.sim?.gen.tunnelStarts ?? []);
    const daylight = 1 - tunnel * 0.965;
    sun.current.intensity = sunPower * daylight;
    hemi.current.intensity = hemiPower * (1 - tunnel * 0.94);
    ambient.current.intensity = (night ? 0.18 : 0.28) * (1 - tunnel * 0.94);
  });
  const sm = SHADOW[quality];
  const night = timeOfDay === "night";
  const afternoon = timeOfDay === "afternoon";
  const sunColor = night ? "#9bbcff" : afternoon ? "#ffbd83" : map.sun;
  const sunPower = map.sunIntensity * (night ? 0.12 : afternoon ? 0.72 : 1);
  const hemiPower = map.hemiIntensity * (night ? 0.28 : afternoon ? 0.82 : 1);
  return (
    <>
      <hemisphereLight ref={hemi} args={[night ? "#263b68" : afternoon ? "#ffd0a0" : map.hemiSky, night ? "#080d18" : map.hemiGround, hemiPower]} />
      <ambientLight ref={ambient} color={night ? "#7e98c9" : "#fff0d5"} intensity={night ? 0.18 : 0.28} />
      <directionalLight
        ref={sun}
        color={sunColor}
        intensity={sunPower}
        castShadow={sm > 0}
        shadow-mapSize={[sm || 512, sm || 512]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={22}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      {(quality === "high" || quality === "ultra") && (
        <Environment resolution={64}>
          <Lightformer intensity={night ? 0.18 : afternoon ? 1.1 : 1.6} color={map.hemiSky} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
          <Lightformer intensity={night ? 0.12 : afternoon ? 0.75 : 1} color={map.sun} position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[16, 2, 1]} />
          <Lightformer intensity={night ? 0.1 : afternoon ? 0.45 : 0.6} color={map.fog} position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[16, 2, 1]} />
        </Environment>
      )}
    </>
  );
}

function CartoonSky({ map, timeOfDay }: { map: MapDef; timeOfDay: "day" | "afternoon" | "night" }) {
  const sky = useRef<THREE.Group>(null!);
  const clouds = useRef<(THREE.Group | null)[]>([]);
  const camera = useThree((state) => state.camera);
  const palette = useMemo<[string, string, string]>(() => {
    const themes: Record<MapDef["id"], [string, string, string]> = {
      city: ["#4d9be0", "#c8ecff", "#fff0ce"], snow: ["#568fc7", "#cce8fb", "#f5fbff"],
      volcano: ["#6b283c", "#f18b59", "#ffc078"], jungle: ["#3b9d7a", "#b7e8ae", "#ffe7a1"],
      race: ["#4d9de0", "#bde8ff", "#fff1d6"], desert: ["#e58b55", "#ffd08a", "#fff0bd"],
      future: ["#20275c", "#5e5bb0", "#ff91db"],
    };
    const day = themes[map.id];
    if (timeOfDay === "night") return ["#101a3b", "#263b62", "#526987"];
    if (timeOfDay === "afternoon") return [day[0], day[2], day[1]];
    return day;
  }, [map.id, timeOfDay]);
  const gradient = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, palette[0]); g.addColorStop(0.58, palette[1]); g.addColorStop(1, palette[2]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [palette]);
  const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ map: gradient, side: THREE.BackSide, depthWrite: false, fog: false }), [gradient]);
  const cloudMat = useMemo(() => new THREE.MeshBasicMaterial({ color: timeOfDay === "night" ? "#c5d7f5" : "#fffdf5", transparent: true, opacity: timeOfDay === "night" ? 0.3 : 0.84, depthWrite: false, fog: false }), [timeOfDay]);
  const sunMat = useMemo(() => new THREE.MeshBasicMaterial({ color: timeOfDay === "night" ? "#dceaff" : palette[2], fog: false, toneMapped: false }), [palette, timeOfDay]);
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: palette[2], transparent: true, opacity: timeOfDay === "night" ? 0.08 : 0.16, depthWrite: false, fog: false, toneMapped: false }), [palette, timeOfDay]);
  const cloudGeo = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);
  const stars = useMemo(() => {
    const positions = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      const y = Math.random() * 2 - 1;
      const angle = Math.random() * Math.PI * 2;
      const ring = Math.sqrt(1 - y * y);
      positions[i * 3] = Math.cos(angle) * ring * 285;
      positions[i * 3 + 1] = y * 285;
      positions[i * 3 + 2] = Math.sin(angle) * ring * 285;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  const starMat = useMemo(() => new THREE.PointsMaterial({ color: "#edf5ff", size: 1.1, transparent: true, opacity: 0.88, sizeAttenuation: false, depthWrite: false, fog: false }), []);
  useEffect(() => () => { gradient.dispose(); skyMat.dispose(); cloudMat.dispose(); sunMat.dispose(); haloMat.dispose(); cloudGeo.dispose(); stars.dispose(); starMat.dispose(); }, [gradient, skyMat, cloudMat, sunMat, haloMat, cloudGeo, stars, starMat]);
  useFrame((state) => {
    if (sky.current) sky.current.position.copy(camera.position);
    clouds.current.forEach((cloud, i) => {
      if (!cloud) return;
      cloud.position.x = [-72, 42, 112, -125][i]! + Math.sin(state.clock.elapsedTime * 0.035 + i * 2) * 2.8;
      cloud.position.y = [27, 39, 24, 44][i]! + Math.sin(state.clock.elapsedTime * 0.18 + i * 1.7) * 0.65;
    });
  });
  const cloudPositions: [number, number, number][] = [[-72, 27, -135], [42, 39, -178], [112, 24, -235], [-125, 44, -260]];
  return (
    <group ref={sky}>
      <mesh scale={360} renderOrder={-100} geometry={cloudGeo} material={skyMat} />
      <points geometry={stars} material={starMat} visible={timeOfDay === "night"} />
      <mesh position={timeOfDay === "night" ? [-58, 52, -151] : [58, 38, -156]} geometry={cloudGeo} material={haloMat} scale={timeOfDay === "night" ? [10, 10, 2.3] : [14, 14, 2.6]} />
      <mesh position={timeOfDay === "night" ? [-58, 52, -150] : [58, 38, -155]} geometry={cloudGeo} material={sunMat} scale={timeOfDay === "night" ? [5.8, 5.8, 2] : [7.2, 7.2, 2.2]} />
      {cloudPositions.map((p, i) => (
        <group key={i} ref={(el) => { clouds.current[i] = el; }} position={p}>
          <mesh position={[-2.2, 0, 0]} geometry={cloudGeo} material={cloudMat} scale={[5.3, 2.1, 2.2]} />
          <mesh position={[1.2, 0.9, 0.15]} geometry={cloudGeo} material={cloudMat} scale={[4.2, 2.8, 2]} />
          <mesh position={[4.2, 0.15, 0]} geometry={cloudGeo} material={cloudMat} scale={[5.5, 2, 2.5]} />
          <mesh position={[0.1, -0.7, 0.25]} geometry={cloudGeo} material={cloudMat} scale={[6.8, 1.7, 2.4]} />
        </group>
      ))}
    </group>
  );
}

const hexRgb = (h: string): [number, number, number] => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};

/** The single stepper: input -> sim -> events -> particles -> camera. */
function Stepper({ map }: { map: MapDef }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const shakeOff = useRef(new THREE.Vector3());
  const frames = useRef(0);
  const dustAcc = useRef(0);
  const spectralAcc = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1) * runtime.timeScale;
    const set = useSettings.getState();
    const sim = runtime.sim;
    const fx = set.visualEffects;
    const P = runtime.particles;
    const dust = hexRgb(map.id === "snow" ? "#ffffff" : map.id === "volcano" ? "#ff8a3a" : map.id === "future" ? "#2be0ff" : map.id === "jungle" ? "#8a6a3a" : "#c8b08a");

    if (sim && runtime.mode === "playing") {
      updateInput(dt);
      sim.update(dt);
      const earnedMilestone = Math.floor(sim.time / 10);
      if (earnedMilestone > runtime.keyMilestone) {
        useStats.getState().addKeys(earnedMilestone - runtime.keyMilestone);
        runtime.keyMilestone = earnedMilestone;
      }
      for (const e of sim.events) {
        const p = sim.player;
        switch (e.type) {
          case "jump":
            audio.jump();
            if (fx) P.burst(8, p.x, p.y + 0.05, 0.2, 2.5, dust, 0.45, 0.35, 4, 0.5);
            break;
          case "land":
            audio.land(e.impact);
            if (fx) P.burst(Math.min(22, 6 + e.impact), p.x, p.y + 0.05, 0, 3.5, dust, 0.55, 0.45, 5, 0.4);
            if (set.cameraShake) runtime.shake = Math.max(runtime.shake, Math.min(0.12, e.impact * 0.005));
            break;
          case "slide":
            audio.slide();
            break;
          case "lane":
            audio.lane();
            break;
          case "bump":
            audio.bump();
            if (set.vibration && navigator.vibrate) navigator.vibrate(30);
            if (set.cameraShake) runtime.shake = 0.15;
            break;
          case "death": {
            const def = COIN_BY_ID[set.coinColor];
            if (e.reason === "coin" && e.coin) {
              audio.coin();
              runtime.coinFx = { x: e.coin.lane * LANE_W, y: e.coin.y, z: -(e.coin.s - sim.dist), t: 0 };
              P.burst(40, e.coin.lane * LANE_W, e.coin.y, -(e.coin.s - sim.dist), 6, hexRgb(set.coinColor === "rainbow" ? "#ffffff" : def.color), 0.9, 0.5, 3, 1);
            } else if (e.reason === "collision") {
              audio.crash();
              P.burst(36, p.x, p.y + 1, -0.4, 7, [1, 0.85, 0.6], 0.8, 0.5, 12, 1);
              P.burst(20, p.x, p.y + 0.6, -0.4, 4, dust, 1, 0.8, 4, 1);
            } else {
              audio.fall();
            }
            if (set.cameraShake) runtime.shake = e.reason === "collision" ? 0.5 : 0.2;
            runtime.hitFlash = 1;
            if (set.vibration && navigator.vibrate) navigator.vibrate(e.reason === "collision" ? [80, 40, 120] : 120);
            const st = useStats.getState();
            const prevBest = st.bestTime;
            const prevMap = st.bestByMap[set.map] ?? 0;
            st.record({ time: sim.time, reason: e.reason, map: set.map, character: set.character, distance: sim.dist });
            const newRecord = sim.time > prevBest;
            runtime.outcome = newRecord ? "victory" : "defeat";
            useUI.getState().setLastRun({
              time: sim.time,
              reason: e.reason,
              map: set.map,
              character: set.character,
              newRecord,
              newMapRecord: sim.time > prevMap,
              previousBest: prevBest,
              distance: sim.dist,
            });
            runtime.mode = "dead";
            runtime.deathT = 0;
            audio.stopMusic();
            break;
          }
        }
      }
      sim.events.length = 0;
      if (runtime.mode === "playing" && runtime.challenge === "race") {
        for (const bot of runtime.raceBots) {
          if (!bot.finished && sim.time >= bot.finishAt) bot.finished = true;
        }
        if (runtime.raceBots.length > 0 && runtime.raceBots.every((bot) => bot.finished)) {
          const st = useStats.getState();
          const prevBest = st.bestTime;
          const prevMap = st.bestByMap[set.map] ?? 0;
          st.record({ time: sim.time, reason: "victory", map: set.map, character: set.character, distance: sim.dist });
          useUI.getState().setLastRun({ time: sim.time, reason: "victory", map: set.map, character: set.character, newRecord: sim.time > prevBest, newMapRecord: sim.time > prevMap, won: true, previousBest: prevBest, distance: sim.dist });
          runtime.mode = "over";
          runtime.outcome = "victory";
          audio.stopMusic();
          audio.record();
          useUI.getState().setScreen("gameover");
        }
      }
      // Equipped character trail effect, independently saved for each character.
      const p = sim.player;
      const equipped = set.equippedEffects[set.character];
      if (fx && equipped && sim.status === "running") {
        const palettes: Record<string, [number, number, number]> = {
          fire: [1, 0.22, 0.025], "blue-smoke": [0.12, 0.58, 1], "gold-stars": [1, 0.72, 0.12],
          shadow: [0.16, 0.12, 0.28], rainbow: [0.8, 0.18, 1], emerald: [0.12, 1, 0.32],
          ice: [0.35, 0.9, 1], starlight: [0.95, 0.95, 1],
        };
        const color = palettes[equipped] ?? palettes.fire!;
        spectralAcc.current += dt * 24;
        while (spectralAcc.current >= 1) {
          spectralAcc.current--;
          const hue = ((sim.time * 0.42) % 1) * Math.PI * 2;
          const rgb: [number, number, number] = equipped === "rainbow" ? [0.5 + 0.5 * Math.sin(hue), 0.5 + 0.5 * Math.sin(hue + 2.094), 0.5 + 0.5 * Math.sin(hue + 4.188)] : color;
          P.emit(p.x + (Math.random() - 0.5) * 0.55, p.y + 0.25 + Math.random() * 0.7, 0.2, (Math.random() - 0.5) * 1.2, equipped === "fire" ? 1.8 : 0.9, 1.1, rgb[0], rgb[1], rgb[2], 0.75 + Math.random() * 0.6, equipped === "blue-smoke" || equipped === "shadow" ? 0.48 : 0.22, equipped === "fire" ? -1.8 : -0.3);
        }
      }
      // Running dust / slide sparks
      if (fx && p.grounded && sim.status === "running") {
        dustAcc.current += dt * (p.slideT > 0 ? 50 : 18);
        while (dustAcc.current > 1) {
          dustAcc.current--;
          P.emit(p.x + (Math.random() - 0.5) * 0.5, p.y + 0.04, 0.25, (Math.random() - 0.5) * 1.5, 0.6 + Math.random() * 1.4, 1.8, dust[0], dust[1], dust[2], 0.58, p.slideT > 0 ? 0.46 : 0.32, 2.2);
        }
      }
      if (fx && set.character === "skeleton-spectral" && sim.status === "running") {
        spectralAcc.current += dt * 14;
        while (spectralAcc.current >= 1) {
          spectralAcc.current -= 1;
          const cyan = hexRgb("#45eaff");
          const purple = hexRgb("#9b7bff");
          const color = Math.random() > 0.5 ? cyan : purple;
          P.emit(p.x + (Math.random() - 0.5) * 0.7, p.y + 0.45 + Math.random() * 0.9, 0.15 + Math.random() * 0.2, (Math.random() - 0.5) * 1.8, 0.8 + Math.random() * 1.8, 1.2, color[0], color[1], color[2], 0.7, 0.16 + Math.random() * 0.12, -0.8);
        }
      }
    } else if (runtime.mode === "dead") {
      runtime.deathT += dt;
      if (runtime.deathT > 1.3) {
        runtime.mode = "over";
        const last = useUI.getState().lastRun;
        if (last?.newRecord) audio.record();
        else audio.gameover();
        useUI.getState().setScreen("gameover");
      }
    }
    if (runtime.coinFx) {
      if (runtime.coinFx.t > 1.2) runtime.coinFx = null;
    }
    runtime.hitFlash = Math.max(0, runtime.hitFlash - dt * 2.5);
    P.update(dt, sim && runtime.mode === "playing" ? sim.speed : 0);

    // Camera
    const portrait = size.width / size.height < 0.85;
    const landscape = size.width / size.height > 1.3;
    const persp = camera as THREE.PerspectiveCamera;
    const fov = portrait ? 74 : landscape ? 58 : 60;
    if (Math.abs(persp.fov - fov) > 0.01) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
    const screen = useUI.getState().screen;
    const camK = set.camera === "near" ? 0.8 : set.camera === "far" ? 1.28 : 1;
    let k = 3;
    if (sim && (runtime.mode === "playing" || runtime.mode === "dead" || runtime.mode === "paused")) {
      const p = sim.player;
      const zback = (portrait ? 7.4 : landscape ? 7.2 : 6.6) * camK;
      tmpPos.set(p.x * 0.6, (portrait ? 3.9 : landscape ? 3.55 : 3.4) * camK + Math.max(0, p.y) * 0.55, zback);
      tmpLook.set(p.x * 0.8, 1.2 + Math.max(0, p.y) * 0.6, -10);
      if (runtime.mode === "dead" && sim.reason === "fall") tmpLook.y -= 1.5;
      k = 7;
    } else if (sim && runtime.mode === "over") {
      const p = sim.player;
      const y = Math.max(0, p.y);
      tmpPos.set(p.x + 1.4, y + 1.6, -4.2);
      tmpLook.set(p.x, y + (portrait ? 0.55 : 0.95), 0);
      k = 2.5;
    } else if (screen === "characters") {
      tmpPos.set(0, 1.3, portrait ? -4.4 : -3.6);
      tmpLook.set(0, portrait ? 0.45 : 0.9, 0);
      k = 3.5;
    } else if (screen === "maps") {
      tmpPos.set(0, 4.5, -7);
      tmpLook.set(0, 2, 25);
    } else {
      tmpPos.set(portrait ? 1.2 : 1.8, 1.5, portrait ? -4.8 : -4.2);
      tmpLook.set(portrait ? 0 : -0.6, portrait ? 0.5 : 0.95, 0);
    }
    const a = 1 - Math.exp(-k * dt);
    camera.position.sub(shakeOff.current);
    camera.position.lerp(tmpPos, a);
    look.current.lerp(tmpLook, a);
    runtime.shake *= Math.exp(-6 * dt);
    shakeOff.current.set((Math.random() - 0.5) * runtime.shake, (Math.random() - 0.5) * runtime.shake, 0);
    camera.position.add(shakeOff.current);
    camera.lookAt(look.current);

    frames.current++;
    if (frames.current === 4) document.getElementById("game-root")?.setAttribute("data-scene-ready", "1");
  });
  return null;
}

export function World() {
  const mapId = useSettings((s) => s.map);
  const charId = useSettings((s) => s.character);
  const quality = useSettings((s) => s.quality);
  const timeOfDay = useSettings((s) => s.timeOfDay);
  const ambientWeather = useSettings((s) => s.ambientWeather);
  const map = MAP_BY_ID[mapId] ?? MAP_BY_ID.city;
  const night = timeOfDay === "night";
  const afternoon = timeOfDay === "afternoon";
  const fog = night ? "#283c5e" : afternoon ? (map.id === "volcano" ? "#c86c53" : "#f0b58c") : map.fog;
  const def = CHARACTER_BY_ID[charId] ?? CHARACTERS[0]!;
  const perSide = { low: 7, medium: 11, high: 15, ultra: 20 }[quality];
  const weather = { low: 150, medium: 350, high: 600, ultra: 900 }[quality];
  return (
    <>
      <Stepper map={map} />
      <color attach="background" args={[fog]} />
      <CartoonSky map={map} timeOfDay={timeOfDay} />
      <fog attach="fog" args={[fog, night ? 12 : map.fogNear, night ? 92 : map.fogFar]} />
      <Lights map={map} quality={quality} timeOfDay={timeOfDay} />
      <Ground map={map} />
      <TrackArchitecture map={map} />
      <Tunnels map={map} />
      <Scenery key={map.id + perSide} map={map} perSide={perSide} />
      <Obstacles map={map} />
      <Coins />
      <CharacterRig key={def.id} def={def} />
      {runtime.challenge === "race" && runtime.raceBots.map((bot) => {
        const botDef = CHARACTER_BY_ID[bot.characterId];
        return botDef ? <CharacterRig key={`race-bot-${bot.id}`} def={botDef} bot={bot} /> : null;
      })}
      <Particles />
      {ambientWeather && <Weather key={map.id + weather} map={map} count={weather} />}
    </>
  );
}
