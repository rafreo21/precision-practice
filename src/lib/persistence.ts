import type { SessionState, SessionHistory } from "./types";

// Increment this whenever SessionState shape changes in a breaking way.
// loadSession() discards any stored session that doesn't match.
const SCHEMA_VERSION = 2;

const KEYS = {
  session: "pp_session",
  history: "pp_history",
  exposure: "pp_exposure",
} as const;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently skip
  }
}

// ── Session (in-progress) ────────────────────────────────────────────────────

export function saveSession(state: SessionState): void {
  if (state.phase === "intro" || state.phase === "summary") return;
  safeWrite(KEYS.session, { ...state, schemaVersion: SCHEMA_VERSION });
}

export function loadSession(): SessionState | null {
  const raw = safeRead<Record<string, unknown> | null>(KEYS.session, null);
  if (!raw) return null;
  // Discard sessions from an older (incompatible) schema version
  if (raw.schemaVersion !== SCHEMA_VERSION) return null;
  const s = raw as unknown as SessionState;
  if (s.phase === "summary" || s.phase === "intro") return null;
  // Validate required fields — guards against partial/corrupt writes
  if (typeof s.mainQuestionCount !== "number") return null;
  if (!s.starterOrder || !Array.isArray(s.starterOrder)) return null;
  if (!s.exposureCount || typeof s.exposureCount !== "object" || Array.isArray(s.exposureCount)) return null;
  if (!s.sessionId || typeof s.sessionId !== "string") return null;
  return s;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEYS.session);
  } catch {
    // ignore
  }
}

// ── History (completed sessions) ─────────────────────────────────────────────

export function saveHistory(state: SessionState): void {
  // Don't save zero-question sessions — they produce misleading history entries
  // (e.g. student opens the app, immediately exits without answering anything).
  if (state.mainQuestionCount === 0) return;
  const existing = loadHistory();
  const entry: SessionHistory = {
    sessionId: state.sessionId,
    completedAt: Date.now(),
    questionsCompleted: state.answers.length,
    skillBreakdowns: (["same_denominator", "same_numerator", "benchmark", "unlike_fractions"] as const).map(
      (skill) => ({
        skill,
        correct: state.skillStats[skill].correct,
        total: state.skillStats[skill].attempts,
      })
    ),
  };
  // Keep last 10 sessions
  const updated = [entry, ...existing].slice(0, 10);
  safeWrite(KEYS.history, updated);
}

export function loadHistory(): SessionHistory[] {
  return safeRead<SessionHistory[]>(KEYS.history, []);
}

// ── Exposure (cross-session question counts) ──────────────────────────────────

export function loadExposure(): Record<string, number> {
  return safeRead<Record<string, number>>(KEYS.exposure, {});
}

export function saveExposure(exposure: Record<string, number>): void {
  safeWrite(KEYS.exposure, exposure);
}

export function incrementExposure(questionIds: string[]): void {
  const existing = loadExposure();
  for (const id of questionIds) {
    existing[id] = (existing[id] ?? 0) + 1;
  }
  safeWrite(KEYS.exposure, existing);
}

export function clearAll(): void {
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
