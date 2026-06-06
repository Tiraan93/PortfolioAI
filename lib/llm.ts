import OpenAI from "openai";
import { allowInsecureLLMSSL, ensureLLMNetworking } from "@/lib/llm-fetch";

export type LLMProvider = "groq" | "openai" | "ollama";

const PROVIDER_CONFIG: Record<
  LLMProvider,
  { baseURL?: string; defaultModel: string; apiKeyEnv: string | null }
> = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    apiKeyEnv: "GROQ_API_KEY",
  },
  openai: {
    defaultModel: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  ollama: {
    baseURL: "http://127.0.0.1:11434/v1",
    defaultModel: "llama3.2",
    apiKeyEnv: null,
  },
};

export function getLLMProvider(): LLMProvider {
  const raw = process.env.LLM_PROVIDER;
  const explicit = raw ? raw.trim().toLowerCase() : undefined;
  if (explicit === "groq" || explicit === "openai" || explicit === "ollama") {
    return explicit as LLMProvider;
  }

  // Prefer OpenAI if available, otherwise fall back to Groq when explicitly configured.
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";

  // Default to OpenAI to avoid confusing prompts asking for a GROQ key.
  return "openai";
}

export function getLLMProviderLabel(provider: LLMProvider = getLLMProvider()): string {
  switch (provider) {
    case "groq":
      return "Groq (free tier)";
    case "ollama":
      return "Ollama (local)";
    default:
      return "OpenAI";
  }
}

export function getSetupMessage(provider: LLMProvider = getLLMProvider()): string {
  switch (provider) {
    case "groq":
      return "Add a free GROQ_API_KEY from https://console.groq.com/keys to .env.local (UTF-8), then restart the dev server.";
    case "ollama":
      return "Install Ollama, run `ollama pull llama3.2`, set LLM_PROVIDER=ollama in .env.local, then restart the dev server.";
    default:
      return "Add OPENAI_API_KEY to .env.local, then restart the dev server.";
  }
}

export function hasLLMConfigured(): boolean {
  const provider = getLLMProvider();
  if (provider === "ollama") return true;
  const envName = PROVIDER_CONFIG[provider].apiKeyEnv;
  return Boolean(envName && process.env[envName]?.trim());
}

export function getLLMClient(): OpenAI | null {
  const provider = getLLMProvider();
  const config = PROVIDER_CONFIG[provider];

  if (provider === "ollama") {
    const baseURL = process.env.OLLAMA_BASE_URL?.trim() || config.baseURL;
    ensureLLMNetworking();
    return new OpenAI({ apiKey: "ollama", baseURL });
  }

  const envName = config.apiKeyEnv;
  if (!envName) return null;

  const apiKey = process.env[envName]?.trim();
  if (!apiKey) return null;

  ensureLLMNetworking();
  return new OpenAI({
    apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
}

export function getLLMModel(): string {
  const explicit = process.env.LLM_MODEL?.trim();
  if (explicit) return explicit;

  const provider = getLLMProvider();
  if (provider === "openai") {
    return process.env.OPENAI_MODEL?.trim() || PROVIDER_CONFIG.openai.defaultModel;
  }
  if (provider === "groq") {
    return process.env.GROQ_MODEL?.trim() || PROVIDER_CONFIG.groq.defaultModel;
  }
  return process.env.OLLAMA_MODEL?.trim() || PROVIDER_CONFIG.ollama.defaultModel;
}

export function supportsJsonResponseFormat(): boolean {
  return getLLMProvider() !== "ollama";
}

export function formatLLMError(error: unknown): string {
  const e = error as Record<string, unknown>;

  const message = typeof e?.message === "string" ? e.message : undefined;

  // Connection-like errors (network, DNS, refused)
  const isConnectionError =
    e?.name === "APIConnectionError" ||
    e?.type === "connection_error" ||
    e?.code === "ECONNREFUSED" ||
    e?.code === "ENOTFOUND" ||
    (message !== undefined &&
      /ECONNREFUSED|ENOTFOUND|ENETUNREACH|fetch failed/i.test(message));

  if (isConnectionError) {
    const provider = getLLMProvider();
    if (provider === "ollama") {
      return "Could not reach Ollama. Install from https://ollama.com, run `ollama serve`, and pull a model (e.g. `ollama pull llama3.2`).";
    }
    const sslHint = allowInsecureLLMSSL()
      ? ""
      : " If you are on Windows with antivirus SSL scanning, add LLM_INSECURE_SSL=true to .env.local and restart.";
    return `Could not reach the AI provider (connection error). Check your internet, VPN, or firewall.${sslHint}`;
  }

  // HTTP-style errors (status codes)
  const status = e?.status ?? e?.statusCode ?? e?.httpStatus;
  if (typeof status === "number") {
    if (status === 401) {
      return `Invalid API key for ${getLLMProviderLabel()}. Check your .env.local and restart the dev server.`;
    }
    if (status === 403) {
      return "API access denied. Check billing or model access for your provider.";
    }
    if (status === 429) {
      return "Rate limit reached. Wait a moment and try again.";
    }
    if (status === 404) {
      return `Model not found (${getLLMModel()}). Set LLM_MODEL in .env.local to a model your provider supports.`;
    }
    return message || `API error (${status}).`;
  }

  if (e instanceof Error && e.message) return e.message;

  return "Unexpected error calling the AI provider.";
}

export async function parseJsonFromModel<T>(
  content: string,
  parse: (data: unknown) => T,
): Promise<T> {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : trimmed;

  try {
    return parse(JSON.parse(jsonString));
  } catch {
    throw new Error("Failed to parse AI response as JSON.");
  }
}
