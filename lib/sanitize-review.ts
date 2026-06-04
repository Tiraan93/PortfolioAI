import type { PortfolioReview } from "@/lib/schema";
import { sanitizeGeneratedText } from "@/lib/sanitize";

export function sanitizePortfolioReview(review: PortfolioReview): PortfolioReview {
  return {
    title: sanitizeGeneratedText(review.title),
    briefDescription: sanitizeGeneratedText(review.briefDescription),
    capabilities: review.capabilities.map((cap) => ({
      name: sanitizeGeneratedText(cap.name),
      evidence: cap.evidence.map((item) => ({
        level: item.level,
        descriptor: item.descriptor.trim(),
        achievement: sanitizeGeneratedText(item.achievement),
      })),
    })),
    learningNeeds: review.learningNeeds.map((need) => sanitizeGeneratedText(need)),
    reflection: sanitizeGeneratedText(review.reflection),
  };
}

export function collectDescriptorTexts(review: PortfolioReview): string[] {
  return review.capabilities.flatMap((cap) =>
    cap.evidence.map((item) => item.descriptor.trim()),
  );
}
