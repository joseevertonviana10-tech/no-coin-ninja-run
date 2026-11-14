import {
  BASE_SPEED,
  COIN_R,
  COYOTE,
  DIFFICULTIES,
  FALL_DEATH_Y,
  FAST_DROP_V,
  GRAVITY_DOWN,
  GRAVITY_UP,
  INPUT_BUFFER,
  JUMP_V,
  LANE_K,
  LANE_W,
  MAX_FRAME_DT,
  MAX_SPEED,
  OBST_HALF_W,
  PLAYER_HD,
  PLAYER_HW,
  SLIDE_H,
  SLIDE_TIME,
  STAND_H,
  STEP_TOL,
  SUBSTEP,
  type Difficulty,
  type DifficultyId,
} from "./constants";
import { TrackGenerator } from "./generator";
import { makeRng } from "./rng";
import type { Coin, DeathReason, KindWeights, Obstacle, SimEvent } from "./types";

export interface SimConfig {
  difficulty: DifficultyId;
  speedMult: number; // 0.5..1.8
  coinSize: number; // scales coin hitbox
  laneGrip: number; // 1 = normal, <1 = slippery
  weights: KindWeights;
  seed: number;
  /** Spawn content at all (false for tests that place things by hand). */
  generate?: boolean;
}

export interface PlayerState {
  lane: number;
  x: number;
  prevX: number;
  y: number;
  vy: number;
  grounded: boolean;
  coyote: number;
  slideT: number;
  slideQueued: boolean;
  falling: boolean;
  bumpT: number;
}

export const LOOKAHEAD = 175;

export class Sim {
  player: PlayerState = {
    lane: 0,
    x: 0,
    prevX: 0,
    y: 0,
    vy: 0,
    grounded: true,
    coyote: COYOTE,
    slideT: 0,
    slideQueued: false,
    falling: false,
    bumpT: 0,
  };
  dist = 0;
  speed: number;
  time = 0;
  status: "running" | "dead" = "running";
  reason: DeathReason | null = null;
  killer: Obstacle | Coin | null = null;
  obstacles: Obstacle[] = [];
  coins: Coin[] = [];
  events: SimEvent[] = [];
  version = 0;
  input = { jumpBuf: 0, slideBuf: 0, jumpHeld: false, slideHeld: false };
  readonly diff: Difficulty;
  readonly gen: TrackGenerator;
  private baseSpeed: number;
  private maxSpeed: number;
  private laneK: number;
  private coinR: number;
  private generate: boolean;

  constructor(cfg: SimConfig) {
    this.diff = DIFFICULTIES[cfg.difficulty];
    this.baseSpeed = BASE_SPEED * cfg.speedMult;
    this.maxSpeed = Math.max(this.baseSpeed + 2, MAX_SPEED * cfg.speedMult * this.diff.maxMult);
    this.speed = this.baseSpeed;
    this.laneK = LANE_K * cfg.laneGrip;
    this.coinR = COIN_R * cfg.coinSize;
    this.generate = cfg.generate !== false;
    this.gen = new TrackGenerator(makeRng(cfg.seed), this.diff, cfg.weights);
    if (this.generate) this.gen.fill(this.obstacles, this.coins, LOOKAHEAD, this.maxSpeed * 0.6);
  }

  get height() {
    return this.player.slideT > 0 ? SLIDE_H : STAND_H;
  }

  jump() {
    if (this.status !== "running") return;
    this.input.jumpBuf = INPUT_BUFFER;
  }
  slide() {
    if (this.status !== "running") return;
    this.input.slideBuf = INPUT_BUFFER;
  }
  move(dir: -1 | 1) {
    if (this.status !== "running") return;
    const p = this.player;
    const t = p.lane + dir;
    if (t < -1 || t > 1) {
      p.bumpT = 0.35;
      this.events.push({ type: "bump", dir });
      return;
    }
    p.lane = t;
    this.events.push({ type: "lane", dir });
  }

  /** Advance by a real frame delta. Splits into fixed substeps. */
  update(frameDt: number) {
    let dt = Math.min(frameDt, MAX_FRAME_DT);
    while (dt > 1e-7 && this.status === "running") {
      const h = Math.min(SUBSTEP, dt);
      this.step(h);
      dt -= h;
    }
  }

  private die(reason: DeathReason, killer: Obstacle | Coin | null) {
    if (this.status === "dead") return;
    this.status = "dead";
    this.reason = reason;
    this.killer = killer;
    this.events.push({
      type: "death",
      reason,
      coin: reason === "coin" ? (killer as Coin) : undefined,
      obstacle: reason === "collision" ? (killer as Obstacle) : undefined,
    });
  }

  private overlapsX(x: number, o: { lane: number }, extra = 0) {
    const cx = o.lane * LANE_W;
    return x + PLAYER_HW > cx - OBST_HALF_W - extra && x - PLAYER_HW < cx + OBST_HALF_W + extra;
  }

  private floorAt(x: number, prevY: number) {
    let floor = 0;
    const d = this.dist;
    for (const o of this.obstacles) {
      if (o.s0 > d + PLAYER_HD + 0.5 || o.s1 < d - PLAYER_HD - 0.5) continue;
      if (o.kind === "hole") {
        if (Math.abs(x - o.lane * LANE_W) < LANE_W * 0.42 && d > o.s0 + 0.2 && d < o.s1 - 0.2) floor = Math.min(floor, -100);
        continue;
      }
      if (!o.walkable) continue;
      if (!this.overlapsX(x, o)) continue;
      if (d + PLAYER_HD < o.s0 || d - PLAYER_HD > o.s1) continue;
      if (o.kind === "ramp") {
        const t = Math.min(1, Math.max(0, (d - o.s0) / (o.s1 - o.s0)));
        floor = Math.max(floor, t * o.y1);
      } else if (prevY >= o.y1 - STEP_TOL) {
        floor = Math.max(floor, o.y1);
      }
    }
    return floor;
  }

  step(h: number) {
    const p = this.player;
    const ib = this.input;
    this.time += h;
    this.speed = Math.min(this.baseSpeed + this.diff.ramp * this.time, this.maxSpeed);
    this.dist += this.speed * h;
    ib.jumpBuf -= h;
    ib.slideBuf -= h;
    if (p.bumpT > 0) p.bumpT -= h;

    // Lateral
    p.prevX = p.x;
    const tx = p.lane * LANE_W;
    p.x += (tx - p.x) * (1 - Math.exp(-this.laneK * h));
    if (Math.abs(tx - p.x) < 0.002) p.x = tx;

    // Vertical
    const prevY = p.y;
    p.coyote = p.grounded ? COYOTE : p.coyote - h;
    if ((ib.jumpBuf > 0 || ib.jumpHeld) && p.coyote > 0 && !p.falling) {
      p.vy = JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.slideT = 0;
      ib.jumpBuf = 0;
      this.events.push({ type: "jump" });
    }
    if (ib.slideBuf > 0 && !p.falling) {
      ib.slideBuf = 0;
      if (!p.grounded) {
        p.vy = Math.min(p.vy, FAST_DROP_V);
        p.slideQueued = true;
      } else {
        p.slideT = SLIDE_TIME;
        this.events.push({ type: "slide" });
      }
    }
    if (p.slideT > 0) {
      p.slideT -= h;
      if (ib.slideHeld && p.grounded && p.slideT < 0.08) p.slideT = 0.08;
      if (p.slideT < 0) p.slideT = 0;
    }

    const g = p.vy > 0 ? GRAVITY_UP : GRAVITY_DOWN;
    p.vy -= g * h;
    p.y += p.vy * h;
    // Once the player has dropped into a hole the fall is committed.
    const floor = p.falling ? -100 : this.floorAt(p.x, prevY);
    if (p.y <= floor) {
      if (!p.grounded) {
        this.events.push({ type: "land", impact: -p.vy });
        if (p.slideQueued) {
          p.slideQueued = false;
          p.slideT = SLIDE_TIME;
          this.events.push({ type: "slide" });
        }
      }
      p.y = floor;
      p.vy = 0;
      p.grounded = true;
    } else if (p.y > floor + 0.02) {
      p.grounded = false;
    }
    p.falling = floor < -50 && p.y < -0.05;
    if (p.y < FALL_DEATH_Y) {
      this.die("fall", null);
      return;
    }

    // Obstacle collisions
    const ph = this.height;
    const d = this.dist;
    for (const o of this.obstacles) {
      if (o.kind === "hole" || o.kind === "ramp") continue;
      if (o.s1 < d - PLAYER_HD || o.s0 > d + PLAYER_HD) continue;
      if (!this.overlapsX(p.x, o)) continue;
      if (o.walkable && p.y >= o.y1 - 0.02) continue;
      if (p.y + ph <= o.y0 || p.y >= o.y1) continue;
      if (!this.overlapsX(p.prevX, o)) {
        // Side swipe: bounce back to the lane we came from.
        const dir = p.x > p.prevX ? 1 : -1;
        p.lane = Math.max(-1, Math.min(1, p.lane - dir));
        p.x = p.prevX;
        p.bumpT = 0.35;
        this.events.push({ type: "bump", dir: dir as -1 | 1 });
        continue;
      }
      this.die("collision", o);
      return;
    }

    // Coin pickups (they end the challenge)
    const r2 = this.coinR * this.coinR;
    const px0 = p.x - PLAYER_HW;
    const px1 = p.x + PLAYER_HW;
    const py1 = p.y + ph;
    for (const c of this.coins) {
      if (!c.alive || c.s < d - 1.5 || c.s > d + 1.5) continue;
      const cx = c.lane * LANE_W;
      const dx = Math.min(Math.max(cx, px0), px1) - cx;
      const dy = Math.min(Math.max(c.y, p.y), py1) - c.y;
      const dz = Math.min(Math.max(c.s, d - PLAYER_HD), d + PLAYER_HD) - c.s;
      if (dx * dx + dy * dy + dz * dz < r2) {
        c.alive = false;
        this.die("coin", c);
        return;
      }
    }

    // Recycle and spawn
    if (this.obstacles.length && this.obstacles[0].s1 < d - 30) {
      this.obstacles = this.obstacles.filter((o) => o.s1 >= d - 30);
      this.version++;
    }
    if (this.coins.length && this.coins[0].s < d - 20) {
      this.coins = this.coins.filter((c) => c.s >= d - 20);
      this.version++;
    }
    if (this.generate && this.gen.fill(this.obstacles, this.coins, d + LOOKAHEAD, this.speed)) this.version++;
  }
}
