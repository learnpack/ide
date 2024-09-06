import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";

export const ResetModal = () => {
  const { t } = useTranslation();
  const {
    compilerSocket,
    exercises,
    currentExercisePosition,
    setOpenedModals,
    updateEditorTabs
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    exercises: state.exercises,
    currentExercisePosition: state.currentExercisePosition,
    setOpenedModals: state.setOpenedModals,
    updateEditorTabs: state.updateEditorTabs
  }));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const toggleModal = () => {
    setOpenedModals({ reset: false });
  };

  const handleReset = () => {
    const data = {
      exerciseSlug: exercises[currentExercisePosition].slug,
      updateEditorTabs: updateEditorTabs
    };

    compilerSocket.emit("reset", data);
    toggleModal();
  };
  return (
    <Modal extraClass="reset-modal" outsideClickHandler={toggleModal}>
      <h2>{t("Reset")}</h2>
      <p>
        {t(
          "Are you sure you want to reset the exercise? You will lose all your progress"
        )}
      </p>
      <section>
        <SimpleButton
          text={t("Reset")}
          extraClass="pill bg-blue"
          action={handleReset}
        />
        <SimpleButton
          text={t("Cancel")}
          extraClass="pill border-blue color-blue"
          action={toggleModal}
        />
      </section>
    </Modal>
  );
};
