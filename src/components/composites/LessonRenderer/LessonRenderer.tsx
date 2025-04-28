import { ReactNode, memo } from "react";
import { ENVIRONMENT } from "../../../utils/lib";
import { TEditorTab } from "../../../utils/storeTypes";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import "./LessonStyles.css";

export const LessonRenderer = memo(
  ({
    header,
    continueAction,
    editorTabs,
  }: {
    header: ReactNode;
    continueAction: () => void;
    editorTabs: TEditorTab[];
  }) => {
    const { t } = useTranslation();
    const currentContent = useStore((s) => s.currentContent);
    const agent = useStore((s) => s.agent);
    const currentExercisePosition = useStore((s) => s.currentExercisePosition);
    const exercises = useStore((s) => s.exercises);

    const isLastExercise = currentExercisePosition === exercises.length - 1;

    return (
      <div className="lesson-content">
        {header}
        <Markdowner markdown={currentContent.body} allowCreate={true} />
        {continueAction &&
          editorTabs.length === 0 &&
          !isLastExercise &&
          agent !== "vscode" && (
            <div
              onClick={continueAction}
              className={`badge bg-blue ${
                editorTabs.length > 0
                  ? "hide-continue-button"
                  : "continue-button"
              }`}
            >
              {t("continue")}
            </div>
          )}
        {/* {ENVIRONMENT === "localhost" && editorTabs.length > 0 && ( */}
        {(ENVIRONMENT === "localhost" && agent === "vscode") ||
          (ENVIRONMENT === "creatorWeb" && <Toolbar editorStatus="MODIFIED" />)}
      </div>
    );
  }
);
