import { useTranslation } from "react-i18next";
import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { Modal } from "../../mockups/Modal";
import SimpleButton from "../../mockups/SimpleButton";

export const MustLoginModal = () => {
  const { t } = useTranslation();
  const { setOpenedModals } = useStore((s) => ({
    setOpenedModals: s.setOpenedModals,
  }));

  const handleClickOutside = () => {
    setOpenedModals({ mustLogin: false });
  };

  const handleLogin = () => {
    setOpenedModals({ login: true, mustLogin: false });
  };

  return (
    <Modal outsideClickHandler={handleClickOutside}>
      <h2 className="text-center">{t("you-must-login-title")}</h2>
      <p>{t("you-must-login-message")}</p>
      <div className="d-flex justify-center gap-big">
        <SimpleButton
          action={handleLogin}
          extraClass="pill clickeable bg-blue  big"
          text={"Login"}
          svg={svgs.sendSvg}
        />
        <SimpleButton
          action={handleClickOutside}
          extraClass="pill clickeable bg-secondary big"
          text={t("skip")}
        />
      </div>
    </Modal>
  );
};
