import { useTranslation } from "react-i18next";
import { Dropdown } from "../../composites/Dropdown/Dropdown";
import BuildButton from "./BuildButton";
import { TestButton } from "./TestButton";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";

export const CompileOptions = () => {
  const { t } = useTranslation();

  return (
    <Dropdown className="up" openingElement={<SimpleButton  svg={svgs.buildIcon} text={t("Run")} />}>
      <BuildButton extraClass="active big w-100" />
      <TestButton />
    </Dropdown>
  );
};
