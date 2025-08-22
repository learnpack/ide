import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import { Modal } from "../../mockups/Modal";
import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";

export const NotAuthorModal = () => {
  const { t } = useTranslation();
  const setOpenedModals = useStore((s) => s.setOpenedModals);

  return (
    <Modal>
      <div className=" flex-y align-center justify-center">
        {svgs.sadRigo}
        <p className="text-bold">{t("not-author-message")}</p>
        <SimpleButton
          text={t("loginAsSomeoneElse")}
          extraClass="bg-blue-rigo text-white button "
          action={() => {
            setOpenedModals({ login: true });
          }}
        />
      </div>
    </Modal>
  );
};
