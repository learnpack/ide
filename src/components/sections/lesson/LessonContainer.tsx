import { useEffect, useState } from "react";

import LessonContent from "./LessonContent";
import "./styles.css";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";

export default function LessonContainer() {
  const {t} = useTranslation()
  const [showAlert, setShowAlert] = useState(false);
  const { exercises, getCurrentExercise, configObject, isTesteable } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    exercises: state.exercises,
    configObject: state.configObject,
    isTesteable: state.isTesteable
  }));

  useEffect(() => {
    const current = getCurrentExercise()
    if (current === undefined) return

    if (configObject.config.grading ==="incremental" && !current.done && isTesteable ) {
        setShowAlert(true)
    }
    else {
        setShowAlert(false)
    }
    
  }, [exercises, configObject]);

  return (
    <div className="lesson-container-component">
      {showAlert && (
        <blockquote>{t("incremental-test-alert")}</blockquote>
      )}
      <LessonContent />
    </div>
  );
}
