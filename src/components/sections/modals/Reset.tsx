import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/SimpleButton";

export const ResetModal = () => {
  const { t } = useTranslation();
  const {
    setOpenedModals,

    resetExercise,
    getCurrentExercise,
  } = useStore((state) => ({
    compilerSocket: state.compilerSocket,
    setOpenedModals: state.setOpenedModals,
    resetExercise: state.resetExercise,
    getCurrentExercise: state.getCurrentExercise,
  }));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const toggleModal = () => {
    setOpenedModals({ reset: false });
  };

  const handleReset = () => {
    resetExercise({
      exerciseSlug: getCurrentExercise().slug,
    });
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
          extraClass="pill bg-blue big"
          action={handleReset}
        />
        <SimpleButton
          text={t("Cancel")}
          extraClass="pill border-blue color-blue big"
          action={toggleModal}
        />
      </section>
    </Modal>
  );
};
