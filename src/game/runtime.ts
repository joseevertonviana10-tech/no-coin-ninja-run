// Per-frame game state shared between the scene and the HUD, kept outside React.
import { audio } from "./audio";
import { MAP_BY_ID } from "./data/maps";
import { ParticlePool } from "./particles";
import { Sim } from "./sim/sim";
import { useSettings, useUI } from "./store";

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
};

export function startRun(training = false) {
  const s = useSettings.getState();
  const map = MAP_BY_ID[s.map] ?? MAP_BY_ID.city;
  runtime.sim = new Sim({
    difficulty: s.difficulty,
    speedMult: s.speedMult,
    coinSize: s.coinSize,
    laneGrip: map.laneGrip,
    weights: map.weights,
    seed: (Math.random() * 1e9) | 0,
    challenge: training ? "three-rows" : "standard",
  });
  runtime.mode = "playing";
  runtime.training = training;
  runtime.timeScale = training ? s.trainingTimescale : 1;
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
