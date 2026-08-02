type LimitEntry = {
  count: number;
  resetAt: number;
};

const memory = new Map<string, LimitEntry>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  memory.set(key, current);
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}
