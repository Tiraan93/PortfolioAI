import { NextResponse } from "next/server";

/**
 * IP-based rate limiting: 2 requests per IP per minute (fixed window).
 *
 * In production on Vercel, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * (free Upstash Redis) so the limit is shared across all serverless instances.
 * Without those env vars it falls back to an in-memory limiter, which is fine for
 * local development but is per-instance only (not reliable across serverless cold
 * starts / multiple regions).
 */

const MAX_REQUESTS = 2;
const WINDOW_SECONDS = 60;

export type RateResult = {
  success: boolean;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetMs: number;
};

/**
 * Best-effort client IP. On Vercel the left-most x-forwarded-for entry is the
 * real client. Falls back to "unknown" which buckets unknowns together.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// --- In-memory fallback (per-instance) ---
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string): RateResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + WINDOW_SECONDS * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    if (memoryStore.size > 10_000) {
      for (const [k, v] of memoryStore) {
        if (now >= v.resetAt) memoryStore.delete(k);
      }
    }
    return { success: true, remaining: MAX_REQUESTS - 1, resetMs: resetAt };
  }

  existing.count += 1;
  return {
    success: existing.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - existing.count),
    resetMs: existing.resetAt,
  };
}

// --- Upstash Redis via REST (no SDK dependency) ---
async function upstashLimit(
  url: string,
  token: string,
  key: string,
): Promise<RateResult> {
  const windowIndex = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const windowKey = `${key}:${windowIndex}`;
  const resetMs = (windowIndex + 1) * WINDOW_SECONDS * 1000;

  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", windowKey],
      ["EXPIRE", windowKey, String(WINDOW_SECONDS + 10)],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash REST error ${response.status}`);
  }

  const data = (await response.json()) as Array<{ result?: number }>;
  const count = data?.[0]?.result ?? 1;

  return {
    success: count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - count),
    resetMs,
  };
}

/**
 * Check and consume one request for the given IP + scope.
 * `scope` separates limits per endpoint (e.g. "generate-review").
 */
export async function rateLimit(
  request: Request,
  scope: string,
): Promise<RateResult> {
  const ip = getClientIp(request);
  const key = `ratelimit:${scope}:${ip}`;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (url && token) {
    try {
      return await upstashLimit(url, token, key);
    } catch (error) {
      // Fail open to in-memory so the app keeps working if the store is down.
      console.warn("Rate limit store unavailable, using in-memory fallback:", error);
    }
  }

  return memoryLimit(key);
}

/** Standard 429 response with a Retry-After header. */
export function tooManyRequestsResponse(resetMs: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: `Rate limit reached: max ${MAX_REQUESTS} requests per minute. Please wait ${retryAfter}s and try again.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(MAX_REQUESTS),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
