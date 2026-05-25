"use client";

import { useReducer, useRef, useEffect, useState, useMemo } from "react";
import { PracticeHeader } from "./PracticeHeader";
import { IntroStage } from "./IntroStage";
import { QuestionStage } from "./QuestionStage";
import { FeedbackStage } from "./FeedbackStage";
import { SummaryStage } from "./SummaryStage";
import { sessionReducer, makeInitialState, getSessionSummary } from "@/lib/session-reducer";
import {
  saveSession,
  clearSession,
  saveHistory,
  loadSession,
  loadHistory,
  loadExposure,
  incrementExposure,
  clearAll,
} from "@/lib/persistence";
import type { SessionState, SessionHistory } from "@/lib/types";

export function PracticeShell() {
  const [state, dispatch] = useReducer(sessionReducer, undefined, makeInitialState);
  const questionStartRef = useRef<number>(Date.now());
  const [savedSession, setSavedSession] = useState<SessionState | null>(null);

  // History is loaded once when we enter the summary phase so the summary
  // computation doesn't read localStorage on every render.
  const [summaryHistory, setSummaryHistory] = useState<SessionHistory[]>([]);

  // Load any in-progress session from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) setSavedSession(saved);
  }, []);

  // Persist state on every change
  useEffect(() => {
    if (state.phase === "intro") return;
    if (state.phase === "summary") {
      saveHistory(state);
      incrementExposure(state.answeredQuestionIds);
      clearSession();
      // Load history AFTER saving so the summary can compare against prior sessions.
      // The current session is identified by sessionId and filtered out in summary.ts.
      setSummaryHistory(loadHistory());
    } else {
      saveSession(state);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Auto-advance after correct answers — no button needed
  useEffect(() => {
    if (state.phase !== "feedback" || state.wasCorrect !== true) return;
    const timer = setTimeout(() => dispatch({ type: "CONTINUE" }), 1500);
    return () => clearTimeout(timer);
  }, [state.phase, state.wasCorrect]);

  function handleStart() {
    setSavedSession(null);
    const exposureCount = loadExposure();
    questionStartRef.current = Date.now();
    dispatch({ type: "START_SESSION", payload: { exposureCount } });
  }

  function handleResume() {
    if (!savedSession) return;
    setSavedSession(null);
    questionStartRef.current = Date.now(); // Reset timing so resumed first answer isn't flagged as fast
    dispatch({ type: "RESTORE_SESSION", payload: savedSession });
  }

  function handleSelectAnswer(side: "left" | "right") {
    const responseTimeMs = Date.now() - questionStartRef.current;
    questionStartRef.current = Date.now();
    dispatch({ type: "SELECT_ANSWER", payload: { side, responseTimeMs } });
  }

  function handleContinue() {
    questionStartRef.current = Date.now();
    dispatch({ type: "CONTINUE" });
  }

  function handleReset() {
    clearSession();
    setSavedSession(null);
    dispatch({ type: "RESET_SESSION" });
  }

  function handleDemoReset() {
    clearAll();
    setSavedSession(null);
    dispatch({ type: "RESET_SESSION" });
  }

  // Memoised so we don't recompute (or read localStorage) on every render —
  // history is loaded once into summaryHistory when phase first becomes "summary".
  const summary = useMemo(
    () => getSessionSummary(state, summaryHistory),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.phase, summaryHistory]
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 flex flex-col flex-1">
        <PracticeHeader onDemoReset={state.phase !== "question" ? handleDemoReset : undefined} />

        <main className="flex-1 flex flex-col justify-center py-6">
          {state.phase === "intro" ? (
            <IntroStage
              onStart={handleStart}
              savedSession={savedSession}
              onResume={handleResume}
            />
          ) : state.phase === "question" ? (
            <QuestionStage state={state} onSelectAnswer={handleSelectAnswer} />
          ) : state.phase === "feedback" ? (
            <FeedbackStage state={state} onContinue={handleContinue} />
          ) : state.phase === "summary" && summary !== null ? (
            <SummaryStage
              summary={summary}
              totalQuestions={state.totalQuestions}
              onReset={handleReset}
            />
          ) : null}
        </main>

        <footer className="py-4 border-t border-slate-100">
          <p className="text-xs text-slate-300 text-center">
            Precision Practice · Adaptive fraction comparison
          </p>
        </footer>
      </div>
    </div>
  );
}
