// import { debounce, removeSpecialCharacters } from "../../../utils/lib";
// import { useEffect } from "react";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import SimpleButton from "../../mockups/SimpleButton";
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
    videoTutorial,
    isTesteable,
    setOpenedModals,
    runExerciseTests,
    bc_token,
    openLink,
    checkRigobotInvitation,
    hasSolution,
    getCurrentExercise,
    // currentExercisePosition,
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    token: state.token,
    setFeedbackButtonProps: state.setFeedbackButtonProps,
    fetchExercises: state.fetchExercises,
    configObject: state.configObject,
    videoTutorial: state.videoTutorial,
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
    currentExercisePosition: state.currentExercisePosition,
  }));

  const { t } = useTranslation();

  const runTests = () => {
    toggleFeedbackVisibility();
    runExerciseTests({
      toast: true,
      setFeedbackButton: true,
      feedbackButtonText: t("Running..."),
    });
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

  const openSolutionFile = () => {
    // setOpenedModals({ solution: true });
    const solutionFile = getCurrentExercise().files.find((file: any) =>
      file.name.includes("solution.hide")
    );
    const data = {
      exerciseSlug: getCurrentExercise().slug,
      files: [solutionFile.path],
    };
    compilerSocket.emit("open", data);
  };

  return (
    <div className="feedback-dropdown">
      {
        <SimpleButton
          svg={svgs.testIcon}
          text={isTesteable ? t("Run tests") : t("No tests available")}
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
      <SimpleButton
        text={
          hasSolution
            ? t("Review model solution")
            : t("Model solution not available")
        }
        svg={svgs.solutionIcon}
        disabled={!hasSolution}
        action={hasSolution ? openSolutionFile : () => {}}
      />
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
