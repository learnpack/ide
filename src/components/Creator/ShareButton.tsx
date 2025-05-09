import { useState } from "react";
import { useTranslation } from "react-i18next";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Modal } from "../mockups/Modal";

export const ShareModal = ({ closeModal }: { closeModal: () => void }) => {
  const { t } = useTranslation();
  return (
    <Modal outsideClickHandler={closeModal}>
      <div>
        <h4 className="text-center">{t("share-tutorial")}</h4>
        <div className="flex-x justify-between align-center">
          <span>{t("who-has-access")}</span>
          <select className="bg-2 border-none padding-small rounded">
            <option value="public">{t("public")}</option>
            <option value="anyone-with-link">{t("anyone-with-link")}</option>
          </select>
        </div>
        <p className="text-center">{t("you-can-also-share-via")}</p>
        <div className="flex-x justify-center align-center gap-big">
          <div className="flex-y align-center justify-center">
            {svgs.twitter} X
          </div>
          <div className="flex-y align-center justify-center">
            {svgs.linkedin} Linkedin
          </div>
          <div className="flex-y align-center justify-center">
            {svgs.facebook} Facebook
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const ShareButton = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <SimpleButton
        text={t("share")}
        action={openModal}
        extraClass="svg-blue text-blue row-reverse"
        svg={svgs.share}
      />

      {showModal && <ShareModal closeModal={closeModal} />}
    </>
  );
};
