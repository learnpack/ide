import { memo, useEffect, useRef, useState } from "react";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { AutoResizeTextarea } from "../AutoResizeTextarea/AutoResizeTextarea";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";
import SimpleButton from "../../mockups/SimpleButton";
import { eventBus } from "../../../managers/eventBus";
import { fixLesson } from "../../../managers/EventProxy";
import RealtimeNotificationListener from "../../Creator/RealtimeNotificationListener";
import { svgs } from "../../../assets/svgs";
import TelemetryManager from "../../../managers/telemetry";
import toast from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ContinueButton = () => {
  const { t } = useTranslation();
  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const editorTabs = useStore((s) => s.editorTabs);
  const agent = useStore((s) => s.agent);
  const exercises = useStore((s) => s.exercises);
  const telemetryReady = useStore((s) => s.telemetryReady);
  const token = useStore((s) => s.token);
  const setOpenedModals = useStore((s) => s.setOpenedModals);
  const [loading, setLoading] = useState(false);
  const [, setCompletionTick] = useState(0);
  const isLastExercise = currentExercisePosition === exercises.length - 1;

  const hasPendingTasks =
    typeof currentExercisePosition === "number" || typeof currentExercisePosition === "string"
      ? TelemetryManager.hasPendingTasks(Number(currentExercisePosition))
      : false;

  const hasPendingTasksInAnyLesson = TelemetryManager.hasPendingTasksInAnyLesson();

  // Without telemetry we cannot know whether there are unanswered testeable
  // elements, so completion is unverifiable → block Finish (fail-safe). Telemetry
  // only becomes ready after a successful start, which requires being logged in.
  const hasPendingWork = hasPendingTasks || hasPendingTasksInAnyLesson;
  // Anonymous learner at the end: keep the button clickable so it can open the
  // login modal (needsLogin implies !telemetryReady, since telemetry requires login).
  const needsLogin = isLastExercise && !token;
  // Logged-in learner with unfinished activities: genuinely blocked.
  const blockedByPending = isLastExercise && telemetryReady && hasPendingWork;
  // Logged in but telemetry not ready yet (transient/failed): cannot verify → block.
  const cannotVerifyLoggedIn = isLastExercise && !telemetryReady && !!token;
  // needsLogin is deliberately NOT part of isDisabled: the button stays active so
  // clicking it routes the learner to the login modal.
  const isDisabled = loading || blockedByPending || cannotVerifyLoggedIn;

  // Never leave the button state mute: explain why it is blocked / what to do.
  const finishTitle = needsLogin
    ? t("login-to-finish")
    : blockedByPending || cannotVerifyLoggedIn
    ? t("complete-activities-to-finish")
    : undefined;

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

    const handleStepCompleted = () => {
      setCompletionTick((t) => t + 1);
    };

    eventBus.on("position_changed", handlePositionChanged);
    eventBus.on("last_lesson_finished", handleLastLessonFinished);
    eventBus.on("step_completed", handleStepCompleted);

    return () => {
      eventBus.off("position_changed", handlePositionChanged);
      eventBus.off("last_lesson_finished", handleLastLessonFinished);
      eventBus.off("step_completed", handleStepCompleted);
    };
  }, []);

  if (agent === "vscode" || hasBodyLessonLoader()) return null;

  const buttonElement = (
    <div
      aria-disabled={isDisabled}
      className={`badge bg-blue  ${
        editorTabs.length > 0 ? "hide-continue-button" : "continue-button"
      }`}
      role="button"
      tabIndex={0}
      style={isDisabled ? { opacity: 0.6, cursor: "not-allowed" } : {}}
      onClick={() => {
        // Anonymous learner trying to finish: route them to the login modal
        // instead of a dead button (mirrors the quiz login prompt).
        if (needsLogin) {
          toast.error(t("login-to-finish"));
          setOpenedModals({ mustLogin: true });
          return;
        }
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
      {loading ? t("loading") : isLastExercise ? "Finish" : t("continue")}
    </div>
  );

  // Explain the button state (login needed / pending activities) via a shadcn
  // tooltip, consistent with the rest of the app (see SimpleButton).
  if (!finishTitle) return buttonElement;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
      <TooltipContent className="max-w-[200px]" side="top">
        <p className="whitespace-normal break-words">{finishTitle}</p>
      </TooltipContent>
    </Tooltip>
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

      if (katexErrors.length > 0 || errorTexts.length > 0) {
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

        if (environment !== "creatorWeb") {
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
  const markdownEditorEnabled = useStore((s) => s.markdownEditorEnabled);
  const setMarkdownEditorEnabled = useStore((s) => s.setMarkdownEditorEnabled);
  const replaceInReadme = useStore((s) => s.replaceInReadme);
  const agent = useStore((s) => s.agent);
  const environment = useStore((s) => s.environment);
  const setOpenedModals = useStore((s) => s.setOpenedModals);
  const lastState = useStore((s) => s.lastState);
  const isTesteable = useStore((s) => s.isTesteable);
  const lastTestResult = useStore((s) => s.lastTestResult);
  const isBuildable = useStore((s) => s.isBuildable);
  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const { t } = useTranslation();
  const [draftContent, setDraftContent] = useState(currentContent);
  const [isSaving, setIsSaving] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const handleSaveRef = useRef<() => void>(() => {});

  useEffect(() => {
    setDraftContent(currentContent);
    setResetKey((k) => k + 1);
  }, [currentContent]);

  const handleSave = async () => {
    setIsSaving(true);
    await replaceInReadme(
      draftContent,
      { line: 1, column: 1, offset: 0 },
      { line: 1, column: 1, offset: Number.MAX_SAFE_INTEGER }
    );
    setIsSaving(false);
    setMarkdownEditorEnabled(false);
  };

  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!markdownEditorEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [markdownEditorEnabled]);

  const handleCancel = () => {
    setDraftContent(currentContent);
    setResetKey((k) => k + 1);
    setMarkdownEditorEnabled(false);
  };

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const saveShortcut = isMac ? "⌘S" : "Ctrl+S";

  // Notify telemetry that the lesson content has rendered, so it can
  // determine (after a debounce window) whether the step is read-only.
  useEffect(() => {
    if (currentContent && currentExercisePosition != null) {
      eventBus.emit("lesson_rendered", {
        stepPosition: Number(currentExercisePosition),
      });
    }
  }, [currentContent, currentExercisePosition]);

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

      {markdownEditorEnabled ? (
        <div className="flex-y gap-small">
          <AutoResizeTextarea
            key={resetKey}
            defaultValue={currentContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="w-100"
            minHeight="400px"
          />
          <div className="flex-x gap-small justify-end padding-small">
            <SimpleButton
              action={handleCancel}
              extraClass="padding-small border-gray rounded scale-on-hover"
              svg={svgs.iconClose}
              text={t("cancel")}
            />
            <SimpleButton
              action={handleSave}
              extraClass="padding-small border-gray rounded scale-on-hover"
              svg={svgs.iconCheck}
              text={
                isSaving ? (
                  t("loading")
                ) : (
                  <>
                    {t("save")}
                    <kbd className="kbd-hint">{saveShortcut}</kbd>
                  </>
                )
              }
            />
          </div>
        </div>
      ) : (
        <Markdowner markdown={editingContent || currentContent} allowCreate={true} />
      )}

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
