import type { SessionState, SkillType, Question, AdaptiveMode } from "./types";
import { ALL_QUESTIONS } from "./questions";
import { needsSupport } from "./intervention-state";

interface NextQuestionResult {
  question: Question;
  adaptiveReason: string | null;
  showAdaptedNotice: boolean;
  isRetry: boolean;
}

export function getNextQuestion(state: SessionState): NextQuestionResult | null {
  // Available = not yet answered in this session
  const available = ALL_QUESTIONS.filter(
    (q) => !state.answeredQuestionIds.includes(q.id)
  );

  if (available.length === 0) return null;

  // Priority 1: queued retry — seamless, no notice
  if (state.queuedRetryQuestionId) {
    const retry = available.find((q) => q.id === state.queuedRetryQuestionId);
    if (retry) {
      return {
        question: retry,
        adaptiveReason: null,
        showAdaptedNotice: false,
        isRetry: true,
      };
    }
  }

  // Only "main" questions count for starter/normal selection.
  // Retry variants are reserved for the retry queue so they are not burned.
  const mainAvailable = available.filter((q) => (q.usage ?? "main") === "main");

  // Starter phase: first 4 main questions, one per skill type in randomised order.
  // Uses mainQuestionCount (not questionIndex) so retries do not consume starter slots.
  // pickBySkill starts at maxDifficulty:1 and automatically escalates to higher
  // difficulties within the same skill if the easy pool is exhausted — so all 4
  // skill types are always attempted during calibration. Returns null only when
  // the target skill is completely exhausted; in that case, fall through to adaptive.
  if (state.mainQuestionCount < 4) {
    const targetSkill = state.starterOrder[state.mainQuestionCount] ?? "same_denominator";
    const q = pickBySkill(mainAvailable, targetSkill, 1, state.exposureCount);
    if (q) return { question: q, adaptiveReason: null, showAdaptedNotice: false, isRetry: false };
  }

  // Targeted support: skill with confirmed struggle pattern
  const weakSkill = getWeakestSkill(state);
  if (weakSkill) {
    const supportLevel = state.skillStats[weakSkill].supportLevel;
    const maxDifficulty: 1 | 2 | 3 = supportLevel >= 3 ? 1 : supportLevel >= 2 ? 2 : 3;
    const q = pickBySkill(mainAvailable, weakSkill, maxDifficulty, state.exposureCount);
    if (q) {
      return {
        question: q,
        adaptiveReason: null,
        showAdaptedNotice: false,
        isRetry: false,
      };
    }
  }

  // Recovery: blend improving skill with mixed practice (40% chance)
  const improvingSkill = getImprovingSkill(state);
  if (improvingSkill && Math.random() < 0.4) {
    const q = pickBySkill(mainAvailable, improvingSkill, 2, state.exposureCount);
    if (q) {
      return {
        question: q,
        adaptiveReason: null,
        showAdaptedNotice: false,
        isRetry: false,
      };
    }
  }

  // Mixed review: balanced across all skill types, prefer least-seen questions
  const q = pickBalanced(mainAvailable, state);
  return q ? { question: q, adaptiveReason: null, showAdaptedNotice: false, isRetry: false } : null;
}

function getWeakestSkill(state: SessionState): SkillType | null {
  const skills: SkillType[] = ["same_denominator", "same_numerator", "benchmark", "unlike_fractions"];
  for (const skill of skills) {
    if (needsSupport(state.skillStats[skill])) return skill;
  }
  return null;
}

function getImprovingSkill(state: SessionState): SkillType | null {
  const skills: SkillType[] = ["same_denominator", "same_numerator", "benchmark", "unlike_fractions"];
  for (const skill of skills) {
    if (state.skillStats[skill].state === "improving") return skill;
  }
  return null;
}

function pickBySkill(
  available: Question[],
  skill: SkillType,
  maxDifficulty: 1 | 2 | 3,
  exposureCount: Record<string, number>
): Question | null {
  const pool = available.filter(
    (q) => q.type === skill && q.difficulty <= maxDifficulty
  );
  const fallback = available.filter((q) => q.type === skill);
  const source = pool.length > 0 ? pool : fallback.length > 0 ? fallback : null;
  if (!source) return null;
  return pickLeastExposed(source, exposureCount);
}

function pickBalanced(available: Question[], state: SessionState): Question | null {
  if (available.length === 0) return null;

  const skills: SkillType[] = ["same_denominator", "same_numerator", "benchmark", "unlike_fractions"];
  const leastAttempted = skills
    .filter((s) => available.some((q) => q.type === s))
    .sort((a, b) => state.skillStats[a].attempts - state.skillStats[b].attempts);

  if (leastAttempted.length > 0) {
    const pool = available.filter((q) => q.type === leastAttempted[0]);
    return pickLeastExposed(pool, state.exposureCount);
  }

  return pickLeastExposed(available, state.exposureCount);
}

// Prefer questions the student has seen the fewest times across sessions
function pickLeastExposed(pool: Question[], exposureCount: Record<string, number>): Question {
  const sorted = [...pool].sort(
    (a, b) => (exposureCount[a.id] ?? 0) - (exposureCount[b.id] ?? 0)
  );
  // Pick randomly from the least-exposed quartile to avoid determinism
  const cutoff = Math.max(1, Math.ceil(sorted.length * 0.4));
  const candidates = sorted.slice(0, cutoff);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Find a retry question: prefer designed retry variants with matching misconception trap,
// then any retry variant in the same skill.
// Retry variants are never surfaced as regular questions, so using one here doesn't
// consume a main-pool slot.
export function findRetryQuestion(
  currentQuestion: Question,
  answeredIds: string[]
): string | null {
  // Difficulty band: ±1 from the missed question so the retry is neither
  // trivially easy nor punishingly hard.
  const candidates = ALL_QUESTIONS.filter(
    (q) =>
      q.id !== currentQuestion.id &&
      !answeredIds.includes(q.id) &&
      q.type === currentQuestion.type &&
      q.difficulty >= Math.max(1, currentQuestion.difficulty - 1) &&
      q.difficulty <= currentQuestion.difficulty + 1
  );

  if (candidates.length === 0) return null;

  // Priority 1: retry variants with matching misconception trap
  const designedRetryMatch = candidates.filter(
    (q) => q.usage === "retry" && q.misconceptionTrap === currentQuestion.misconceptionTrap
  );
  if (designedRetryMatch.length > 0) {
    return designedRetryMatch[Math.floor(Math.random() * designedRetryMatch.length)].id;
  }

  // Priority 2: any retry variant in the same skill
  const designedRetry = candidates.filter((q) => q.usage === "retry");
  if (designedRetry.length > 0) {
    return designedRetry[Math.floor(Math.random() * designedRetry.length)].id;
  }

  // Priority 3: same misconception trap among main questions
  const sameTrap = candidates.filter(
    (q) => q.misconceptionTrap === currentQuestion.misconceptionTrap
  );
  const pool = sameTrap.length > 0 ? sameTrap : candidates;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function deriveAdaptiveMode(state: SessionState): AdaptiveMode {
  if (state.mainQuestionCount >= state.totalQuestions) return "session_complete";
  if (state.mainQuestionCount < 4) return "starter_mix";
  if (state.queuedRetryQuestionId) return "similar_retry";

  const skills: SkillType[] = ["same_denominator", "same_numerator", "benchmark", "unlike_fractions"];
  const hasWeakSkill = skills.some((s) => needsSupport(state.skillStats[s]));
  if (hasWeakSkill) return "targeted_support";

  const hasImproving = skills.some((s) => state.skillStats[s].state === "improving");
  if (hasImproving) return "recovery";

  if (state.mainQuestionCount >= 6) return "mixed_review";
  return "monitoring";
}

export function makeStarterOrder(): SkillType[] {
  const order: SkillType[] = [
    "same_denominator",
    "same_numerator",
    "benchmark",
    "unlike_fractions",
  ];
  // Fisher-Yates shuffle
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
