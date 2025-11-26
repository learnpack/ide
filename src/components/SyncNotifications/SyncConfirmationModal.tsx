import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { getLanguageName } from "../../utils/lib";
import i18n from "../../utils/i18n";
import { Modal } from "../mockups/Modal";
import { Icon } from "../Icon";

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
      <div className="min-w-[450px] max-w-[500px]">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="AlertTriangle" size={24} color="#f59e0b" />
          <h2 className="text-xl font-semibold m-0">{t("sync-confirm-title")}</h2>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-500 rounded-md p-3 mb-5">
          <p className="text-amber-900 dark:text-amber-200 text-sm m-0">
            {t("sync-confirm-warning")}
          </p>
        </div>
        
        <div className="mb-5">
          <h3 className="text-base font-medium mb-4 text-[var(--color-active)]">
            {notification.lessonTitle}
          </h3>
          
          <div className="mb-4">
            <strong className="block mb-2 text-sm text-[var(--color-active)]">
              {t("sync-confirm-source")}:
            </strong>
            <div className="inline-block px-3 py-1.5 rounded bg-[var(--color-blue-opaque)] text-[var(--color-blue-rigo)] border border-[var(--color-blue-rigo)] text-sm font-semibold">
              {sourceLanguageName}
            </div>
          </div>
          
          <div className="flex justify-center my-4">
            <Icon name="ArrowDown" size={20} color="var(--color-inactive)" />
          </div>
          
          <div className="mb-4">
            <strong className="block mb-2 text-sm text-[var(--color-active)]">
              {t("sync-confirm-will-overwrite")}:
            </strong>
            <div className="flex flex-wrap gap-2">
              {notification.targetLanguages.map(lang => (
                <div 
                  key={lang} 
                  className="px-3 py-1.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 text-sm font-semibold"
                >
                  {getLanguageName(lang, i18n.language)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 p-3 bg-[var(--bg-2)] rounded-md">
            <Icon name="AlertCircle" size={16} />
            <p className="text-sm text-[var(--color-inactive)] m-0">
              {t("sync-confirm-cannot-undo")}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-inactive)]">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            {t("cancel")}
          </button>
          <button 
            onClick={handleConfirm} 
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-semibold"
          >
            <Icon name="RefreshCw" size={16} />
            {t("confirm-sync")}
          </button>
        </div>
      </div>
    </Modal>
  );
};

