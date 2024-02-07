import SimpleButton from "../../mockups/Button";
import { svgs } from "../../../assets/svgs";
import { getStatus } from "../../../utils/socket";
import useStore from "../../../utils/store";
import { toast } from "react-hot-toast";

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
  const {
    currentExercisePosition,
    exercises,
    compilerSocket,
    buildbuttonText,
    setBuildButtonText,
    isBuildable,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
    compilerSocket: state.compilerSocket,
    buildbuttonText: state.buildbuttonText,
    setBuildButtonText: state.setBuildButtonText,
    isBuildable: state.isBuildable,
  }));

  const build = () => {
    // buildFiredAt = Date.now();
    setBuildButtonText("Running...", "");
    const [icon, message] = getStatus("compiling");
    toast.success(message, { icon: icon });

    const data = {
      exerciseSlug: exercises[currentExercisePosition].slug,
    };

    compilerSocket.emit("build", data);
    let compilerErrorHandler = debounce((data: any) => {
      data;
      // const stdout = data.logs[0];
      setBuildButtonText("Try again", "bg-fail");
      const [icon, message] = getStatus("compiler-error");
      toast.error(message, { icon: icon });

    }, 100);

    let compilerSuccessHandler = debounce((data: any) => {
      data;
      const [icon, message] = getStatus("compiler-success");
      toast.success(message, { icon: icon });
      setBuildButtonText("Run", "bg-success");
    }, 100);

    compilerSocket.onStatus("compiler-error", compilerErrorHandler);
    compilerSocket.onStatus("compiler-success", compilerSuccessHandler);
  };

  return (
    <SimpleButton
      text={<span>{buildbuttonText.text}</span>}
      svg={svgs.buildIcon}
      extraClass={`pill bg-blue ${buildbuttonText.className}`}
      action={build}
      disabled={!isBuildable}
    />
  );
}
