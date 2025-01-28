import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import { DEV_MODE } from "../../utils/lib";
import useStore from "../../utils/store";
import SimpleButton from "../mockups/SimpleButton";
import { RigoToggler } from "../Rigobot/Rigobot";
import LanguageButton from "../sections/header/LanguageButton";
import styles from "./NewHeader.module.css";
import { ToggleSidebar } from "../sections/sidebar/ToggleSidebar";

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
  }));

  const { t } = useTranslation();

  const openSolutionFile = () => {
    // TODO: This should open ALL solution files
    const solutionFile = getCurrentExercise().files.find((file: any) =>
      file.name.includes("solution.hide")
    );

    const data = {
      exerciseSlug: getCurrentExercise().slug,
      files: [solutionFile.path],
      solutionFileName: solutionFile.name,
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
          disabled={!videoTutorial}
          svg={svgs.video}
          action={() => {
            setShowVideoTutorial(true);
            reportEnrichDataLayer("learnpack_open_video", {});
          }}
        />

        <RigoToggler />
        <ToggleSidebar />
      </section>
    </header>
  );
};
