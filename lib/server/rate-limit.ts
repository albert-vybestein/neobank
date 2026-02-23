type RateLimitOptions = {
  max: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.max - 1,
      retryAfterMs: options.windowMs
    };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(existing.resetAt - now, 0)
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(options.max - existing.count, 0),
    retryAfterMs: Math.max(existing.resetAt - now, 0)
  };
}

export function clearRateLimitBuckets() {
  buckets.clear();
}
