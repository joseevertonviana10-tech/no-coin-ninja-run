// Feel and rule constants for the runner. Pure values, no React / three.js.
export const LANE_W = 2.5; // distance between lane centers (m)
export const OBST_HALF_W = 1.0; // half width of a lane obstacle
export const PLAYER_HW = 0.32; // player half width
export const PLAYER_HD = 0.3; // player half depth
export const STAND_H = 1.7;
export const SLIDE_H = 0.75;
export const GRAVITY_UP = 32;
export const GRAVITY_DOWN = 42;
export const JUMP_V = 13.2; // peak ~2.72 m
export const FAST_DROP_V = -24;
export const SLIDE_TIME = 0.72;
export const INPUT_BUFFER = 0.14;
export const COYOTE = 0.09;
export const STEP_TOL = 0.32; // feet within this of a top => land on it
export const BASE_SPEED = 12;
export const MAX_SPEED = 28;
export const COIN_R = 0.42;
export const LANE_K = 22; // lane smoothing (higher = snappier)
export const FALL_DEATH_Y = -1.6;
export const SUBSTEP = 1 / 120;
export const MAX_FRAME_DT = 0.1;

export const TRAIN_TOP = 2.3;
export const COIN_Y = 1.0;

export type DifficultyId = "easy" | "normal" | "hard" | "insane";

export interface Difficulty {
  id: DifficultyId;
  label: string;
  ramp: number; // m/s gained per second
  maxMult: number; // cap multiplier on MAX_SPEED
  density: number; // chance a non-safe lane gets an obstacle
  gapMult: number; // spacing between rows
  coinDensity: number; // chance of coin traps
}

export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  easy: { id: "easy", label: "Fácil", ramp: 0.08, maxMult: 0.75, density: 0.45, gapMult: 1.35, coinDensity: 0.35 },
  normal: { id: "normal", label: "Normal", ramp: 0.14, maxMult: 0.9, density: 0.6, gapMult: 1.12, coinDensity: 0.5 },
  hard: { id: "hard", label: "Difícil", ramp: 0.22, maxMult: 1.0, density: 0.72, gapMult: 0.98, coinDensity: 0.65 },
  insane: { id: "insane", label: "Insano", ramp: 0.32, maxMult: 1.12, density: 0.85, gapMult: 0.9, coinDensity: 0.8 },
};
