import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";

export const AskForHint: React.FC<{
  context: string;
}> = ({ context }) => {
  const { setRigoContext } = useStore((state) => ({
    setRigoContext: state.setRigoContext,
  }));
  const { t } = useTranslation();

  const handleClick = () => {
    setRigoContext(context);
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
