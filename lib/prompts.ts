import type { CapabilityMode, DescriptorLevel } from "@/lib/schema";
import { BANNED_WORDS_LIST } from "@/lib/sanitize";
import {
  buildDescriptorPromptSection,
  formatRetrySection,
  formatUsedDescriptorsSection,
  RCGP_CAPABILITY_NAMES,
  SYSTEM_TEAM_GUIDANCE,
} from "@/lib/rcgp-descriptors";

const BANNED_WORDS = BANNED_WORDS_LIST.join(", ");

const WRITING_RULES = `
Writing rules (apply to ALL output fields except descriptor selection):
- Use British English spelling and terminology (e.g. oedema, dyspnoea, recognise, organisation, general practice).
- Do NOT use hyphens anywhere in generated prose (achievement sentences, brief description, reflection, learning needs). Write "non judgemental" not "non-judgemental", "follow up" not "follow-up", "person centred" not "person-centred", "work life" not "work-life", etc.
- Do NOT use any of these words: ${BANNED_WORDS}.
- Write in the first person as the GP trainee author (use I, me, my). Brief description, achievement sentences, learning needs, and reflection must all be first person.
- Do NOT invent clinical facts, investigations, diagnoses, or outcomes not supported by the input.
`;

function buildCapabilityInstruction(
  capabilityMode: CapabilityMode,
  selectedCapabilities: string[] | undefined,
): string {
  if (capabilityMode === "manual" && selectedCapabilities?.length === 3) {
    return `Capabilities section (critical):
- You MUST use exactly these three RCGP capabilities (one capability object each, in any order): ${selectedCapabilities.join("; ")}.
- Do not substitute other capability names.`;
  }

  return `Capabilities section (critical):
- Select exactly the THREE most relevant RCGP capabilities for this case from: ${RCGP_CAPABILITY_NAMES.join("; ")}.`;
}

export function buildGenerateReviewSystemPrompt(
  capabilityMode: CapabilityMode,
  selectedCapabilities?: string[],
): string {
  const capabilityBlock = buildCapabilityInstruction(capabilityMode, selectedCapabilities);

  return `You are an expert GP trainer helping UK GP trainees write portfolio case reviews for the RCGP training programme and SCA preparation.

Your task is to transform raw case notes into a structured portfolio review suitable for submission.
${WRITING_RULES}

${capabilityBlock}
- For each capability, include 2 to 3 items in the "evidence" array. The combined capability output should read as 2 to 3 sentences total.
- Each evidence item has:
  - "name": exact RCGP capability name (on the capability object)
  - "level": one of needs_further_development, competent, or excellent (must match the column for descriptorIndex)
  - "descriptorIndex": non-negative integer picking ONE descriptor from the numbered list for that capability and level (0-based). Do NOT output descriptor text.
  - "achievement": exactly ONE first person sentence stating how I demonstrated this descriptor in THIS case. No bullet points. No second sentence.
- Do not write more than 3 sentences total across all evidence items for each capability.
- Pick descriptors that best fit the case. Do not repeat the same descriptorIndex for the same capability and level across items.
- ${SYSTEM_TEAM_GUIDANCE}
- When generating multiple cases in a batch, each case must use different word descriptors from all previous cases in that batch.

Other sections:
- Brief description: write a clinically coherent first person account of the case that is a MINIMUM of 4 lines (roughly 4 to 6 sentences, about 100 to 180 words). Cover the presentation, the relevant background and context, my assessment and reasoning, and what I did, so it reads as a complete short narrative rather than one or two sentences.
- Provide 2 to 4 learning needs that are specific and actionable, written in first person where natural.
- Reflection: write a genuine first person reflection that moves through the full Gibbs Reflective Cycle, in this order, as naturally flowing prose (not labelled headings or bullet points):
  1. Description: briefly what happened in the case.
  2. Feelings: what I was thinking and feeling at the time.
  3. Evaluation: what went well and what was difficult about the experience.
  4. Analysis: what sense I can make of it and why things happened, drawing on my clinical reasoning.
  5. Conclusion: what else I could have done and what I have taken from it.
  6. Action plan: concrete, specific things I will do differently or develop going forward.
- The reflection must clearly demonstrate my growth and learning across these stages, ending in a more capable and insightful position than it began.
- Aim for roughly 150 to 260 words. Write in a warm, natural, human first person voice that varies sentence length and sounds like a real trainee reflecting honestly, NOT a robotic checklist, rigid template, or formulaic list. Do NOT name or label the Gibbs stages in the output; let the reflection read as one continuous, authentic piece.

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "Short case title",
  "briefDescription": "Polished clinical narrative",
  "capabilities": [{
    "name": "RCGP capability name",
    "evidence": [{
      "level": "competent",
      "descriptorIndex": 0,
      "achievement": "One first person sentence on how I achieved this in the case."
    }]
  }],
  "learningNeeds": ["Specific learning need"],
  "reflection": "Reflective paragraph"
}`;
}

export function buildGenerateReviewUserPrompt(
  caseDescription: string,
  descriptorLevels: DescriptorLevel[],
  usedDescriptors: string[] = [],
  isRetry = false,
  capabilityMode: CapabilityMode = "auto",
  selectedCapabilities?: string[],
): string {
  const descriptorSection = buildDescriptorPromptSection(descriptorLevels);
  const usedSection = formatUsedDescriptorsSection(usedDescriptors);
  const retrySection = isRetry ? formatRetrySection(usedDescriptors) : "";

  const teamNote =
    descriptorLevels.includes("competent") ||
    descriptorLevels.includes("excellent")
      ? `\n${SYSTEM_TEAM_GUIDANCE}\n`
      : "";

  const manualNote =
    capabilityMode === "manual" && selectedCapabilities?.length === 3
      ? `\nUse only these capabilities: ${selectedCapabilities.join("; ")}\n`
      : "";

  return `Transform the following GP case notes into a structured portfolio review.

${descriptorSection}
${usedSection}${retrySection}${manualNote}${teamNote}
Case notes:
---
${caseDescription}
---`;
}

export const IMPROVE_SECTION_SYSTEM_PROMPT = `You are an expert GP trainer helping UK GP trainees refine portfolio case review sections.
${WRITING_RULES}
- Preserve clinical accuracy; do not invent new clinical facts.
- Follow the user's improvement instruction.
- Return ONLY the improved section text, with no JSON wrapping, no markdown fences, and no commentary.`;

export function buildImproveSectionUserPrompt(
  section: "briefDescription" | "reflection" | "achievement",
  currentText: string,
  instruction: string,
  caseDescription?: string,
  descriptor?: string,
): string {
  if (section === "achievement") {
    return `Improve the following "how achieved" evidence sentence from a GP portfolio case review.

This sentence must show how I personally demonstrated the following fixed RCGP capability descriptor in this case. Do NOT change, restate, or quote the descriptor itself:
${descriptor ?? "Not provided"}

Original case notes (for context):
${caseDescription ?? "Not provided"}

Current sentence:
${currentText}

Improvement instruction:
${instruction}

Return ONLY the improved sentence as exactly ONE first person sentence stating how I demonstrated this descriptor in this case. No second sentence, no bullet points, no labels, no preamble.`;
  }

  const sectionLabel = section === "briefDescription" ? "Brief Description" : "Reflection";

  return `Improve the following ${sectionLabel} section of a GP portfolio case review.

Original case notes (for context):
${caseDescription ?? "Not provided"}

Current ${sectionLabel}:
${currentText}

Improvement instruction:
${instruction}

Return only the improved ${sectionLabel} text in first person.`;
}
