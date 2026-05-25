"use client";

import type { Fraction } from "@/lib/types";

interface FractionChoiceProps {
  fraction: Fraction;
  side: "left" | "right";
  selected: boolean;
  correct: boolean | null; // null = not yet answered
  disabled: boolean;
  onSelect: (side: "left" | "right") => void;
}

function FractionDisplay({ fraction }: { fraction: Fraction }) {
  return (
    <span className="inline-flex flex-col items-center leading-none select-none gap-1" aria-hidden="true">
      <span className="text-[32px] sm:text-[42px] font-[300] tabular-nums tracking-[-0.03em]">
        {fraction.numerator}
      </span>
      <span className="block w-8 sm:w-10 border-t-[1.5px] border-current opacity-40" />
      <span className="text-[32px] sm:text-[42px] font-[300] tabular-nums tracking-[-0.03em]">
        {fraction.denominator}
      </span>
    </span>
  );
}

export function FractionChoice({
  fraction,
  side,
  selected,
  correct,
  disabled,
  onSelect,
}: FractionChoiceProps) {
  const isAnswered = correct !== null;
  const isCorrect = isAnswered && selected && correct === true;
  const isWrong = isAnswered && selected && correct === false;
  const isCorrectNotSelected = isAnswered && !selected && correct === true;

  function getCardStyle(): string {
    if (isCorrect) {
      return "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100";
    }
    if (isWrong) {
      return "border-slate-200 bg-slate-50 text-slate-500";
    }
    if (isCorrectNotSelected) {
      return "border-emerald-400 bg-emerald-50 text-emerald-800";
    }
    if (selected) {
      return "border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm shadow-indigo-100";
    }
    if (disabled) {
      return "border-slate-200 bg-white text-slate-600 cursor-not-allowed";
    }
    return "border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm cursor-pointer active:scale-[0.98]";
  }

  return (
    <button
      onClick={() => !disabled && onSelect(side)}
      disabled={disabled}
      aria-label={`${fraction.numerator} over ${fraction.denominator}${selected ? " — selected" : ""}`}
      className={`
        relative flex items-center justify-center
        w-full min-h-[120px] sm:min-h-[140px] rounded-2xl border-2
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2
        ${getCardStyle()}
      `}
    >
      <FractionDisplay fraction={fraction} />

      {isCorrect && (
        <span className="absolute top-3 right-3 text-emerald-500" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M3.75 9L7.5 12.75L14.25 5.25"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      {isWrong && (
        <span className="absolute top-3 right-3 text-slate-400" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 3L13 13M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      {isCorrectNotSelected && (
        <span className="absolute top-3 right-3 text-emerald-400 text-xs font-medium">
          correct
        </span>
      )}
    </button>
  );
}
