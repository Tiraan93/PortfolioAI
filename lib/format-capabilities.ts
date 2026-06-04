import type { PortfolioReview } from "@/lib/schema";
import { DESCRIPTOR_LEVEL_LABELS } from "@/lib/rcgp-descriptors";

export function formatCapabilitiesForDisplay(review: PortfolioReview): string {
  return review.capabilities
    .map((cap) => {
      const items = cap.evidence
        .map((item) => {
          const levelLabel = DESCRIPTOR_LEVEL_LABELS[item.level].column;
          return `[${levelLabel}]\n${item.descriptor}\n\nHow achieved: ${item.achievement}`;
        })
        .join("\n\n");
      return `${cap.name}\n${items}`;
    })
    .join("\n\n---\n\n");
}

export function formatCapabilitiesForCopy(review: PortfolioReview): string {
  return formatCapabilitiesForDisplay(review);
}
