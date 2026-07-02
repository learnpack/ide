/**
 * Bridge between the LearnPack IDE and the SCORM 1.2 run-time wrapper.
 *
 * When the course is exported to SCORM (learnpack-cli export), the IDE bundle
 * (`app.js`) is loaded inside `config/index.html`, which also loads `api.js`.
 * `api.js` defines the `ScormProcess*` helpers as globals on `window`, so the
 * IDE can talk to the LMS by calling them directly on the same document.
 *
 * SCORM 1.2 specifics honored here (per the ADL SCORM 1.2 CMI data model):
 * - `cmi.core.lesson_status` is a SINGLE field that conflates completion and
 *   pass/fail. Valid tokens: "passed" | "completed" | "failed" | "incomplete" |
 *   "browsed" | "not attempted". LearnPack has no formal mastery threshold, so
 *   we report "completed".
 * - `cmi.core.score.raw/min/max` are CMIDecimal. We report a 0-100 percentage.
 * - We never touch `cmi.suspend_data` (capped at 4096 chars in 1.2).
 * - `LMSCommit` (ScormProcessCommit) is called so progress persists even if the
 *   learner closes the tab abruptly.
 *
 * In every non-SCORM environment these globals do not exist, so all functions
 * here are safe no-ops.
 */

type ScormWrapper = {
  ScormProcessSetValue?: (element: string, value: string) => void;
  ScormProcessGetValue?: (element: string) => string | undefined;
  ScormProcessCommit?: () => void;
};

const getScormWrapper = (): ScormWrapper | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as ScormWrapper;
  // Presence of the wrapper globals is the definitive signal that we are running
  // inside the SCORM package (they are injected by config/api.js).
  if (typeof w.ScormProcessSetValue !== "function") return null;
  return w;
};

export const isScormEnvironment = (): boolean => getScormWrapper() !== null;

// Writes cmi.core.score.raw/min/max (0-100 CMIDecimal). Shared by progress and
// completion reporting.
const setScore = (scorm: ScormWrapper, percent: number): void => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  scorm.ScormProcessSetValue?.("cmi.core.score.min", "0");
  scorm.ScormProcessSetValue?.("cmi.core.score.max", "100");
  scorm.ScormProcessSetValue?.("cmi.core.score.raw", String(clamped));
};

/**
 * Marks the course as started/in-progress in the LMS.
 *
 * Sets `cmi.core.lesson_status = "incomplete"` and commits, so the LMS records
 * the attempt as soon as the learner opens the course. Does NOT downgrade a
 * returning learner who already finished (guards against "completed"/"passed").
 */
export const reportScormStarted = (): void => {
  const scorm = getScormWrapper();
  if (!scorm) return;

  try {
    const status = scorm.ScormProcessGetValue?.("cmi.core.lesson_status");
    if (status === "completed" || status === "passed") return;

    scorm.ScormProcessSetValue?.("cmi.core.lesson_status", "incomplete");
    scorm.ScormProcessCommit?.();
  } catch (error) {
    console.error("Error reporting start to SCORM LMS", error);
  }
};

/**
 * Reports incremental progress to the LMS during the course.
 *
 * @param percent   0-100 completion percentage → `cmi.core.score.raw`.
 * @param stepIndex Optional current step index → `cmi.core.lesson_location`
 *                  (bookmark). When omitted, only the score is written.
 *
 * Intentionally does NOT touch `cmi.core.lesson_status` (it stays "incomplete"
 * until `reportScormCompletion` marks it "completed"), so progress reporting can
 * never overwrite the completion state.
 */
export const reportScormProgress = (
  percent: number,
  stepIndex?: number
): void => {
  const scorm = getScormWrapper();
  if (!scorm) return;

  try {
    if (typeof percent === "number" && Number.isFinite(percent)) {
      setScore(scorm, percent);
    }
    if (typeof stepIndex === "number" && Number.isFinite(stepIndex)) {
      scorm.ScormProcessSetValue?.(
        "cmi.core.lesson_location",
        String(stepIndex)
      );
    }
    scorm.ScormProcessCommit?.();
  } catch (error) {
    console.error("Error reporting progress to SCORM LMS", error);
  }
};

/**
 * Reports course completion to the LMS.
 *
 * @param scorePercent Optional 0-100 completion/score percentage. When omitted
 *                     only `lesson_status` is reported.
 */
export const reportScormCompletion = (scorePercent?: number): void => {
  const scorm = getScormWrapper();
  if (!scorm) return;

  try {
    scorm.ScormProcessSetValue?.("cmi.core.lesson_status", "completed");

    if (typeof scorePercent === "number" && Number.isFinite(scorePercent)) {
      setScore(scorm, scorePercent);
    }

    scorm.ScormProcessCommit?.();
  } catch (error) {
    console.error("Error reporting completion to SCORM LMS", error);
  }
};
