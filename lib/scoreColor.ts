export type ScoreVariant = "bar" | "dot" | "tint" | "border";

type Palette = Record<ScoreVariant, string>;

const PALETTE: Record<"red" | "orange" | "amber" | "lime" | "green", Palette> = {
  red: {
    bar: "bg-red-500",
    dot: "bg-red-500",
    tint: "bg-red-50 dark:bg-red-950/30",
    border: "border-l-red-500",
  },
  orange: {
    bar: "bg-orange-500",
    dot: "bg-orange-500",
    tint: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-l-orange-500",
  },
  amber: {
    bar: "bg-amber-400",
    dot: "bg-amber-400",
    tint: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-l-amber-400",
  },
  lime: {
    bar: "bg-lime-500",
    dot: "bg-lime-500",
    tint: "bg-lime-50 dark:bg-lime-950/30",
    border: "border-l-lime-500",
  },
  green: {
    bar: "bg-green-500",
    dot: "bg-green-500",
    tint: "bg-green-50 dark:bg-green-950/30",
    border: "border-l-green-500",
  },
};

type Color = keyof typeof PALETTE;

function bucket100(score: number): Color {
  if (score <= 20) return "red";
  if (score <= 40) return "orange";
  if (score <= 60) return "amber";
  if (score <= 80) return "lime";
  return "green";
}

function bucket20(score: number): Color {
  if (score <= 5) return "red";
  if (score <= 10) return "orange";
  if (score <= 15) return "lime";
  return "green";
}

export function getScoreColor(
  score: number,
  max: number = 100,
  variant: ScoreVariant = "bar",
): string {
  const color = max === 20 ? bucket20(score) : bucket100(score);
  return PALETTE[color][variant];
}
