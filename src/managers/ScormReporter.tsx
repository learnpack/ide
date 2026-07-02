import { useEffect } from "react";
import { eventBus } from "./eventBus";
import TelemetryManager from "./telemetry";
import useStore from "@/utils/store";
import {
  isScormEnvironment,
  reportScormStarted,
  reportScormProgress,
} from "./scormBridge";

/**
 * Bridges the IDE's telemetry to the SCORM 1.2 run-time so the LMS records the
 * learner's start, per-step progress/score and a bookmark — not just the final
 * completion. Renders nothing.
 *
 * No-op outside SCORM: it only subscribes when running inside the exported SCORM
 * package (detected via the `ScormProcess*` globals injected by config/api.js).
 * Course completion stays in eventListener.tsx (`last_lesson_finished`).
 */
export default function ScormReporter() {
  useEffect(() => {
    if (!isScormEnvironment()) return;

    // Register the attempt as started/in-progress as soon as the SCO mounts
    // (LMSInitialize already ran in the wrapper's onload).
    reportScormStarted();

    // Push the live completion percentage (score) and the current step
    // (bookmark) to the LMS whenever a step is completed or the learner
    // navigates between lessons.
    const sync = () => {
      const rate = TelemetryManager.getCompletionRate();
      const stepIndex = Number(useStore.getState().currentExercisePosition);
      reportScormProgress(rate, stepIndex);
    };

    eventBus.on("step_completed", sync);
    eventBus.on("position_changed", sync);

    return () => {
      eventBus.off("step_completed", sync);
      eventBus.off("position_changed", sync);
    };
  }, []);

  return null;
}
