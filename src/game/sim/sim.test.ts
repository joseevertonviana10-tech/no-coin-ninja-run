import { describe, expect, it } from "vitest";
import { BASE_SPEED, LANE_W, TRAIN_TOP, type DifficultyId } from "./constants";
import { Sim } from "./sim";
import { getTunnelBlend, TUNNEL_APPROACH, TUNNEL_FIRST, TUNNEL_LENGTH, TUNNEL_VISUAL_LEAD } from "./tunnels";
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

  it("tunnels always place a long train in the centre and leave a reachable side platform", () => {
    for (const seed of [1, 7, 42, 99, 2026]) {
      const sim = new Sim({
        difficulty: "normal", speedMult: 1, coinSize: 1, laneGrip: 1,
        weights: W, seed,
      });
      sim.gen.fill(sim.obstacles, sim.coins, TUNNEL_FIRST + 100, sim.speed);
      const train = sim.obstacles.find((o) => o.kind === "train" && o.lane === 0 && o.s0 >= TUNNEL_FIRST);
      const tunnelRow = sim.gen.rows.find((row) => row.s >= TUNNEL_FIRST && row.s < TUNNEL_FIRST + 80);
      expect(train, `missing centre train for seed ${seed}`).toBeDefined();
      expect(train!.s0).toBe(sim.gen.tunnelStarts[0]! + TUNNEL_APPROACH);
      expect(train!.s1 - train!.s0).toBeCloseTo(TUNNEL_LENGTH - 13, 5);
      expect(tunnelRow?.safe === -1 || tunnelRow?.safe === 1).toBe(true);
      expect(sim.coins.some((coin) => coin.s >= train!.s0 && coin.s <= train!.s1 && coin.lane === tunnelRow!.safe)).toBe(false);
    }
  });

  it("tunnel darkness fades in before the portal and fades out after the exit", () => {
    const entrance = 240;
    expect(getTunnelBlend(entrance - TUNNEL_VISUAL_LEAD - 8, [entrance])).toBe(0);
    expect(getTunnelBlend(entrance + 3, [entrance])).toBeCloseTo(1, 5);
    expect(getTunnelBlend(entrance + TUNNEL_LENGTH + TUNNEL_VISUAL_LEAD + 9, [entrance])).toBe(0);
  });

  it("tunnel side-platform coin traps are random, and the safe platform remains coin-free", () => {
    let withCoinTrap = 0;
    let withoutCoinTrap = 0;
    for (let seed = 1; seed <= 32; seed++) {
      const sim = new Sim({
        difficulty: "normal", speedMult: 1, coinSize: 1, laneGrip: 1,
        weights: W, seed,
      });
      sim.gen.fill(sim.obstacles, sim.coins, TUNNEL_FIRST + 100, sim.speed);
      const train = sim.obstacles.find((o) => o.kind === "train" && o.lane === 0 && o.s0 >= TUNNEL_FIRST)!;
      const safe = sim.gen.rows.find((row) => row.s >= TUNNEL_FIRST && row.s < TUNNEL_FIRST + 80)!.safe;
      const trapCoins = sim.coins.filter((coin) => coin.s >= train.s0 + 6 && coin.s <= train.s0 + 24 && coin.lane === -safe);
      if (trapCoins.length) withCoinTrap++;
      else withoutCoinTrap++;
      expect(sim.coins.some((coin) => coin.s >= train.s0 && coin.s <= train.s1 && coin.lane === safe)).toBe(false);
    }
    expect(withCoinTrap).toBeGreaterThan(0);
    expect(withoutCoinTrap).toBeGreaterThan(0);
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
