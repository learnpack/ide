import { useState } from "react";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { TSyncNotification } from "../../utils/storeTypes";
import { getLanguageName, getLessonDisplayInfo } from "../../utils/lib";
import i18n from "../../utils/i18n";
import { Icon } from "../Icon";
import { Loader } from "../composites/Loader/Loader";
import SimpleButton from "../mockups/SimpleButton";
import { SyncConsumableErrorModal } from "./SyncConsumableErrorModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  notification: TSyncNotification;
  onSyncClick: () => void;
}

export const SyncNotificationCard = ({ notification, onSyncClick }: Props) => {
  const { t } = useTranslation();
  const dismissSyncNotification = useStore(s => s.dismissSyncNotification);
  const sidebar = useStore(s => s.sidebar);
  const language = useStore(s => s.language);
  const getUserConsumables = useStore(s => s.getUserConsumables);
  const [showConsumableError, setShowConsumableError] = useState(false);
  
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
  
  const getTimeOnly = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };
  
  const handleSyncClick = async () => {
    // Refresh consumables before checking
    await getUserConsumables();
    
    const aiGenerationsLeft = useStore.getState().userConsumables.ai_generation;
    const requiredConsumables = 1; // 1 per lesson
    
    // Check if user has enough consumables (skip check if unlimited)
    if (aiGenerationsLeft !== -1 && aiGenerationsLeft < requiredConsumables) {
      setShowConsumableError(true);
      return;
    }
    
    // If enough consumables, proceed normally
    onSyncClick();
  };
  
  const isProcessing = notification.status === "processing";
  
  return (
    <div 
      className={`rounded padding-medium bg-1 border ${isProcessing ? 'border-gray' : 'border-gray'}`}
      style={isProcessing ? { borderColor: "var(--color-blue-rigo)" } : {}}
    >
      <div className="flex-x align-center gap-small" style={{ minWidth: 0 }}>
        <span className="text-bold" style={{ color: "var(--color-active)", flexShrink: 0 }}>
          {id}
        </span>
        <h3 
          className="text-bold m-0" 
          style={{ 
            color: "var(--color-active)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: 1
          }}
        >
          {formattedTitle}
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex-x align-center gap-small" 
              style={{ 
                color: "var(--color-inactive)", 
                opacity: 0.7, 
                cursor: "help",
                flexShrink: 0,
                marginLeft: "8px"
              }}
            >
              <Icon name="Clock" size={16} />
              <span>{getTimeOnly(notification.updatedAt)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("time-since-modification-tooltip", { time: getTimeOnly(notification.updatedAt) })}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex-x align-center gap-small" style={{ marginTop: "8px", marginBottom: "8px" }}>
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
      
      {/* Progress indicator for processing */}
      {isProcessing && notification.syncProgress && (
        <div className="flex-y gap-small" style={{ marginTop: "12px" }}>
          <div className="flex-x align-center gap-small">
            <Loader size="sm" color="var(--color-blue-rigo)" />
            <span style={{ color: "var(--color-active)" }}>
              {t("languages-completed", {
                completed: notification.syncProgress.completedLanguages.length,
                total: notification.syncProgress.totalLanguages
              })}
            </span>
          </div>
          <div className="w-100 rounded" style={{ height: "6px", backgroundColor: "var(--bg-color)", overflow: "hidden" }}>
            <div 
              className="h-100 bg-blue-rigo"
              style={{
                width: `${(notification.syncProgress.completedLanguages.length / notification.syncProgress.totalLanguages) * 100}%`,
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
            action={handleSyncClick}
          />
        </div>
      )}
      
      {showConsumableError && (
        <SyncConsumableErrorModal onClose={() => setShowConsumableError(false)} />
      )}
    </div>
  );
};

