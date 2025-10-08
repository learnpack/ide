import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import { DEV_MODE } from "../../utils/lib";
import useStore from "../../utils/store";
import SimpleButton from "../mockups/SimpleButton";
import { RigoToggler } from "../Rigobot/Rigobot";
import LanguageButton from "../sections/header/LanguageButton";
import styles from "./NewHeader.module.css";
import { ToggleSidebar } from "../sections/sidebar/ToggleSidebar";
import { Icon } from "../Icon";
// import TelemetryManager from "../../managers/telemetry";
// import { useState } from "react";
// import { Modal } from "../mockups/Modal";
// import { createPortal } from "react-dom";
import { eventBus } from "../../managers/eventBus";
// import { slugToTitle } from "../Rigobot/utils";

export const NewHeader = () => {
  const {
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
    // isCreator,
    setShowVideoTutorial,
    reportEnrichDataLayer,
    // mode,
    // setMode,
    // setOpenedModals,
    // environment,
    configObject,
  } = useStore((state) => ({
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
    // mode: state.mode,
    // isCreator: state.isCreator,
    // setOpenedModals: state.setOpenedModals,
    // setMode: state.setMode,
    // environment: state.environment,
    configObject: state.configObject,
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
            eventBus.emit("position_change", {
              position: Number(currentExercisePosition) - 1,
            });
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
            eventBus.emit("position_change", {
              position: Number(currentExercisePosition) + 1,
            });
            reportEnrichDataLayer("learnpack_next_step", {});
          }}
        >
          {svgs.nextArrowButton}
        </button>

        {DEV_MODE && (
          <button onClick={test} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="FlaskConical" size={18} />
            TEST
          </button>
        )}
      </section>
      <section className="hidden-mobile">
        <p className="m-0">{configObject?.config?.title[language] || ""}</p>
      </section>
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
        {videoTutorial && (
          <div className="d-flex gap-small">
            {videoTutorial && (
              <SimpleButton
                title="Video tutorial"
                svg={svgs.video}
                action={async () => {
                  setShowVideoTutorial(true);
                  reportEnrichDataLayer("learnpack_open_video", {});
                }}
              />
            )}
          </div>
        )}

        <RigoToggler />
        <ToggleSidebar />
      </section>
    </header>
  );
};
