import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import { Modal } from "../../mockups/Modal";

export const NotAuthorModal = () => {
  const { t } = useTranslation();

  return (
    <Modal>
      <div className=" flex-y align-center justify-center">
        {svgs.sadRigo}
        <p className="text-bold">{t("not-author-message")}</p>
      </div>
    </Modal>
  );
};
