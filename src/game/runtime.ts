// Per-frame game state shared between the scene and the HUD, kept outside React.
import { audio } from "./audio";
import { MAP_BY_ID } from "./data/maps";
import { ParticlePool } from "./particles";
import { Sim } from "./sim/sim";
import { useSettings, useStats, useUI } from "./store";

export type Mode = "menu" | "playing" | "paused" | "dead" | "over";

export const runtime = {
  sim: null as Sim | null,
  mode: "menu" as Mode,
  deathT: 0,
  /** "victory" | "defeat" pose on the game over screen. */
  outcome: "defeat" as "victory" | "defeat",
  celebrateT: 99,
  shake: 0,
  hitFlash: 0,
  coinFx: null as null | { x: number; y: number; z: number; t: number },
  particles: new ParticlePool(420),
  runId: 0,
  training: false,
  timeScale: 1,
  keyMilestone: 0,
};

export function startRun(training = false) {
  const s = useSettings.getState();
  const map = MAP_BY_ID[s.map] ?? MAP_BY_ID.city;
  runtime.sim = new Sim({
    difficulty: s.difficulty,
    speedMult: s.speedMult,
    coinSize: s.coinSize,
    noCoin: s.noCoinMode,
    autoDodge: s.autoDodge,
    laneGrip: map.laneGrip,
    weights: map.weights,
    seed: (Math.random() * 1e9) | 0,
    challenge: training ? "three-rows" : "standard",
  });
  runtime.mode = "playing";
  runtime.training = training;
  runtime.timeScale = training ? s.trainingTimescale : 1;
  runtime.keyMilestone = 0;
  runtime.deathT = 0;
  runtime.shake = 0;
  runtime.hitFlash = 0;
  runtime.coinFx = null;
  runtime.particles.clear();
  runtime.runId++;
  audio.unlock();
  audio.startMusic(map.id);
  useUI.getState().setLastRun(null);
  useUI.getState().setScreen("playing");
}

export function reviveRun() {
  const sim = runtime.sim;
  if (!sim || runtime.mode !== "over" || !useStats.getState().spendKey()) return false;
  const p = sim.player;
  const d = sim.dist;
  runtime.particles.burst(150, p.x, Math.max(0.7, p.y + 0.7), -0.3, 8, [0.12, 0.62, 1], 1.8, 1.05, -0.7, 1.8);
  runtime.particles.burst(90, p.x, Math.max(0.5, p.y + 0.45), -0.2, 4.5, [0.28, 0.82, 1], 2.4, 1.45, -0.25, 1.4);
  sim.obstacles = sim.obstacles.filter((o) => o.s1 < d - 2 || o.s0 > d + 22);
  sim.coins = sim.coins.filter((c) => { if (c.s >= d - 2 && c.s <= d + 22) { c.alive = false; return false; } return true; });
  p.y = 0; p.vy = 0; p.grounded = true; p.coyote = 0.12; p.falling = false; p.slideT = 0; p.slideQueued = false;
  sim.status = "running"; sim.reason = null; sim.killer = null; sim.events.length = 0;
  runtime.mode = "playing"; runtime.deathT = 0; runtime.hitFlash = 0; runtime.shake = 0.35;
  runtime.outcome = "defeat";
  useUI.getState().setLastRun(null);
  useUI.getState().setScreen("playing");
  audio.startMusic(useSettings.getState().map);
  return true;
}

export function pauseRun() {
  if (runtime.mode !== "playing") return;
  runtime.mode = "paused";
  useUI.getState().setScreen("paused");
}

export function resumeRun() {
  if (runtime.mode !== "paused") return;
  runtime.mode = "playing";
  useUI.getState().setScreen("playing");
}

export function toMenu() {
  runtime.mode = "menu";
  runtime.training = false;
  runtime.timeScale = 1;
  runtime.sim = null;
  runtime.particles.clear();
  runtime.coinFx = null;
  audio.unlock();
  audio.startMusic(useSettings.getState().map);
  useUI.getState().setScreen("menu");
}
