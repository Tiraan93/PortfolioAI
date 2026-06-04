import { ensureLLMNetworking } from "@/lib/llm-fetch";
ensureLLMNetworking();
import { NextRequest, NextResponse } from "next/server";
import {
  buildImproveSectionUserPrompt,
  IMPROVE_SECTION_SYSTEM_PROMPT,
} from "@/lib/prompts";
import {
  formatLLMError,
  getLLMClient,
  getLLMModel,
  getSetupMessage,
  hasLLMConfigured,
} from "@/lib/llm";
import { sanitizeGeneratedText } from "@/lib/sanitize";
import { improveSectionRequestSchema, improveSectionResponseSchema } from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, currentText, instruction, caseDescription } =
      improveSectionRequestSchema.parse(body);

    const client = getLLMClient();
    if (!client || !hasLLMConfigured()) {
      return NextResponse.json({ error: getSetupMessage() }, { status: 503 });
    }

    const completion = await client.chat.completions.create({
      model: getLLMModel(),
      temperature: 0.3,
      messages: [
        { role: "system", content: IMPROVE_SECTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildImproveSectionUserPrompt(
            section,
            currentText,
            instruction,
            caseDescription,
          ),
        },
      ],
    });

    const improvedText = completion.choices[0]?.message?.content?.trim();
    if (!improvedText) {
      throw new Error("Empty response from AI model.");
    }

    const result = improveSectionResponseSchema.parse({
      improvedText: sanitizeGeneratedText(improvedText),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = formatLLMError(error);
    const status = message.includes("Invalid API key") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
