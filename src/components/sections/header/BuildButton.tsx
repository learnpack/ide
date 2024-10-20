import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { getStatus } from "../../../managers/socket";
import useStore from "../../../utils/store";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";


function debounce(func: any, wait: any) {
  let timeout: any;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function BuildButton({
  extraClass = "",
}: {
  extraClass: string;
}) {
  const { t } = useTranslation();
  const {
    currentExercisePosition,
    compilerSocket,
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

  let compilerErrorHandler = debounce((data: any) => {
    data;

    if (data.recommendations) {
      toast.error(data.recommendations);
    }
    setBuildButtonPrompt(t("Try again"), "bg-fail");
    const [icon, message] = getStatus("compiler-error");
    toast.error(message, { icon: icon });
  }, 100);

  let compilerSuccessHandler = debounce((data: any) => {
    data;

    const [icon, message] = getStatus("compiler-success");
    toast.success(message, { icon: icon });
    setBuildButtonPrompt(t("Run"), "bg-success");
  }, 100);

  useEffect(() => {
    compilerSocket.onStatus("compiler-error", compilerErrorHandler);
    compilerSocket.onStatus("compiler-success", compilerSuccessHandler);
  }, [currentExercisePosition]);

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
      disabled={
        (!isBuildable && !isTesteable)
      }
    />
  );
}
