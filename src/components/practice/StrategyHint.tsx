"use client";

import { Badge } from "@/components/ui/badge";

interface StrategyHintProps {
  label: string;
  className?: string;
}

const InfoIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6 5.5v3M6 4h.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export function StrategyHint({ label, className = "" }: StrategyHintProps) {
  return (
    <Badge
      variant="outline"
      className={`h-auto py-1 px-2.5 border-indigo-200 bg-indigo-50 text-indigo-600 font-medium text-xs ${className}`}
    >
      <InfoIcon />
      {label}
    </Badge>
  );
}
