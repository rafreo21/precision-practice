/**
 * Shared difficulty-aware response-time thresholds.
 *
 * These are heuristic values tuned for the question types in this prototype.
 * They have NOT been validated against formal learning-science benchmarks.
 *
 * Difficulty 1 (easy):  student can answer quickly once they know the rule
 * Difficulty 2 (medium): needs a moment to apply the strategy
 * Difficulty 3 (hard):  cross-multiplication or close-call benchmarking takes real time
 */
export const FAST_RESPONSE_BY_DIFFICULTY: Record<1 | 2 | 3, number> = {
  1: 900,
  2: 1400,
  3: 2200,
};

/**
 * Returns true if the student answered faster than expected for this difficulty level.
 * Used to detect rushing / guessing behaviour.
 */
export function isFastForDifficulty(responseTimeMs: number, difficulty: 1 | 2 | 3): boolean {
  return responseTimeMs < FAST_RESPONSE_BY_DIFFICULTY[difficulty];
}
