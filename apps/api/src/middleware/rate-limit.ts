import type { NextFunction, Request, Response } from "express";

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 90;

function getClientKey(req: Request) {
  return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
}

export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = getClientKey(req);
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  current.count += 1;
  res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - current.count)));

  if (current.count > MAX_REQUESTS) {
    res.status(429).json({
      error: "Too many requests. Please try again in a minute.",
      code: "rate_limited"
    });
    return;
  }

  next();
}
