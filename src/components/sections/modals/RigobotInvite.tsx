import toast from "react-hot-toast";
import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";

const convertUrlToBase64 = (url: string) => {
  return btoa(url);
};

export const RigobotInviteModal = () => {
  const { t } = useTranslation();

  const { openLink, bc_token, setOpenedModals } = useStore((state) => ({
    openLink: state.openLink,
    bc_token: state.bc_token,
    setOpenedModals: state.setOpenedModals,
  }));

  const closeModal = () => {
    toast.error("The user clicked outside the modal");
  };

  const acceptRigobot = () => {
    const inviteUrl =
      "https://rigobot.herokuapp.com/invite?referer=4geeks&token=" +
      bc_token +
      "&callback=" +
      convertUrlToBase64(window.location.href);
    openLink(inviteUrl);
    setOpenedModals({ rigobotInvite: false });
  };

  return (
    <Modal
      outsideClickHandler={closeModal}
      children={
        <>
          <h1>{t("missing-rigobot-user")}</h1>
          <p>{t("missing-rigobot-user-text")}</p>
          <div>
            <SimpleButton
              text={t("accept-now")}
              action={acceptRigobot}
              svg={svgs.rigoSvg}
              extraClass="w-100 border-blue active-on-hover padding-medium text-center rounded "
            />
          </div>
        </>
      }
    />
  );
};
