import { useTranslation } from "react-i18next";
import { Dropdown } from "../../composites/Dropdown/Dropdown";
import CustomBuildButton from "./CustomBuildButton";
import BuildButton from "./BuildButton";
import { TestButton } from "./TestButton";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { CustomTestButton } from "./CustomTestButton";
export const CompileOptions = ({
  dropdownDirection = "up",
  onRunTests,
  onBuild,
  isRunning,
  isHtml,
}: {
  dropdownDirection: "up" | "down";
  onRunTests?: () => void;
  onBuild?: () => void;
  isRunning?: boolean;
  isHtml?: boolean;
}) => {
  const { t } = useTranslation();
  const { isBuildable, isTesteable, isCompiling, lastState, serviceError } = useStore((state) => ({
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
    isCompiling: state.isCompiling,
    lastState: state.lastState,
    serviceError: state.serviceError,
  }));

  const hasError = !isCompiling && !isRunning && lastState === "error";
  const errorIcon = serviceError ? svgs.warning : svgs.testIcon;
  const errorText = serviceError ? t("retry") : t("try-again");

  return (
    <Dropdown
      className={dropdownDirection}
      openingElement={
        <SimpleButton
          extraClass={`compiler rounded padding-small ${isCompiling ? "palpitate" : ""} ${hasError ? "bg-fail text-white" : ""}`}
          svg={hasError ? errorIcon : svgs.run}
          text={isCompiling || isRunning ? t("Running...") : hasError ? errorText : t("Run")}
        />
      }
    >
      {isBuildable && !onBuild && <BuildButton extraClass=" active big w-100" isHtml={isHtml} />}
      {onBuild && <CustomBuildButton isRunning={isRunning} extraClass=" active big w-100" onBuild={onBuild} isHtml={isHtml} />}
      {isTesteable && !onRunTests && <TestButton />}
      {onRunTests && <CustomTestButton onRunTests={onRunTests} />}
    </Dropdown>
  );
};
