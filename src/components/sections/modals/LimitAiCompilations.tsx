import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";

import { Markdowner } from "../../composites/Markdowner/Markdowner";

export const LimitAiCompilations = () => {
  const { setOpenedModals, bc_token } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    bc_token: state.bc_token,
  }));

  const { t } = useTranslation();

  const handleOutsideClick = () => {
    setOpenedModals({ limitReached: false });
  };

  const handleUpgrade = () => {
    window.open(
      `https://4geeks.com/profile/subscriptions?token=${bc_token}`,
      "_blank"
    );
  };

  return (
    <div>
      <Modal outsideClickHandler={handleOutsideClick}>
        <div className="">
          <h1 className="">{t("limit-ai-compilations")}</h1>
          <Markdowner markdown={t("limit-ai-compilations-description")} />
          <div className="d-flex justify-center">
            <SimpleButton
              extraClass="bg-blue padding-medium rounded "
              text={t("upgrade-now")}
              action={handleUpgrade}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
