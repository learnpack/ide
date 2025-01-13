import { useTranslation } from "react-i18next";
import { Dropdown } from "../../composites/Dropdown/Dropdown";
import BuildButton from "./BuildButton";
import { TestButton } from "./TestButton";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";

export const CompileOptions = ({
  allowedActions,
}: {
  allowedActions: string[];
}) => {
  const { t } = useTranslation();

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
      {allowedActions.includes("build") && (
        <BuildButton extraClass=" active big w-100" />
      )}
      {allowedActions.includes("test") && <TestButton />}
    </Dropdown>
  );
};
