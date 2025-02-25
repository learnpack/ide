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

    return (
      <div className="lesson-content">
        {header}
        <Markdowner markdown={currentContent} />
        {continueAction &&
          editorTabs.length === 0 &&
          !(ENVIRONMENT === "localhost") && (
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
        {ENVIRONMENT === "localhost" && agent !== "os" && (
          <Toolbar editorStatus="MODIFIED" />
        )}
      </div>
    );
  }
);
