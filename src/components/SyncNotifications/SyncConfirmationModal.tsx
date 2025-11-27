import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { getLanguageName } from "../../utils/lib";
import i18n from "../../utils/i18n";
import { Modal } from "../mockups/Modal";
import { Icon } from "../Icon";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";

interface Props {
  notification: TSyncNotification;
  onClose: () => void;
}

export const SyncConfirmationModal = ({ notification, onClose }: Props) => {
  const { t } = useTranslation();
  const acceptSyncNotification = useStore(s => s.acceptSyncNotification);
  
  const handleConfirm = async () => {
    await acceptSyncNotification(notification);
    onClose();
  };
  
  const sourceLanguageName = getLanguageName(notification.sourceLanguage, i18n.language);
  
  return (
    <Modal outsideClickHandler={onClose} minWidth="450px">
      <div className="flex-y gap-medium">
        <div className="flex-x align-center gap-small">
          <div className="big-svg flex-x align-center">{svgs.rigoWait}</div>
          <h2 className="text-bold m-0">{t("sync-confirm-title")}</h2>
        </div>
        
        <div className="bg-1 rounded padding-medium">
          <p className="m-0">
            {t("sync-confirm-warning")}
          </p>
        </div>
        
        <div className="flex-y gap-small">
          <h3 className="text-bold m-0">
            {notification.lessonTitle}
          </h3>
          
          <div className="flex-y gap-small">
            <strong style={{ color: "var(--color-active)" }}>
              {t("sync-confirm-source")}:
            </strong>
            <div className="inline-block padding-small rounded bg-1 border" style={{ borderColor: "var(--color-blue-rigo)", color: "var(--color-blue-rigo)" }}>
              {sourceLanguageName}
            </div>
          </div>
          
          <div className="flex-x justify-center">
            <Icon name="ArrowDown" size={20} color="var(--color-inactive)" />
          </div>
          
          <div className="flex-y gap-small">
            <strong style={{ color: "var(--color-active)" }}>
              {t("sync-confirm-will-overwrite")}:
            </strong>
            <div className="flex-x flex-wrap gap-small">
              {notification.targetLanguages.map(lang => (
                <div 
                  key={lang} 
                  className="padding-small rounded border text-bold"
                  style={{ 
                    backgroundColor: "var(--bg-2)",
                    borderColor: "var(--color-inactive)",
                    color: "var(--color-active)"
                  }}
                >
                  {getLanguageName(lang, i18n.language)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-x align-center gap-small padding-small rounded bg-warning text-black">
            <Icon name="AlertCircle" size={16} />
            <p className="m-0">
              {t("sync-confirm-cannot-undo")}
            </p>
          </div>
        </div>
        
        <div className="flex-x justify-center gap-medium" style={{ paddingTop: "16px", borderTop: "1px solid var(--color-inactive)" }}>
          <SimpleButton
            extraClass="bg-gray text-black padding-small rounded"
            text={t("cancel")}
            action={onClose}
          />
          <SimpleButton
            extraClass="bg-blue-rigo text-white padding-small rounded row-reverse"
            text={t("confirm-sync")}
            svg={<Icon name="RefreshCw" size={16} />}
            action={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  );
};

