// Merges keyboard, virtual buttons and swipes into sim actions.
import { runtime } from "./runtime";

export type Action = "up" | "left" | "down" | "right";

const held: Record<Action, { on: boolean; t: number; sources: number }> = {
  up: { on: false, t: 0, sources: 0 },
  left: { on: false, t: 0, sources: 0 },
  down: { on: false, t: 0, sources: 0 },
  right: { on: false, t: 0, sources: 0 },
};

let sensitivity = 1;
export function setSensitivity(v: number) {
  sensitivity = v;
}
export function getSensitivity() {
  return sensitivity;
}

function fire(a: Action) {
  const sim = runtime.sim;
  if (!sim || runtime.mode !== "playing") return;
  if (a === "up") sim.jump();
  else if (a === "down") sim.slide();
  else sim.move(a === "left" ? -1 : 1);
}

/** Immediate press. Hold state is tracked so held keys repeat. */
export function press(a: Action) {
  const h = held[a];
  h.sources++;
  h.on = true;
  h.t = 0;
  fire(a);
  syncHeld();
}

export function release(a: Action) {
  const h = held[a];
  h.sources = Math.max(0, h.sources - 1);
  h.on = h.sources > 0;
  syncHeld();
}

/** Tap without hold (swipes). */
export function tap(a: Action) {
  fire(a);
}

export function releaseAll() {
  for (const k of Object.keys(held) as Action[]) {
    held[k].on = false;
    held[k].sources = 0;
  }
  syncHeld();
}

function syncHeld() {
  const sim = runtime.sim;
  if (!sim) return;
  sim.input.jumpHeld = held.up.on;
  sim.input.slideHeld = held.down.on;
}

/** Called once per frame by the stepper: repeats held lane changes. */
export function updateInput(dt: number) {
  syncHeld();
  const delay = 0.28 / sensitivity;
  const rate = 0.18 / sensitivity;
  for (const a of ["left", "right"] as const) {
    const h = held[a];
    if (!h.on) continue;
    h.t += dt;
    if (h.t >= delay) {
      fire(a);
      h.t = delay - rate;
    }
  }
}

export const KEY_MAP: Record<string, Action> = {
  KeyW: "up",
  ArrowUp: "up",
  Space: "up",
  KeyA: "left",
  ArrowLeft: "left",
  KeyS: "down",
  ArrowDown: "down",
  KeyD: "right",
  ArrowRight: "right",
};
