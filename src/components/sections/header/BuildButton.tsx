import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";

export default function BuildButton({
  extraClass = "",
}: {
  extraClass: string;
}) {
  const { t } = useTranslation();
  const {
    buildbuttonText,
    setBuildButtonPrompt,
    isBuildable,
    build,
    isTesteable,
    runExerciseTests,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
    compilerSocket: state.compilerSocket,
    buildbuttonText: state.buildbuttonText,
    setBuildButtonPrompt: state.setBuildButtonPrompt,
    isBuildable: state.isBuildable,
    build: state.build,
    isTesteable: state.isTesteable,
    feedbackButtonProps: state.feedbackbuttonProps,
    runExerciseTests: state.runExerciseTests,
  }));

  const runTests = () => {
    setBuildButtonPrompt(t("Running..."), "bg-blue");
    runExerciseTests({
      toast: true,
      setFeedbackButton: false,
      feedbackButtonText: t("Running..."),
      targetButton: "build",
    });
  };

  const changeToTest = !isBuildable && isTesteable;

  return (
    <SimpleButton
      id="build-button"
      text={t(buildbuttonText.text)}
      svg={svgs.buildIcon}
      extraClass={`pill bg-blue ${buildbuttonText.className} ${extraClass}`}
      action={() => {
        changeToTest ? runTests() : build(t("Running..."));
      }}
      disabled={!isBuildable && !isTesteable}
    />
  );
}
