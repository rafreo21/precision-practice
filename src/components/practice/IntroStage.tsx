"use client";

import { Button } from "@/components/ui/button";
import type { SessionState } from "@/lib/types";

interface IntroStageProps {
  onStart: () => void;
  savedSession?: SessionState | null;
  onResume?: () => void;
}

export function IntroStage({ onStart, savedSession, onResume }: IntroStageProps) {
  const hasResume = savedSession !== null && savedSession !== undefined && onResume;
  const progress = savedSession
    ? `${savedSession.mainQuestionCount} of ${savedSession.totalQuestions} questions completed`
    : null;

  return (
    <div className="flex flex-col items-start gap-10 py-12 max-w-sm">
      {/* Wordmark accent */}
      <div className="flex items-center gap-2">
        <div className="h-px w-6 bg-indigo-400" />
        <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-[0.12em]">
          Fractions
        </span>
      </div>

      {/* Title + subtitle */}
      <div className="flex flex-col gap-4">
        <h1 className="text-[52px] font-light text-slate-900 leading-[1.05] tracking-[-0.03em]">
          Precision
          <br />
          <span className="font-semibold text-indigo-600">Practice</span>
        </h1>
        <p className="text-[17px] text-slate-500 leading-relaxed tracking-[-0.01em]">
          Short focused comparison practice that adapts as you go.
        </p>
      </div>

      {/* Session meta */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[13px] text-slate-500">~5 minutes</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[13px] text-slate-500">
            You&apos;ll get support when needed.
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[13px] text-slate-500">
            Practice adjusts as you go — support appears when patterns suggest it&apos;s useful.
          </span>
        </div>
      </div>

      {/* CTAs */}
      {hasResume ? (
        <div className="flex flex-col gap-3 w-full">
          {/* Resume banner */}
          <div className="flex flex-col gap-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-[12px] font-semibold text-indigo-600 uppercase tracking-[0.08em]">
              Session in progress
            </p>
            {progress ? (
              <p className="text-[13px] text-slate-600">{progress}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onResume}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl text-[15px] font-medium tracking-[-0.01em] transition-colors"
            >
              Resume
            </Button>
            <Button
              onClick={onStart}
              variant="ghost"
              size="lg"
              className="text-slate-500 hover:text-slate-700 px-4 rounded-xl text-[14px]"
            >
              Start fresh
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={onStart}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl text-[15px] font-medium tracking-[-0.01em] transition-colors"
        >
          Start practice
        </Button>
      )}
    </div>
  );
}
