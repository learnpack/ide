import { useEffect, useState } from "react";

import LessonContent from "./LessonContent";
import "./styles.css";
import useStore from "../../../utils/store";

export default function LessonContainer() {
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
    
  }, [exercises]);

  return (
    <div className="lesson-container-component">
      {showAlert && (
        <blockquote>You must successfully complete and test this step before continuing to the next one. Carefully read the instructions and ask for feedback if you need any help.</blockquote>
      )}
      <LessonContent />
    </div>
  );
}
