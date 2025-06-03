import { memo } from "react";
import { ENVIRONMENT } from "../../../utils/lib";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";

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

export const LessonRenderer = memo(() => {0
  const currentContent = useStore((s) => s.currentContent);
  const agent = useStore((s) => s.agent);

  return (
    <div className="lesson-content">
      <Markdowner markdown={currentContent.body} allowCreate={true} />
      <ContinueButton />

      {ENVIRONMENT === "localhost" && agent === "vscode" && (
        <Toolbar editorStatus="MODIFIED" />
      )}
    </div>
  );
});
