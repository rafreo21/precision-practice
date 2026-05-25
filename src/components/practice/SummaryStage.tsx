"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SessionMetric } from "./SessionMetric";
import type { SessionSummary, CrossSessionComparison } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/intervention-state";

interface SummaryStageProps {
  summary: SessionSummary;
  totalQuestions: number;
  onReset: () => void;
}

function SkillRow({
  label,
  correct,
  total,
  recentCorrect,
  recentTotal,
}: {
  label: string;
  correct: number;
  total: number;
  recentCorrect: number;
  recentTotal: number;
}) {
  if (total === 0) return null;

  const rate = correct / total;
  const pct = Math.round(rate * 100);
  const recentRate = recentTotal > 0 ? recentCorrect / recentTotal : 0;
  const improved = recentRate > rate && recentTotal >= 2;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] font-medium text-slate-700 leading-snug">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {improved ? (
            <span className="text-[11px] font-semibold text-emerald-600">
              {recentCorrect} of last {recentTotal}
            </span>
          ) : null}
          <span className="text-[12px] text-slate-400 tabular-nums">
            {correct}/{total}
          </span>
        </div>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 75 ? "#10b981" : pct >= 50 ? "#6366f1" : "#94a3b8",
          }}
        />
      </div>
    </div>
  );
}

function CrossSessionRow({ comparison }: { comparison: CrossSessionComparison }) {
  const { label, thisSession, lastSession, improved } = comparison;
  if (thisSession.total === 0) return null;

  const thisPct = Math.round((thisSession.correct / thisSession.total) * 100);

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-slate-600 leading-snug">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        {improved ? (
          <span className="text-[11px] font-semibold text-emerald-600">↑</span>
        ) : null}
        <span className="text-[12px] text-slate-500 tabular-nums">
          {thisSession.correct}/{thisSession.total}
          {lastSession && lastSession.total > 0 ? (
            <span className="text-slate-400">
              {" "}vs {lastSession.correct}/{lastSession.total}
            </span>
          ) : null}
        </span>
        <span className="text-[11px] text-slate-400 tabular-nums w-8 text-right">
          {thisPct}%
        </span>
      </div>
    </div>
  );
}

export function SummaryStage({ summary, totalQuestions, onReset }: SummaryStageProps) {
  // Zero-question guard: session ended before any main question was completed.
  // Show a graceful neutral state rather than empty stats.
  if (summary.questionsCompleted === 0) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-lg py-8">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-[0.12em]">
            Session ended early
          </p>
          <h2 className="text-[32px] sm:text-[36px] font-semibold text-slate-900 leading-[1.1] tracking-[-0.03em]">
            No questions completed.
          </h2>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Start a new session whenever you&apos;re ready.
          </p>
        </div>
        <Button
          onClick={onReset}
          className="self-start bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium tracking-[-0.01em] px-8"
          size="lg"
        >
          Practice again
        </Button>
      </div>
    );
  }

  const overallCorrect = summary.skillBreakdowns.reduce((s, b) => s + b.correct, 0);
  const overallTotal = summary.skillBreakdowns.reduce((s, b) => s + b.total, 0);
  const attempted = summary.skillBreakdowns.filter((b) => b.total > 0);

  // Emotional headline
  const improvedLabel = summary.improvedSkill
    ? SKILL_LABELS[summary.improvedSkill].toLowerCase()
    : null;

  const headline =
    improvedLabel !== null
      ? `You improved in ${improvedLabel} today.`
      : "Strong session today.";

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg py-8">
      {/* Emotional headline — leads the page */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-[0.12em]">
          Session complete
        </p>
        <h2 className="text-[32px] sm:text-[36px] font-semibold text-slate-900 leading-[1.1] tracking-[-0.03em]">
          {headline}
        </h2>
        {summary.concreteMetric !== "" ? (
          <p className="text-[14px] text-slate-500 leading-relaxed">
            {summary.concreteMetric}
          </p>
        ) : null}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3">
        <SessionMetric
          label="Questions done"
          value={summary.questionsCompleted}
          sublabel={`of ${totalQuestions}`}
          accent
        />
        <SessionMetric
          label="Correct"
          value={`${overallCorrect}/${overallTotal}`}
          sublabel={`${Math.round((overallCorrect / Math.max(overallTotal, 1)) * 100)}% accuracy`}
        />
      </div>

      {attempted.length > 0 ? (
        <>
          <Separator className="bg-slate-100" />

          {/* Cross-session comparison — shown when history exists */}
          {summary.hasHistory && summary.crossSessionComparisons.some((c) => c.thisSession.total > 0) ? (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
                Compared to last session
              </p>
              {summary.crossSessionComparisons
                .filter((c) => c.thisSession.total > 0)
                .map((c) => (
                  <CrossSessionRow key={c.skill} comparison={c} />
                ))}
            </div>
          ) : null}

          {summary.hasHistory ? <Separator className="bg-slate-100" /> : null}

          {/* Skill breakdown */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
              {summary.hasHistory ? "This session" : "By skill type"}
            </p>
            {summary.skillBreakdowns.map((b) => (
              <SkillRow
                key={b.skill}
                label={b.label}
                correct={b.correct}
                total={b.total}
                recentCorrect={b.recentCorrect}
                recentTotal={b.recentTotal}
              />
            ))}
          </div>

          <Separator className="bg-slate-100" />
        </>
      ) : null}

      {/* Next focus */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
          Next focus
        </p>
        <p className="text-[14px] text-slate-600 leading-relaxed">{summary.nextFocus}</p>
      </div>

      {/* CTA */}
      <Button
        onClick={onReset}
        className="self-start bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium tracking-[-0.01em] px-8"
        size="lg"
      >
        Practice again
      </Button>
    </div>
  );
}
