import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";

export const TestButton = () => {
  const { t } = useTranslation();
  const { isTesteable, runExerciseTests, feedbackbuttonProps } = useStore((state) => ({
    isTesteable: state.isTesteable,
    runExerciseTests: state.runExerciseTests,
    feedbackbuttonProps: state.feedbackbuttonProps,
  }));

  const runTests = () => {
    runExerciseTests({
      toast: true,
      setFeedbackButton: true,
      feedbackButtonText: t("Running..."),
      targetButton: "feedback",
    });
  };

  return (
    <SimpleButton
      extraClass={`rounded big w-100 border-blue color-active ${feedbackbuttonProps.className}`}
      svg={svgs.testIcon}
      text={isTesteable ? t(feedbackbuttonProps.text) : t("No tests available")}
      action={runTests}
      disabled={
        !isTesteable
      }
    />
  );
};
