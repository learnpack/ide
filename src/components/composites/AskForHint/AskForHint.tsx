import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";
import { useTranslation } from "react-i18next";

export const AskForHint: React.FC<{
  from: "test" | "quiz";
  getContext: () => string;
  onClick?: () => void;
}> = ({ from, getContext, onClick }) => {
  const { setRigoContext, toggleRigo, reportEnrichDataLayer } = useStore(
    (state) => ({
      setRigoContext: state.setRigoContext,
      toggleRigo: state.toggleRigo,
      reportEnrichDataLayer: state.reportEnrichDataLayer,
    })
  );
  const { t } = useTranslation();

  const handleClick = () => {
    const context = getContext();
    setRigoContext({
      context: context,
      userMessage:
        from === "test"
          ? t("can-you-give-me-a-hint")
          : t("help-me-with-this-quiz"),
      performTests: from === "test",
    });
    toggleRigo({ ensure: "open" });
    reportEnrichDataLayer(`learnpack_${from}_help`, {
      context: context,
    });
    onClick?.();
  };
  return (
    <div>
      <SimpleButton
        extraClass="border-blue padding-medium rounded active-on-hover bg-lesson"
        action={handleClick}
        text={t("ask-rigo-for-a-hint")}
        svg={svgs.rigoSvg}
      />
    </div>
  );
};
