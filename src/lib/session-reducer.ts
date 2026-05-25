import type { SessionState, SessionAction, SessionHistory } from "./types";
import { makeInitialSkillStats } from "./intervention-state";
import { processAnswer, advanceToNextQuestion } from "./adaptive-engine";
import { getNextQuestion, deriveAdaptiveMode, makeStarterOrder } from "./adaptive-flow";
import { calculateSessionSummary } from "./summary";

// Total main questions per session. Retry/scaffold questions don't count toward this.
const SESSION_MAIN_QUESTION_TARGET = 12;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeInitialState(): SessionState {
  return {
    phase: "intro",
    sessionId: generateSessionId(),
    questionIndex: 0,
    mainQuestionCount: 0,
    currentQuestionIsRetry: false,
    totalQuestions: SESSION_MAIN_QUESTION_TARGET,
    currentQuestion: null,
    answers: [],
    skillStats: makeInitialSkillStats(),
    adaptiveMode: "starter_mix",
    lastAdaptiveReason: null,
    queuedRetryQuestionId: null,
    engagementState: "normal",
    fastResponseCount: 0,
    feedbackSkipCount: 0,
    questionStartTime: null,
    feedbackStartTime: null,
    answeredQuestionIds: [],
    starterOrder: makeStarterOrder(),
    exposureCount: {},
    selectedSide: null,
    wasCorrect: null,
    misconceptionDetected: null,
    feedbackContent: null,
    showGuessingReset: false,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START_SESSION": {
      const fresh = makeInitialState();
      const withExposure: SessionState = {
        ...fresh,
        exposureCount: action.payload?.exposureCount ?? {},
      };
      const firstResult = getNextQuestion(withExposure);
      if (!firstResult) return { ...withExposure, phase: "summary" };

      return {
        ...withExposure,
        phase: "question",
        currentQuestion: firstResult.question,
        currentQuestionIsRetry: firstResult.isRetry,
        adaptiveMode: deriveAdaptiveMode(withExposure),
        questionStartTime: Date.now(),
      };
    }

    case "SELECT_ANSWER": {
      if (!state.currentQuestion || state.phase !== "question") return state;

      const { side, responseTimeMs } = action.payload;
      const result = processAnswer(state, side, responseTimeMs);

      const newMainCount = state.currentQuestionIsRetry
        ? state.mainQuestionCount
        : state.mainQuestionCount + 1;

      if (result.wasCorrect) {
        const isSessionDone = newMainCount >= SESSION_MAIN_QUESTION_TARGET;
        if (isSessionDone) {
          return {
            ...state,
            ...result.updatedState,
            phase: "summary",
            questionIndex: state.questionIndex + 1,
            mainQuestionCount: newMainCount,
          };
        }
        return {
          ...state,
          ...result.updatedState,
          phase: "feedback",
          questionIndex: state.questionIndex + 1,
          mainQuestionCount: newMainCount,
          feedbackStartTime: Date.now(),
        };
      }

      return {
        ...state,
        ...result.updatedState,
        phase: "feedback",
        questionIndex: state.questionIndex + 1,
        mainQuestionCount: newMainCount,
        feedbackStartTime: Date.now(),
      };
    }

    case "CONTINUE": {
      if (state.phase !== "feedback") return state;

      // Count feedback skips on wrong answers (engagement signal)
      const skipped =
        state.wasCorrect === false &&
        state.feedbackStartTime !== null &&
        Date.now() - state.feedbackStartTime < 1800;
      const newFeedbackSkipCount = skipped
        ? state.feedbackSkipCount + 1
        : state.feedbackSkipCount;

      const isSessionDone = state.mainQuestionCount >= SESSION_MAIN_QUESTION_TARGET;
      if (isSessionDone) {
        return { ...state, phase: "summary", feedbackSkipCount: newFeedbackSkipCount };
      }

      const advances = advanceToNextQuestion({
        ...state,
        feedbackSkipCount: newFeedbackSkipCount,
      });

      // Guard: if the question bank is exhausted, transition to summary rather than
      // rendering a blank question screen.
      if (advances.currentQuestion === null) {
        return { ...state, feedbackSkipCount: newFeedbackSkipCount, phase: "summary" };
      }

      return {
        ...state,
        ...advances,
        feedbackSkipCount: newFeedbackSkipCount,
        phase: "question",
      };
    }

    case "RESTORE_SESSION": {
      return action.payload;
    }

    case "RESET_SESSION": {
      return makeInitialState();
    }

    default:
      return state;
  }
}

/**
 * Compute the session summary from state + the loaded history array.
 * Pass history as a parameter so localStorage is NOT read during render —
 * caller is responsible for loading and memoising the history.
 */
export function getSessionSummary(state: SessionState, history: SessionHistory[]) {
  if (state.phase !== "summary") return null;
  return calculateSessionSummary(state, history);
}
