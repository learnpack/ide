import { memo, useState } from "react";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";
import SimpleButton from "../../mockups/SimpleButton";
import { FetchManager } from "../../../managers/fetchManager";
import { InteractiveTutor } from "../InteractiveTutor/InteractiveTutor";
// import { TestLatex } from "./TestLatex";

const ContinueButton = () => {
  const { t } = useTranslation();
  const handlePositionChange = useStore((s) => s.handlePositionChange);
  const currentExercisePosition = useStore((s) => s.currentExercisePosition);
  const editorTabs = useStore((s) => s.editorTabs);
  const agent = useStore((s) => s.agent);
  const exercises = useStore((s) => s.exercises);
  const isLastExercise = currentExercisePosition === exercises.length - 1;

  return (
    !isLastExercise &&
    agent !== "vscode" && (
      <div
        className={`badge bg-blue ${
          editorTabs.length > 0 ? "hide-continue-button" : "continue-button"
        }`}
        onClick={() =>
          handlePositionChange(Number(currentExercisePosition) + 1)
        }
      >
        {t("continue")}
      </div>
    )
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
