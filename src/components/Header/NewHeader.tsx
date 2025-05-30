import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import { DEV_MODE } from "../../utils/lib";
import useStore from "../../utils/store";
import SimpleButton from "../mockups/SimpleButton";
import { RigoToggler } from "../Rigobot/Rigobot";
import LanguageButton from "../sections/header/LanguageButton";
import styles from "./NewHeader.module.css";
import { ToggleSidebar } from "../sections/sidebar/ToggleSidebar";
import { slugToTitle } from "../Rigobot/utils";

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
    isCreator,
    setShowVideoTutorial,
    reportEnrichDataLayer,
    mode,
    setMode,
    setOpenedModals,
    environment,
    lessonTitle,
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
    isCreator: state.isCreator,
    setOpenedModals: state.setOpenedModals,
    setMode: state.setMode,
    environment: state.environment,
    lessonTitle: state.lessonTitle,
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
        {/* <ScreenShareSmart /> */}
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
      <section className="hidden-mobile">
        <p className="m-0">{slugToTitle(lessonTitle)}</p>
      </section>
      <section className="flex-x align-center">
        {isCreator && environment === "localhost" && (
          <SimpleButton
            action={() => {
              mode === "student" ? setMode("creator") : setMode("student");
            }}
            extraClass="svg-blue"
            svg={mode === "student" ? svgs.edit : svgs.runCustom}
          />
        )}
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
        {videoTutorial && (
          <SimpleButton
            title={`Video tutorial ${videoTutorial ? "" : t("not available")}`}
            disabled={!videoTutorial && mode === "student"}
            svg={svgs.video}
            action={async () => {
              if (mode === "student") {
                setShowVideoTutorial(true);
                reportEnrichDataLayer("learnpack_open_video", {});
              } else {
                setOpenedModals({
                  addVideoTutorial: true,
                });
              }
            }}
          />
        )}

        <RigoToggler />
        <ToggleSidebar />
      </section>
    </header>
  );
};
