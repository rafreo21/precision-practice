"use client";

import { Progress, ProgressLabel } from "@/components/ui/progress";

interface ProgressStripProps {
  current: number;
  total: number;
  answeredCorrect: number;
}

export function ProgressStrip({ current, total, answeredCorrect }: ProgressStripProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <Progress
      value={pct}
      aria-label={`Question ${current} of ${total}`}
      className="gap-1.5"
    >
      {/* Labels sit as children above the ProgressTrack the root renders */}
      <div className="flex w-full justify-between items-baseline">
        <ProgressLabel className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          Question {current} of {total}
        </ProgressLabel>
        <span className="text-xs text-slate-500 tabular-nums">
          {answeredCorrect} correct
        </span>
      </div>
    </Progress>
  );
}
