import {
  findCapability,
  isExactDescriptor,
  normalizeCapabilityName,
  resolveDescriptor,
} from "@/lib/rcgp-descriptors";
import type { LlmPortfolioReview, PortfolioReview } from "@/lib/schema";

export function resolveLlmPortfolioReview(llm: LlmPortfolioReview): PortfolioReview {
  return {
    title: llm.title,
    briefDescription: llm.briefDescription,
    learningNeeds: llm.learningNeeds,
    reflection: llm.reflection,
    capabilities: llm.capabilities.map((cap) => {
      const name = normalizeCapabilityName(cap.name);
      return {
        name,
        evidence: cap.evidence.map((item) => ({
          level: item.level,
          descriptor: resolveDescriptor(name, item.level, item.descriptorIndex),
          achievement: item.achievement,
        })),
      };
    }),
  };
}

export function collectManualCapabilityErrors(
  review: PortfolioReview,
  selectedCapabilities: string[],
): string[] {
  const expected = new Set(
    selectedCapabilities.map((n) => normalizeCapabilityName(n)),
  );
  const actual = review.capabilities.map((c) => c.name);
  const errors: string[] = [];

  if (actual.length !== 3) {
    errors.push("Review must include exactly 3 capabilities.");
    return errors;
  }

  for (const name of actual) {
    if (!expected.has(name)) {
      errors.push(`Capability "${name}" was not in your selected list.`);
    }
  }

  const unique = new Set(actual);
  if (unique.size !== 3) {
    errors.push("Each of the 3 selected capabilities must appear exactly once.");
  }

  return errors;
}

export function collectDuplicateDescriptorErrors(
  review: PortfolioReview,
  usedDescriptors: string[],
  selectedCapabilities?: string[],
): string[] {
  const errors: string[] = [];

  if (selectedCapabilities?.length === 3) {
    errors.push(...collectManualCapabilityErrors(review, selectedCapabilities));
  }
  const usedSet = new Set(usedDescriptors.map((d) => d.trim()));
  const inReview = new Set<string>();

  for (const cap of review.capabilities) {
    if (!findCapability(cap.name)) {
      errors.push(`Unknown capability: ${cap.name}`);
    }

    for (const item of cap.evidence) {
      const text = item.descriptor.trim();

      if (!isExactDescriptor(text)) {
        errors.push(`Descriptor is not from the RCGP list (${cap.name}).`);
      }
      if (usedSet.has(text)) {
        errors.push(
          `Descriptor already used in another case in this batch (${cap.name}, ${item.level}).`,
        );
      }
      if (inReview.has(text)) {
        errors.push(`Duplicate descriptor within this review (${cap.name}).`);
      }
      inReview.add(text);
    }
  }

  return errors;
}
