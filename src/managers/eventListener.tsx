import useStore from "@/utils/store";
import { eventBus, Events } from "./eventBus";
import { useEffect } from "react";
import TelemetryManager from "./telemetry";
import { Notifier } from "./Notifier";
import { reportScormCompletion } from "./scormBridge";


export default function EventListener() {
    const currentExercisePosition = useStore((state) => state.currentExercisePosition);
    const exercises = useStore((state) => state.exercises);
    const setOpenedModals = useStore((state) => state.setOpenedModals);
    const isLastExercise = currentExercisePosition === exercises.length - 1;
    useEffect(() => {
        const handleAssessmentCompleted = (event: Events["assessment_completed"]) => {
            console.debug("assessment_completed", event);
            if (isLastExercise) {
                // Without telemetry we cannot verify pending tasks, and client-side
                // quizzes emit assessment_completed even for anonymous learners, so
                // auto-finishing here would bypass the checks. Require telemetry.
                if (event.status === "SUCCESS" &&
                    useStore.getState().telemetryReady &&
                    !TelemetryManager.hasPendingTasks(currentExercisePosition) &&
                    !TelemetryManager.hasPendingTasksInAnyLesson()) {
                    eventBus.emit("last_lesson_finished", {});
                }
            }
        };

        const handleLastLessonFinished = () => {
            console.debug("last_lesson_finished");
            // Fail-safe backstop: never complete when telemetry is not initialized,
            // since completion (and the SCORM report) cannot be verified.
            if (!useStore.getState().telemetryReady) {
                console.debug("Completion blocked: telemetry not initialized (cannot verify)");
                return;
            }
            // Verify again if there are pending tasks in any lesson
            if (!TelemetryManager.hasPendingTasksInAnyLesson()) {
                // Mark the last step as complete if it hasn't been yet.
                // quiz_submission / case "test" handle testeable steps; this covers
                // read-only last steps that have no departure open_step event.
                const lastPos = exercises.length - 1;
                TelemetryManager.completeStepIfReadOnly(
                  lastPos,
                  useStore.getState().mode
                );
                // Push the finished state now: a read-only last step has no later
                // open_step to carry it, and the unload path never reaches Breathecode.
                void TelemetryManager.submit();
                Notifier.confetti();
                setOpenedModals({ lastLessonFinished: true });
                // If running inside a SCORM package, tell the LMS the course is
                // complete. No-op in every other environment.
                reportScormCompletion(100);
            } else {
                console.debug("Modal not opened: there are pending tasks in other lessons");
            }
        };

        eventBus.on("assessment_completed", handleAssessmentCompleted);
        eventBus.on("last_lesson_finished", handleLastLessonFinished);
        // Remove by reference: off(type) without a handler would drop every
        // listener of that type, and skipping it stacks a copy per re-run.
        return () => {
            eventBus.off("assessment_completed", handleAssessmentCompleted);
            eventBus.off("last_lesson_finished", handleLastLessonFinished);
        }
    }, [isLastExercise, currentExercisePosition, exercises, setOpenedModals]);

    return null;
}
