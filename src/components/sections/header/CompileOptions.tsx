import { useTranslation } from "react-i18next";
import { Dropdown } from "../../composites/Dropdown/Dropdown";
import BuildButton from "./BuildButton";
import { TestButton } from "./TestButton";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";

export const CompileOptions = ({
  dropdownDirection = "up",
}: {
  dropdownDirection: "up" | "down";
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
          text={isCompiling ? t("Running...") : t("Run")}
        />
      }
    >
      {isBuildable && <BuildButton extraClass=" active big w-100" />}
      {isTesteable && <TestButton />}
    </Dropdown>
  );
};
