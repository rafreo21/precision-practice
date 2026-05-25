import type { Question, MisconceptionType } from "./types";
import { isFastForDifficulty } from "./timing";

export function detectMisconception(
  question: Question,
  selectedSide: "left" | "right",
  responseTimeMs: number
): MisconceptionType {
  const isCorrect = selectedSide === question.correctSide;
  if (isCorrect) return "unclear"; // Not a misconception

  const chosen = selectedSide === "left" ? question.left : question.right;
  const correct = question.correctSide === "left" ? question.left : question.right;

  // Very fast wrong answer — likely careless (threshold scales with difficulty)
  if (isFastForDifficulty(responseTimeMs, question.difficulty)) return "careless_or_rushing";

  switch (question.type) {
    case "same_numerator": {
      // Student picks the fraction with the larger denominator → classic misconception
      if (chosen.denominator > correct.denominator) {
        return "bigger_denominator_means_bigger_fraction";
      }
      return "unclear";
    }

    case "same_denominator": {
      // Student picks the smaller numerator when denominators are equal
      // Could be careless or rushing — denominators being equal is usually obvious
      return "careless_or_rushing";
    }

    case "benchmark": {
      return "weak_benchmark_reasoning";
    }

    case "unlike_fractions": {
      // If student picks based on numerator alone
      if (chosen.numerator > correct.numerator) {
        return "numerator_only_comparison";
      }
      // If student picks based on denominator alone
      if (chosen.denominator > correct.denominator) {
        return "bigger_denominator_means_bigger_fraction";
      }
      return "weak_benchmark_reasoning";
    }

    default:
      return "unclear";
  }
}
