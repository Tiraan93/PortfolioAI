"use client";

import { useState } from "react";
import type { PortfolioReview } from "@/lib/schema";
import { DESCRIPTOR_LEVEL_LABELS } from "@/lib/rcgp-descriptors";

type Capability = PortfolioReview["capabilities"][number];

type CapabilityEvidenceBlockProps = {
  capability: Capability;
  onCopy: (text: string) => void;
  onImproveEvidence?: (evidenceIndex: number, instruction: string) => Promise<void>;
  onImproveCapability?: (instruction: string) => Promise<void>;
  improvingTarget?: number | "capability" | null;
};

const DEFAULT_INSTRUCTION = "Make more concise and portfolio ready";

function ImproveBox({
  instruction,
  setInstruction,
  onApply,
  disabled,
  busy,
}: {
  instruction: string;
  setInstruction: (value: string) => void;
  onApply: () => void;
  disabled: boolean;
  busy: boolean;
}) {
  return (
    <div className="mb-1 mt-2 flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        placeholder="How should this be improved?"
        className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <button
        type="button"
        onClick={onApply}
        disabled={disabled || !instruction.trim()}
        className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {busy ? "Improving..." : "Apply"}
      </button>
    </div>
  );
}

export function CapabilityEvidenceBlock({
  capability,
  onCopy,
  onImproveEvidence,
  onImproveCapability,
  improvingTarget = null,
}: CapabilityEvidenceBlockProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [improveOpen, setImproveOpen] = useState<number | "capability" | null>(null);
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);

  const isImproving = improvingTarget !== null;

  const handleCopy = async (id: string, text: string) => {
    await onCopy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleImprove = (target: number | "capability") => {
    setImproveOpen((prev) => (prev === target ? null : target));
    setInstruction(DEFAULT_INSTRUCTION);
  };

  const applyImprove = async (target: number | "capability") => {
    if (!instruction.trim()) return;
    if (target === "capability") {
      if (!onImproveCapability) return;
      await onImproveCapability(instruction.trim());
    } else {
      if (!onImproveEvidence) return;
      await onImproveEvidence(target, instruction.trim());
    }
    setImproveOpen(null);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-navy">{capability.name}</h4>
        {onImproveCapability && (
          <button
            type="button"
            onClick={() => toggleImprove("capability")}
            disabled={isImproving}
            className="text-xs font-medium text-accent transition-colors hover:text-accent-dark disabled:opacity-50"
          >
            {improvingTarget === "capability" ? "Improving..." : "Improve all"}
          </button>
        )}
      </div>

      {improveOpen === "capability" && onImproveCapability && (
        <ImproveBox
          instruction={instruction}
          setInstruction={setInstruction}
          onApply={() => applyImprove("capability")}
          disabled={isImproving}
          busy={improvingTarget === "capability"}
        />
      )}

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
                <div className="flex items-center gap-2">
                  {onImproveEvidence && (
                    <button
                      type="button"
                      onClick={() => toggleImprove(index)}
                      disabled={isImproving}
                      className="text-xs font-medium text-accent transition-colors hover:text-accent-dark disabled:opacity-50"
                    >
                      {improvingTarget === index ? "Improving..." : "Improve"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(id, blockText)}
                    className="text-xs font-medium text-muted hover:text-foreground"
                  >
                    {copiedId === id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="rounded-md bg-background px-3 py-2 text-foreground/90 italic">
                {item.descriptor}
              </p>
              <p className="mt-2 text-foreground/90">
                <span className="font-medium text-navy">How achieved: </span>
                {item.achievement}
              </p>
              {improveOpen === index && onImproveEvidence && (
                <ImproveBox
                  instruction={instruction}
                  setInstruction={setInstruction}
                  onApply={() => applyImprove(index)}
                  disabled={isImproving}
                  busy={improvingTarget === index}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
