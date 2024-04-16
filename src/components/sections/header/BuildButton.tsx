import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { getStatus } from "../../../utils/socket";
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

export default function BuildButton() {
  const { t } = useTranslation();
  const {
    currentExercisePosition,
    compilerSocket,
    buildbuttonText,
    setBuildButtonText,
    isBuildable,
    build,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
    compilerSocket: state.compilerSocket,
    buildbuttonText: state.buildbuttonText,
    setBuildButtonText: state.setBuildButtonText,
    isBuildable: state.isBuildable,
    build: state.build,
  }));

  let compilerErrorHandler = debounce((data: any) => {
    data;
    // const stdout = data.logs[0];
    setBuildButtonText(t("Try again"), "bg-fail");
    const [icon, message] = getStatus("compiler-error");
    toast.error(message, { icon: icon });
  }, 100);

  let compilerSuccessHandler = debounce((data: any) => {
    data;
    const [icon, message] = getStatus("compiler-success");
    toast.success(message, { icon: icon });
    setBuildButtonText(t("Run"), "bg-success");
  }, 100);

  useEffect(() => {
    compilerSocket.onStatus("compiler-error", compilerErrorHandler);
    compilerSocket.onStatus("compiler-success", compilerSuccessHandler);
  }, [currentExercisePosition]);

  return (
    <SimpleButton
    id="build-button"
      text={t(buildbuttonText.text)}
      svg={svgs.buildIcon}
      extraClass={`pill bg-blue ${buildbuttonText.className}`}
      action={() => {
        build(t("Running..."));
      }}
      
      disabled={!isBuildable}
    />
  );
}
