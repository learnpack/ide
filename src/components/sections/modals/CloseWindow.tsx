import { Modal } from "../../mockups/Modal";
import { useTranslation } from "react-i18next";


export const CloseWindow = () => {
  const { t } = useTranslation();

//   const closeWindow = () => {
//     window.close();
//   };

  return (
    <Modal outsideClickHandler={() => {}}>
      <h2>{t("close-window-title")}</h2>
      <p>{t("close-window-description")}</p>
      {/* <div className="d-flex justify-center">
        <SimpleButton
          extraClass="bg-blue button"
          text={t("close-window-button")}
          action={closeWindow}
        />
      </div> */}
    </Modal>
  );
};
