import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { useTranslation } from "react-i18next";

export default function CustomBuildButton({
  extraClass = "",
  onBuild = () => {},
  isRunning,
  isHtml,
}: {
  extraClass: string;
  onBuild: () => void;
  isRunning?: boolean;
  isHtml?: boolean;
}) {
  const { t } = useTranslation();
  const buttonText = isHtml ? `${t("see-terminal-output-html")}` : t("see-terminal-output");
  const tooltipText = isHtml ? `${t("see-terminal-output-tooltip-html")}` : t("see-terminal-output-tooltip");
  return (
    <SimpleButton
      // id="build-button"
      text={isRunning ? t("Running...") : t(buttonText)}
      svg={svgs.buildIcon}
      extraClass={`pill bg-blue ${extraClass}`}
      title={t(tooltipText)}
      tooltipSide="right"
      disabled={isRunning}
      action={onBuild}
    />
  );
}
