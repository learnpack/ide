import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import SimpleButton from "../../mockups/SimpleButton";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";

interface IFeedbackDropdown {
  toggleFeedbackVisibility: () => void;
  direction: "up" | "down";
}

export const FeedbackDropdown = ({
  toggleFeedbackVisibility,
  direction,
}: IFeedbackDropdown) => {
  const {
    compilerSocket,
    token,
    videoTutorial,
    setOpenedModals,
    bc_token,
    openLink,
    checkRigobotInvitation,
    hasSolution,
    getCurrentExercise,
    updateEditorTabs,
    toggleRigo,
    setShowVideoTutorial,
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    token: state.token,
    videoTutorial: state.videoTutorial,
    setOpenedModals: state.setOpenedModals,
    bc_token: state.bc_token,
    openLink: state.openLink,
    checkRigobotInvitation: state.checkRigobotInvitation,
    hasSolution: state.hasSolution,
    getCurrentExercise: state.getCurrentExercise,
    updateEditorTabs: state.updateEditorTabs,
    toggleRigo: state.toggleRigo,
    setShowVideoTutorial: state.setShowVideoTutorial,
  }));

  const { t } = useTranslation();

  const openLoginModal = () => {
    setOpenedModals({ login: true });
    toggleFeedbackVisibility();
  };

  const redirectToVideo = () => {
    setShowVideoTutorial(true);
    // openLink(videoTutorial);
    toggleFeedbackVisibility();
  };

  const openLearnpackDocs = () => {
    const docsUrl = "https://4geeks.com/docs/learnpack";
    openLink(docsUrl);
    toggleFeedbackVisibility();
  };

  const showChat = () => {
    // setOpenedModals({ chat: true });
    toggleRigo();
    toggleFeedbackVisibility();
  };

  const rigoAccepted = async () => {
    const messages = {
      error: t("rigo-not-yet-accepted"),
    };
    checkRigobotInvitation(messages);
  };

  const openSolutionFile = () => {
    // TODO: This should open ALL solution files
    const solutionFile = getCurrentExercise().files.filter((file: any) =>
      file.name.includes("solution.hide")
    );

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      files: solutionFile.map((file: any) => file.path),
      solutionFileName: solutionFile.map((file: any) => file.name),
      updateEditorTabs: updateEditorTabs,
    };
    compilerSocket.emit("open", data);
  };

  return (
    <div className={`feedback-dropdown ${direction}`}>
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
