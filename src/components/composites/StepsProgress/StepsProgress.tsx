import React from "react";
import styles from "./StepsProgress.module.css";
import useStore from "../../../utils/store";

interface StepsProgressProps {
  height?: number;
}

const StepsProgress: React.FC<StepsProgressProps> = ({
  height = 4,
}) => {
  const currentStep = useStore((s) => s.currentExercisePosition);
  const totalSteps = useStore((s) => s.exercises.length);
  
  const currentStepNumber = Number(currentStep);

  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    id: index,
    isCompleted: index <= currentStepNumber,
  }));

  if (currentStepNumber === 0) return null;

  return (
    <div
      className={styles.container}
      role="progressbar"
      aria-valuenow={currentStepNumber}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-label={`Progress: ${currentStepNumber} of ${totalSteps} steps completed`}
    >
      {steps.map((step) => (
        <div
          key={step.id}
          className={`${styles.step} ${
            step.isCompleted ? styles.completed : styles.remaining
          }`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};

export default StepsProgress;
