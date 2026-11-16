import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CoinColorId } from "./data/coins";
import type { MapId } from "./data/maps";
import type { DifficultyId } from "./sim/constants";
import type { DeathReason } from "./sim/types";

export type Quality = "low" | "medium" | "high" | "ultra";
export type ControlsPos = "left" | "center" | "right";
export type CameraMode = "near" | "normal" | "far";
export type TrainingSpeed = 0.75 | 0.5 | 0.25;

export interface Settings {
  quality: Quality;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  soundOn: boolean;
  controlsVisible: boolean;
  controlsSize: number;
  controlsPosition: ControlsPos;
  controlsOpacity: number;
  sensitivity: number;
  speedMult: number;
  difficulty: DifficultyId;
  visualEffects: boolean;
  vibration: boolean;
  camera: CameraMode;
  cameraShake: boolean;
  coinColor: CoinColorId;
  coinSize: number;
  coinGlow: number;
  character: string;
  map: MapId;
  trainingTimescale: TrainingSpeed;
}

export const DEFAULT_SETTINGS: Settings = {
  quality: "medium",
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  soundOn: true,
  controlsVisible: true,
  controlsSize: 1,
  controlsPosition: "center",
  controlsOpacity: 0.85,
  sensitivity: 1,
  speedMult: 1,
  difficulty: "normal",
  visualEffects: true,
  vibration: true,
  camera: "normal",
  cameraShake: true,
  coinColor: "gold",
  coinSize: 1,
  coinGlow: 1,
  character: "ninja-cape-red",
  map: "city",
  trainingTimescale: 0.75,
};

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    { name: "nocoin-settings-v1", storage: createJSONStorage(() => localStorage) },
  ),
);

export interface RunResult {
  time: number;
  reason: DeathReason;
  map: MapId;
  character: string;
  newRecord: boolean;
  newMapRecord: boolean;
  previousBest: number;
  distance: number;
}

export interface Stats {
  bestTime: number;
  runs: number;
  coinsCollected: number;
  collisions: number;
  falls: number;
  totalTime: number;
  totalDistance: number;
  bestByMap: Record<string, number>;
  bestByCharacter: Record<string, number>;
}

export const EMPTY_STATS: Stats = {
  bestTime: 0,
  runs: 0,
  coinsCollected: 0,
  collisions: 0,
  falls: 0,
  totalTime: 0,
  totalDistance: 0,
  bestByMap: {},
  bestByCharacter: {},
};

/** Pure stats update so it can be unit-tested. */
export function applyRun(
  stats: Stats,
  run: { time: number; reason: DeathReason; map: string; character: string; distance: number },
): Stats {
  return {
    bestTime: Math.max(stats.bestTime, run.time),
    runs: stats.runs + 1,
    coinsCollected: stats.coinsCollected + (run.reason === "coin" ? 1 : 0),
    collisions: stats.collisions + (run.reason === "collision" ? 1 : 0),
    falls: stats.falls + (run.reason === "fall" ? 1 : 0),
    totalTime: stats.totalTime + run.time,
    totalDistance: stats.totalDistance + run.distance,
    bestByMap: { ...stats.bestByMap, [run.map]: Math.max(stats.bestByMap[run.map] ?? 0, run.time) },
    bestByCharacter: {
      ...stats.bestByCharacter,
      [run.character]: Math.max(stats.bestByCharacter[run.character] ?? 0, run.time),
    },
  };
}

interface StatsStore extends Stats {
  record: (run: { time: number; reason: DeathReason; map: string; character: string; distance: number }) => void;
  resetStats: () => void;
}

export const useStats = create<StatsStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATS,
      record: (run) => set(applyRun(get(), run)),
      resetStats: () => set(EMPTY_STATS),
    }),
    { name: "nocoin-stats-v1", storage: createJSONStorage(() => localStorage) },
  ),
);

export type Screen = "menu" | "characters" | "maps" | "settings" | "records" | "training" | "playing" | "paused" | "gameover";

interface UIStore {
  screen: Screen;
  lastRun: RunResult | null;
  setScreen: (s: Screen) => void;
  setLastRun: (r: RunResult | null) => void;
}

export const useUI = create<UIStore>()((set) => ({
  screen: "menu",
  lastRun: null,
  setScreen: (screen) => set({ screen }),
  setLastRun: (lastRun) => set({ lastRun }),
}));

export function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t * 100) % 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
