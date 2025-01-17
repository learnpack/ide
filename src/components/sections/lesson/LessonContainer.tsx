import { ReactElement, useEffect, useState } from "react";
import LessonContent from "./LessonContent";
import "./styles.css";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import { Alert } from "../../composites/Alert/Alert";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { ENVIRONMENT } from "../../../utils/lib";
import { Toolbar } from "../../composites/Editor/Editor";

interface Alerts {
  incrementalTest: boolean;
  agent: boolean;
}

export default function LessonContainer({
  children,
  continueAction,
}: {
  children?: ReactElement;
  continueAction?: () => void;
}) {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alerts>({
    incrementalTest: false,
    agent: true,
  });
  const {
    exercises,
    getCurrentExercise,
    configObject,
    isTesteable,
    editorTabs,
    environment,
  } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    exercises: state.exercises,
    configObject: state.configObject,
    isTesteable: state.isTesteable,
    editorTabs: state.editorTabs,
    environment: state.environment,
  }));

  useEffect(() => {
    const current = getCurrentExercise();
    if (current === undefined || !configObject || !configObject.config) return;

    setAlerts((prevAlerts) => ({
      ...prevAlerts,
      incrementalTest:
        configObject.config.grading === "incremental" &&
        !current.done &&
        isTesteable,
    }));
  }, [exercises, configObject]);

  const handleHideAlert = (alertName: keyof Alerts) => {
    setAlerts((prevAlerts) => ({
      ...prevAlerts,
      [alertName]: false,
    }));
  };

  return (
    <div className="lesson-container-component">
      {alerts.incrementalTest && (
        <blockquote>{t("incremental-test-alert")}</blockquote>
      )}
      {configObject?.config?.warnings?.agent &&
        alerts.agent &&
        environment !== "localStorage" && (
          <Alert>
            <div className="d-flex space-between">
              <p>
              {t("agent-mismatch-error")}{" "}
              <OpenWindowLink
                href="https://4geeks.com/lesson/agent-vs-mode"
                text="Read more"
              />
            </p>
            <button onClick={() => handleHideAlert("agent")}>Hide</button>
          </div>
        </Alert>
      )}
      {children}
      <LessonContent />

      {continueAction &&
        editorTabs.length === 0 &&
        !(ENVIRONMENT === "localhost") && (
          <div
            onClick={continueAction}
            className={`badge bg-blue ${
              editorTabs.length > 0 ? "hide-continue-button" : "continue-button"
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
