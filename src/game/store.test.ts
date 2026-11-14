import { describe, expect, it } from "vitest";
import { applyRun, EMPTY_STATS, formatTime } from "./store";

describe("records and stats", () => {
  it("keeps the longest no-coin time as the personal record", () => {
    let s = applyRun(EMPTY_STATS, { time: 30, reason: "coin", map: "city", character: "a", distance: 300 });
    s = applyRun(s, { time: 12, reason: "collision", map: "snow", character: "b", distance: 100 });
    expect(s.bestTime).toBe(30);
    expect(s.runs).toBe(2);
    expect(s.coinsCollected).toBe(1);
    expect(s.collisions).toBe(1);
    expect(s.bestByMap).toEqual({ city: 30, snow: 12 });
    expect(s.bestByCharacter).toEqual({ a: 30, b: 12 });
  });

  it("formats the timer as MM:SS.cc", () => {
    expect(formatTime(165.83)).toBe("02:45.83");
    expect(formatTime(0)).toBe("00:00.00");
  });
});
