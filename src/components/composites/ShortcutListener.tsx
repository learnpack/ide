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
    // handlePositionChange,
    build,
    runExerciseTests,
    setOpenedModals,
    openedModals,
    isBuildable,
    isTesteable,
  } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    // handlePositionChange: state.handlePositionChange,
    exercises: state.exercises,
    build: state.build,
    runExerciseTests: state.runExerciseTests,
    setOpenedModals: state.setOpenedModals,
    openedModals: state.openedModals,
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        event.key === "Enter" &&
        isBuildable
      ) {
        build(t("Running..."));
      }
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key === "Enter" &&
        isTesteable
      ) {
        runExerciseTests({
          toast: true,
          setFeedbackButton: true,
          feedbackButtonText: t("Running..."),
          targetButton: "feedback",
        });
      }
      if (event.ctrlKey && event.altKey && event.key === "Enter") {
        setOpenedModals({ chat: !openedModals.chat });
      }
      if (event.ctrlKey && (event.key === "+" || event.key === "-")) {
        event.preventDefault();
        const scale = window.devicePixelRatio;
        if (scale > 2) {
          document.body.style.transform = `scale(${2 / scale})`;
        } else {
          document.body.style.transform = "none";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentExercisePosition, openedModals.chat]);

  return <div className="shortcut-listener">{children}</div>;
};
