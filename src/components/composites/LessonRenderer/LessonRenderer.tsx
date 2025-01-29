import { ReactNode, memo } from "react";
import { ENVIRONMENT } from "../../../utils/lib";
import { TEditorTab } from "../../../utils/storeTypes";
import { Toolbar } from "../Editor/Editor";
import { Markdowner } from "../Markdowner/Markdowner";
import { useTranslation } from "react-i18next";

export const LessonRenderer = memo(
  ({
    header,
    content,
    continueAction,
    editorTabs,
  }: {
    header: ReactNode;
    content: string;
    continueAction: () => void;
    editorTabs: TEditorTab[];
  }) => {
    const { t } = useTranslation();

    console.debug("---LessonRenderer content---");
    console.debug(content);
    console.debug("---LessonRenderer content end---");

    return (
      <div className="lesson-content">
        {header}
        <Markdowner markdown={content} />
        {/* <LessonContent /> */}
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
        {ENVIRONMENT === "localhost" && <Toolbar editorStatus="MODIFIED" />}
      </div>
    );
  }
);
