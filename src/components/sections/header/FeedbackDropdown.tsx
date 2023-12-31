import { debounce, removeSpecialCharacters } from "../../../utils/lib";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";

import SimpleButton from "../../mockups/Button";
import { OpenWindowLink } from "../../composites/OpenWindowLink";

interface IFeedbackDropdown {
  toggleFeedbackVisibility: () => void;
}



export const FeedbackDropdown = ({
  toggleFeedbackVisibility,
}: IFeedbackDropdown) => {
  const {
    compilerSocket,
    token,
    setFeedbackButtonProps,
    fetchExercises,
    videoTutorial,
    setShowVideoTutorial,
    isTesteable,
    setOpenedModals,
    runExerciseTests,
    setTestResult,
    toastFromStatus
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    token: state.token,
    setFeedbackButtonProps: state.setFeedbackButtonProps,
    fetchExercises: state.fetchExercises,
    configObject: state.configObject,
    videoTutorial: state.videoTutorial,
    setShowVideoTutorial: state.setShowVideoTutorial,
    getCurrentExercise: state.getCurrentExercise,
    isTesteable: state.isTesteable,
    setOpenedModals: state.setOpenedModals,
    runExerciseTests: state.runExerciseTests,
    setTestResult: state.setTestResult,
    toastFromStatus: state.toastFromStatus
    
  }));

  let debounceSuccess = debounce((data: any) => {
    setTestResult("successful", removeSpecialCharacters(data.logs[0]))
    toastFromStatus("testing-success")
    setFeedbackButtonProps("Succeded", "bg-success text-white");
    fetchExercises();
  }, 100);

  let debouncedError = debounce((data: any) => {
    setTestResult("failed", removeSpecialCharacters(data.logs[0]))
    toastFromStatus("testing-error")
    setFeedbackButtonProps("Try again", "bg-fail text-white");
  }, 100);

  const runTests = () => {
    toggleFeedbackVisibility();
    runExerciseTests({
        toast: true,
        setFeedbackButton: true
    });
    compilerSocket.onStatus("testing-success", debounceSuccess);
    compilerSocket.onStatus("testing-error", debouncedError);
  };

  const openLoginModal = () => {
    setOpenedModals({ login: true });
    toggleFeedbackVisibility();
  };

  const redirectToVideo = () => {
    setShowVideoTutorial(true);
    toggleFeedbackVisibility();
  };

  const showChat = () => {
    setOpenedModals({ chat: true });
    toggleFeedbackVisibility();
  };

  return (
    <div className="feedback-dropdown">
      {
        <SimpleButton
          svg={svgs.testIcon}
          text="Run tests"
          action={runTests}
          disabled={!isTesteable}
        />
      }
      {Boolean(token) ? (
        <SimpleButton
          text="Get help from AI"
          svg={svgs.brainIcon}
          action={showChat}
        />
      ) : (
        <SimpleButton
          svg={svgs.fourGeeksIcon}
          text="Login to use AI feedback"
          action={openLoginModal}
        />
      )}
      <SimpleButton
        text={`Video tutorial ${videoTutorial ? "" : "(not available)"}`}
        disabled={!videoTutorial}
        svg={svgs.videoIcon}
        action={redirectToVideo}
      />

      <p>
        Feedback plays an important role when learning technical skills.
        <OpenWindowLink
          text="Learn why"
          href="https://4geeks.com/docs/learnpack"
        />
      </p>
    </div>
  );
};
