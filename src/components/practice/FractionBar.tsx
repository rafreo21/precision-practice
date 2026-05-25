"use client";

import type { Fraction } from "@/lib/types";

interface FractionBarProps {
  fraction: Fraction;
  label?: string;
  color?: string;
  className?: string;
}

export function FractionBar({ fraction, label, color = "#6366f1", className = "" }: FractionBarProps) {
  const { numerator, denominator } = fraction;
  const segments = Array.from({ length: denominator }, (_, i) => i);
  const filledCount = Math.min(numerator, denominator);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label !== undefined ? (
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] text-slate-500 w-8 text-right tabular-nums shrink-0">
          {numerator}/{denominator}
        </span>
        <div className="flex gap-0.5 flex-1 max-w-xs">
          {segments.map((i) => (
            <div
              key={i}
              className="h-6 flex-1 rounded-sm border transition-colors"
              style={{
                backgroundColor: i < filledCount ? color : "transparent",
                borderColor: i < filledCount ? color : "#e2e8f0",
                opacity: i < filledCount ? 0.8 : 1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FractionBarPairProps {
  left: Fraction;
  right: Fraction;
  correctSide: "left" | "right";
  hideLabels?: boolean; // hint mode — don't reveal which is larger
}

export function FractionBarPair({ left, right, correctSide, hideLabels = false }: FractionBarPairProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <FractionBar
        fraction={left}
        label={hideLabels ? undefined : correctSide === "left" ? "Larger" : "Smaller"}
        color={!hideLabels && correctSide === "left" ? "#6366f1" : "#94a3b8"}
      />
      <FractionBar
        fraction={right}
        label={hideLabels ? undefined : correctSide === "right" ? "Larger" : "Smaller"}
        color={!hideLabels && correctSide === "right" ? "#6366f1" : "#94a3b8"}
      />
    </div>
  );
}
