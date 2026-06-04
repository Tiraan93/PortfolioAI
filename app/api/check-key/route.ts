import { ensureLLMNetworking } from "@/lib/llm-fetch";
ensureLLMNetworking();
import { NextResponse } from "next/server";
import {
  formatLLMError,
  getLLMClient,
  getLLMModel,
  getLLMProvider,
  getLLMProviderLabel,
  getSetupMessage,
  hasLLMConfigured,
} from "@/lib/llm";

export async function GET() {
  const provider = getLLMProvider();
  const providerLabel = getLLMProviderLabel(provider);

  if (!hasLLMConfigured()) {
    return NextResponse.json({
      configured: false,
      provider,
      providerLabel,
      message: getSetupMessage(provider),
    });
  }

  const client = getLLMClient();
  if (!client) {
    return NextResponse.json({
      configured: false,
      provider,
      providerLabel,
      message: getSetupMessage(provider),
    });
  }

  try {
    await client.models.list();
    return NextResponse.json({
      configured: true,
      valid: true,
      provider,
      providerLabel,
      model: getLLMModel(),
      message: `${providerLabel} is configured.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        valid: false,
        provider,
        providerLabel,
        model: getLLMModel(),
        message: formatLLMError(error),
      },
      { status: 401 },
    );
  }
}
