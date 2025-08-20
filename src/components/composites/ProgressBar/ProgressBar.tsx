import React, { useEffect, useState } from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** Duración en segundos */
  duration?: number;
  /** Altura opcional en píxeles (por defecto 8px) */
  height?: number;
  initialProgress?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  duration,
  height = 8,
  initialProgress = 0,
}) => {
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (duration) {
      const totalSteps = 100;
      const intervalTime = (duration * 1000) / totalSteps; // Tiempo por cada paso
      let currentProgress = 0;

      interval = setInterval(() => {
        if (currentProgress < totalSteps) {
          currentProgress++;
          setProgress(currentProgress);
        } else {
          clearInterval(interval);
        }
      }, intervalTime);
    }

    return () => {
      clearInterval(interval);
    };
  }, [duration]);

  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  return (
    <div
      className={styles.container}
      style={{ height: `${height}px` }}
      aria-label="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.filler} style={{ width: `${progress}%` }} />
    </div>
  );
};

export default ProgressBar;
