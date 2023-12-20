import SimpleButton from "../templates/Button";
import { svgs } from "../../assets/svgs";
import { getStatus } from "../../utils/socket";
import useStore from "../../utils/store";
import { toast } from 'react-hot-toast';


export default function BuildButton() {
  const { currentExercisePosition, exercises, compilerSocket, buildbuttonText, setBuildButtonText } = useStore();


  const build = () => {
    setBuildButtonText("Running...", "")
    toast.success(getStatus("compiling"));

    const data = {
      exerciseSlug: exercises[currentExercisePosition].slug
    }

    compilerSocket.emit('build', data);

    compilerSocket.onStatus('compiler-success', () => {
      toast.success(getStatus("compiler-success"));
      setBuildButtonText("Run", "bg-success");
    })

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
    };
    let debouncedFunc = debounce((data: any) => {
      data

      setBuildButtonText("Try again", "bg-fail");
      toast.error(getStatus("compiler-error"));
    }, 100);

    compilerSocket.onStatus('compiler-error', debouncedFunc);


  }

  return <SimpleButton text={buildbuttonText.text} svg={svgs.buildIcon} extraClass={`pill bg-blue ${buildbuttonText.className}`} action={build} />
}