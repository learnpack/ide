import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import { DEV_MODE } from "../../utils/lib";
import useStore from "../../utils/store";
import SimpleButton from "../mockups/SimpleButton";
import { RigoToggler } from "../Rigobot/Rigobot";
import LanguageButton from "../sections/header/LanguageButton";
import styles from "./NewHeader.module.css";
import { ToggleSidebar } from "../sections/sidebar/ToggleSidebar";
import toast from "react-hot-toast";

export const NewHeader = () => {
  const {
    handlePositionChange,
    currentExercisePosition,
    exercises,
    test,
    isIframe,
    language,
    hasSolution,
    getCurrentExercise,
    updateEditorTabs,
    compilerSocket,
    videoTutorial,
    setShowVideoTutorial,
    reportEnrichDataLayer,
    mode,
    addVideoTutorial,
  } = useStore((state) => ({
    handlePositionChange: state.handlePositionChange,
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
    test: state.test,
    isIframe: state.isIframe,
    language: state.language,
    hasSolution: state.hasSolution,
    getCurrentExercise: state.getCurrentExercise,
    updateEditorTabs: state.updateEditorTabs,
    compilerSocket: state.compilerSocket,
    videoTutorial: state.videoTutorial,
    setShowVideoTutorial: state.setShowVideoTutorial,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    mode: state.mode,
    addVideoTutorial: state.addVideoTutorial,
  }));

  const { t } = useTranslation();

  const openSolutionFile = () => {
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
    reportEnrichDataLayer("learnpack_open_solution", {});
  };

  return (
    <header className={styles.header}>
      <section>
        <button
          disabled={currentExercisePosition == 0}
          onClick={() => {
            handlePositionChange(Number(currentExercisePosition) - 1);
            reportEnrichDataLayer("learnpack_previous_step", {});
          }}
        >
          {svgs.prevArrowButton}
        </button>
        <button
          disabled={
            exercises && currentExercisePosition === exercises.length - 1
          }
          onClick={() => {
            handlePositionChange(Number(currentExercisePosition) + 1);
            reportEnrichDataLayer("learnpack_next_step", {});
          }}
        >
          {svgs.nextArrowButton}
        </button>
        {DEV_MODE && <button onClick={test}>TEST</button>}
      </section>
      <section>{svgs.learnpackLogo}</section>
      <section className="flex-x align-center">
        {!isIframe && language && <LanguageButton />}
        {hasSolution && (
          <SimpleButton
            title={
              hasSolution
                ? t("Review model solution")
                : t("Model solution not available")
            }
            svg={svgs.solution}
            disabled={!hasSolution}
            action={hasSolution ? openSolutionFile : () => {}}
          />
        )}
        <SimpleButton
          title={`Video tutorial ${videoTutorial ? "" : t("not available")}`}
          disabled={!videoTutorial && mode === "student"}
          svg={svgs.video}
          action={async () => {
            if (mode === "student") {
              setShowVideoTutorial(true);
              reportEnrichDataLayer("learnpack_open_video", {});
            } else {
              const tutorial = prompt("Enter the video tutorial URL");
              if (tutorial) {
                const tid = toast.loading(t("Adding video tutorial..."));
                await addVideoTutorial(tutorial);
                toast.success(t("Video tutorial added"), { id: tid });
              }
            }
          }}
        />

        <RigoToggler />
        <ToggleSidebar />
      </section>
    </header>
  );
};
