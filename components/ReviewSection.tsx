"use client";

import { useState } from "react";

type ReviewSectionProps = {
  title: string;
  icon: string;
  content: string;
  onCopy: () => void;
  canImprove?: boolean;
  onImprove?: (instruction: string) => Promise<void>;
  isImproving?: boolean;
};

export function ReviewSection({
  title,
  icon,
  content,
  onCopy,
  canImprove = false,
  onImprove,
  isImproving = false,
}: ReviewSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showImprove, setShowImprove] = useState(false);
  const [instruction, setInstruction] = useState("Make more concise and portfolio ready");

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImprove = async () => {
    if (!onImprove || !instruction.trim()) return;
    await onImprove(instruction.trim());
    setShowImprove(false);
  };

  return (
    <section className="rounded-xl border border-border bg-background/60 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <span aria-hidden>{icon}</span>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {canImprove && onImprove && (
            <button
              type="button"
              onClick={() => setShowImprove((prev) => !prev)}
              disabled={isImproving}
              className="text-xs font-medium text-accent transition-colors hover:text-accent-dark disabled:opacity-50"
            >
              Improve
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {showImprove && canImprove && onImprove && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="How should this section be improved?"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="button"
            onClick={handleImprove}
            disabled={isImproving || !instruction.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {isImproving ? "Improving..." : "Apply"}
          </button>
        </div>
      )}

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{content}</p>
    </section>
  );
}
