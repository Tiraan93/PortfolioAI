"use client";

import { useState } from "react";
import type { PortfolioReview } from "@/lib/schema";
import { DESCRIPTOR_LEVEL_LABELS } from "@/lib/rcgp-descriptors";

type Capability = PortfolioReview["capabilities"][number];

type CapabilityEvidenceBlockProps = {
  capability: Capability;
  onCopy: (text: string) => void;
};

export function CapabilityEvidenceBlock({ capability, onCopy }: CapabilityEvidenceBlockProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    await onCopy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card/50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-navy">{capability.name}</h4>
      <ul className="flex flex-col gap-4">
        {capability.evidence.map((item, index) => {
          const id = `${capability.name}-${index}`;
          const blockText = `[${DESCRIPTOR_LEVEL_LABELS[item.level].column}]\n${item.descriptor}\n\nHow achieved: ${item.achievement}`;
          return (
            <li key={id} className="text-sm leading-relaxed">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-accent">
                    {DESCRIPTOR_LEVEL_LABELS[item.level].short}
                  </span>
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success-text">
                    RCGP exact wording
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(id, blockText)}
                  className="text-xs font-medium text-muted hover:text-foreground"
                >
                  {copiedId === id ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="rounded-md bg-background px-3 py-2 text-foreground/90 italic">
                {item.descriptor}
              </p>
              <p className="mt-2 text-foreground/90">
                <span className="font-medium text-navy">How achieved: </span>
                {item.achievement}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
