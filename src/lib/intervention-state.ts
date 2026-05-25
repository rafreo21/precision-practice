import type { SkillStats, SkillType, SupportLevel, MisconceptionType } from "./types";

// Heuristic recovery thresholds — not validated through formal learning science.
// A student exits support mode when they get RECOVERY_REQUIRED_CORRECT correct
// answers out of the last RECOVERY_WINDOW attempts.
const RECOVERY_WINDOW = 4;
const RECOVERY_REQUIRED_CORRECT = 3;

export const SKILL_LABELS: Record<SkillType, string> = {
  same_denominator: "Same-denominator comparisons",
  same_numerator: "Same-numerator comparisons",
  benchmark: "Benchmark reasoning",
  unlike_fractions: "Unlike fractions",
};

export function makeInitialSkillStats(): Record<SkillType, SkillStats> {
  const skills: SkillType[] = ["same_denominator", "same_numerator", "benchmark", "unlike_fractions"];
  const makeEntry = (type: SkillType): SkillStats => ({
    type,
    state: "neutral",
    supportLevel: 0,
    attempts: 0,
    correct: 0,
    recentAnswers: [],
    misconceptionCounts: {},
  });
  return {
    same_denominator: makeEntry("same_denominator"),
    same_numerator: makeEntry("same_numerator"),
    benchmark: makeEntry("benchmark"),
    unlike_fractions: makeEntry("unlike_fractions"),
  };
}

export function recordAnswer(
  stats: SkillStats,
  correct: boolean,
  misconception: MisconceptionType | null
): SkillStats {
  const newRecent = [...stats.recentAnswers, correct].slice(-RECOVERY_WINDOW);
  const newMisconceptionCounts = { ...stats.misconceptionCounts };
  if (!correct && misconception && misconception !== "unclear") {
    newMisconceptionCounts[misconception] = (newMisconceptionCounts[misconception] ?? 0) + 1;
  }

  const updated: SkillStats = {
    ...stats,
    attempts: stats.attempts + 1,
    correct: stats.correct + (correct ? 1 : 0),
    recentAnswers: newRecent,
    misconceptionCounts: newMisconceptionCounts,
  };

  return transitionSkillState(updated);
}

function transitionSkillState(stats: SkillStats): SkillStats {
  const recent = stats.recentAnswers;
  const recentCorrect = recent.filter(Boolean).length;
  const recentTotal = recent.length;
  const totalMisses = stats.attempts - stats.correct;

  const dominantMisconception = getDominantMisconception(stats);
  const dominantMissCount = dominantMisconception
    ? (stats.misconceptionCounts[dominantMisconception] ?? 0)
    : 0;

  let nextState = stats.state;
  let nextSupportLevel = stats.supportLevel;

  // RECOVERY ─────────────────────────────────────────────────────────────────

  // RECOVERY_REQUIRED_CORRECT of last RECOVERY_WINDOW correct while in support mode → improving
  if (
    recentTotal >= RECOVERY_REQUIRED_CORRECT &&
    recentCorrect >= RECOVERY_REQUIRED_CORRECT &&
    (stats.state === "needs_support" || stats.state === "guided_practice")
  ) {
    nextState = "improving";
    nextSupportLevel = Math.max(0, stats.supportLevel - 1) as SupportLevel;
  }

  // 4 of 4 correct in improving state → mixed_review
  if (recentTotal === 4 && recentCorrect === 4 && stats.state === "improving") {
    nextState = "mixed_review";
    nextSupportLevel = 0;
  }

  // ESCALATION ───────────────────────────────────────────────────────────────

  // neutral → monitoring:
  // Signal: first identified misconception miss, OR 2 total misses across the skill
  if (stats.state === "neutral") {
    if (dominantMissCount >= 1 || totalMisses >= 2) {
      nextState = "monitoring";
      nextSupportLevel = 1;
    }
  }

  // monitoring → needs_support:
  // Requires: 2 same-pattern misses across ≥3 attempts, OR 3 total misses in skill
  if (stats.state === "monitoring") {
    const patternConfirmed = dominantMissCount >= 2 && stats.attempts >= 3;
    const generalStruggle = totalMisses >= 3;
    if (patternConfirmed || generalStruggle) {
      nextState = "needs_support";
      nextSupportLevel = 2;
    }
  }

  // needs_support → guided_practice: 4+ misses on dominant pattern
  if (stats.state === "needs_support" && dominantMissCount >= 4) {
    nextState = "guided_practice";
    nextSupportLevel = 3;
  }

  return { ...stats, state: nextState, supportLevel: nextSupportLevel as SupportLevel };
}

export function getDominantMisconception(stats: SkillStats): MisconceptionType | null {
  const entries = Object.entries(stats.misconceptionCounts) as [MisconceptionType, number][];
  if (entries.length === 0) return null;
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][1] >= 1 ? sorted[0][0] : null;
}

export function needsSupport(stats: SkillStats): boolean {
  return stats.state === "needs_support" || stats.state === "guided_practice";
}

export function isImproving(stats: SkillStats): boolean {
  return stats.state === "improving" || stats.state === "mixed_review";
}

export function getRecentCorrectCount(stats: SkillStats): number {
  return stats.recentAnswers.filter(Boolean).length;
}
