import { useEffect } from "react";
import { eventBus } from "./eventBus";
import TelemetryManager from "./telemetry";
import useStore from "@/utils/store";
import { isScormEnvironment, reportScormProgress } from "./scormBridge";

/**
 * Bridges the IDE's telemetry to the SCORM 1.2 run-time so the LMS records the
 * learner's start, per-step progress/score and a bookmark — not just the final
 * completion. Renders nothing.
 *
 * No-op outside SCORM: it only subscribes when running inside the exported SCORM
 * package (detected via the `ScormProcess*` globals injected by config/api.js).
 *
 * Scope: this component handles only the CONTINUOUS signals (start, progress,
 * bookmark). Course COMPLETION deliberately stays in eventListener.tsx, where the
 * "course finished" decision already lives (`last_lesson_finished` guarded by
 * `!hasPendingTasksInAnyLesson()`, alongside confetti and the modal). Keeping it
 * there avoids duplicating that guard.
 */
export default function ScormReporter() {
  useEffect(() => {
    if (!isScormEnvironment()) return;

    // Push the live completion percentage (score), the current step (bookmark)
    // and the in-progress status to the LMS. `reportScormProgress` marks the
    // attempt "incomplete" (registering "started"), so it must run AFTER the
    // wrapper's LMSInitialize. `lesson_rendered` fires once the first lesson is
    // displayed — reliably post-init — so the attempt flips to in-progress as
    // soon as the learner is in the course; `step_completed`/`position_changed`
    // keep it fresh as they advance.
    const sync = () => {
      const rate = TelemetryManager.getCompletionRate();
      const stepIndex = Number(useStore.getState().currentExercisePosition);
      reportScormProgress(rate, stepIndex);
    };

    eventBus.on("lesson_rendered", sync);
    eventBus.on("step_completed", sync);
    eventBus.on("position_changed", sync);

    return () => {
      eventBus.off("lesson_rendered", sync);
      eventBus.off("step_completed", sync);
      eventBus.off("position_changed", sync);
    };
  }, []);

  return null;
}
