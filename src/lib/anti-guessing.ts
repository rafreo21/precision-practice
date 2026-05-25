import type { SessionState, EngagementState, AnswerRecord } from "./types";
import { isFastForDifficulty } from "./timing";

// Number of recent answers to analyse for guessing signals.
// Using a rolling window avoids penalising students for early-session struggles
// that they've already corrected.
const ROLLING_WINDOW_SIZE = 8;

const FAST_WRONG_COUNT_TRIGGER = 3;
const FEEDBACK_SKIP_THRESHOLD = 3;
const FEEDBACK_SKIP_MS = 1800;

export function detectEngagementState(
  answers: AnswerRecord[],
  feedbackSkipCount: number
): EngagementState {
  // Use the rolling window for BOTH the trigger count and the pattern check so they
  // always operate on the same data set. This prevents early-session struggles from
  // permanently biasing the trigger threshold.
  const recentAnswers = answers.slice(-ROLLING_WINDOW_SIZE);

  // Count fast-wrong answers within the rolling window, scaling the threshold by
  // each question's difficulty. Falls back to difficulty-2 for answers recorded
  // before the difficulty field was added.
  const fastWrongInWindow = recentAnswers.filter(
    (a) => !a.correct && isFastForDifficulty(a.responseTimeMs, a.difficulty ?? 2)
  ).length;

  // Guessing requires ALL three signals simultaneously:
  // fast wrong answers + inconsistent skill errors + no dominant misconception
  if (fastWrongInWindow >= FAST_WRONG_COUNT_TRIGGER) {
    const recentWrong = recentAnswers.filter((a) => !a.correct);
    if (recentWrong.length >= 3) {
      const inconsistentSkills = new Set(recentWrong.map((a) => a.skillType)).size >= 2;
      const noDominantPattern = !hasRepeatedMisconception(recentWrong);
      if (inconsistentSkills && noDominantPattern) {
        return "guessing";
      }
    }
    return "rushing";
  }

  if (feedbackSkipCount >= FEEDBACK_SKIP_THRESHOLD) {
    return "feedback_skipping";
  }

  return "normal";
}

// A repeated misconception means the student has a real pattern, not random guessing
function hasRepeatedMisconception(wrongAnswers: AnswerRecord[]): boolean {
  const counts: Partial<Record<string, number>> = {};
  for (const a of wrongAnswers) {
    if (a.misconceptionDetected && a.misconceptionDetected !== "unclear") {
      counts[a.misconceptionDetected] = (counts[a.misconceptionDetected] ?? 0) + 1;
    }
  }
  return Object.values(counts).some((n) => (n ?? 0) >= 2);
}

export function isFastWrongResponse(
  responseTimeMs: number,
  wasCorrect: boolean,
  difficulty: 1 | 2 | 3 = 2
): boolean {
  return !wasCorrect && isFastForDifficulty(responseTimeMs, difficulty);
}

export function isFastResponse(responseTimeMs: number, difficulty: 1 | 2 | 3 = 2): boolean {
  return isFastForDifficulty(responseTimeMs, difficulty);
}

export function isFeedbackSkip(feedbackStartTime: number | null): boolean {
  if (feedbackStartTime === null) return false;
  return Date.now() - feedbackStartTime < FEEDBACK_SKIP_MS;
}

export function isGuessingDetected(state: SessionState): boolean {
  return state.engagementState === "guessing";
}

export const GUESSING_RESET_COPY = {
  headline: "Let's slow this one down.",
  body: "Compare the size of each fraction before choosing — there's no timer here.",
  cta: "Ready",
};
