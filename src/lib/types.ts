export type SkillType =
  | "same_denominator"
  | "same_numerator"
  | "benchmark"
  | "unlike_fractions";

export type MisconceptionType =
  | "bigger_denominator_means_bigger_fraction"
  | "numerator_only_comparison"
  | "weak_benchmark_reasoning"
  | "equivalent_fraction_weakness"
  | "careless_or_rushing"
  | "guessing_or_low_engagement"
  | "unclear";

export type SupportLevel = 0 | 1 | 2 | 3;

export type SkillState =
  | "neutral"
  | "monitoring"
  | "needs_support"
  | "guided_practice"
  | "improving"
  | "mixed_review"
  | "mastered_for_session";

export type EngagementState =
  | "normal"
  | "rushing"
  | "guessing"
  | "feedback_skipping"
  | "uncertain";

export type AdaptiveMode =
  | "starter_mix"
  | "monitoring"
  | "targeted_support"
  | "similar_retry"
  | "recovery"
  | "mixed_review"
  | "session_complete";

export type SessionPhase = "intro" | "question" | "feedback" | "summary";

export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface Question {
  id: string;
  type: SkillType;
  left: Fraction;
  right: Fraction;
  correctSide: "left" | "right";
  difficulty: 1 | 2 | 3;
  strategy: string;
  misconceptionTrap: MisconceptionType;
  explanation: string;
  /** Controls which selection pool this question belongs to. Defaults to "main" if omitted. */
  usage?: "main" | "retry" | "scaffold";
}

export interface SessionHistory {
  sessionId: string;
  completedAt: number;
  questionsCompleted: number;
  skillBreakdowns: Array<{
    skill: SkillType;
    correct: number;
    total: number;
  }>;
}

export interface CrossSessionComparison {
  skill: SkillType;
  label: string;
  thisSession: { correct: number; total: number };
  lastSession: { correct: number; total: number } | null;
  improved: boolean;
}

export interface SkillStats {
  type: SkillType;
  state: SkillState;
  supportLevel: SupportLevel;
  attempts: number;
  correct: number;
  recentAnswers: boolean[]; // last 4, oldest first
  misconceptionCounts: Partial<Record<MisconceptionType, number>>;
}

export interface AnswerRecord {
  questionId: string;
  skillType: SkillType;
  correct: boolean;
  responseTimeMs: number;
  /** Difficulty of the question answered — used for rolling fast-wrong detection.
   *  Optional for backward compatibility with sessions saved before this field existed. */
  difficulty?: 1 | 2 | 3;
  misconceptionDetected: MisconceptionType | null;
  timestamp: number;
}

export interface FeedbackContent {
  headline: string;
  body: string;
  visualType: "fraction_bars" | "number_line" | "none";
  supportLevel: SupportLevel;
  guidedSteps?: string[];
  strategyLabel: string;
}

export interface SessionSummary {
  questionsCompleted: number;
  /** Total answer attempts including adaptive practice repeats (answers.length). */
  totalAttempts: number;
  strongestImprovement: string;
  improvedSkill: SkillType | null;
  concreteMetric: string;
  nextFocus: string;
  hasHistory: boolean;
  crossSessionComparisons: CrossSessionComparison[];
  skillBreakdowns: Array<{
    skill: SkillType;
    label: string;
    correct: number;
    total: number;
    recentCorrect: number;
    recentTotal: number;
  }>;
}

export interface SessionState {
  phase: SessionPhase;
  sessionId: string;
  questionIndex: number;
  mainQuestionCount: number;
  currentQuestionIsRetry: boolean;
  totalQuestions: number;
  currentQuestion: Question | null;
  answers: AnswerRecord[];
  skillStats: Record<SkillType, SkillStats>;
  adaptiveMode: AdaptiveMode;
  lastAdaptiveReason: string | null;
  queuedRetryQuestionId: string | null;
  engagementState: EngagementState;
  fastResponseCount: number;
  feedbackSkipCount: number;
  questionStartTime: number | null;
  feedbackStartTime: number | null;
  answeredQuestionIds: string[];
  starterOrder: SkillType[];
  exposureCount: Record<string, number>;
  // Feedback state (only populated in "feedback" phase)
  selectedSide: "left" | "right" | null;
  wasCorrect: boolean | null;
  misconceptionDetected: MisconceptionType | null;
  feedbackContent: FeedbackContent | null;
  showGuessingReset: boolean;
}

export type SessionAction =
  | { type: "START_SESSION"; payload?: { exposureCount: Record<string, number> } }
  | { type: "SELECT_ANSWER"; payload: { side: "left" | "right"; responseTimeMs: number } }
  | { type: "CONTINUE" }
  | { type: "RESET_SESSION" }
  | { type: "RESTORE_SESSION"; payload: SessionState };
