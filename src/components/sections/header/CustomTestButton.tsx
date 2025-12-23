import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";

export const CustomTestButton = ({ onRunTests }: { onRunTests: () => void }) => {

  return (
    <SimpleButton
      extraClass={`rounded big w-100 border-blue color-blue`}
      svg={svgs.testIcon}
      tooltipSide="right"
      action={onRunTests}
    />
  );
};
