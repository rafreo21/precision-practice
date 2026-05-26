"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FractionChoice } from "./FractionChoice";
import { ProgressStrip } from "./ProgressStrip";
import type { SessionState, SkillType } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/intervention-state";

interface QuestionStageProps {
  state: SessionState;
  onSelectAnswer: (side: "left" | "right") => void;
}

// Non-directional thinking prompts — do NOT reveal the comparison rule
const SKILL_HINTS: Record<SkillType, string> = {
  same_denominator:
    "Look at both fractions carefully. What do you notice about the bottom numbers?",
  same_numerator:
    "The top numbers are the same. Think about what the bottom number tells you about the size of each piece.",
  benchmark:
    "Is there a familiar fraction you can use as a reference point to help compare these?",
  unlike_fractions:
    "Think about how much of a whole each fraction represents. Which one takes up more space?",
};

export function QuestionStage({ state, onSelectAnswer }: QuestionStageProps) {
  const [hintVisible, setHintVisible] = useState(false);
  const question = state.currentQuestion;

  if (!question) return null;

  const skillStats = state.skillStats[question.type];
  const isStruggling =
    skillStats.state === "needs_support" || skillStats.state === "guided_practice";
  const progressCurrent = Math.min(state.mainQuestionCount + 1, state.totalQuestions);

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg">
      {/* Progress */}
      <ProgressStrip
        current={progressCurrent}
        total={state.totalQuestions}
        answeredCorrect={state.answers.filter((a) => a.correct).length}
      />

      {/* Skill label */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
          {SKILL_LABELS[question.type]}
        </span>
        {isStruggling ? (
          <span className="text-[12px] text-indigo-500 font-medium">
            Let&rsquo;s work through this one carefully.
          </span>
        ) : null}
        {/* Retry context — shown when this is a practice repeat, not a new question */}
        {state.currentQuestionIsRetry ? (
          <span className="text-[12px] text-slate-400 font-medium">
            One similar comparison for practice.
          </span>
        ) : null}
      </div>

      {/* Prompt */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-[-0.02em]">
          Which is larger?
        </h2>
        <p className="text-[13px] text-slate-500">Select one to continue</p>
      </div>

      {/* Rushing nudge — appears when the rolling window detects consistently fast wrong answers */}
      {state.engagementState === "rushing" ? (
        <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Take a moment to compare the values before choosing.
          </p>
        </div>
      ) : null}

      {/* Fraction choices */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <FractionChoice
          fraction={question.left}
          side="left"
          selected={false}
          correct={null}
          disabled={false}
          onSelect={onSelectAnswer}
        />
        <FractionChoice
          fraction={question.right}
          side="right"
          selected={false}
          correct={null}
          disabled={false}
          onSelect={onSelectAnswer}
        />
      </div>

      {/* Hint — non-directional thinking prompt, no answer leak */}
      {!hintVisible ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHintVisible(true)}
          className="self-start border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 rounded-lg"
        >
          Need a hint?
        </Button>
      ) : (
        <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
            Think about it
          </span>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {SKILL_HINTS[question.type]}
          </p>
        </div>
      )}
    </div>
  );
}
