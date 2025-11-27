import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { getLanguageName, getLessonDisplayInfo } from "../../utils/lib";
import i18n from "../../utils/i18n";
import { Icon } from "../Icon";
import { Loader } from "../composites/Loader/Loader";
import SimpleButton from "../mockups/SimpleButton";

interface Props {
  notification: TSyncNotification;
  onSyncClick: () => void;
}

export const SyncNotificationCard = ({ notification, onSyncClick }: Props) => {
  const { t } = useTranslation();
  const dismissSyncNotification = useStore(s => s.dismissSyncNotification);
  const sidebar = useStore(s => s.sidebar);
  const language = useStore(s => s.language);
  
  // Get lesson display info (ID and translated/formatted title)
  const { id, formattedTitle } = getLessonDisplayInfo(
    notification.lessonSlug,
    sidebar,
    language,
    notification.lessonTitle
  );
  
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
      className={`rounded padding-medium bg-1 border ${isProcessing ? 'border-gray' : 'border-gray'}`}
      style={isProcessing ? { borderColor: "var(--color-blue-rigo)" } : {}}
    >
      <div className="flex-x justify-between align-start gap-small">
        <div className="flex-x align-center gap-small">
          <span className="text-bold" style={{ color: "var(--color-active)" }}>
            {id}
          </span>
          <h3 className="text-bold m-0" style={{ color: "var(--color-active)" }}>
            {formattedTitle}
          </h3>
        </div>
        {!isProcessing && (
          <SimpleButton 
            action={handleDismiss}
            extraClass="padding-small rounded scale-on-hover"
            title={t("dismiss")}
            text={<Icon name="X" size={16} />}
          />
        )}
      </div>
      
      <p className="m-0" style={{ marginTop: "8px", marginBottom: "8px", color: "var(--color-inactive)" }}>
        {getTimeAgo(notification.updatedAt)}
      </p>
      
      <div className="flex-x align-center gap-small">
        <span className="text-bold" style={{ color: "var(--color-active)" }}>
          {getLanguageName(notification.sourceLanguage, i18n.language)}
        </span>
        <Icon name="ArrowRight" size={16} />
        <span style={{ color: "var(--color-inactive)" }}>
          {notification.targetLanguages.length} {t("languages")}
        </span>
      </div>
      
      {/* Error message if sync failed */}
      {notification.status === "error" && (
        <div className="flex-x align-center gap-small padding-small rounded bg-warning text-black" style={{ marginTop: "8px" }}>
          <Icon name="AlertCircle" size={16} />
          <p className="m-0">
            {t("sync-timeout-message")}
          </p>
        </div>
      )}
      
      {isProcessing && notification.syncProgress && (
        <div className="flex-y gap-small" style={{ marginTop: "12px" }}>
          <div className="flex-x align-center gap-small">
            <Loader size="sm" color="var(--color-blue-rigo)" />
            <span style={{ color: "var(--color-active)" }}>
              {t("languages-completed", {
                completed: notification.syncProgress.completedLanguages,
                total: notification.syncProgress.totalLanguages
              })}
            </span>
          </div>
          <div className="w-100 rounded" style={{ height: "6px", backgroundColor: "var(--bg-color)", overflow: "hidden" }}>
            <div 
              className="h-100 bg-blue-rigo"
              style={{
                width: `${(notification.syncProgress.completedLanguages / notification.syncProgress.totalLanguages) * 100}%`,
                transition: "width 0.3s"
              }}
            />
          </div>
        </div>
      )}
      
      {!isProcessing && (
        <div className="flex-x justify-end gap-small" style={{ marginTop: "12px" }}>
          <SimpleButton
            extraClass="bg-gray text-black padding-small rounded"
            size="small"
            text={t("dismiss")}
            action={handleDismiss}
          />
          <SimpleButton
            extraClass="bg-blue-rigo text-white padding-small rounded"
            size="small"
            text={notification.status === "error" ? t("retry") : t("synchronize")}
            action={onSyncClick}
          />
        </div>
      )}
    </div>
  );
};

