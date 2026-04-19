import { describe, it, expect } from "vitest";
import { getScoreColor } from "./scoreColor";

describe("getScoreColor (max=100)", () => {
  it.each([
    [0, "bg-red-500"],
    [30, "bg-red-500"],
    [31, "bg-orange-500"],
    [50, "bg-orange-500"],
    [51, "bg-amber-400"],
    [70, "bg-amber-400"],
    [71, "bg-lime-500"],
    [85, "bg-lime-500"],
    [86, "bg-green-500"],
    [100, "bg-green-500"],
  ])("score %i -> bar %s", (score, expected) => {
    expect(getScoreColor(score, 100, "bar")).toBe(expected);
  });
});

describe("getScoreColor (max=20)", () => {
  it.each([
    [0, "bg-red-500"],
    [6, "bg-red-500"],
    [7, "bg-orange-500"],
    [10, "bg-orange-500"],
    [11, "bg-amber-400"],
    [14, "bg-amber-400"],
    [15, "bg-lime-500"],
    [17, "bg-lime-500"],
    [18, "bg-green-500"],
    [20, "bg-green-500"],
  ])("score %i -> bar %s", (score, expected) => {
    expect(getScoreColor(score, 20, "bar")).toBe(expected);
  });
});

describe("getScoreColor variants", () => {
  it("returns dot class", () => {
    expect(getScoreColor(50, 100, "dot")).toBe("bg-orange-500");
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
