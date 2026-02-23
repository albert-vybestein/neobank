import { beforeEach, describe, expect, it } from "vitest";

import { checkRateLimit, clearRateLimitBuckets } from "@/lib/server/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it("blocks after max requests", () => {
    const options = { max: 2, windowMs: 60_000 };

    expect(checkRateLimit("key", options).allowed).toBe(true);
    expect(checkRateLimit("key", options).allowed).toBe(true);
    expect(checkRateLimit("key", options).allowed).toBe(false);
  });

  it("resets when cleared", () => {
    const options = { max: 1, windowMs: 60_000 };
    checkRateLimit("key", options);
    expect(checkRateLimit("key", options).allowed).toBe(false);

    clearRateLimitBuckets();
    expect(checkRateLimit("key", options).allowed).toBe(true);
  });
});
