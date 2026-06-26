"use client";

import { useEffect, useRef, useState } from "react";
import { RCGP_CAPABILITY_NAMES } from "@/lib/rcgp-descriptors";
import type { CapabilityMode } from "@/lib/schema";

type CapabilitySelectorProps = {
  mode: CapabilityMode;
  selected: string[];
  onChange: (update: { mode: CapabilityMode; selected: string[] }) => void;
  disabled?: boolean;
};

export function CapabilitySelector({
  mode,
  selected,
  onChange,
  disabled,
}: CapabilitySelectorProps) {
  const [open, setOpen] = useState(false);
  // Distinguishes an explicit "Let AI choose" click from the untouched default
  // (both are mode === "auto"). Resets when the selector remounts (e.g. on Clear).
  const [explicitAi, setExplicitAi] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const chooseAi = () => {
    setExplicitAi(true);
    onChange({ mode: "auto", selected: [] });
    setOpen(false);
  };

  const toggleCapability = (name: string) => {
    if (selected.includes(name)) {
      onChange({ mode: "manual", selected: selected.filter((n) => n !== name) });
      return;
    }
    if (selected.length >= 3) return;
    const next = [...selected, name];
    onChange({ mode: "manual", selected: next });
    if (next.length === 3) setOpen(false);
  };

  return (
    <div ref={ref} className="relative" aria-disabled={disabled}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm disabled:opacity-60"
        aria-expanded={open}
      >
        <div className="flex flex-wrap gap-2">
          {mode === "auto" ? (
            <span className="text-muted">
              {explicitAi ? "Let AI choose capabilities" : "Select capabilities"}
            </span>
          ) : selected.length === 0 ? (
            <span className="text-muted">Select capabilities</span>
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
        {mode === "manual" && (
          <span className="ml-auto text-xs text-muted">{selected.length}/3</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 w-full overflow-auto rounded-md border border-border bg-card p-2 shadow-lg">
          <div className="grid gap-1">
            <button
              type="button"
              onClick={chooseAi}
              className={`w-full rounded px-2 py-1.5 text-left text-sm ${mode === "auto" ? "bg-accent/10 font-medium text-navy" : "hover:bg-background"}`}
            >
              Let AI choose capabilities
            </button>
            {RCGP_CAPABILITY_NAMES.map((name) => {
              const isSelected = mode === "manual" && selected.includes(name);
              const atLimit = mode === "manual" && selected.length >= 3 && !isSelected;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCapability(name)}
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
    </div>
  );
}
