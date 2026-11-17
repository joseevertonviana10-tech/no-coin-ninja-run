export type ObstacleKind = "low" | "high" | "crate" | "car" | "train" | "ramp" | "hole";

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  lane: number; // -1 | 0 | 1
  s0: number; // start along track
  s1: number; // end along track
  y0: number;
  y1: number;
  walkable: boolean;
  variant: number;
}

export interface Coin {
  id: number;
  lane: number;
  s: number;
  y: number;
  alive: boolean;
}

export type DeathReason = "coin" | "collision" | "fall" | "victory";

export type SimEvent =
  | { type: "jump" }
  | { type: "land"; impact: number }
  | { type: "slide" }
  | { type: "lane"; dir: -1 | 1 }
  | { type: "bump"; dir: -1 | 1 }
  | { type: "death"; reason: DeathReason; coin?: Coin; obstacle?: Obstacle };

export type KindWeights = Record<Exclude<ObstacleKind, "ramp">, number>;

export interface RowLog {
  s: number;
  safe: number;
}
