import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import SimpleButton from "../mockups/SimpleButton";
import useStore from "../../utils/store";
import { TTelemetryFetchStatus } from "../../utils/storeTypes";
import "./TelemetryLoadingScreen.css";

const TIP_INTERVAL_MS = 6000;
const TIP_COUNT = 10;

interface TelemetryLoadingScreenProps {
  status: TTelemetryFetchStatus;
}

export default function TelemetryLoadingScreen({
  status,
}: TelemetryLoadingScreenProps) {
  const { t } = useTranslation();
  const proceedWithTelemetry = useStore((s) => s.proceedWithTelemetry);

  const [tipIndex, setTipIndex] = useState(0);
  const [tipFading, setTipFading] = useState(false);
  const tipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
      return;
    }

    tipTimerRef.current = setInterval(() => {
      setTipFading(true);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIP_COUNT);
        setTipFading(false);
      }, 400);
    }, TIP_INTERVAL_MS);

    return () => {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
    };
  }, [status]);

  const tipKey = `telemetry-loading-tips_${tipIndex}`;

  const content = (
    <div className="telemetry-loading-overlay">
      <div className="telemetry-loading-rigo">{svgs.rigoWait}</div>

      {status === "loading" && (
        <>
          <p className="telemetry-loading-title">{t("telemetry-loading-title")}</p>
          <p className="telemetry-loading-subtitle">{t("telemetry-loading-subtitle")}</p>

          <div className={`telemetry-loading-tip${tipFading ? " fade-out" : ""}`}>
            {t(tipKey)}
          </div>

          <div className="telemetry-loading-dot-row">
            <span className="telemetry-loading-dot" />
            <span className="telemetry-loading-dot" />
            <span className="telemetry-loading-dot" />
          </div>
        </>
      )}

      {status === "timeout" && (
        <>
          <p className="telemetry-loading-title">{t("telemetry-timeout-title")}</p>
          <p className="telemetry-loading-subtitle">{t("telemetry-timeout-description")}</p>

          <div className="telemetry-loading-actions">
            <SimpleButton
              text={t("telemetry-reload")}
              action={() => window.location.reload()}
              extraClass="bc-btn"
            />
            <SimpleButton
              text={t("telemetry-continue-anyway")}
              action={() => void proceedWithTelemetry()}
              extraClass="bc-btn-ghost"
              title={t("telemetry-continue-risk-tooltip")}
              tooltipSide="bottom"
            />
          </div>
        </>
      )}

      {status === "server_error" && (
        <>
          <p className="telemetry-loading-title">{t("telemetry-server-error-title")}</p>
          <p className="telemetry-loading-subtitle">{t("telemetry-server-error-description")}</p>

          <div className="telemetry-loading-actions">
            <SimpleButton
              text={t("telemetry-reload")}
              action={() => window.location.reload()}
              extraClass="bc-btn"
            />
            <SimpleButton
              text={t("telemetry-continue-anyway")}
              action={() => void proceedWithTelemetry()}
              extraClass="bc-btn-ghost"
              title={t("telemetry-continue-risk-tooltip")}
              tooltipSide="bottom"
            />
          </div>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
