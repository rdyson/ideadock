import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export class RateLimitError extends Error {
  readonly resetAt: number;
  constructor(message: string, resetAt: number) {
    super(message);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

type LimitKind = "ideaCreate" | "researchRerun";

type Limiters = Record<LimitKind, Ratelimit>;

let cached: Limiters | null = null;

function getLimiters(): Limiters | null {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  cached = {
    ideaCreate: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "24 h"),
      prefix: "rl:idea-create",
      analytics: false,
    }),
    researchRerun: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "rl:research-rerun",
      analytics: false,
    }),
  };
  return cached;
}

export async function enforceLimit(kind: LimitKind, userId: string): Promise<void> {
  const limiters = getLimiters();
  if (!limiters) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[ratelimit] KV env vars missing; allowing ${kind} for ${userId}`);
    }
    return;
  }

  const result = await limiters[kind].limit(userId);
  if (result.success) return;

  const resetIn = Math.max(0, result.reset - Date.now());
  const hours = Math.max(1, Math.ceil(resetIn / 3_600_000));
  throw new RateLimitError(`Daily limit reached. Try again in about ${hours}h.`, result.reset);
}
