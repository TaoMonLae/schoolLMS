/**
 * lib/rate-limit.ts — Sliding-window rate limiter
 * ─────────────────────────────────────────────────
 * In-process sliding-window rate limiter suitable for a single-instance
 * deployment (DigitalOcean Droplet, single PM2 process).
 *
 * ⚠️  MULTI-INSTANCE NOTE:
 * If you scale to multiple Node processes or containers, replace the
 * in-memory store with Upstash Redis:
 *   npm install @upstash/ratelimit @upstash/redis
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, "10 s"),
 *   });
 *
 * Built-in limits:
 *   - login:       5 attempts per 15 minutes per IP
 *   - api:       100 requests per minute per IP
 *   - super-admin: 30 requests per minute per user
 *   - default:    60 requests per minute per IP
 *
 * Usage (in Next.js middleware or server action):
 *   import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
 *
 *   const result = rateLimit("login", clientIp);
 *   if (!result.allowed) {
 *     return new Response("Too Many Requests", {
 *       status: 429,
 *       headers: { "Retry-After": String(result.retryAfterSeconds) },
 *     });
 *   }
 */

import { logger } from "@/lib/logger";

// ── Configuration ─────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  /** Authentication endpoints — strict to prevent brute-force */
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  /** General API routes */
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Super-admin operations — tighter to detect privilege abuse */
  "super-admin": { maxRequests: 30, windowMs: 60 * 1000 },
  /** Default for anything not explicitly configured */
  default: { maxRequests: 60, windowMs: 60 * 1000 },
};

// ── In-memory store ───────────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
  lastPruned: number;
}

// key → sliding window of request timestamps
const store = new Map<string, WindowEntry>();

// Prune entries that haven't been touched for 2× the longest window
const MAX_IDLE_MS = 2 * 60 * 60 * 1000; // 2 hours

let lastGlobalPrune = Date.now();

function globalPrune(now: number): void {
  if (now - lastGlobalPrune < 5 * 60 * 1000) return; // prune at most every 5 min
  lastGlobalPrune = now;
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastPruned > MAX_IDLE_MS) {
      store.delete(key);
    }
  }
}

// ── Core rate-limit function ──────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

/**
 * Checks and records a request against the rate limit for a given bucket and identifier.
 *
 * @param bucket   One of the RATE_LIMIT_CONFIGS keys, or "default"
 * @param identifier  Client IP, user ID, or composite key
 */
export function rateLimit(bucket: string, identifier: string): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[bucket] ?? RATE_LIMIT_CONFIGS.default;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Periodic global store pruning to avoid unbounded memory growth
  globalPrune(now);

  const key = `${bucket}:${identifier}`;
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [], lastPruned: now };
    store.set(key, entry);
  }

  // Prune timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
  entry.lastPruned = now;

  const currentCount = entry.timestamps.length;

  if (currentCount >= config.maxRequests) {
    // Oldest timestamp in window — adding windowMs gives the reset time
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + config.windowMs;
    const retryAfterSeconds = Math.ceil((resetMs - now) / 1000);

    logger.security("Rate limit exceeded", { bucket, identifier, currentCount });

    return {
      allowed: false,
      remaining: 0,
      resetMs,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this request
  entry.timestamps.push(now);

  const oldestInWindow = entry.timestamps[0];
  const resetMs = oldestInWindow + config.windowMs;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs,
    retryAfterSeconds: 0,
  };
}

// ── Rate limit headers helper ─────────────────────────────────────────────────

/**
 * Converts a RateLimitResult into HTTP headers for a Next.js Response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

// ── IP extraction helper ──────────────────────────────────────────────────────

/**
 * Extracts the real client IP from a Next.js request.
 * Reads x-forwarded-for (set by Nginx/Cloudflare) then falls back
 * to x-real-ip, then to a generic unknown marker.
 *
 * ⚠️  In production, ensure your Nginx config sets these headers and
 *     that you trust the proxy (so users can't spoof the IP).
 */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; take the first (client) IP
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}

// ── Store size (for monitoring / health checks) ───────────────────────────────
export function getRateLimitStoreSize(): number {
  return store.size;
}

export function resetRateLimitStore(): void {
  store.clear();
}
