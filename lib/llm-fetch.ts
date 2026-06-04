let initialized = false;

/**
 * On some Windows networks (antivirus SSL inspection, corporate proxy),
 * Node fails HTTPS with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
 * In local development we relax TLS verification for AI API calls only
 * by setting NODE_TLS_REJECT_UNAUTHORIZED=0 for this Node process.
 * Never used in production.
 */
export function allowInsecureLLMSSL(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.LLM_INSECURE_SSL === "false") return false;
  if (process.env.LLM_INSECURE_SSL === "true") return true;
  return process.env.NODE_ENV === "development";
}

export function ensureLLMNetworking(): void {
  if (initialized) return;
  initialized = true;
  if (allowInsecureLLMSSL()) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}
