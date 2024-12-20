import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { convertMarkdownToHTML } from "../../../utils/lib";

export const LimitAiCompilations = () => {
  const { setOpenedModals } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
  }));

  const { t } = useTranslation();

  const handleOutsideClick = () => {
    setOpenedModals({ limitReached: false });
  };

  const handleUpgrade = () => {
    window.open("https://4geeks.com/profile/subscriptions", "_blank");
  };

  return (
    <div>
      <Modal outsideClickHandler={handleOutsideClick}>
        <div className="">
          <h1 className="">{t("limit-ai-compilations")}</h1>
          <p
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                t("limit-ai-compilations-description")
              ),
            }}
            className="text-sm text-gray-500"
          ></p>
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
