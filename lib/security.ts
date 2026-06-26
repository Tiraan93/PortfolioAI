/**
 * Same-origin (CSRF-style) guard for state-changing API routes.
 *
 * Browsers send the `Origin` header on same-origin AND cross-origin POST/PUT/DELETE
 * requests, so a legitimate call from our own frontend matches, while bots/curl that
 * omit it (or send a foreign origin) are rejected. This is a cheap first line of
 * defence against drive-by abuse of the LLM endpoints; it is NOT a substitute for
 * rate limiting, auth, or a provider spend cap.
 *
 * Set ALLOWED_ORIGINS (comma-separated, e.g. "https://portfoliochimp.com") to
 * allowlist your production domain(s). If unset, we compare the Origin against the
 * request's own Host header (works for typical same-origin deployments).
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured.includes(origin);
  }

  const host = request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}
