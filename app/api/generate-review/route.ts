import { ensureLLMNetworking } from "@/lib/llm-fetch";
ensureLLMNetworking();
import { NextRequest, NextResponse } from "next/server";
import type OpenAI from "openai";
import {
  buildGenerateReviewSystemPrompt,
  buildGenerateReviewUserPrompt,
} from "@/lib/prompts";
import {
  formatLLMError,
  getLLMClient,
  getLLMModel,
  getLLMProvider,
  getLLMProviderLabel,
  hasLLMConfigured,
  parseJsonFromModel,
  supportsJsonResponseFormat,
} from "@/lib/llm";
import { rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import {
  collectDuplicateDescriptorErrors,
  resolveLlmPortfolioReview,
} from "@/lib/resolve-portfolio-review";
import {
  collectDescriptorTexts,
  sanitizePortfolioReview,
} from "@/lib/sanitize-review";
import type { CapabilityMode, DescriptorLevel, PortfolioReview } from "@/lib/schema";
import {
  buildDemoReview,
  generateReviewRequestSchema,
  llmPortfolioReviewSchema,
} from "@/lib/schema";

const MAX_DESCRIPTOR_RETRIES = 1;

async function callModel(
  client: OpenAI,
  caseDescription: string,
  descriptorLevels: DescriptorLevel[],
  caseOptions: { capabilityMode: CapabilityMode; selectedCapabilities?: string[] },
  usedDescriptors: string[],
  attempt = 0,
): Promise<PortfolioReview> {
  const { capabilityMode, selectedCapabilities } = caseOptions;

  const completion = await client.chat.completions.create({
    model: getLLMModel(),
    temperature: 0.4,
    ...(supportsJsonResponseFormat()
      ? { response_format: { type: "json_object" as const } }
      : {}),
    messages: [
      {
        role: "system",
        content: buildGenerateReviewSystemPrompt(capabilityMode, selectedCapabilities),
      },
      {
        role: "user",
        content: buildGenerateReviewUserPrompt(
          caseDescription,
          descriptorLevels,
          usedDescriptors,
          attempt > 0,
          capabilityMode,
          selectedCapabilities,
        ),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from AI model.");
  }

  const llmReview = await parseJsonFromModel(content, (data) =>
    llmPortfolioReviewSchema.parse(data),
  );
  const review = sanitizePortfolioReview(resolveLlmPortfolioReview(llmReview));

  const validationErrors = collectDuplicateDescriptorErrors(
    review,
    usedDescriptors,
    capabilityMode === "manual" ? selectedCapabilities : undefined,
  );
  if (validationErrors.length > 0 && attempt < MAX_DESCRIPTOR_RETRIES) {
    return callModel(client, caseDescription, descriptorLevels, caseOptions, usedDescriptors, attempt + 1);
  }

  if (validationErrors.length > 0) {
    throw new Error(
      `${validationErrors[0]} Try generating again or use different case notes.`,
    );
  }

  return review;
}

async function generateReviews(
  cases: { caseDescription: string; capabilityMode: CapabilityMode; selectedCapabilities?: string[] }[],
  descriptorLevels: DescriptorLevel[],
) {
  const client = getLLMClient();
  if (!client) {
    const reviews = cases.map((_, index) => buildDemoReview(index, cases.length));
    return { reviews, demo: true, provider: getLLMProvider() };
  }

  const usedDescriptors: string[] = [];
  const reviews: PortfolioReview[] = [];

  for (const { caseDescription, capabilityMode, selectedCapabilities } of cases) {
    const review = await callModel(
      client,
      caseDescription,
      descriptorLevels,
      { capabilityMode, selectedCapabilities },
      usedDescriptors,
    );
    reviews.push(review);
    usedDescriptors.push(...collectDescriptorTexts(review));
  }

  return { reviews, demo: false, provider: getLLMProvider() };
}

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(request, "generate-review");
    if (!limit.success) {
      return tooManyRequestsResponse(limit.resetMs);
    }

    const body = await request.json();
    const parsed = generateReviewRequestSchema.parse(body);
    const { cases, descriptorLevels } = parsed;

    const { reviews, demo, provider } = await generateReviews(cases, descriptorLevels);

    if (reviews.length !== cases.length) {
      return NextResponse.json(
        { error: "Review count did not match the number of cases submitted." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      reviews,
      review: reviews[0],
      demo,
      provider,
      providerLabel: getLLMProviderLabel(provider),
    });
  } catch (error) {
    const message = formatLLMError(error);
    const status =
      message.includes("at least 20 characters") ||
      message.includes("Select at least one") ||
      message.includes("Add at least one") ||
      message.includes("exactly 3 capabilities") ||
      message.includes("Unknown RCGP capability") ||
      message.includes("Invalid descriptorIndex") ||
      message.includes("already used") ||
      message.includes("Duplicate descriptor") ||
      message.includes("was not in your selected")
        ? 400
        : message.includes("Invalid API key") || message.includes("access denied")
          ? 401
          : 500;
    return NextResponse.json(
      {
        error: message,
        demo: !hasLLMConfigured(),
        provider: getLLMProvider(),
      },
      { status },
    );
  }
}
