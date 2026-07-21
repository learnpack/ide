import { memo, useEffect, useRef, useState } from "react";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { AutoResizeTextarea } from "../AutoResizeTextarea/AutoResizeTextarea";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";
import SimpleButton from "../../mockups/SimpleButton";
import { Modal } from "../../mockups/Modal";
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
  const markdownDraftDirty = useStore((s) => s.markdownDraftDirty);
  const setMarkdownDraftDirty = useStore((s) => s.setMarkdownDraftDirty);
  const pendingDiscard = useStore((s) => s.pendingDiscard);
  const resolveMarkdownDraftDiscard = useStore((s) => s.resolveMarkdownDraftDiscard);
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
  // Guards against concurrent saves. A ref rather than the isSaving state
  // because two clicks (or Ctrl+S repeats) landing in the same render pass
  // would both read a stale `false` from state.
  const isSavingRef = useRef(false);

  // Follow the saved lesson only while there is nothing unsaved to lose.
  // currentContent also moves on optimistic saves, failed-save rollbacks,
  // undo/redo and background syncs; re-seeding then would wipe the buffer the
  // user is still editing. Clearing the flag (cancel, discard, save) re-runs
  // this and resynchronises the draft.
  useEffect(() => {
    if (markdownDraftDirty) return;
    setDraftContent(currentContent);
    setResetKey((k) => k + 1);
  }, [currentContent, markdownDraftDirty]);

  // Safety net. This component is mounted for the app's lifetime today, so the
  // cleanup never runs; it matters only if that ever changes. A flag left set
  // with no editor to clear it would block navigation behind a modal that is
  // no longer rendered. The dep is a stable store action.
  useEffect(() => () => setMarkdownDraftDirty(false), [setMarkdownDraftDirty]);

  const handleSave = async (): Promise<boolean> => {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const result = await replaceInReadme(
        draftContent,
        { line: 1, column: 1, offset: 0 },
        { line: 1, column: 1, offset: Number.MAX_SAFE_INTEGER }
      );
      // Only close on success. On failure the draft stays on screen so the
      // user can retry; replaceInReadme already reports the error via toast.
      if (result?.success) {
        setMarkdownDraftDirty(false);
        setMarkdownEditorEnabled(false);
        return true;
      }
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!markdownEditorEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // Inert while the discard prompt is open: it has its own Save button,
        // and a shortcut save behind it would leave the prompt out of date.
        if (pendingDiscard) return;
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [markdownEditorEnabled, pendingDiscard]);

  const handleCancel = () => {
    // Clearing the flag lets the effect above resynchronise the draft.
    setMarkdownDraftDirty(false);
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
            defaultValue={draftContent}
            onChange={(e) => {
              setDraftContent(e.target.value);
              setMarkdownDraftDirty(true);
            }}
            className="w-100"
            minHeight="400px"
          />
          <div className="flex-x gap-small justify-end padding-small">
            <SimpleButton
              action={handleCancel}
              disabled={isSaving || !!pendingDiscard}
              extraClass="padding-small border-gray rounded scale-on-hover"
              svg={svgs.iconClose}
              text={t("cancel")}
            />
            <SimpleButton
              action={handleSave}
              disabled={isSaving || !!pendingDiscard}
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

      {/* The Modal's own X (and clicking outside) resolves as "keep editing". */}
      {pendingDiscard && (
        <Modal
          extraClass="unsaved-draft-modal"
          outsideClickHandler={() => resolveMarkdownDraftDiscard(false)}
        >
          <div className="draft-warning flex-x align-center">
            <div className="big-svg">{svgs.rigoSoftBlue}</div>
            <p>{t("unsaved-changes-description")}</p>
          </div>
          <div className="flex-x gap-small justify-center">
            <SimpleButton
              text={isSaving ? t("loading") : t("save")}
              svg={svgs.iconCheck}
              disabled={isSaving}
              extraClass="padding-small bg-blue-rigo text-white rounded"
              action={async () => {
                // On success the parked action continues; on failure the
                // editor stays open with the draft and the caller is unwound
                // (the error toast already explains what happened).
                resolveMarkdownDraftDiscard(await handleSave());
              }}
            />
            <SimpleButton
              text={t("discardElement")}
              svg={svgs.trash}
              disabled={isSaving}
              extraClass="padding-small border-gray rounded"
              action={() => resolveMarkdownDraftDiscard(true)}
            />
          </div>
        </Modal>
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
