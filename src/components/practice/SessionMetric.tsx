"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SessionMetricProps {
  label: string;
  value: string | number;
  sublabel?: string;
  /** Optional explanatory line rendered beneath the sublabel in muted text.
   *  Ownership stays inside the card so the grid layout never breaks. */
  helperText?: string;
  accent?: boolean;
}

export function SessionMetric({ label, value, sublabel, helperText, accent = false }: SessionMetricProps) {
  return (
    <Card className={accent ? "bg-indigo-50 ring-indigo-100" : ""}>
      <CardContent className="flex flex-col gap-0.5 pt-0">
        <span
          className={`text-2xl font-semibold tabular-nums ${
            accent ? "text-indigo-700" : "text-slate-800"
          }`}
        >
          {value}
        </span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {sublabel !== undefined ? (
          <span className="text-xs text-slate-500">{sublabel}</span>
        ) : null}
        {helperText !== undefined ? (
          <span className="text-xs text-slate-400 mt-1.5 leading-snug">{helperText}</span>
        ) : null}
      </CardContent>
    </Card>
  );
}
