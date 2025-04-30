import React from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** Valor entre 0 y 100 */
  progress: number;
  /** Altura opcional en píxels (por defecto 8px) */
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
}) => {
  // Clamp para que no se pase de 0–100
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={styles.container}
      style={{ height: `${height}px` }}
      aria-label="progressbar"
      aria-valuenow={safeProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.filler}
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
