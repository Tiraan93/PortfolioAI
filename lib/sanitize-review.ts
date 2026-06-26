import type { PortfolioReview } from "@/lib/schema";
import { sanitizeGeneratedText } from "@/lib/sanitize";

export function sanitizePortfolioReview(review: PortfolioReview): PortfolioReview {
  return {
    title: sanitizeGeneratedText(review.title),
    briefDescription: sanitizeGeneratedText(review.briefDescription),
    capabilities: review.capabilities.map((cap) => ({
      // Capability names are fixed RCGP identifiers (already resolved to canonical
      // form upstream). Do NOT run them through sanitizeGeneratedText: it strips
      // hyphens, which corrupts "Decision-making and Diagnosis" and breaks the
      // capability-name match in both manual and auto modes.
      name: cap.name.trim(),
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
