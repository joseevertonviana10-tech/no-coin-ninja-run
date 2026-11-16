import { describe, expect, it } from "vitest";
import { BASE_SPEED, LANE_W, TRAIN_TOP, type DifficultyId } from "./constants";
import { Sim } from "./sim";
import type { KindWeights, Obstacle, ObstacleKind } from "./types";

const W: KindWeights = { low: 3, high: 2, crate: 2, car: 1, train: 2, hole: 1 };
const DIMS: Record<ObstacleKind, [number, number, number, boolean]> = {
  low: [0.5, 0, 1.0, true],
  high: [0.6, 1.15, 3.4, false],
  crate: [1.6, 0, 1.2, true],
  car: [4.2, 0, 1.5, true],
  train: [16, 0, TRAIN_TOP, true],
  ramp: [5, 0, TRAIN_TOP, true],
  hole: [3.2, -5, 0, false],
};

function emptySim(speedMult = 1) {
  return new Sim({ difficulty: "normal", speedMult, coinSize: 1, laneGrip: 1, weights: W, seed: 1, generate: false });
}
function place(sim: Sim, kind: ObstacleKind, lane: number, s: number): Obstacle {
  const [len, y0, y1, walkable] = DIMS[kind];
  const o = { id: sim.obstacles.length + 1, kind, lane, s0: s, s1: s + len, y0, y1, walkable, variant: 0 };
  sim.obstacles.push(o);
  return o;
}
function run(sim: Sim, seconds: number, each?: (sim: Sim) => void) {
  for (let t = 0; t < seconds && sim.status === "running"; t += 1 / 60) {
    each?.(sim);
    sim.update(1 / 60);
  }
}
/** Press jump when the obstacle is `lead` metres ahead. */
function jumpAt(lead: number, s: number) {
  let done = false;
  return (sim: Sim) => {
    if (!done && s - sim.dist < lead) {
      sim.jump();
      done = true;
    }
  };
}

describe("NO COIN rules", () => {
  it("jumping over a low barrier does not end the run", () => {
    const sim = emptySim();
    place(sim, "low", 0, 30);
    run(sim, 4, jumpAt(4, 30));
    expect(sim.status).toBe("running");
    expect(sim.dist).toBeGreaterThan(31);
  });

  it("running into a low barrier ends the run as a collision", () => {
    const sim = emptySim();
    place(sim, "low", 0, 30);
    run(sim, 4);
    expect(sim.status).toBe("dead");
    expect(sim.reason).toBe("collision");
  });

  it("sliding under a high barrier survives, standing hits it", () => {
    const a = emptySim();
    place(a, "high", 0, 30);
    let slid = false;
    run(a, 4, (s) => {
      if (!slid && 30 - s.dist < 4) {
        s.slide();
        slid = true;
      }
    });
    expect(a.status).toBe("running");

    const b = emptySim();
    place(b, "high", 0, 30);
    run(b, 4);
    expect(b.reason).toBe("collision");
  });

  it("touching a coin ends the run with reason coin and freezes the timer", () => {
    const sim = emptySim();
    sim.coins.push({ id: 1, lane: 0, s: 20, y: 1, alive: true });
    run(sim, 4);
    expect(sim.status).toBe("dead");
    expect(sim.reason).toBe("coin");
    const frozen = sim.time;
    expect(frozen).toBeCloseTo((20 - 0.3 - 0.42) / BASE_SPEED, 1);
    sim.update(1 / 60);
    sim.update(0.5);
    expect(sim.time).toBe(frozen);
  });

  it("coins in another lane are harmless", () => {
    const sim = emptySim();
    sim.coins.push({ id: 1, lane: 1, s: 20, y: 1, alive: true });
    run(sim, 4);
    expect(sim.status).toBe("running");
  });

  it("jumping over a coin line clears it", () => {
    const sim = emptySim();
    sim.coins.push({ id: 1, lane: 0, s: 30, y: 1, alive: true });
    run(sim, 4, jumpAt(5, 30));
    expect(sim.status).toBe("running");
  });

  it("running into a hole is a fall; jumping it survives", () => {
    const a = emptySim();
    place(a, "hole", 0, 30);
    run(a, 5);
    expect(a.reason).toBe("fall");

    const b = emptySim();
    place(b, "hole", 0, 30);
    run(b, 5, jumpAt(2.5, 30));
    expect(b.status).toBe("running");
  });

  it("jumping onto a train lets you run on its roof", () => {
    const sim = emptySim();
    place(sim, "train", 0, 30);
    run(sim, 2.6, jumpAt(3.5, 30));
    expect(sim.status).toBe("running");
    expect(sim.dist).toBeGreaterThan(31);
  });

  it("a ramp leads onto the train roof", () => {
    const sim = emptySim();
    place(sim, "ramp", 0, 25);
    place(sim, "train", 0, 30);
    run(sim, 2.8);
    expect(sim.status).toBe("running");
    expect(sim.player.y).toBeCloseTo(TRAIN_TOP, 1);
  });

  it("side-swiping a train bumps you back instead of ending the run", () => {
    const sim = emptySim();
    place(sim, "train", 1, 10);
    run(sim, 1.2);
    sim.move(1);
    run(sim, 0.5);
    expect(sim.status).toBe("running");
    expect(sim.player.lane).toBe(0);
  });

  it("three-row training creates five consecutive coin walls across all lanes", () => {
    const sim = new Sim({
      difficulty: "normal", speedMult: 1, coinSize: 1, laneGrip: 1,
      weights: W, seed: 7, challenge: "three-rows",
    });
    const first = sim.coins.slice(0, 15);
    expect(first).toHaveLength(15);
    expect(new Set(first.map((c) => c.lane))).toEqual(new Set([-1, 0, 1]));
    expect(new Set(first.map((c) => c.s)).size).toBe(5);
  });

  it("Nerdola spawns two outer-lane trains and coins in the center and on their roofs", () => {
    const sim = new Sim({
      difficulty: "normal", speedMult: 1, coinSize: 1, laneGrip: 1,
      weights: W, seed: 7, challenge: "nerdola",
    });
    const trains = sim.obstacles.filter((o) => o.kind === "train").slice(0, 2);
    expect(trains.map((o) => o.lane)).toEqual([-1, 1]);
    expect(sim.coins.some((c) => c.lane === 0 && c.y === 1)).toBe(true);
    expect(sim.coins.some((c) => c.lane === -1 && c.y > TRAIN_TOP)).toBe(true);
    expect(sim.coins.some((c) => c.lane === 1 && c.y > TRAIN_TOP)).toBe(true);
  });
  it("speed setting scales the starting speed", () => {
    expect(emptySim(1.5).speed).toBeCloseTo(BASE_SPEED * 1.5);
    expect(emptySim(0.6).speed).toBeCloseTo(BASE_SPEED * 0.6);
  });
});

/** Bot that follows the generator's safe lanes: proves no row is impossible. */
function botStep(sim: Sim) {
  const p = sim.player;
  const d = sim.dist;
  const coinAhead = sim.coins.find((c) => c.alive && c.lane === p.lane && c.s > d + 0.5 && c.s - d < sim.speed * 0.4 + 2);
  if (coinAhead && p.grounded) sim.jump();
  const next = sim.gen.rows.find((r) => r.s > d - 0.2);
  const look = sim.speed * 0.28 + 2;
  const laneClear = (lane: number) =>
    !sim.obstacles.some((o) => o.lane === lane && o.s1 > d - 1.2 && o.s0 < d + look) &&
    !sim.coins.some((c) => c.alive && c.lane === lane && c.s > d - 1.2 && c.s < d + look);
  if (next && p.lane === Math.round(p.x / LANE_W)) {
    const dir = Math.sign(next.safe - p.lane) as -1 | 0 | 1;
    if (dir !== 0 && laneClear(p.lane + dir)) sim.move(dir);
  }
  for (const o of sim.obstacles) {
    if (o.lane !== p.lane || o.kind === "ramp") continue;
    const ahead = o.s0 - d;
    if (ahead < 0 || ahead > 12) continue;
    if (o.kind === "high" && ahead < sim.speed * 0.3 && p.slideT <= 0) sim.slide();
    if ((o.kind === "low" || o.kind === "crate" || o.kind === "car" || o.kind === "train") && ahead < sim.speed * 0.2 + 0.6) sim.jump();
    if (o.kind === "hole" && ahead < sim.speed * 0.12 + 0.3) sim.jump();
  }
}

describe("procedural track", () => {
  const diffs: DifficultyId[] = ["easy", "normal", "hard", "insane"];
  for (const difficulty of diffs) {
    it(`always leaves a coin-free path on ${difficulty}`, () => {
      for (const seed of [1, 7, 42, 99]) {
        const sim = new Sim({ difficulty, speedMult: 1, coinSize: 1, laneGrip: 1, weights: W, seed });
        run(sim, 90, botStep);
        expect({ seed, status: sim.status, reason: sim.reason, t: Math.round(sim.time) }).toEqual({
          seed,
          status: "running",
          reason: null,
          t: 90,
        });
      }
    });
  }
});
