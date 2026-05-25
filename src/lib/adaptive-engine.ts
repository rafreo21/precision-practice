import type { SessionState, AnswerRecord, MisconceptionType } from "./types";
import { detectMisconception } from "./misconception-detector";
import { getFeedbackContent } from "./feedback-copy";
import { recordAnswer } from "./intervention-state";
import { detectEngagementState } from "./anti-guessing";
import { getNextQuestion, findRetryQuestion, deriveAdaptiveMode } from "./adaptive-flow";

interface AnswerResult {
  wasCorrect: boolean;
  misconceptionDetected: MisconceptionType | null;
  updatedState: Partial<SessionState>;
}

export function processAnswer(
  state: SessionState,
  selectedSide: "left" | "right",
  responseTimeMs: number
): AnswerResult {
  const question = state.currentQuestion!;
  const wasCorrect = selectedSide === question.correctSide;

  let misconception: MisconceptionType | null = null;
  if (!wasCorrect) {
    misconception = detectMisconception(question, selectedSide, responseTimeMs);
  }

  // Update skill stats
  const updatedStats = {
    ...state.skillStats,
    [question.type]: recordAnswer(
      state.skillStats[question.type],
      wasCorrect,
      misconception
    ),
  };

  const newAnswers: AnswerRecord[] = [
    ...state.answers,
    {
      questionId: question.id,
      skillType: question.type,
      correct: wasCorrect,
      responseTimeMs,
      // Store difficulty so the rolling-window fast-wrong check can scale thresholds
      // per question rather than using a fixed proxy value.
      difficulty: question.difficulty,
      misconceptionDetected: misconception,
      timestamp: Date.now(),
    },
  ];

  // detectEngagementState now computes fast-wrong count directly from the rolling
  // window, so no cumulative fastResponseCount tracking is needed here.
  const newEngagementState = detectEngagementState(
    newAnswers,
    state.feedbackSkipCount
  );

  // Determine if we should queue a retry question (only after a wrong answer with a clear misconception)
  let queuedRetryId: string | null = null;
  if (
    !wasCorrect &&
    misconception &&
    misconception !== "unclear" &&
    misconception !== "guessing_or_low_engagement"
  ) {
    queuedRetryId = findRetryQuestion(question, [...state.answeredQuestionIds, question.id]);
  }

  // Build feedback content based on support level + misconception
  const currentSupportLevel = updatedStats[question.type].supportLevel;
  const feedbackContent = !wasCorrect
    ? getFeedbackContent(question, misconception ?? "unclear", currentSupportLevel)
    : null;

  return {
    wasCorrect,
    misconceptionDetected: misconception,
    updatedState: {
      answers: newAnswers,
      skillStats: updatedStats,
      engagementState: newEngagementState,
      answeredQuestionIds: [...state.answeredQuestionIds, question.id],
      queuedRetryQuestionId: queuedRetryId,
      feedbackContent,
      showGuessingReset: newEngagementState === "guessing" && !wasCorrect,
      selectedSide,
      wasCorrect,
      misconceptionDetected: misconception,
    },
  };
}

export function advanceToNextQuestion(state: SessionState): Partial<SessionState> {
  // Clear queued retry if we just used it
  const stateWithoutRetry: SessionState = {
    ...state,
    queuedRetryQuestionId:
      state.currentQuestion?.id === state.queuedRetryQuestionId
        ? null
        : state.queuedRetryQuestionId,
  };

  const nextResult = getNextQuestion(stateWithoutRetry);
  const newMode = deriveAdaptiveMode(stateWithoutRetry);

  return {
    currentQuestion: nextResult?.question ?? null,
    adaptiveMode: newMode,
    lastAdaptiveReason: nextResult?.adaptiveReason ?? null,
    currentQuestionIsRetry: nextResult?.isRetry ?? false,
    queuedRetryQuestionId: stateWithoutRetry.queuedRetryQuestionId,
    feedbackContent: null,
    selectedSide: null,
    wasCorrect: null,
    misconceptionDetected: null,
    showGuessingReset: false,
    questionStartTime: Date.now(),
  };
}
