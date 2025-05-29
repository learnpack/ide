import { useTranslation } from "react-i18next";
import { Dropdown } from "../../composites/Dropdown/Dropdown";
import BuildButton from "./BuildButton";
import { TestButton } from "./TestButton";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";

export const CompileOptions = () => {
  const { t } = useTranslation();
  const { isBuildable, isTesteable } = useStore((state) => ({
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
  }));

  return (
    <Dropdown
      className="up"
      openingElement={
        <SimpleButton
          extraClass="compiler rounded padding-small"
          svg={svgs.run}
          text={t("Run")}
        />
      }
    >
      {isBuildable && <BuildButton extraClass=" active big w-100" />}
      {isTesteable && <TestButton />}
    </Dropdown>
  );
};
