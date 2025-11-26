import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { getLanguageName } from "../../utils/lib";
import i18n from "../../utils/i18n";
import { Icon } from "../Icon";
import { Loader } from "../composites/Loader/Loader";

interface Props {
  notification: TSyncNotification;
  onSyncClick: () => void;
}

export const SyncNotificationCard = ({ notification, onSyncClick }: Props) => {
  const { t } = useTranslation();
  const dismissSyncNotification = useStore(s => s.dismissSyncNotification);
  
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissSyncNotification(notification.id, notification.lessonSlug);
  };
  
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return t("modified-time-ago", { time: `${seconds}s` });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("modified-time-ago", { time: `${minutes}m` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("modified-time-ago", { time: `${hours}h` });
    const days = Math.floor(hours / 24);
    return t("modified-time-ago", { time: `${days}d` });
  };
  
  const isProcessing = notification.status === "processing";
  
  return (
    <div 
      className={`
        bg-[var(--bg-2)] border rounded-lg p-4 transition-all duration-200
        ${isProcessing 
          ? 'border-[var(--color-blue-rigo)] bg-[var(--color-blue-opaque)]' 
          : 'border-[var(--color-inactive)] hover:border-[var(--color-active)] hover:shadow-md'
        }
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base font-medium text-[var(--color-active)] m-0">
          {notification.lessonTitle}
        </h3>
        {!isProcessing && (
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-[var(--bg-color)] rounded transition-colors text-[var(--color-inactive)] hover:text-[var(--color-active)]"
            title={t("dismiss")}
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>
      
      <p className="text-sm text-[var(--color-inactive)] mb-2">
        {getTimeAgo(notification.updatedAt)}
      </p>
      
      <div className="flex items-center gap-2 text-sm mb-3">
        <span className="font-semibold text-[var(--color-active)]">
          {getLanguageName(notification.sourceLanguage, i18n.language)}
        </span>
        <Icon name="ArrowRight" size={16} />
        <span className="text-[var(--color-inactive)]">
          {notification.targetLanguages.length} {t("languages")}
        </span>
      </div>
      
      {isProcessing && notification.syncProgress && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Loader size="sm" />
            <span className="text-sm text-[var(--color-active)]">
              {t("languages-completed", {
                completed: notification.syncProgress.completedLanguages,
                total: notification.syncProgress.totalLanguages
              })}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bg-color)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-blue-rigo)] transition-all duration-300"
              style={{
                width: `${(notification.syncProgress.completedLanguages / notification.syncProgress.totalLanguages) * 100}%`
              }}
            />
          </div>
        </div>
      )}
      
      {!isProcessing && (
        <div className="flex justify-end mt-3">
          <button 
            onClick={onSyncClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            {t("synchronize")}
          </button>
        </div>
      )}
    </div>
  );
};

