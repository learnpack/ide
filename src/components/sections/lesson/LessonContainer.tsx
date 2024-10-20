import { ReactElement, useEffect, useState } from "react";
import LessonContent from "./LessonContent";
import "./styles.css";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import { Alert } from "../../composites/Alert/Alert";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { ENVIRONMENT } from "../../../utils/lib";

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
  const { exercises, getCurrentExercise, configObject, isTesteable } = useStore(
    (state) => ({
      getCurrentExercise: state.getCurrentExercise,
      exercises: state.exercises,
      configObject: state.configObject,
      isTesteable: state.isTesteable,
    })
  );

  useEffect(() => {
    const current = getCurrentExercise();
    if (current === undefined) return;

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
      {configObject.config.warnings &&
        configObject.config.warnings.agent &&
        alerts.agent && (
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
      {ENVIRONMENT === "localStorage" && continueAction && (
        <div onClick={continueAction} className="badge bg-blue">
          {t("continue")}
        </div>
      )}
    </div>
  );
}
