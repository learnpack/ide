import { useEffect } from "react";

import "./App.css";
import "./index.css";
import "./components.css";

import LessonContainer from "./components/sections/lesson/LessonContainer";
import { SocketHandler } from "./components/composites/SocketHandler";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/sections/header";
import { ModalsContainer } from "./components/sections/modals";
import useStore from "./utils/store";
import { useTranslation } from "react-i18next";

export default function Home() {
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
      if (event.ctrlKey && event.key === "ArrowRight") {
        handlePositionChange(currentExercisePosition + 1);
      }
      if (event.ctrlKey && event.key === "ArrowLeft") {
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

  return (
    <main id="main-container" className="">
      <Toaster />
      <ModalsContainer />
      <SocketHandler />
      <Header />
      <LessonContainer />
    </main>
  );
}
