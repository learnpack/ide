import { memo, useEffect, useRef, useState } from "react";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";
import SimpleButton from "../../mockups/SimpleButton";
import { eventBus } from "../../../managers/eventBus";
import { fixLesson } from "../../../managers/EventProxy";
import RealtimeNotificationListener from "../../Creator/RealtimeNotificationListener";
import { svgs } from "../../../assets/svgs";
import TelemetryManager from "../../../managers/telemetry";

const ContinueButton = () => {
  const { t } = useTranslation();
  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const editorTabs = useStore((s) => s.editorTabs);
  const agent = useStore((s) => s.agent);
  const exercises = useStore((s) => s.exercises);
  const [loading, setLoading] = useState(false);
  const isLastExercise = currentExercisePosition === exercises.length - 1;

  // Check if the current step still has pending tasks (tests/quizzes not completed)
  const hasPendingTasks =
    typeof currentExercisePosition === "number" || typeof currentExercisePosition === "string"
      ? TelemetryManager.hasPendingTasks(Number(currentExercisePosition))
      : false;

  // Check if there are pending tasks in any lesson
  const hasPendingTasksInAnyLesson = TelemetryManager.hasPendingTasksInAnyLesson();

  const isFinishDisabled = isLastExercise && (hasPendingTasks || hasPendingTasksInAnyLesson);
  const isDisabled = loading || isFinishDisabled;

  const hasBodyLessonLoader = () => {
    const selector = ".lesson-loader";
    const element = document.querySelector(selector);
    return element !== null;
  };

  useEffect(() => {
    const handlePositionChanged = () => {
      setLoading(false);
    };
    
    const handleLastLessonFinished = () => {
      setLoading(false);
    };

    eventBus.on("position_changed", handlePositionChanged);
    eventBus.on("last_lesson_finished", handleLastLessonFinished);

    return () => {
      eventBus.off("position_changed", handlePositionChanged);
      eventBus.off("last_lesson_finished", handleLastLessonFinished);
    };
  }, []);

  return (
    agent !== "vscode" &&
    !hasBodyLessonLoader() && (
      <div
        aria-disabled={isDisabled}
        className={`badge bg-blue  ${
          editorTabs.length > 0 ? "hide-continue-button" : "continue-button"
        }`}
        role="button"
        tabIndex={0}
        style={isDisabled ? { opacity: 0.6, cursor: "not-allowed" } : {}}
        onClick={() => {
          if (isDisabled) return;
          setLoading(true);
          if (isLastExercise) {
            // If there are no pending tasks in any lesson, finish the lesson
            if (!hasPendingTasksInAnyLesson) {
              eventBus.emit("last_lesson_finished", {});
            } else {
              console.debug("Cannot finish: there are pending tasks in other lessons");
              setLoading(false);
            }
          } else {
            eventBus.emit("position_change", {
              position: Number(currentExercisePosition) + 1,
            });
          }
        }}
      >
        {loading
          ? t("loading")
          : isLastExercise
          ? "Finish"
          : t("continue")}
      </div>
    )
  );
};

const LessonInspector = () => {
  const currentContent = useStore((s) => s.currentContent);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const token = useStore((s) => s.token);
  const environment = useStore((s) => s.environment);
  const language = useStore((s) => s.language);
  const getCurrentExercise = useStore((s) => s.getCurrentExercise);
  const fetchReadme = useStore((s) => s.fetchReadme);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    intervalRef.current = setTimeout(async () => {
      const katexErrors = document.querySelectorAll("span.katex-error");
      const errorTexts = document.querySelectorAll("text.error-text");
      const taskListItems = document.querySelectorAll("li.task-list-item");

      if (katexErrors.length > 0 || errorTexts.length > 0 || taskListItems.length > 0) {
        let foundErrors = "There are\n";
        
        if (katexErrors.length > 0) {
          foundErrors += `<KATEX_ERRORS> ${katexErrors.length} katex errors:\n`;
          katexErrors.forEach((error) => {
            foundErrors += `  - ${error.getAttribute("title") || ""}\n`;
          });
          foundErrors += `</KATEX_ERRORS>\n`;
        }

        if (errorTexts.length > 0) {
          foundErrors += `<MERMAID_ERRORS> ${errorTexts.length} error texts related to mermaid diagrams:\n`;
          errorTexts.forEach((error) => {
            foundErrors += `  - ${error.textContent || ""}\n`;
          });
          foundErrors += `</MERMAID_ERRORS>\n`;
        }
        
        if (taskListItems.length > 0) {
          foundErrors += `<TASK_LIST_ITEMS> ${taskListItems.length} task list items that are not properly formatted as quizzes:\n`;
          taskListItems.forEach((item) => {
            foundErrors += `  - ${item.textContent || ""}\n`;
          });
          foundErrors += `</TASK_LIST_ITEMS>\n`;
        }


        if (environment !== "creatorWeb") {
          console.log("not creator web, skipping fix lesson");
          return;
        }

        const currentExercise = getCurrentExercise();

        const inputs = {
          lesson_content: currentContent,
          found_errors: foundErrors,
        };
        const { notificationId } = await fixLesson(
          token,
          inputs,
          currentExercise.slug,
          language
        );
        if (notificationId) {
          setNotificationId(notificationId);
        }
      }
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [currentContent]);

  return (
    <>
      {notificationId && (
        <RealtimeNotificationListener
          onNotification={() => {
            fetchReadme();
          }}
          notificationId={notificationId}
        />
      )}
    </>
  );
};

export const LessonRenderer = memo(() => {
  const currentContent = useStore((s) => s.currentContent);
  const editingContent = useStore((s) => s.editingContent);
  const agent = useStore((s) => s.agent);
  const environment = useStore((s) => s.environment);
  const setOpenedModals = useStore((s) => s.setOpenedModals);
  const lastState = useStore((s) => s.lastState);
  const isTesteable = useStore((s) => s.isTesteable);
  const lastTestResult = useStore((s) => s.lastTestResult);
  const isBuildable = useStore((s) => s.isBuildable);

  console.log("Rendering LessonRenderer", {
    currentContent,
    editingContent,
    agent,
    environment,
    lastState,
  });

  const onReset = () => {
    setOpenedModals({ reset: true });
  };

  const onlyContinue = !isBuildable && !isTesteable;
  const toolbarStateClass = 
    lastTestResult?.status === "failed"
      ? "error"  // Tests failed - keep toolbar red even if compilation succeeds
      : lastTestResult?.status === "successful" && lastState === "success"
      ? "success"  // Tests passed - toolbar green
      : lastState === "error"
      ? "error"  // Compilation error (no test result yet)
      : "";  // Normal state
  return (
    <div className="lesson-content">
      <LessonInspector />
      <AddVideoButton />

      <Markdowner markdown={editingContent || currentContent} allowCreate={true} />

      {/* <TestLatex /> */}
      <ContinueButton />

      {environment === "localhost" && agent === "vscode" && (
        <Toolbar editorStatus="MODIFIED" position="sticky" onReset={onReset} toolbarStateClass={toolbarStateClass} onlyContinue={onlyContinue} />
      )}
    </div>
  );
});

const AddVideoButton = () => {
  const mode = useStore((s) => s.mode);
  const videoTutorial = useStore((s) => s.videoTutorial);
  const setOpenedModals = useStore((s) => s.setOpenedModals);
  const syllabus = useStore((s) => s.syllabus);
  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const { t } = useTranslation();

  const lesson = syllabus.lessons
    ? syllabus.lessons[Number(currentExercisePosition)]
    : null;

  if (lesson && !lesson.generated) {
    return null;
  }

  if (mode !== "creator") {
    return null;
  }

  return (
    <div className="flex-x align-center justify-end gap-small padding-small">
      <SimpleButton
        text={t("add-video-tutorial")}
        svg={
          !videoTutorial ? (
            <div className="d-flex align-center">{svgs.video}</div>
          ) : (
            svgs.plusSimple
          )
        }
        extraClass="svg-blue border-blue padding-small rounded"
        action={async () => {
          setOpenedModals({
            addVideoTutorial: true,
          });
        }}
      />
    </div>
  );
};
