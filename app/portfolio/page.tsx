"use client";

import { useEffect, useState } from "react";
import { CaseInput, initialCases, type CaseDraft } from "@/components/CaseInput";
import { ReviewPanel } from "@/components/ReviewPanel";
import type { DescriptorLevel, PortfolioReview } from "@/lib/schema";

const RESULTS_STORAGE_KEY = "sca-portfolio-results";

export type ReviewResult = {
  caseId: string;
  review: PortfolioReview;
};

type LlmStatus = {
  configured: boolean;
  valid?: boolean;
  provider?: string;
  providerLabel: string;
  message: string;
};

export default function PortfolioPage() {
  const [cases, setCases] = useState<CaseDraft[]>(initialCases);
  const [descriptorLevels, setDescriptorLevels] = useState<DescriptorLevel[]>(["competent"]);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoInfo, setDemoInfo] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [demoProvider, setDemoProvider] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as ReviewResult[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setResults(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetch("/api/check-key")
      .then((res) => res.json())
      .then((data: LlmStatus) => setLlmStatus(data))
      .catch(() => {
        setLlmStatus({
          configured: false,
          providerLabel: "Unknown",
          message: "Could not check AI provider status.",
        });
      });
  }, []);

  const persistResults = (next: ReviewResult[]) => {
    if (next.length > 0) {
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(RESULTS_STORAGE_KEY);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setDemoInfo(null);

    const validCases = cases.filter((c) => c.caseDescription.trim().length >= 20);

    try {
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cases: validCases.map((c) => ({
            id: c.id,
            caseDescription: c.caseDescription.trim(),
            capabilityMode: c.capabilityMode,
            selectedCapabilities:
              c.capabilityMode === "manual" ? c.selectedCapabilities : undefined,
          })),
          descriptorLevels,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate review.");
      }

      const reviews = (data.reviews ?? [data.review]) as PortfolioReview[];

      if (reviews.length !== validCases.length) {
        throw new Error(
          "The server returned fewer reviews than cases. Please try again.",
        );
      }

      const mapped: ReviewResult[] = validCases.map((c, index) => {
        const review = reviews[index];
        if (!review) {
          throw new Error(`Missing review for case ${index + 1}.`);
        }
        return { caseId: c.id, review };
      });

      setResults(mapped);
      persistResults(mapped);
      setActiveIndex(0);
      setIsDemo(Boolean(data.demo));

      if (data.demo) {
        setDemoProvider(data.provider ?? llmStatus?.provider ?? "openai");
        const provider = data.provider ?? llmStatus?.provider ?? "openai";
        if (provider === "groq") {
          setDemoInfo(
            "Running in demo mode. Add a free GROQ_API_KEY to .env.local (UTF-8), then restart the dev server.",
          );
        } else if (provider === "openai") {
          setDemoInfo(
            "Running in demo mode. Add OPENAI_API_KEY to .env.local (UTF-8), then restart the dev server.",
          );
        } else {
          setDemoInfo(
            "Running in demo mode. Configure your LLM provider (e.g. Ollama) and restart the dev server.",
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate review.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeResult = results[activeIndex];
  const activeCase = cases.find((c) => c.id === activeResult?.caseId);

  const updateActiveReview = (review: PortfolioReview) => {
    setResults((prev) => {
      const next = prev.map((item, index) =>
        index === activeIndex ? { ...item, review } : item,
      );
      persistResults(next);
      return next;
    });
  };

  const statusBanner = () => {
    if (!llmStatus) return null;

    if (llmStatus.configured && llmStatus.valid === false) {
      return (
        <div className="mb-6 rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-text">
          {llmStatus.message}
        </div>
      );
    }

    if (!llmStatus.configured) {
      return (
        <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted">
          {llmStatus.message}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-navy">Portfolio AI</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Enter your cases in the first person. Choose your capabilities or let the AI pick
          the three most relevant. Each review uses exact RCGP word descriptors, unique across
          a batch.
        </p>
      </div>

      {statusBanner()}

      {demoInfo && (
        <div className="mb-6 rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-text">
          {demoInfo}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <CaseInput
            cases={cases}
            onChange={setCases}
            onSubmit={handleGenerate}
            isLoading={isLoading}
            descriptorLevels={descriptorLevels}
            onDescriptorLevelsChange={setDescriptorLevels}
          />
        </div>

        <div className="flex flex-col gap-4">
          {results.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {results.map((result, index) => (
                <button
                  key={result.caseId}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    index === activeIndex
                      ? "bg-accent text-white"
                      : "border border-border bg-card text-muted hover:text-accent-dark"
                  }`}
                >
                  Case {index + 1}
                  {result.review.title ? `: ${result.review.title}` : ""}
                </button>
              ))}
            </div>
          )}

          <ReviewPanel
            review={activeResult?.review ?? null}
            caseDescription={activeCase?.caseDescription ?? ""}
            isDemo={isDemo}
            onUpdateReview={updateActiveReview}
            demoProvider={demoProvider}
          />
        </div>
      </div>
    </div>
  );
}
