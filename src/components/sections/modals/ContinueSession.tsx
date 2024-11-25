import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import SimpleButton from "../../mockups/SimpleButton";
import toast from "react-hot-toast";

export const SessionModal = () => {
  const { setOpenedModals, sessionActions } = useStore((s) => ({
    setOpenedModals: s.setOpenedModals,
    sessionActions: s.sessionActions,
  }));

  const { t } = useTranslation();

  const outsideClickHandler = () => {
    toast.error(t("please-select-option"));
  };

  const handleContinue = async () => {
    await sessionActions({ action: "continue" });
    setOpenedModals({ session: false });
  };
  const handleNew = async () => {
    await sessionActions({ action: "new" });
    setOpenedModals({ session: false });
  };

  return (
    <Modal outsideClickHandler={outsideClickHandler}>
      <h3 className="text-center">{t("we-got-you-covered")}</h3>
      <p>{t("prev-session")}</p>

      <div className="d-flex justify-center gap-big">
        <SimpleButton
          extraClass="pill bg-blue"
          text={t("continue-here")}
          action={handleContinue}
        />
        <SimpleButton
          extraClass="pill btn-dark"
          text={t("start-again")}
          action={handleNew}
        />
      </div>
    </Modal>
  );
};
