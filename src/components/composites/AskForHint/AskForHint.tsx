import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";

export const AskForHint: React.FC<{
  context: string;
}> = ({ context }) => {
  const { setRigoContext, toggleRigo } = useStore((state) => ({
    setRigoContext: state.setRigoContext,
    toggleRigo: state.toggleRigo,
  }));
  const { t } = useTranslation();

  const handleClick = () => {
    setRigoContext(context);
    toggleRigo({ensure: "open"});
  };
  return (
    <div className="ask-for-hint">
      <SimpleButton
        extraClass="border-blue padding-medium rounded active-on-hover"
        action={handleClick}
        text={t("ask-rigo-for-a-hint")}
        svg={svgs.rigoSvg}
      />
    </div>
  );
};
