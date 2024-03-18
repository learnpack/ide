import { debounce, removeSpecialCharacters } from "../../../utils/lib";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";

import SimpleButton from "../../mockups/Button";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";

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
    videoTutorial,

    isTesteable,
    setOpenedModals,
    runExerciseTests,
    setTestResult,
    toastFromStatus,
    bc_token,
    openLink,
    checkRigobotInvitation,
    // hasSolution,
    // getCurrentExercise
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    token: state.token,
    setFeedbackButtonProps: state.setFeedbackButtonProps,
    fetchExercises: state.fetchExercises,
    configObject: state.configObject,
    videoTutorial: state.videoTutorial,
    // setShowVideoTutorial: state.setShowVideoTutorial,
    isTesteable: state.isTesteable,
    setOpenedModals: state.setOpenedModals,
    runExerciseTests: state.runExerciseTests,
    setTestResult: state.setTestResult,
    toastFromStatus: state.toastFromStatus,
    bc_token: state.bc_token,
    openLink: state.openLink,
    clearBcToken: state.clearBcToken,
    checkRigobotInvitation: state.checkRigobotInvitation,
    hasSolution: state.hasSolution,
    currentSolution: state.currentSolution,
    getCurrentExercise: state.getCurrentExercise,
  }));

  const { t } = useTranslation();

  let debounceSuccess = debounce((data: any) => {
    const stdout = removeSpecialCharacters(data.logs[0]);
    setTestResult("successful", stdout);
    toastFromStatus("testing-success");
    setFeedbackButtonProps("Succeded", "bg-success text-white");
  }, 100);

  let debouncedError = debounce((data: any) => {
    const stdout = removeSpecialCharacters(data.logs[0]);
    setTestResult("failed", stdout);
    toastFromStatus("testing-error");
    setFeedbackButtonProps(t("Try again"), "bg-fail text-white");
  }, 100);

  const runTests = () => {
    toggleFeedbackVisibility();
    runExerciseTests({
      toast: true,
      setFeedbackButton: true,
    });
    compilerSocket.onStatus("testing-success", debounceSuccess);
    compilerSocket.onStatus("testing-error", debouncedError);
  };

  const openLoginModal = () => {
    setOpenedModals({ login: true });
    toggleFeedbackVisibility();
  };

  const redirectToVideo = () => {
    openLink(videoTutorial);    
    toggleFeedbackVisibility();
  };
  
  const openLearnpackDocs = () => {
    const docsUrl = "https://4geeks.com/docs/learnpack";
    openLink(docsUrl);
    toggleFeedbackVisibility();
  };

  const showChat = () => {
    setOpenedModals({ chat: true });
    toggleFeedbackVisibility();
  };

  const rigoAccepted = async () => {
    checkRigobotInvitation();
  };

  // const openSolutionFile = () => {
  //   // setOpenedModals({ solution: true });
  //   const solutionFile = getCurrentExercise().files.find((file: any) => file.name.includes("solution.hide"));
  //   const data = {
  //     exerciseSlug: getCurrentExercise().slug,
  //     files: [solutionFile.path],
  //   };
  //   compilerSocket.emit("open", data);
  // };

  return (
    <div className="feedback-dropdown">
      {
        <SimpleButton
          svg={svgs.testIcon}
          text={t("Run tests")}
          action={runTests}
          disabled={!isTesteable}
        />
      }
      {Boolean(token) ? (
        <SimpleButton
        text={t("Get help from AI")}
          svg={svgs.brainIcon}
          action={showChat}
        />
      ) : bc_token ? (
        <>
          <SimpleButton
            svg={svgs.brainIcon}
            text={t("Get help from AI")}
            action={rigoAccepted}
          />
        </>
      ) : (
        <SimpleButton
          svg={svgs.fourGeeksIcon}
          text={t("Login to use AI feedback")}
          action={openLoginModal}
        />
      )}
      {/* <SimpleButton
        text={
          hasSolution ? t("Review model solution") : t("Model solution not available")
        }
        svg={svgs.solutionIcon}
        disabled={!hasSolution}
        action={hasSolution ? openSolutionFile : ()=>{}}
      /> */}
      <SimpleButton
        text={`Video tutorial ${videoTutorial ? "" : t("not available")}`}
        disabled={!videoTutorial}
        svg={svgs.videoIcon}
        action={redirectToVideo}
      />
      <SimpleButton
        text={t("About LearnPack")}
        svg={svgs.fourGeeksIcon}
        action={openLearnpackDocs}
      />

      <p>
        {t("Feedback plays an important role when learning technical skills. ")}
        <OpenWindowLink
          text={t("Learn why")}
          href="https://4geeks.com/mastering-technical-knowledge#feedback-quality-and-frequency"
        />
      </p>
    </div>
  );
};
