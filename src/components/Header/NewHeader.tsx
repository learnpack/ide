import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";
import { DEV_MODE } from "../../utils/lib";
import useStore from "../../utils/store";
import SimpleButton from "../mockups/SimpleButton";
import { RigoToggler } from "../Rigobot/Rigobot";
import LanguageButton from "../sections/header/LanguageButton";
import { SyncNotificationBadge } from "../SyncNotifications/SyncNotificationBadge";
import styles from "./NewHeader.module.css";
import { ToggleSidebar } from "../sections/sidebar/ToggleSidebar";
import { Icon } from "../Icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import TelemetryManager from "../../managers/telemetry";
// import { useState } from "react";
// import { Modal } from "../mockups/Modal";
// import { createPortal } from "react-dom";
import { eventBus } from "../../managers/eventBus";
import { HistoryControls } from "../HistoryControls/HistoryControls";
import { updateCourseTitle } from "../../utils/creator";
import toast from "react-hot-toast";
// import { slugToTitle } from "../Rigobot/utils";

export const NewHeader = () => {
  const {
    currentExercisePosition,
    exercises,
    test,
    isIframe,
    language,
    // hasSolution,
    // getCurrentExercise,
    // updateEditorTabs,
    // compilerSocket,
    videoTutorial,
    // isCreator,
    setShowVideoTutorial,
    reportEnrichDataLayer,
    mode,
    // setMode,
    // setOpenedModals,
    environment,
    configObject,
    token,
    updateCourseTitle: updateCourseTitleInStore,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
    test: state.test,
    isIframe: state.isIframe,
    language: state.language,
    // hasSolution: state.hasSolution,
    // getCurrentExercise: state.getCurrentExercise,
    // updateEditorTabs: state.updateEditorTabs,
    // compilerSocket: state.compilerSocket,
    videoTutorial: state.videoTutorial,
    setShowVideoTutorial: state.setShowVideoTutorial,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    mode: state.mode,
    // isCreator: state.isCreator,
    // setOpenedModals: state.setOpenedModals,
    // setMode: state.setMode,
    environment: state.environment,
    configObject: state.configObject,
    token: state.token,
    updateCourseTitle: state.updateCourseTitle,
  }));

  const { t } = useTranslation();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const currentTitle = configObject?.config?.title?.[language] || "";
  const canEditTitle =
    environment === "creatorWeb" && mode === "creator" && !isIframe;

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(currentTitle);
    }
  }, [currentTitle, isEditingTitle]);

  const handleSaveTitle = async () => {
    const trimmedTitle = titleDraft.trim();
    if (!trimmedTitle) {
      toast.error("Title cannot be empty");
      return;
    }

    if (!token) {
      toast.error("Missing Rigo token");
      return;
    }

    try {
      await updateCourseTitle(token, language, trimmedTitle);
      updateCourseTitleInStore(language, trimmedTitle);
      toast.success(
        "Title saved. Other languages will update automatically."
      );
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Failed to update title");
    }
  };

  const showSyncNotifications = () => {
    const titleLanguages = configObject?.config?.title ? Object.keys(configObject.config.title) : [];
    return titleLanguages.length > 1 && environment === "creatorWeb" && mode === "creator";
  };

  // const openSolutionFile = () => {
  //   const solutionFile = getCurrentExercise().files.filter((file: any) =>
  //     file.name.includes("solution.hide")
  //   );

  //   const data = {
  //     exerciseSlug: getCurrentExercise().slug,
  //     files: solutionFile.map((file: any) => file.path),
  //     solutionFileName: solutionFile.map((file: any) => file.name),
  //     updateEditorTabs: updateEditorTabs,
  //   };
  //   compilerSocket.emit("open", data);
  //   reportEnrichDataLayer("learnpack_open_solution", {});
  // };

  return (
    <header className={styles.header}>
      <section>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("previous-lesson")}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("next-lesson")}</p>
          </TooltipContent>
        </Tooltip>

        {DEV_MODE && (
          <button onClick={test} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="FlaskConical" size={18} />
            TEST
          </button>
        )}
      </section>
      <section className="hidden-mobile">
        {canEditTitle ? (
          <div
            className="flex-x align-center gap-1"
            style={{ alignItems: "center", gap: "8px" }}
          >
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  style={{ maxWidth: "420px" }}
                />
                <SimpleButton
                  title={t("save")}
                  svg={svgs.checkIcon}
                  action={handleSaveTitle}
                />
                <SimpleButton
                  title={t("cancel")}
                  svg={svgs.closeIcon}
                  action={() => setIsEditingTitle(false)}
                />
              </>
            ) : (
              <>
                <p className="m-0">{currentTitle}</p>
                <SimpleButton
                  title={t("edit")}
                  svg={svgs.edit}
                  action={() => setIsEditingTitle(true)}
                />
              </>
            )}
          </div>
        ) : (
          <p className="m-0">{currentTitle}</p>
        )}
      </section>
      <section className="flex-x align-center">
        {showSyncNotifications() && <SyncNotificationBadge />}
        <HistoryControls />
        {!isIframe && language && <LanguageButton />}
        {/* {hasSolution && (
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
        )} */}
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
