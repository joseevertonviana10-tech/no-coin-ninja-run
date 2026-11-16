import { COIN_Y, TRAIN_TOP, type Difficulty } from "./constants";
import type { Rng } from "./rng";
import type { Coin, KindWeights, Obstacle, ObstacleKind, RowLog } from "./types";

/**
 * Procedural track generator. Content is laid out in rows. Every row keeps one
 * "safe" lane (no coins, no trains, at most one jump/slide obstacle) that is
 * adjacent to the previous row's safe lane, so a path always exists.
 */
export class TrackGenerator {
  nextS = 48;
  safeLane = 0;
  blockedUntil = [-1e9, -1e9, -1e9];
  rows: RowLog[] = [];
  private id = 1;

  constructor(
    private rng: Rng,
    private diff: Difficulty,
    private weights: KindWeights,
  ) {}

  fill(obstacles: Obstacle[], coins: Coin[], limit: number, speed: number) {
    let changed = false;
    while (this.nextS < limit) {
      const gap = Math.min(42, Math.max(13, speed * 0.85 * this.diff.gapMult)) * this.rng.range(1, 1.3);
      this.row(obstacles, coins, this.nextS, gap, speed);
      this.nextS += gap;
      changed = true;
    }
    if (this.rows.length > 400) this.rows.splice(0, this.rows.length - 400);
    return changed;
  }

  private dims(kind: ObstacleKind) {
    switch (kind) {
      case "low":
        return { len: 0.5, y0: 0, y1: 1.0, walkable: true };
      case "high":
        return { len: 0.6, y0: 1.15, y1: 3.4, walkable: false };
      case "crate":
        return { len: 1.6, y0: 0, y1: 1.2, walkable: true };
      case "car":
        return { len: 4.2, y0: 0, y1: 1.5, walkable: true };
      case "hole":
        return { len: 3.2, y0: -5, y1: 0, walkable: false };
      case "train":
        return { len: this.rng.range(12, 22), y0: 0, y1: TRAIN_TOP, walkable: true };
      case "ramp":
        return { len: 5, y0: 0, y1: TRAIN_TOP, walkable: true };
    }
  }

  private add(obstacles: Obstacle[], kind: ObstacleKind, lane: number, s: number) {
    const d = this.dims(kind);
    const o: Obstacle = {
      id: this.id++,
      kind,
      lane,
      s0: s,
      s1: s + d.len,
      y0: d.y0,
      y1: d.y1,
      walkable: d.walkable,
      variant: this.rng.int(0, 2),
    };
    obstacles.push(o);
    return o;
  }

  private coinLine(coins: Coin[], lane: number, s: number, maxLen: number, y = COIN_Y) {
    const n = Math.max(3, Math.min(this.rng.int(4, 8), Math.floor(maxLen / 1.5)));
    for (let i = 0; i < n; i++) coins.push({ id: this.id++, lane, s: s + i * 1.5, y, alive: true });
  }

  private coinArc(coins: Coin[], lane: number, s: number) {
    for (let i = -3; i <= 3; i++) {
      const t = 1 - (i * i) / 9;
      coins.push({ id: this.id++, lane, s: s + 0.25 + i * 1.4, y: COIN_Y + t * 1.7, alive: true });
    }
  }

  private pickKind(allowTrain: boolean): Exclude<ObstacleKind, "ramp"> {
    const entries = (Object.entries(this.weights) as [Exclude<ObstacleKind, "ramp">, number][]).filter(
      ([k, w]) => w > 0 && (allowTrain || k !== "train"),
    );
    const total = entries.reduce((a, [, w]) => a + w, 0);
    let r = this.rng.next() * total;
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) return k;
    }
    return entries[0][0];
  }

  private row(obstacles: Obstacle[], coins: Coin[], s: number, gap: number, speed: number) {
    const margin = speed * 0.35 + 2;
    const free = [-1, 0, 1].filter((l) => this.blockedUntil[l + 1] < s - margin);
    let candidates = free.filter((l) => Math.abs(l - this.safeLane) <= 1);
    if (candidates.length === 0) candidates = [this.safeLane];
    // Prefer keeping lane sometimes, moving other times.
    const safe = this.rng.chance(0.45) && candidates.includes(this.safeLane) ? this.safeLane : this.rng.pick(candidates);
    this.safeLane = safe;
    this.rows.push({ s, safe });

    const coinMax = gap * 0.42;
    let blockedCount = [-1, 0, 1].filter((l) => this.blockedUntil[l + 1] >= s - 1).length;

    for (const lane of [-1, 0, 1]) {
      if (lane === safe) {
        if (this.rng.chance(this.diff.density * 0.35)) {
          const k = this.rng.pick(["low", "high", "hole"] as const) ?? "low";
          if (this.weights[k] > 0) this.add(obstacles, k, lane, s);
        }
        continue;
      }
      if (this.blockedUntil[lane + 1] >= s - 1) {
        // Lane is under a train: maybe coin trap on the roof.
        const end = this.blockedUntil[lane + 1] - 1;
        if (end - s > 5 && this.rng.chance(this.diff.coinDensity * 0.5)) {
          this.coinLine(coins, lane, s + 1, Math.min(coinMax, end - s - 1), TRAIN_TOP + COIN_Y);
        }
        continue;
      }
      if (this.rng.chance(this.diff.density)) {
        const kind = this.pickKind(blockedCount < 2);
        if (kind === "train") {
          const withRamp = this.rng.chance(0.45);
          const start = s + (withRamp ? 5 : 0);
          if (withRamp) this.add(obstacles, "ramp", lane, s);
          const t = this.add(obstacles, "train", lane, start);
          this.blockedUntil[lane + 1] = t.s1;
          blockedCount++;
          if (this.rng.chance(this.diff.coinDensity * 0.4)) {
            this.coinLine(coins, lane, start + 1.5, Math.min(coinMax, t.s1 - start - 2), TRAIN_TOP + COIN_Y);
          }
        } else {
          this.add(obstacles, kind, lane, s);
          if (kind === "low" && this.rng.chance(this.diff.coinDensity * 0.6)) this.coinArc(coins, lane, s);
          else if ((kind === "crate" || kind === "car") && this.rng.chance(this.diff.coinDensity * 0.3)) {
            const top = kind === "car" ? 1.5 : 1.2;
            coins.push({ id: this.id++, lane, s: s + 0.8, y: top + 0.7, alive: true });
          }
        }
      } else if (this.rng.chance(this.diff.coinDensity)) {
        this.coinLine(coins, lane, s, coinMax);
      }
    }
  }
}
