import type { FeedbackContent, MisconceptionType, SupportLevel, Question } from "./types";

export function getFeedbackContent(
  question: Question,
  misconception: MisconceptionType,
  supportLevel: SupportLevel
): FeedbackContent {
  const base = getMisconceptionBase(question, misconception, supportLevel);
  return base;
}

interface FeedbackBase {
  headline: string;
  body: string;
  strategyLabel: string;
  visualType: "fraction_bars" | "number_line" | "none";
  supportLevel: SupportLevel;
  guidedSteps?: string[];
}

function getMisconceptionBase(
  question: Question,
  misconception: MisconceptionType,
  supportLevel: SupportLevel
): FeedbackBase {
  // Level 0 — first wrong answer, no established pattern yet
  // Keep it brief and non-alarming. No visual.
  if (supportLevel === 0) {
    return {
      headline: "Let's try that differently.",
      body: getFirstMissBody(misconception, question),
      strategyLabel: question.strategy,
      visualType: "none",
      supportLevel: 0,
    };
  }

  // Level 1+ — pattern detected, show coaching + visual
  switch (misconception) {
    case "bigger_denominator_means_bigger_fraction":
      return {
        headline:
          supportLevel === 1
            ? "Let's compare this another way."
            : "I noticed a pattern. Let's try a different strategy.",
        body: "When fractions share the same numerator, a larger denominator means smaller pieces — the whole is divided into more parts, so each piece is smaller.",
        strategyLabel: "Larger denominator → smaller pieces",
        visualType: "fraction_bars",
        supportLevel,
        guidedSteps:
          supportLevel >= 3
            ? [
                "Do both fractions have the same numerator?",
                "Which denominator is larger?",
                "More divisions means smaller pieces. Which has the smaller denominator?",
              ]
            : undefined,
      };

    case "numerator_only_comparison":
      return {
        headline:
          supportLevel === 1
            ? "Let's compare this another way."
            : "I noticed a pattern. Let's try a different strategy.",
        body: "Comparing numerators only works when denominators match. With different denominators, a larger numerator doesn't always mean a larger fraction.",
        strategyLabel: "Find a common denominator, then compare",
        visualType: "fraction_bars",
        supportLevel,
        guidedSteps:
          supportLevel >= 3
            ? [
                "Check: do the denominators match?",
                "If not, convert both to the same denominator.",
                "Now compare the numerators.",
              ]
            : undefined,
      };

    case "weak_benchmark_reasoning":
      return {
        headline:
          supportLevel === 1
            ? "Let's compare this another way."
            : "I noticed a pattern. Let's try a different strategy.",
        body: "A useful anchor: check whether each fraction is above or below 1/2. A fraction above 1/2 is always larger than one below it.",
        strategyLabel: "Is it above or below 1/2?",
        visualType: "number_line",
        supportLevel,
        guidedSteps:
          supportLevel >= 3
            ? [
                `Is ${getFractionStr(question.left)} above or below 1/2?`,
                `Is ${getFractionStr(question.right)} above or below 1/2?`,
                "A fraction above 1/2 beats one below it.",
              ]
            : undefined,
      };

    case "careless_or_rushing":
      return {
        headline: "Take another look.",
        body: "These share the same denominator — just compare which numerator is larger.",
        strategyLabel: "Same denominator? Compare numerators.",
        visualType: "none",
        supportLevel,
      };

    default:
      return {
        headline: "Let's compare this another way.",
        body: "Work through it step by step — check the denominators first, then the numerators.",
        strategyLabel: "Step by step",
        visualType: question.type === "benchmark" ? "number_line" : "fraction_bars",
        supportLevel,
      };
  }
}

function getFirstMissBody(misconception: MisconceptionType, question: Question): string {
  switch (misconception) {
    case "bigger_denominator_means_bigger_fraction":
      return "Check the denominators again — when numerators match, a bigger denominator means smaller pieces.";
    case "numerator_only_comparison":
      return "The numerators alone aren't enough here — the denominators change the piece size too.";
    case "weak_benchmark_reasoning":
      return "Try checking whether each fraction is above or below 1/2.";
    case "careless_or_rushing":
      return "These share the same denominator — compare the numerators.";
    default:
      return question.explanation;
  }
}

function getFractionStr(f: { numerator: number; denominator: number }): string {
  return `${f.numerator}/${f.denominator}`;
}
