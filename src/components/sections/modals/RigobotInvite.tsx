import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import toast from "react-hot-toast";
import { useState } from "react";

export const RigobotInviteModal = () => {
  const { t } = useTranslation();

  const [hasClickedButton, setHasClickedButton] = useState(false);

  const { checkRigobotInvitation, setOpenedModals } = useStore((state) => ({
    openLink: state.openLink,
    bc_token: state.bc_token,
    setOpenedModals: state.setOpenedModals,
    language: state.language,
    checkRigobotInvitation: state.checkRigobotInvitation,
  }));

  return (
    <Modal
      // outsideClickHandler={closeModal}
      children={
        <>
          <h1>{t("sync-your-user-with-rigobot")}</h1>
          <p>{t("sync-your-user-with-rigobot-text")}</p>
          <div>
            <SimpleButton
              text={
                hasClickedButton ? t("i-already-accepted") : t("accept-now")
              }
              action={async () => {
                const ready = await checkRigobotInvitation({
                  error: t("please-accept-rigobot-first"),
                });

                if (ready) {
                  toast.success(t("rigobot-invitation-accepted"));
                  setOpenedModals({ rigobotInvite: false });
                }
                setHasClickedButton(true);
              }}
              svg={svgs.rigoSvg}
              extraClass="w-100 border-blue active-on-hover padding-medium text-center rounded justify-center "
            />
          </div>
        </>
      }
    />
  );
};
