import OpenAI from "openai";
import { ZodError } from "zod";
import { allowInsecureLLMSSL, ensureLLMNetworking } from "@/lib/llm-fetch";

export type LLMProvider = "openrouter" | "groq" | "openai" | "ollama";

const PROVIDER_CONFIG: Record<
  LLMProvider,
  { baseURL?: string; defaultModel: string; apiKeyEnv: string | null }
> = {
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "deepseek/deepseek-v4-flash",
    apiKeyEnv: "OPENROUTER_API_KEY",
  },
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
  if (
    explicit === "openrouter" ||
    explicit === "groq" ||
    explicit === "openai" ||
    explicit === "ollama"
  ) {
    return explicit as LLMProvider;
  }

  // Auto-detect by available key. OpenRouter is preferred (free models available).
  if (process.env.OPENROUTER_API_KEY?.trim()) return "openrouter";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";

  // Default to OpenRouter so the app points at the free OpenRouter tier.
  return "openrouter";
}

export function getLLMProviderLabel(provider: LLMProvider = getLLMProvider()): string {
  switch (provider) {
    case "openrouter":
      return "OpenRouter (DeepSeek V4 Flash)";
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
    case "openrouter":
      return "Add a free OPENROUTER_API_KEY from https://openrouter.ai/keys to .env.local, then restart the dev server.";
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
    // Optional OpenRouter ranking headers (safe no-ops for other providers).
    ...(provider === "openrouter"
      ? {
          defaultHeaders: {
            "HTTP-Referer": process.env.OPENROUTER_SITE_URL?.trim() || "",
            "X-Title": process.env.OPENROUTER_SITE_NAME?.trim() || "PortfolioAI",
          },
        }
      : {}),
  });
}

export function getLLMModel(): string {
  const explicit = process.env.LLM_MODEL?.trim();
  if (explicit) return explicit;

  const provider = getLLMProvider();
  if (provider === "openrouter") {
    return process.env.OPENROUTER_MODEL?.trim() || PROVIDER_CONFIG.openrouter.defaultModel;
  }
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

/** Portfolio reviews include long prose (reflection, brief description); avoid truncated JSON. */
export const STRUCTURED_COMPLETION_MAX_TOKENS = 8192;

type CompletionMessage = {
  content?: string | null | Array<{ type?: string; text?: string }>;
  reasoning?: string | null;
  reasoning_content?: string | null;
};

export function extractCompletionText(
  message: CompletionMessage | null | undefined,
): string {
  if (!message) return "";

  const { content } = message;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }

  return "";
}

export function getStructuredCompletionParams(): Record<string, unknown> {
  const params: Record<string, unknown> = {
    max_tokens: STRUCTURED_COMPLETION_MAX_TOKENS,
  };

  if (supportsJsonResponseFormat()) {
    params.response_format = { type: "json_object" };
  }

  const provider = getLLMProvider();
  const model = getLLMModel().toLowerCase();
  if (provider === "openrouter" && model.includes("deepseek")) {
    // DeepSeek defaults to thinking mode; disable it so JSON lands in message.content.
    params.reasoning = { enabled: false };
  }

  return params;
}

function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

export function formatLLMError(error: unknown): string {
  const e = error as Record<string, unknown>;

  const isString = (value: unknown): value is string => typeof value === "string";

  // Connection-like errors (network, DNS, refused)
  const isConnectionError =
    e?.name === "APIConnectionError" ||
    e?.type === "connection_error" ||
    e?.code === "ECONNREFUSED" ||
    e?.code === "ENOTFOUND" ||
    (isString(e?.message) && /ECONNREFUSED|ENOTFOUND|ENETUNREACH|fetch failed/i.test(e.message));

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
    const message = e?.message;
    return (isString(message) && message) || `API error (${status}).`;
  }

  if (e instanceof Error && e.message) return e.message;

  return "Unexpected error calling the AI provider.";
}

export async function parseJsonFromModel<T>(
  content: string,
  parse: (data: unknown) => T,
): Promise<T> {
  const jsonString = extractJsonString(content);
  let data: unknown;

  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("Failed to parse AI response as JSON.");
  }

  try {
    return parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.errors[0];
      throw new Error(
        first?.message ?? "AI response did not match the expected portfolio format.",
      );
    }
    throw error;
  }
}
