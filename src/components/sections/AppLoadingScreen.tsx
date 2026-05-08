import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import useStore from "../../utils/store";
import { TAppLoadingError } from "../../utils/storeTypes";
import "./AppLoadingScreen.css";

const TIP_INTERVAL_MS = 8000;
const TIP_COUNT = 10;
const EYEBROW_COUNT = 3;

function shuffleIndices(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface AppLoadingScreenProps {
  error: TAppLoadingError | null;
}

export default function AppLoadingScreen({ error }: AppLoadingScreenProps) {
  const { t } = useTranslation();
  const environment = useStore((s) => s.environment);

  const tipPrefix = environment === "creatorWeb" ? "creator-loading-tips" : "student-loading-tips";

  const [order] = useState(() => shuffleIndices(TIP_COUNT));
  const [eyebrowOrder] = useState(() => shuffleIndices(EYEBROW_COUNT));
  const [tipStep, setTipStep] = useState(0);
  const [tipFading, setTipFading] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
      if (tipFadeTimeoutRef.current) clearTimeout(tipFadeTimeoutRef.current);
      return;
    }

    tipTimerRef.current = setInterval(() => {
      setTipFading(true);
      tipFadeTimeoutRef.current = setTimeout(() => {
        setTipStep((prev) => (prev + 1) % TIP_COUNT);
        setTipFading(false);
      }, 400);
    }, TIP_INTERVAL_MS);

    return () => {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
      if (tipFadeTimeoutRef.current) clearTimeout(tipFadeTimeoutRef.current);
    };
  }, [error]);

  const tipKey = `${tipPrefix}_${order[tipStep]}`;
  const eyebrowKey = `loading-eyebrow_${eyebrowOrder[tipStep % EYEBROW_COUNT]}`;

  const content = (
    <div className="app-loading-overlay">
      {error ? (
        <div className="app-loading-error-card">
          <div className="app-loading-rigo app-loading-rigo--error">{svgs.sadRigo}</div>
          <div className="app-loading-error-text">
            <p className="app-loading-error-title">{t(error.titleKey)}</p>
            <p className="app-loading-error-description">{t(error.descriptionKey)}</p>
          </div>
          <div className="app-loading-actions">
            {error.actions.map((a) => (
              <button
                key={a.label}
                className={a.style === "primary" ? "app-loading-btn-primary" : "app-loading-btn-ghost"}
                onClick={a.action}
              >
                {t(a.label)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="app-loading-rigo">
            <img src="/rigo-float.gif" alt="rigo" />
          </div>
          <div className={`app-loading-tip-block${tipFading ? " fade-out" : ""}`}>
            <span className="app-loading-eyebrow">{t(eyebrowKey)}</span>
            <p className="app-loading-tip">{t(tipKey)}</p>
          </div>
          <div className="app-loading-dot-row">
            <span className="app-loading-dot" />
            <span className="app-loading-dot" />
            <span className="app-loading-dot" />
          </div>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
