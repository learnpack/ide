import { useTranslation } from "react-i18next";
import { Modal } from "../../mockups/Modal";
import { svgs } from "../../../assets/svgs";

export const PackageNotFoundModal = () => {
  const { t } = useTranslation();

  return (
    <Modal>
      <div className="flex-y align-center justify-center">
        {svgs.sadRigo}
        <h2 className="text-center text-red">{t("course-not-found")}</h2>
        <p>
          {t(
            "package-not-found-message",
            "The package you're trying to access does not exist or is no longer available."
          )}
        </p>
      </div>
    </Modal>
  );
};
