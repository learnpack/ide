import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";

const correctLanguage = (language: string) => {
  return language === "us" ? "en" : "es";
};

const convertUrlToBase64 = (url: string) => {
  return btoa(url);
};

export const RigobotInviteModal = () => {
  const { t } = useTranslation();

  const { openLink, bc_token, setOpenedModals, language } = useStore(
    (state) => ({
      openLink: state.openLink,
      bc_token: state.bc_token,
      setOpenedModals: state.setOpenedModals,
      language: state.language,
    })
  );

  const closeModal = () => {
    setOpenedModals({ rigobotInvite: false });
  };

  const acceptRigobot = () => {
    const inviteUrl =
      "https://rigobot.herokuapp.com/invite?referer=4geeks&lang=" +
      correctLanguage(language) +
      "&token=" +
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
          <h1>{t("sync-your-user-with-rigobot")}</h1>
          <p>{t("sync-your-user-with-rigobot-text")}</p>
          <div>
            <SimpleButton
              text={t("accept-now")}
              action={acceptRigobot}
              svg={svgs.rigoSvg}
              extraClass="w-100 border-blue active-on-hover padding-medium text-center rounded justify-center "
            />
          </div>
        </>
      }
    />
  );
};
