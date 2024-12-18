import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";

export const LimitAiCompilations = () => {
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));

  const { t } = useTranslation();

  const handleOutsideClick = () => {
    setOpenedModals({ limitReached: false });
  };

  return (
    <div>
      <Modal outsideClickHandler={handleOutsideClick}>
        <div className="">
          <h1 className="">{t("limit-ai-compilations")}</h1>
          <p className="text-sm text-gray-500">
            {t("limit-ai-compilations-description")}
          </p>
        </div>
      </Modal>
    </div>
  );
};
