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
import { useSettings, useStats, useUI, type Quality } from "../store";
import { CharacterRig } from "./Character";
import { Coins } from "./Coins";
import { Particles, Weather } from "./Effects";
import { Obstacles } from "./Obstacles";
import { Scenery } from "./Scenery";
import { sideTexture, trackTexture } from "./textures";

const TRACK_LEN = 260;
const TRACK_W = 8.4;

function Ground({ map }: { map: MapDef }) {
  const track = useMemo(() => trackTexture(map), [map]);
  const side = useMemo(() => sideTexture(map), [map]);
  const sideMat = useRef<THREE.MeshStandardMaterial>(null!);
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
        <meshStandardMaterial map={track} roughness={map.id === "future" ? 0.25 : 0.9} metalness={map.id === "future" ? 0.5 : 0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, map.sideEmissive && map.id === "volcano" ? -0.6 : -0.02, -TRACK_LEN / 2 + 30]} receiveShadow>
        <planeGeometry args={[240, TRACK_LEN]} />
        <meshStandardMaterial
          ref={sideMat}
          map={side}
          roughness={0.95}
          emissive={map.sideEmissive ?? "#000000"}
          emissiveMap={map.sideEmissive ? side : null}
          emissiveIntensity={map.sideEmissive ? (map.id === "volcano" ? 1.6 : 0.6) : 0}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (TRACK_W / 2 + 0.1), map.id === "volcano" ? -0.3 : 0.08, -TRACK_LEN / 2 + 30]} receiveShadow castShadow>
          <boxGeometry args={[0.25, map.id === "volcano" ? 0.8 : 0.16, TRACK_LEN]} />
          <meshStandardMaterial
            color={edge}
            emissive={map.id === "future" ? edge : "#000000"}
            emissiveIntensity={map.id === "future" ? 2 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

const SHADOW: Record<Quality, number> = { low: 0, medium: 1024, high: 2048, ultra: 2048 };

function Lights({ map, quality, timeOfDay }: { map: MapDef; quality: Quality; timeOfDay: "day" | "afternoon" | "night" }) {
  const sun = useRef<THREE.DirectionalLight>(null!);
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
  });
  const sm = SHADOW[quality];
  const night = timeOfDay === "night";
  const afternoon = timeOfDay === "afternoon";
  const sunColor = night ? "#9bbcff" : afternoon ? "#ffbd83" : map.sun;
  const sunPower = map.sunIntensity * (night ? 0.12 : afternoon ? 0.72 : 1);
  const hemiPower = map.hemiIntensity * (night ? 0.28 : afternoon ? 0.82 : 1);
  return (
    <>
      <hemisphereLight args={[night ? "#263b68" : afternoon ? "#ffd0a0" : map.hemiSky, night ? "#080d18" : map.hemiGround, hemiPower]} />
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
          <Lightformer intensity={1.6} color={map.hemiSky} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
          <Lightformer intensity={1} color={map.sun} position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[16, 2, 1]} />
          <Lightformer intensity={0.6} color={map.fog} position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[16, 2, 1]} />
        </Environment>
      )}
    </>
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
    const persp = camera as THREE.PerspectiveCamera;
    const fov = portrait ? 74 : 60;
    if (Math.abs(persp.fov - fov) > 0.01) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
    const screen = useUI.getState().screen;
    const camK = set.camera === "near" ? 0.8 : set.camera === "far" ? 1.28 : 1;
    let k = 3;
    if (sim && (runtime.mode === "playing" || runtime.mode === "dead" || runtime.mode === "paused")) {
      const p = sim.player;
      const zback = (portrait ? 7.4 : 6.6) * camK;
      tmpPos.set(p.x * 0.6, (portrait ? 3.9 : 3.4) * camK + Math.max(0, p.y) * 0.55, zback);
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
  const map = MAP_BY_ID[mapId] ?? MAP_BY_ID.city;
  const night = timeOfDay === "night";
  const afternoon = timeOfDay === "afternoon";
  const sky = night ? "#050914" : afternoon ? "#d99368" : map.sky;
  const fog = night ? "#0a1020" : afternoon ? "#e6b18e" : map.fog;
  const def = CHARACTER_BY_ID[charId] ?? CHARACTERS[0]!;
  const perSide = { low: 7, medium: 11, high: 15, ultra: 20 }[quality];
  const weather = { low: 150, medium: 350, high: 600, ultra: 900 }[quality];
  return (
    <>
      <Stepper map={map} />
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fog, night ? 12 : map.fogNear, night ? 82 : map.fogFar]} />
      <Lights map={map} quality={quality} timeOfDay={timeOfDay} />
      <Ground map={map} />
      <Scenery key={map.id + perSide} map={map} perSide={perSide} />
      <Obstacles map={map} />
      <Coins />
      <CharacterRig key={def.id} def={def} />
      <Particles />
      <Weather key={map.id + weather} map={map} count={weather} />
    </>
  );
}
