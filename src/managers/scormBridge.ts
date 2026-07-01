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
      const clamped = Math.max(0, Math.min(100, Math.round(scorePercent)));
      scorm.ScormProcessSetValue?.("cmi.core.score.min", "0");
      scorm.ScormProcessSetValue?.("cmi.core.score.max", "100");
      scorm.ScormProcessSetValue?.("cmi.core.score.raw", String(clamped));
    }

    scorm.ScormProcessCommit?.();
  } catch (error) {
    console.error("Error reporting completion to SCORM LMS", error);
  }
};
