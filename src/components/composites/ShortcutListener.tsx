import React, { useEffect } from "react";
import useStore from "../../utils/store";
import { useTranslation } from "react-i18next";

type ShortcutListenerProps = {
  children: React.ReactNode;
};

export const ShortcutsListener = ({ children }: ShortcutListenerProps) => {
  const { t } = useTranslation();
  const {
    currentExercisePosition,
    handlePositionChange,
    build,
    runExerciseTests,
    setOpenedModals,
    openedModals,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    handlePositionChange: state.handlePositionChange,
    exercises: state.exercises,
    build: state.build,
    runExerciseTests: state.runExerciseTests,
    setOpenedModals: state.setOpenedModals,
    openedModals: state.openedModals,
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "ArrowRight" && !event.shiftKey) {
        handlePositionChange(currentExercisePosition + 1);
      }
      if (event.ctrlKey && event.key === "ArrowLeft" && !event.shiftKey) {
        handlePositionChange(currentExercisePosition - 1);
      }
      if (
        event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        event.key === "Enter"
      ) {
        build(t("Running..."));
      }
      if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
        runExerciseTests({
          toast: true,
          setFeedbackButton: true,
          feedbackButtonText: t("Running..."),
        });
      }
      if (event.ctrlKey && event.altKey && event.key === "Enter") {
        setOpenedModals({ chat: !openedModals.chat });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentExercisePosition, openedModals.chat]);

  return <div className="shortcut">{children}</div>;
};
