import type { TQuizSubmission } from "../../../managers/telemetry";

export type TQuizGroup = {
  title: string;
  checkboxes: {
    text: string;
    isCorrect: boolean;
    feedback?: string;
  }[];
  correctAnswer: string;
  currentSelection: string;
};

export const makeQuizSubmission = (
  groups: TQuizGroup[],
  quizHash: string,
  started_at: number
): TQuizSubmission => {
  const correctAnswers = Object.values(groups).filter(
    (group) => group.correctAnswer === group.currentSelection
  );
  const percentage = (correctAnswers.length / groups.length) * 100;

  const selections = groups.map((group) => {
    // Find the checkbox that matches the current selection to get its feedback
    const selectedCheckbox = group.checkboxes.find(
      (cb) => cb.text === group.currentSelection
    );

    return {
      question: group.title,
      answer: group.currentSelection,
      isCorrect: group.correctAnswer === group.currentSelection,
      feedback: selectedCheckbox?.feedback,
    };
  });

  return {
    started_at,
    ended_at: Date.now(),
    status: percentage === 100 ? "SUCCESS" : "ERROR",
    percentage,
    quiz_hash: quizHash,
    selections,
  };
};

/**
 * Returns a comparable timestamp for ordering submissions (newest wins).
 * Prefer ended_at; fall back to started_at; unknown values become 0.
 */
export const getQuizSubmissionTimestampMs = (s: TQuizSubmission): number => {
  const ended =
    typeof s.ended_at === "number" && !Number.isNaN(s.ended_at)
      ? s.ended_at
      : 0;
  const started =
    typeof s.started_at === "number" && !Number.isNaN(s.started_at)
      ? s.started_at
      : 0;
  return Math.max(ended, started);
};

/**
 * Picks the most recent submission by timestamp. Does not assume array order
 * (server/reconciliation may return submissions in any order).
 */
export const getLatestQuizSubmission = (
  submissions: TQuizSubmission[]
): TQuizSubmission | null => {
  if (!submissions.length) {
    return null;
  }
  return submissions.reduce((latest, current) =>
    getQuizSubmissionTimestampMs(current) > getQuizSubmissionTimestampMs(latest)
      ? current
      : latest
  );
};

/** Stable identity string for fill-in-the-blank blocks (code + ordered numeric metadata). */
export const buildFillInTheBlankIdentityString = (
  code: string,
  metadata: Record<string, unknown>
) => {
  const numericKeys = Object.keys(metadata)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const metaPart = numericKeys
    .map((k) => `${k}=${String(metadata[k])}`)
    .join("|");
  return `fitb:${code.trim()}:${metaPart}`;
};

export const makeFillInTheBlankSubmission = (
  uniqueBlanks: string[],
  answers: Record<string, string>,
  correctAnswers: Record<string, string[]>,
  quizHash: string,
  started_at: number
): TQuizSubmission => {
  const selections = uniqueBlanks.map((blankNum) => {
    const raw = (answers[blankNum] ?? "").trim();
    const userLower = raw.toLowerCase();
    const isCorrect = Boolean(correctAnswers[blankNum]?.includes(userLower));
    return {
      question: `blank_${blankNum}`,
      answer: raw,
      isCorrect,
    };
  });
  const correctCount = selections.filter((s) => s.isCorrect).length;
  const total = uniqueBlanks.length;
  const percentage = total > 0 ? (correctCount / total) * 100 : 0;
  return {
    started_at,
    ended_at: Date.now(),
    status: percentage === 100 ? "SUCCESS" : "ERROR",
    percentage,
    quiz_hash: quizHash,
    selections,
  };
};
