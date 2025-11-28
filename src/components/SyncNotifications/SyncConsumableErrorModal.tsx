import { useTranslation } from "react-i18next";
import { Modal } from "../mockups/Modal";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Markdowner } from "../composites/Markdowner/Markdowner";

interface Props {
  onClose: () => void;
}

export const SyncConsumableErrorModal = ({ onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <Modal outsideClickHandler={onClose} minWidth="450px" showCloseButton={false}>
      <div className="flex-y align-center justify-center gap-medium">
        <div>
          <h1 className="d-flex align-center gap-small justify-center big-svg text-bold">
            {svgs.sadRigo}
            <span>{t("ai-generations-insufficient")}</span>
          </h1>
        </div>
        <div className="rounded padding-medium w-100">
          <div className="rounded padding-small">
            <Markdowner
              markdown={t("sync-consumable-insufficient")}
            />
          </div>
        </div>
        <div className="flex-x justify-center gap-medium">
          <SimpleButton
            extraClass="bg-gray text-black padding-small rounded"
            text={t("close")}
            action={onClose}
          />
        </div>
      </div>
    </Modal>
  );
};

