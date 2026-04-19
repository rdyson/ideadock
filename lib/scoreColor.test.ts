import { describe, it, expect } from "vitest";
import { getScoreColor } from "./scoreColor";

describe("getScoreColor (max=100)", () => {
  it.each([
    [0, "bg-red-500"],
    [20, "bg-red-500"],
    [21, "bg-orange-500"],
    [40, "bg-orange-500"],
    [41, "bg-amber-400"],
    [60, "bg-amber-400"],
    [61, "bg-lime-500"],
    [80, "bg-lime-500"],
    [81, "bg-green-500"],
    [100, "bg-green-500"],
  ])("score %i -> bar %s", (score, expected) => {
    expect(getScoreColor(score, 100, "bar")).toBe(expected);
  });
});

describe("getScoreColor (max=20)", () => {
  it.each([
    [0, "bg-red-500"],
    [5, "bg-red-500"],
    [6, "bg-orange-500"],
    [10, "bg-orange-500"],
    [11, "bg-lime-500"],
    [15, "bg-lime-500"],
    [16, "bg-green-500"],
    [20, "bg-green-500"],
  ])("score %i -> bar %s", (score, expected) => {
    expect(getScoreColor(score, 20, "bar")).toBe(expected);
  });
});

describe("getScoreColor variants", () => {
  it("returns dot class", () => {
    expect(getScoreColor(50, 100, "dot")).toBe("bg-amber-400");
  });

  it("returns tint class with dark mode", () => {
    expect(getScoreColor(90, 100, "tint")).toContain("bg-green-50");
    expect(getScoreColor(90, 100, "tint")).toContain("dark:bg-green-950/30");
  });

  it("returns border-left class", () => {
    expect(getScoreColor(10, 100, "border")).toBe("border-l-red-500");
  });

  it("defaults to bar variant and max=100", () => {
    expect(getScoreColor(90)).toBe("bg-green-500");
  });
});
