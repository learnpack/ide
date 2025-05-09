import React, { useEffect, useState } from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** Duración en segundos */
  duration: number;
  /** Altura opcional en píxeles (por defecto 8px) */
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  duration,
  height = 8,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalSteps = 100;
    const intervalTime = (duration * 1000) / totalSteps; // Tiempo por cada paso
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (currentProgress < totalSteps) {
        currentProgress++;
        setProgress(currentProgress);
      } else {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval); // Limpiar intervalo al desmontar
  }, [duration]);

  return (
    <div
      className={styles.container}
      style={{ height: `${height}px` }}
      aria-label="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.filler}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
