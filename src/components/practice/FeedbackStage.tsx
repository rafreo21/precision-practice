"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FractionBarPair } from "./FractionBar";
import { NumberLine } from "./NumberLine";
import { FractionChoice } from "./FractionChoice";
import type { SessionState, SkillType } from "@/lib/types";
import { GUESSING_RESET_COPY } from "@/lib/anti-guessing";

// Count how many of the most recent answers are wrong on the same skill type.
// Used to detect a repeated-failure streak and trigger an emotional reset prompt.
function countConsecutiveSameSkillMisses(state: SessionState, skill: SkillType): number {
  const answers = state.answers;
  let count = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    const a = answers[i];
    if (!a.correct && a.skillType === skill) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

interface FeedbackStageProps {
  state: SessionState;
  onContinue: () => void;
}

// ── Guessing reset ────────────────────────────────────────────────────────────

function GuessingResetCard({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-5 max-w-lg w-full pt-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-slate-900 tracking-[-0.02em]">
          {GUESSING_RESET_COPY.headline}
        </h3>
        <p className="text-[14px] text-slate-500 leading-relaxed">
          {GUESSING_RESET_COPY.body}
        </p>
      </div>
      <Button
        onClick={onContinue}
        variant="outline"
        className="self-start border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
      >
        {GUESSING_RESET_COPY.cta}
      </Button>
    </div>
  );
}

// ── Answer review cards ───────────────────────────────────────────────────────

function AnswerReview({
  state,
}: {
  state: SessionState;
}) {
  const { currentQuestion: question, selectedSide, wasCorrect } = state;
  if (!question) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
        Your answer
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FractionChoice
          fraction={question.left}
          side="left"
          selected={selectedSide === "left"}
          correct={selectedSide === "left" ? (wasCorrect ?? null) : null}
          disabled
          onSelect={() => {}}
        />
        <FractionChoice
          fraction={question.right}
          side="right"
          selected={selectedSide === "right"}
          correct={selectedSide === "right" ? (wasCorrect ?? null) : null}
          disabled
          onSelect={() => {}}
        />
      </div>
    </div>
  );
}

// ── Correct result ────────────────────────────────────────────────────────────

function CorrectResult({ explanation, strategy }: { explanation: string; strategy: string }) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              d="M2 5L4.5 7.5L8.5 2.5"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-[13px] font-semibold text-emerald-700">Correct</span>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed">{explanation}</p>
      {/* Show the strategy post-answer — confirms their reasoning */}
      <p className="text-[12px] text-indigo-500 font-medium leading-relaxed">{strategy}</p>
    </div>
  );
}

// ── Wrong answer feedback — level 0 (first miss, light) ───────────────────────

function LightFeedback({
  headline,
  body,
}: {
  headline: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <h3 className="text-[15px] font-semibold text-slate-800 tracking-[-0.01em]">
        {headline}
      </h3>
      <p className="text-[13px] text-slate-500 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Wrong answer feedback — level 1+ (pattern detected, full) ─────────────────

function FullFeedback({
  state,
}: {
  state: SessionState;
}) {
  const { currentQuestion: question, feedbackContent: feedback } = state;
  if (!question || !feedback) return null;

  return (
    <div className="flex flex-col gap-4 pt-1">
      {/* Dominant headline */}
      <h3 className="text-[17px] font-semibold text-slate-900 tracking-[-0.02em] leading-snug">
        {feedback.headline}
      </h3>

      {/* Dominant visual — shown first, before explanation */}
      {feedback.visualType === "fraction_bars" ? (
        <FractionBarPair
          left={question.left}
          right={question.right}
          correctSide={question.correctSide}
        />
      ) : feedback.visualType === "number_line" ? (
        <NumberLine
          left={question.left}
          right={question.right}
          correctSide={question.correctSide}
        />
      ) : null}

      {/* One concise insight */}
      <p className="text-[13px] text-slate-500 leading-relaxed">{feedback.body}</p>

      {/* Guided steps — level 3 only, simplified to 3 steps max */}
      {feedback.supportLevel === 3 && feedback.guidedSteps !== undefined ? (
        <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
          {feedback.guidedSteps.slice(0, 3).map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[11px] font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-[13px] text-slate-600 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FeedbackStage({ state, onContinue }: FeedbackStageProps) {
  const { currentQuestion: question, feedbackContent: feedback, wasCorrect } = state;

  if (!question) return null;

  if (state.showGuessingReset) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-lg">
        <GuessingResetCard onContinue={onContinue} />
      </div>
    );
  }

  const isLightFeedback = !wasCorrect && feedback?.supportLevel === 0;
  const isFullFeedback = !wasCorrect && feedback !== null && (feedback.supportLevel ?? 0) >= 1;

  // Repeated-failure detection: 3+ consecutive wrong answers on the same skill
  const consecutiveMisses = !wasCorrect
    ? countConsecutiveSameSkillMisses(state, question.type)
    : 0;
  const showPausePattern = consecutiveMisses >= 3;

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg">
      {/* 1. Answer review */}
      <AnswerReview state={state} />

      <Separator className="bg-slate-100" />

      {/* 2. Result — correct */}
      {wasCorrect === true ? (
        <CorrectResult explanation={question.explanation} strategy={question.strategy} />
      ) : null}

      {/* 3. Result — wrong, light (first miss) */}
      {isLightFeedback && feedback !== null ? (
        <LightFeedback headline={feedback.headline} body={feedback.body} />
      ) : null}

      {/* 4. Result — wrong, full (pattern detected) */}
      {isFullFeedback ? (
        <FullFeedback state={state} />
      ) : null}

      {/* 5. Repeated-failure emotional reset — calm, non-shaming */}
      {showPausePattern ? (
        <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[13px] font-semibold text-slate-700 tracking-[-0.01em]">
            Pause the pattern.
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            You&rsquo;ve missed a few of these in a row — that&rsquo;s a useful signal. Take a breath
            before the next one. Reading the explanation above carefully often helps.
          </p>
        </div>
      ) : null}

      {/* 6. Feedback-skipping nudge — shown when student is clicking past explanations quickly */}
      {state.engagementState === "feedback_skipping" && !wasCorrect ? (
        <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-[12px] text-slate-400 leading-relaxed">
            This explanation is short — worth a quick read before the next one.
          </p>
        </div>
      ) : null}

      {/* CTA — shown for all answers so the student controls the pace */}
      <div className="pt-1">
        <Button
          onClick={onContinue}
          className={
            wasCorrect === true
              ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl font-medium tracking-[-0.01em] shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium tracking-[-0.01em]"
          }
          variant={wasCorrect === true ? "outline" : "default"}
        >
          {wasCorrect === true
            ? "Continue"
            : state.queuedRetryQuestionId !== null
            ? "Try a similar one"
            : "Continue"}
        </Button>
      </div>
    </div>
  );
}
