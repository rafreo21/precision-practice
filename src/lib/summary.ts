import type { SessionState, SessionSummary, SkillType, SessionHistory, CrossSessionComparison } from "./types";
import { SKILL_LABELS, getRecentCorrectCount } from "./intervention-state";

export function calculateSessionSummary(
  state: SessionState,
  history: SessionHistory[]
): SessionSummary {
  const skills: SkillType[] = ["same_denominator", "same_numerator", "benchmark", "unlike_fractions"];

  // Exclude the current session from history comparison — saveHistory() may have
  // already written this session before summary renders, so we filter by sessionId.
  const previousSessions = history.filter((h) => h.sessionId !== state.sessionId);
  const lastSession = previousSessions.length > 0 ? previousSessions[0] : null;

  const breakdowns = skills.map((skill) => {
    const stats = state.skillStats[skill];
    const recentCorrect = getRecentCorrectCount(stats);
    const recentTotal = Math.min(stats.recentAnswers.length, 4);
    return {
      skill,
      label: SKILL_LABELS[skill],
      correct: stats.correct,
      total: stats.attempts,
      recentCorrect,
      recentTotal,
    };
  });

  // Cross-session comparisons
  const crossSessionComparisons: CrossSessionComparison[] = skills.map((skill) => {
    const current = breakdowns.find((b) => b.skill === skill)!;
    const prev = lastSession?.skillBreakdowns.find((b) => b.skill === skill) ?? null;

    const thisRate = current.total > 0 ? current.correct / current.total : 0;
    const prevRate = prev && prev.total > 0 ? prev.correct / prev.total : null;
    const improved = prevRate !== null && thisRate > prevRate && current.total >= 2;

    return {
      skill,
      label: SKILL_LABELS[skill],
      thisSession: { correct: current.correct, total: current.total },
      lastSession: prev ? { correct: prev.correct, total: prev.total } : null,
      improved,
    };
  });

  // Most-improved skill: biggest positive improvement in recent accuracy vs overall.
  // Minimum evidence: ≥4 attempts total AND ≥2 recent answers — prevents the
  // improvement headline from firing on 1–3 question samples.
  const attempted = breakdowns.filter((b) => b.total > 0);

  let improvedSkill: SkillType | null = null;
  // Start at 0 so only genuine positive improvement (not "least bad") qualifies.
  let bestImprovementScore = 0;

  for (const b of attempted) {
    if (b.total < 4 || b.recentTotal < 2) continue; // insufficient evidence
    const overallRate = b.correct / b.total;
    const recentRate = b.recentCorrect / b.recentTotal;
    const improvement = recentRate - overallRate;
    if (improvement > bestImprovementScore) {
      bestImprovementScore = improvement;
      improvedSkill = b.skill;
    }
  }

  // Concrete metric — prefer cross-session comparison when history exists.
  // Copy is conditional on whether the rate actually improved, held steady, or declined.
  let concreteMetric = "";
  let strongestImprovement = "";

  if (lastSession && improvedSkill) {
    const current = breakdowns.find((b) => b.skill === improvedSkill)!;
    const prev = lastSession.skillBreakdowns.find((b) => b.skill === improvedSkill);
    if (prev && prev.total > 0 && current.total > 0) {
      const currentRate = current.correct / current.total;
      const prevRate = prev.correct / prev.total;
      if (currentRate > prevRate) {
        concreteMetric = `${SKILL_LABELS[improvedSkill]}: improved from ${prev.correct}/${prev.total} last session to ${current.correct}/${current.total} this session.`;
      } else if (currentRate < prevRate) {
        concreteMetric = `${SKILL_LABELS[improvedSkill]}: ${current.correct}/${current.total} this session vs ${prev.correct}/${prev.total} last session.`;
      } else {
        concreteMetric = `${SKILL_LABELS[improvedSkill]}: ${current.correct}/${current.total} — consistent with last session.`;
      }
      strongestImprovement = SKILL_LABELS[improvedSkill];
    }
  }

  if (!concreteMetric && improvedSkill) {
    const bd = breakdowns.find((b) => b.skill === improvedSkill)!;
    if (bd.recentTotal > 0) {
      concreteMetric = `${SKILL_LABELS[improvedSkill]}: ${bd.recentCorrect} of your last ${bd.recentTotal} correct.`;
      strongestImprovement = SKILL_LABELS[improvedSkill];
    }
  }

  // Fallback: show best-performing skill stats without claiming improvement.
  // Do NOT set improvedSkill here — the headline stays neutral without evidence.
  if (!concreteMetric && attempted.length > 0) {
    const best = [...attempted].sort(
      (a, b) => b.correct / Math.max(b.total, 1) - a.correct / Math.max(a.total, 1)
    )[0];
    concreteMetric = lastSession
      ? `${SKILL_LABELS[best.skill]}: ${best.correct} of ${best.total} correct this session.`
      : `${SKILL_LABELS[best.skill]}: ${best.correct} of ${best.total} correct.`;
    strongestImprovement = SKILL_LABELS[best.skill];
  }

  // Next focus: skill with lowest recent accuracy
  const nextFocusSkill = [...attempted]
    .filter((b) => b.recentTotal > 0)
    .sort((a, b) => a.recentCorrect / a.recentTotal - b.recentCorrect / b.recentTotal)[0];

  const nextFocus = nextFocusSkill
    ? `Keep working on ${SKILL_LABELS[nextFocusSkill.skill].toLowerCase()}.`
    : "Keep mixing all skill types for balanced practice.";

  return {
    questionsCompleted: state.mainQuestionCount,
    strongestImprovement,
    improvedSkill,
    concreteMetric,
    nextFocus,
    hasHistory: lastSession !== null,
    crossSessionComparisons,
    skillBreakdowns: breakdowns,
  };
}
