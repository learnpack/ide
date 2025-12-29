import useStore from "@/utils/store";
import { eventBus } from "./eventBus";
import { useEffect } from "react";
import TelemetryManager from "./telemetry";
import { Notifier } from "./Notifier";


export default function EventListener() {
    const currentExercisePosition = useStore((state) => state.currentExercisePosition);
    const exercises = useStore((state) => state.exercises);
    const setOpenedModals = useStore((state) => state.setOpenedModals);
    const isLastExercise = currentExercisePosition === exercises.length - 1;
    useEffect(() => {
        eventBus.on("assessment_completed", (event) => {
            console.debug("assessment_completed", event);
            if (isLastExercise) {
                if (event.status === "SUCCESS" &&
                    !TelemetryManager.hasPendingTasks(currentExercisePosition) &&
                    !TelemetryManager.hasPendingTasksInAnyLesson()) {
                    eventBus.emit("last_lesson_finished", {});
                }
            }
        });

        eventBus.on("last_lesson_finished", () => {
            console.debug("last_lesson_finished");
            // Verify again if there are pending tasks in any lesson
            if (!TelemetryManager.hasPendingTasksInAnyLesson()) {
                Notifier.confetti();
                setOpenedModals({ lastLessonFinished: true });
            } else {
                console.debug("Modal not opened: there are pending tasks in other lessons");
            }
        });
        return () => {
            eventBus.off("assessment_completed");
        }
    }, [isLastExercise, currentExercisePosition, setOpenedModals]);

    return null;
}