import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { CharacterDef } from "../data/characters";
import { runtime } from "../runtime";
import { LANE_W } from "../sim/constants";
import { useSettings, useUI } from "../store";
import { Cape } from "./Cape";
import { Accessories } from "./Accessories";
import { BackGear, CharacterDetails, Forearm, Head, Shin, Thigh, Torso, UpperArm, useCharacterMats } from "./CharacterModel";

const HIP_Y = 0.92;
const JOINTS = ["vx", "vz", "hipY", "tx", "tz", "hx", "hy", "slx", "slz", "el", "srx", "srz", "er", "tl", "kl", "tr", "kr", "z"] as const;
type Pose = Record<(typeof JOINTS)[number], number>;
const zero = (): Pose => Object.fromEntries(JOINTS.map((j) => [j, 0])) as Pose;

export function CharacterRig({ def, bot }: { def: CharacterDef; bot?: { id: number; lane: number; finishAt: number; finished: boolean } }) {
  const m = useCharacterMats(def);
  const allRgb = useSettings((s) => s.allCharactersRgb);
  const accessory = useSettings((s) => s.equippedAccessories[def.id]);
  const timeOfDay = useSettings((s) => s.timeOfDay);
  const root = useRef<THREE.Group>(null!);
  const visual = useRef<THREE.Group>(null!);
  const hips = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const shL = useRef<THREE.Group>(null!);
  const shR = useRef<THREE.Group>(null!);
  const elL = useRef<THREE.Group>(null!);
  const elR = useRef<THREE.Group>(null!);
  const thL = useRef<THREE.Group>(null!);
  const thR = useRef<THREE.Group>(null!);
  const knL = useRef<THREE.Group>(null!);
  const knR = useRef<THREE.Group>(null!);
  const st = useRef({ phase: 0, t: 0, cur: zero(), spin: 0, floor: 0, wind: 0 });

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = st.current;
    s.t += dt;
    const t = s.t;
    if (allRgb) {
      const hue = (t * 0.2) % 1;
      m.main.color.setHSL(hue, 0.95, 0.5);
      m.second.color.setHSL((hue + 0.33) % 1, 0.9, 0.62);
      m.accent.color.setHSL((hue + 0.66) % 1, 1, 0.58);
      m.glow.color.setHSL(hue, 1, 0.62);
      m.glow.emissive.setHSL(hue, 1, 0.28);
      m.main.emissive.setHSL(hue, 0.9, 0.1);
    } else if (def.id === "monkey-rainbow") {
      const hue = (t * 0.22) % 1;
      m.main.color.setHSL(hue, 0.9, 0.48);
      m.second.color.setHSL((hue + 0.34) % 1, 0.82, 0.62);
      m.accent.color.setHSL((hue + 0.67) % 1, 0.95, 0.58);
      m.main.emissive.setHSL(hue, 0.85, 0.12);
    }
    const sim = runtime.sim;
    const mode = runtime.mode;
    const screen = useUI.getState().screen;
    if (bot && sim) {
      const progress = THREE.MathUtils.clamp(sim.time / bot.finishAt, 0, 1);
      const phase = sim.time * 9 + bot.id * 1.7;
      const stride = Math.sin(phase);
      root.current.visible = !bot.finished;
      root.current.position.set(bot.lane * LANE_W, 0, -25 + progress * 19);
      visual.current.rotation.set(0.02, 0, Math.sin(phase * 0.5) * 0.045);
      hips.current.position.y = HIP_Y + Math.abs(Math.cos(phase)) * 0.055;
      torso.current.rotation.set(-0.18, 0, 0);
      head.current.rotation.set(0.04, 0, 0);
      shL.current.rotation.set(-stride * 0.85, 0, -0.12);
      shR.current.rotation.set(stride * 0.85, 0, 0.12);
      elL.current.rotation.x = 1.05;
      elR.current.rotation.x = 1.05;
      thL.current.rotation.x = stride * 0.92;
      thR.current.rotation.x = -stride * 0.92;
      knL.current.rotation.x = -Math.max(0, -Math.cos(phase)) * 1.1;
      knR.current.rotation.x = -Math.max(0, Math.cos(phase)) * 1.1;
      st.current.wind = 8;
      st.current.floor = 0;
      return;
    }
    const tg = zero();
    tg.hipY = HIP_Y;
    let x = 0;
    let y = 0;
    let k = 16;
    let wind = 1.5;
    const zombie = def.style === "zombie";

    const idle = () => {
      tg.tx = -0.03 + Math.sin(t * 2) * 0.025;
      tg.hy = Math.sin(t * 0.7) * 0.35;
      tg.slz = -0.12;
      tg.srz = 0.12;
      tg.el = 0.25;
      tg.er = 0.25;
      if (zombie) {
        tg.slx = tg.srx = 1.4;
        tg.hx = 0.2;
      }
    };
    const victory = () => {
      const hop = Math.abs(Math.sin(t * 5.5));
      y = hop * 0.35;
      tg.slx = 2.9 + Math.sin(t * 11) * 0.2;
      tg.srx = 2.9 - Math.sin(t * 11) * 0.2;
      tg.slz = -0.45;
      tg.srz = 0.45;
      tg.tl = hop * 0.5;
      tg.tr = hop * 0.5;
      tg.kl = tg.kr = -hop * 0.9;
      tg.hx = -0.2;
      k = 20;
    };
    const defeat = () => {
      tg.hipY = 0.5;
      tg.tl = 1.5;
      tg.kl = -1.6;
      tg.tr = -0.15;
      tg.kr = -2.1;
      tg.tx = -0.45;
      tg.hx = 0.55;
      tg.slx = 0.3;
      tg.srx = 0.3;
      tg.el = 0.4;
      tg.er = 0.4;
      tg.vx = 0;
      k = 6;
    };

    if (mode === "menu" || !sim) {
      if (screen === "characters") s.spin += dt * 0.8;
      else s.spin *= Math.exp(-4 * dt);
      if (runtime.celebrateT < 1.8) {
        runtime.celebrateT += dt;
        victory();
      } else idle();
      wind = 1.2 + Math.sin(t * 0.8) * 0.8;
    } else {
      const p = sim.player;
      x = p.x;
      y = p.y;
      s.spin *= Math.exp(-6 * dt);
      if (mode === "over") {
        y = Math.max(0, y);
        if (runtime.outcome === "victory") victory();
        else defeat();
        wind = 1.5;
      } else if (sim.status === "dead") {
        const dT = runtime.deathT;
        wind = 0.5;
        if (sim.reason === "fall") {
          y = p.y - dT * dT * 10;
          tg.slx = 2.8 + Math.sin(t * 22) * 0.5;
          tg.srx = 2.8 - Math.sin(t * 22) * 0.5;
          tg.tl = 0.8 + Math.sin(t * 18) * 0.4;
          tg.tr = 0.3 - Math.sin(t * 18) * 0.4;
          tg.kl = tg.kr = -0.8;
          tg.vx = -0.3;
          k = 14;
        } else if (sim.reason === "collision") {
          tg.vx = 1.45;
          tg.z = Math.min(1, dT * 3) * 1.1;
          tg.slx = 2.7;
          tg.srx = 2.5;
          tg.slz = -0.6;
          tg.srz = 0.6;
          tg.tl = 0.6;
          tg.tr = 0.2;
          tg.kl = -0.4;
          tg.hx = -0.4;
          y = Math.max(0, p.y - dT * 6);
          k = 12;
        } else {
          // Coin: freeze in shock, then slump.
          if (dT < 0.35) {
            tg.slx = 2.6;
            tg.srx = 2.6;
            tg.slz = -0.9;
            tg.srz = 0.9;
            tg.hx = -0.3;
            k = 25;
          } else defeat();
          y = Math.max(0, p.y - dT * 8);
        }
      } else {
        // Alive
        const speed = sim.speed;
        wind = speed;
        const sliding = p.slideT > 0;
        if (p.grounded && !sliding) s.phase += dt * (6.5 + speed * 0.32);
        const ph = s.phase;
        if (sliding) {
          tg.vx = 1.12;
          tg.tx = -0.55;
          tg.hx = -0.35;
          tg.tl = 0.35;
          tg.kl = -0.15;
          tg.tr = 0.75;
          tg.kr = -1.2;
          tg.slx = -0.4;
          tg.slz = -0.5;
          tg.srx = 1.6;
          tg.srz = 0.3;
          tg.el = 0.3;
          tg.er = 0.6;
          k = 22;
        } else if (!p.grounded) {
          const rising = p.vy > 0;
          tg.tl = rising ? 1.1 : 0.6;
          tg.kl = rising ? -1.7 : -0.6;
          tg.tr = rising ? 0.1 : 0.3;
          tg.kr = rising ? -0.5 : -0.4;
          tg.slx = rising ? 2.4 : 1.4;
          tg.srx = rising ? 0.6 : 1.4;
          tg.slz = -0.5;
          tg.srz = 0.5;
          tg.el = 0.5;
          tg.er = 1.0;
          tg.tx = rising ? -0.25 : 0.05;
          if (p.falling) {
            tg.slx = 2.9 + Math.sin(t * 22) * 0.5;
            tg.srx = 2.9 - Math.sin(t * 22) * 0.5;
          }
          k = 14;
        } else {
          const sn = Math.sin(ph);
          tg.tl = sn * 0.95;
          tg.tr = -sn * 0.95;
          tg.kl = -(Math.max(0, -Math.cos(ph)) * 1.4 + 0.25);
          tg.kr = -(Math.max(0, Math.cos(ph)) * 1.4 + 0.25);
          tg.slx = zombie ? 1.4 + sn * 0.15 : -sn * 0.85;
          tg.srx = zombie ? 1.4 - sn * 0.15 : sn * 0.85;
          tg.slz = -0.12;
          tg.srz = 0.12;
          tg.el = zombie ? 0.2 : 1.1 + sn * 0.2;
          tg.er = zombie ? 0.2 : 1.1 - sn * 0.2;
          tg.tx = -0.2;
          tg.hipY = HIP_Y - 0.03 + Math.abs(Math.cos(ph)) * 0.06;
          tg.hy = 0;
          // Natural counter-motion: shoulders and head react against the leg swing.
          tg.hx = 0.08 - sn * 0.035;
          tg.hy = -sn * 0.045;
          tg.tz = sn * 0.06;
          tg.tx = -0.2 + THREE.MathUtils.clamp(-p.vy * 0.025, -0.12, 0.18);
          tg.el = zombie ? 0.2 : 1.08 + sn * 0.24;
          tg.er = zombie ? 0.2 : 1.08 - sn * 0.24;
          // A small shoulder lag makes the arms feel connected to the torso.
          tg.slz = -0.12 - sn * 0.035;
          tg.srz = 0.12 + sn * 0.035;
          k = 26;
        }
        // Lane-change lean and bump wobble
        const lean = THREE.MathUtils.clamp(-(p.lane * LANE_W - p.x) * 0.22, -0.45, 0.45);
        tg.vz = lean + (p.bumpT > 0 ? Math.sin(p.bumpT * 40) * p.bumpT * 0.9 : 0);
      }
    }

    // Damp toward the target pose
    const a = 1 - Math.exp(-k * dt);
    const c = s.cur;
    for (const j of JOINTS) c[j] += (tg[j] - c[j]) * a;

    root.current.position.set(x, y, 0);
    root.current.rotation.y = s.spin;
    visual.current.rotation.set(c.vx, 0, c.vz);
    visual.current.position.z = c.z;
    hips.current.position.y = c.hipY;
    torso.current.rotation.set(c.tx, 0, c.tz);
    head.current.rotation.set(c.hx, c.hy, 0);
    shL.current.rotation.set(c.slx, 0, c.slz);
    shR.current.rotation.set(c.srx, 0, c.srz);
    elL.current.rotation.x = c.el;
    elR.current.rotation.x = c.er;
    thL.current.rotation.x = c.tl;
    thR.current.rotation.x = c.tr;
    knL.current.rotation.x = c.kl;
    knR.current.rotation.x = c.kr;
    s.floor = y;
    s.wind = wind;
  });

  return (
    <group>
      <group ref={root}>
        <pointLight position={[0, 1.25, 0.2]} color="#c9e4ff" intensity={2.4} distance={6.5} decay={2} visible={timeOfDay === "night"} />
        <group ref={visual}>
          <group ref={hips} position={[0, HIP_Y, 0]}>
            <group ref={torso}>
              <Torso def={def} m={m} />
              <CharacterDetails def={def} m={m} />
              <BackGear def={def} m={m} />
              <Accessories accessoryId={accessory} />
              <group ref={head} position={[0, 0.62, 0]}>
                <Head def={def} m={m} />
              </group>
              <group ref={shL} position={[-0.27, 0.5, 0]}>
                <UpperArm def={def} m={m} />
                <group ref={elL} position={[0, -0.27, 0]}>
                  <Forearm def={def} m={m} />
                </group>
              </group>
              <group ref={shR} position={[0.27, 0.5, 0]}>
                <UpperArm def={def} m={m} />
                <group ref={elR} position={[0, -0.27, 0]}>
                  <Forearm def={def} m={m} />
                </group>
              </group>
            </group>
            <group ref={thL} position={[-0.11, 0, 0]}>
              <Thigh def={def} m={m} />
              <group ref={knL} position={[0, -0.45, 0]}>
                <Shin def={def} m={m} />
              </group>
            </group>
            <group ref={thR} position={[0.11, 0, 0]}>
              <Thigh def={def} m={m} />
              <group ref={knR} position={[0, -0.45, 0]}>
                <Shin def={def} m={m} />
              </group>
            </group>
          </group>
        </group>
      </group>
      {def.cape && (
        <Cape
          key={def.id}
          color={def.cape}
          long={def.id === "king-emerald"}
          torso={torso}
          getWind={() => st.current.wind}
          getFloor={() => st.current.floor}
        />
      )}
    </group>
  );
}
