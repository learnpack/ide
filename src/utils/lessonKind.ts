/**
 * Tells what a lesson tests the student on, from data available before the
 * lesson is opened: its file list (in the config) and its README text. The
 * sidebar uses it to show whether each lesson is a reading, has questions or
 * is a code challenge.
 */

export type TLessonKind = "reading" | "questions" | "code";

type TLessonFile = {
  name: string;
  hidden?: boolean;
};

type TCodeChallengeInfo = {
  graded?: boolean;
  entry?: string | null;
  language?: string | null;
  files?: TLessonFile[];
};

/**
 * Files the student works on: visible files that are not documentation or
 * images. A markdown file only counts when it has its own solution file
 * (regex-comments.md + regex-comments.solution.hide.md).
 */
export const getInteractiveFiles = <T extends TLessonFile>(files: T[]): T[] =>
  files
    .filter((file) => !file.hidden)
    .filter((file) => {
      const fileName = file.name.toLowerCase();
      // Excluir README y otros archivos de documentación
      if (fileName.includes("readme")) return false;
      if (fileName.includes("pycache")) return false;
      // Excluir archivos markdown, salvo que sean el ejercicio mismo: un .md
      // con su propia solución (regex-comments.md + regex-comments.solution.hide.md)
      if (fileName.endsWith(".md")) {
        const solutionName = fileName.replace(/\.md$/, ".solution.hide.md");
        return files.some((f) => f.name.toLowerCase() === solutionName);
      }
      // Excluir imágenes (no son código ejecutable)
      if (
        fileName.endsWith(".png") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".gif") ||
        fileName.endsWith(".svg") ||
        fileName.endsWith(".webp")
      ) return false;
      return true;
    });

/**
 * Exercises without entry or language have files the CLI cannot compile, so
 * they are compiled and tested in the cloud.
 */
export const needsCloudCompiler = (exercise: TCodeChallengeInfo): boolean =>
  !exercise.entry &&
  !exercise.language &&
  getInteractiveFiles(exercise.files || []).length > 0;

/** Same rule fetchSingleExerciseInfo uses to make an exercise testeable */
export const isCodeChallenge = (exercise: TCodeChallengeInfo): boolean =>
  Boolean(exercise.graded) || needsCloudCompiler(exercise);

// Code blocks rendered as a quiz (CustomCodeBlock in Markdowner.tsx)
const QUIZ_BLOCKS = new Set([
  "fill_in_the_blank",
  "fill",
  "select_the_blank",
  "select",
  "ordering",
  "order",
]);
const FENCE = /^\s*(`{3,}|~{3,})(.*)$/;
// A checkbox list nested in a list item, which checkForQuiz renders as a quiz
const NESTED_CHECKBOX = /^(?: {2,}|\t)(?:[-*+]|\d+[.)])\s+\[[ xX]\]\s/;

// The open question registers only when eval is set (OpenQuestion.tsx). Reads
// the meta like extractMetadata: key="value" pairs, "false" means false.
const hasEval = (meta: string): boolean => {
  let value: string | undefined;
  for (const match of meta.matchAll(/(\w+)="([^"]*)"/g)) {
    if (match[1] === "eval") value = match[2];
  }
  return value !== undefined && value !== "" && value.toLowerCase() !== "false";
};

/**
 * Whether the README has a question the lesson registers as a quiz: a
 * checkbox quiz, an open question with eval, or a fill, select or ordering
 * block.
 */
export const hasQuestions = (markdown: string): boolean => {
  // The fence of the code block the line is in, if any. Only a fence of the
  // same character, at least as long and with nothing after it, closes it.
  let openFence: string | null = null;
  for (const line of markdown.split(/\r?\n/)) {
    const fence = line.match(FENCE);
    if (openFence) {
      if (
        fence &&
        fence[1][0] === openFence[0] &&
        fence[1].length >= openFence.length &&
        fence[2].trim() === ""
      ) {
        openFence = null;
      }
      continue;
    }
    if (fence) {
      const [info = "", ...meta] = fence[2].trim().split(/\s+/);
      // Markdowner reads the language as className.split("-")[1]
      const language = info.split("-")[0];
      if (QUIZ_BLOCKS.has(language)) return true;
      if (language === "question" && hasEval(meta.join(" "))) return true;
      openFence = fence[1];
      continue;
    }
    if (NESTED_CHECKBOX.test(line)) return true;
  }
  return false;
};

type TLessonKindInfo = {
  codeChallenge: boolean;
  /** Whether the README has questions; undefined while it is unknown (not loaded yet, or it failed) */
  questions: boolean | undefined;
  /** Whether the student's telemetry already registered questions for the lesson */
  registeredQuiz: boolean;
  done: boolean;
};

/**
 * A code challenge never has questions, so it only gets the code kind. While
 * the README is unknown, the questions in the student's telemetry are used
 * instead: a finished lesson already registered its questions, so one without
 * them is a reading. Returns null when the kind can't be told yet.
 */
export const getLessonKind = ({
  codeChallenge,
  questions,
  registeredQuiz,
  done,
}: TLessonKindInfo): TLessonKind | null => {
  if (codeChallenge) return "code";
  if (questions !== undefined) return questions ? "questions" : "reading";
  if (registeredQuiz) return "questions";
  if (done) return "reading";
  return null;
};
