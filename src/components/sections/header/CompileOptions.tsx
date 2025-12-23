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
  const { isBuildable, isTesteable, isCompiling } = useStore((state) => ({
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
    isCompiling: state.isCompiling,
  }));

  return (
    <Dropdown
      className={dropdownDirection}
      openingElement={
        <SimpleButton
          extraClass={`compiler rounded padding-small ${isCompiling ? "palpitate" : ""}`}
          svg={svgs.run}
          text={isCompiling || isRunning ? t("Running...") : t("Run")}
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
