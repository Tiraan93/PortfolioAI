"use client";

import { useEffect, useRef, useState } from "react";
import { RCGP_CAPABILITY_NAMES } from "@/lib/rcgp-descriptors";
import type { CapabilityMode } from "@/lib/schema";

type CapabilitySelectorProps = {
  mode: CapabilityMode;
  onModeChange: (mode: CapabilityMode) => void;
  selected: string[];
  onSelectedChange: (names: string[]) => void;
  disabled?: boolean;
};

export function CapabilitySelector({
  mode,
  onModeChange,
  selected,
  onSelectedChange,
  disabled,
}: CapabilitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  const toggleCapability = (name: string) => {
    if (selected.includes(name)) {
      onSelectedChange(selected.filter((n) => n !== name));
      return;
    }
    if (selected.length >= 3) return;
    onSelectedChange([...selected, name]);
  };

  const filtered = RCGP_CAPABILITY_NAMES.filter((n) =>
    n.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="mb-1 block text-sm font-medium text-navy">Capabilities</legend>
      <p className="mb-2 text-xs text-muted">
        Choose how to pick the three RCGP capabilities for each review.
      </p>

      <div ref={ref} className="relative rounded-xl border border-border bg-background/80 p-3">
        <p className="mb-2 text-xs font-medium text-navy">
          Choose how to pick the three RCGP capabilities for this case.
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onModeChange("auto");
              setOpen(false);
            }}
            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              mode === "auto"
                ? "bg-accent text-white"
                : "border border-border bg-card text-muted hover:bg-muted/10"
            }`}
          >
            Let AI choose
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange("manual");
              setOpen(true);
            }}
            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              mode === "manual"
                ? "bg-accent text-white"
                : "border border-border bg-card text-muted hover:bg-muted/10"
            }`}
          >
            Choose manually
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm"
          aria-expanded={open}
        >
          <div className="flex flex-wrap gap-2">
            {mode === "auto" ? (
              <span className="text-muted">Let AI choose capabilities</span>
            ) : selected.length === 0 ? (
              <span className="text-muted">Choose capabilities...</span>
            ) : (
              selected.map((capability) => (
                <span
                  key={capability}
                  className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                >
                  {capability}
                </span>
              ))
            )}
          </div>
          <span className="ml-auto text-xs text-muted">
            {mode === "auto" ? "AI choose" : `${selected.length}/3`}
          </span>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 w-full overflow-auto rounded-md border border-border bg-card p-2 shadow-lg">
            <div className="mb-2 border-b border-border pb-2 text-xs uppercase tracking-wide text-muted">
              Select capabilities
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search capabilities"
              className="mb-2 w-full rounded-md border border-border px-2 py-1 text-sm"
            />
            <div className="grid gap-1">
              {filtered.map((name) => {
                const isSelected = selected.includes(name);
                const atLimit = selected.length >= 3 && !isSelected;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onModeChange("manual");
                      toggleCapability(name);
                      setOpen(true);
                    }}
                    disabled={atLimit}
                    className={`w-full truncate rounded px-2 py-1 text-left text-sm ${isSelected ? "bg-accent/10 font-medium text-navy" : "hover:bg-background"} ${atLimit ? "opacity-50" : ""}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-2 text-xs text-muted">
          {mode === "auto"
            ? "AI will choose the 3 most relevant capabilities."
            : `Selected ${selected.length} of 3`}
        </p>
      </div>
    </fieldset>
  );
}
