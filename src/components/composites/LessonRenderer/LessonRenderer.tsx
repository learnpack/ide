import { memo, useEffect, useRef, useState } from "react";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";
import SimpleButton from "../../mockups/SimpleButton";
import { FetchManager } from "../../../managers/fetchManager";
import { InteractiveTutor } from "../InteractiveTutor/InteractiveTutor";
import { eventBus } from "../../../managers/eventBus";
import { fixLesson } from "../../../managers/EventProxy";
import RealtimeNotificationListener from "../../Creator/RealtimeNotificationListener";
// import toast from "react-hot-toast";

const ContinueButton = () => {
  const { t } = useTranslation();
  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const editorTabs = useStore((s) => s.editorTabs);
  const agent = useStore((s) => s.agent);
  const exercises = useStore((s) => s.exercises);
  const [loading, setLoading] = useState(false);
  const isLastExercise = currentExercisePosition === exercises.length - 1;

  const hasBodyLessonLoader = () => {
    const selector = ".lesson-loader";
    const element = document.querySelector(selector);
    return element !== null;
  };

  useEffect(() => {
    eventBus.on("position_changed", () => {
      setLoading(false);
    });
  }, []);

  return (
    !isLastExercise &&
    agent !== "vscode" &&
    !hasBodyLessonLoader() && (
      <div
        aria-disabled={loading}
        className={`badge bg-blue  ${
          editorTabs.length > 0 ? "hide-continue-button" : "continue-button"
        }`}
        role="button"
        tabIndex={0}
        onClick={() => {
          setLoading(true);
          eventBus.emit("position_change", {
            position: Number(currentExercisePosition) + 1,
          });
        }}
      >
        {loading ? t("loading") : t("continue")}
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

      // Find the title attribute of the katex errors
      const katexErrorsTitles = Array.from(katexErrors).map((error) => {
        return error.getAttribute("title") || "";
      });

      if (katexErrors.length > 0 || errorTexts.length > 0) {
        const foundKatexErrors = `Inside this lesson, there are ${
          katexErrors.length
        } katex errors and ${
          errorTexts.length
        } error texts related to mermaid diagrams. The titles of the katex errors are: ${katexErrorsTitles.join(
          ", "
        )}`;

        if (environment !== "creatorWeb") {
          console.log("not creator web, skipping fix lesson");
          return;
        }

        const currentExercise = getCurrentExercise();

        const inputs = {
          lesson_content: currentContent,
          found_errors: foundKatexErrors,
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
  const agent = useStore((s) => s.agent);
  const environment = useStore((s) => s.environment);
  const getCurrentExercise = useStore((s) => s.getCurrentExercise);
  const language = useStore((s) => s.language);
  const [mode, setMode] = useState<"markdown" | "text" | "interactive">(
    "markdown"
  );

  return (
    <div className="lesson-content">
      <LessonInspector />
      {mode === "markdown" && (
        <Markdowner markdown={currentContent} allowCreate={true} />
      )}
      {mode === "text" && (
        <textarea
          defaultValue={currentContent}
          className="w-100 h-full padding-small rounded textarea"
          onBlur={(e) => {
            console.log(e.target.value, "e.target.value");

            if (e.target.value === currentContent) return;

            FetchManager.replaceReadme(
              getCurrentExercise().slug,
              language,
              e.target.value
            );
          }}
        />
      )}
      {mode === "interactive" && <InteractiveTutor />}
      <SimpleButton
        extraClass={"d-none text-reveal-button"}
        text={
          mode === "markdown"
            ? "Markdown"
            : mode === "text"
            ? "Text"
            : "Interactive"
        }
        action={() =>
          setMode(
            mode === "markdown"
              ? "text"
              : mode === "text"
              ? "interactive"
              : "markdown"
          )
        }
      />
      {/* <TestLatex /> */}
      <ContinueButton />

      {environment === "localhost" && agent === "vscode" && (
        <Toolbar editorStatus="MODIFIED" position="sticky" />
      )}
    </div>
  );
});
