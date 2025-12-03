import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { getLanguageName, getLessonDisplayInfo } from "../../utils/lib";
import i18n from "../../utils/i18n";
import { Modal } from "../mockups/Modal";
import { Icon } from "../Icon";
import SimpleButton from "../mockups/SimpleButton";
import { svgs } from "../../assets/svgs";
import { Markdowner } from "../composites/Markdowner/Markdowner";

interface Props {
  notification: TSyncNotification;
  onClose: () => void;
}

export const SyncConfirmationModal = ({ notification, onClose }: Props) => {
  const { t } = useTranslation();
  const acceptSyncNotification = useStore(s => s.acceptSyncNotification);
  const sidebar = useStore(s => s.sidebar);
  const language = useStore(s => s.language);
  const userConsumables = useStore(s => s.userConsumables);
  
  // Get lesson display info (ID and translated/formatted title)
  const { id, formattedTitle } = getLessonDisplayInfo(
    notification.lessonSlug,
    sidebar,
    language,
    notification.lessonTitle
  );
  
  const handleConfirm = async () => {
    await acceptSyncNotification(notification);
    onClose();
  };
  
  const sourceLanguageName = getLanguageName(notification.sourceLanguage, i18n.language);
  
  return (
    <Modal outsideClickHandler={onClose}>
      <div className="flex-y gap-medium">
        <div className="flex-x align-center justify-center gap-small">
          <div className="big-svg flex-x align-center">{svgs.rigoWait}</div>
          <h1 className="text-bold m-0">{t("sync-confirm-title")}</h1>
        </div>
        
        <div className="bg-1 rounded padding-medium">
          <p className="m-0">
            {t("sync-confirm-warning")}
          </p>
        </div>
        
        <div className="flex-y gap-small">
          <div className="flex-x align-center gap-small">
            <span className="text-bold">
              {id}
            </span>
            <h3 className="m-0 text-bold">
              {formattedTitle}
            </h3>
          </div>
          
          <div className="flex-x align-center gap-small">
            <span style={{ color: "var(--color-active)" }}>
              {t("sync-confirm-source")}:
            </span>
            <span>{sourceLanguageName}</span>
          </div>
          
          <div className="flex-x align-center gap-small flex-wrap">
            <span style={{ color: "var(--color-active)" }}>
              {t("sync-confirm-will-overwrite")}:
            </span>
            <span>
              {notification.targetLanguages.map((lang, index) => (
                <span key={lang}>
                  {getLanguageName(lang, i18n.language)}
                  {index < notification.targetLanguages.length - 1 && ", "}
                </span>
              ))}
            </span>
          </div>
          
          {/* Show consumable info only if not unlimited */}
          {userConsumables.ai_generation !== -1 && (
            <div className="flex-x align-center gap-small padding-small rounded bg-1">
              <Icon name="Info" size={16} />
              <div>
                <Markdowner markdown={t("sync-will-consume")} />
              </div>
            </div>
          )}
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

