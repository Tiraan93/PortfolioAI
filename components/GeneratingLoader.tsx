"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Becoming a MapleMedic",
  "Booking flights to Canada",
  "Tasting Maple syrup",
  "Loading Poutine",
  "Unlocking my full potential",
];

const PHRASE_MS = 3000;

export function GeneratingLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, PHRASE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-8 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <a
        href="https://www.maplemed.co.uk/"
        target="_blank"
        rel="noopener noreferrer"
        title="Visit MapleMed"
        className="group relative flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {/* Outer spinning loading circle (clickable → MapleMed) */}
        <div
          className="h-56 w-56 animate-spin rounded-full border-4 border-accent-light border-t-accent"
          style={{ animationDuration: "1.2s" }}
        />

        {/* Greyed out circle holding the (greyed) MapleMedic logo */}
        <div
          className="absolute flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-neutral-300 transition-transform group-hover:scale-105"
          style={{ isolation: "isolate" }}
        >
          <img
            src="/maple-cross.png"
            alt=""
            aria-hidden
            className="h-full w-full object-contain opacity-60 mix-blend-screen"
          />

          {/* Cycling phrases, in front of the logo */}
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <span
              key={index}
              className="loader-phrase rounded-lg bg-black/55 px-2.5 py-1.5 text-[13px] font-semibold leading-tight text-white"
            >
              {MESSAGES[index]}
            </span>
          </div>
        </div>
      </a>

      <p className="text-sm font-medium text-muted">Generating your review…</p>
    </div>
  );
}
