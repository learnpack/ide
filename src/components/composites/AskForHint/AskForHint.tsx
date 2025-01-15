import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";

export const AskForHint: React.FC<{
  context: string;
  from: "test" | "quiz";
}> = ({ context, from }) => {
  const {
    setRigoContext,
    toggleRigo,
    reportEnrichDataLayer,

  } = useStore((state) => ({
    setRigoContext: state.setRigoContext,
    toggleRigo: state.toggleRigo,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
  }));
  const { t } = useTranslation();

  const handleClick = () => {
    setRigoContext(context);
    toggleRigo({ ensure: "open" });
    reportEnrichDataLayer(`learnpack_${from}_help`, {
      context,
    });
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
